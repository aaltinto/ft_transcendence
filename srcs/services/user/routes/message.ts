import * as amqplib from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY_MS = 5000; // 5 seconds
const RECONNECT_DELAY_MS = 10000; // 10 seconds

interface RetryConfig {
    maxAttempts: number;
    delayMs: number;
    backoffMultiplier: number;
}

class ResilientRabbitMQ {
    private connection: any = null;
    private channel: any = null;
    private isConnecting: boolean = false;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private messageQueue: Array<{ queue: string; message: any; resolve: Function; reject: Function }> = [];
    private isShuttingDown: boolean = false;

    constructor(private config: RetryConfig = { 
        maxAttempts: MAX_RETRY_ATTEMPTS, 
        delayMs: RETRY_DELAY_MS, 
        backoffMultiplier: 1.5 
    }) {
        this.setupConnectionHandlers();
    }

    private setupConnectionHandlers(): void {
        process.on('SIGINT', () => this.gracefulShutdown());
        process.on('SIGTERM', () => this.gracefulShutdown());
    }

    private async sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async retryOperation<T>(
        operation: () => Promise<T>,
        operationName: string,
        attempts: number = 0
    ): Promise<T> {
        try {
            return await operation();
        } catch (error) {
            const nextAttempt = attempts + 1;
            
            if (nextAttempt >= this.config.maxAttempts) {
                console.error(`${operationName} failed after ${this.config.maxAttempts} attempts:`, error);
                throw error;
            }

            const delay = this.config.delayMs * Math.pow(this.config.backoffMultiplier, attempts);
            console.warn(`${operationName} failed (attempt ${nextAttempt}/${this.config.maxAttempts}), retrying in ${delay}ms:`, error);
            
            await this.sleep(delay);
            return this.retryOperation(operation, operationName, nextAttempt);
        }
    }

    private async createConnection(): Promise<void> {
        if (!RABBITMQ_URL) {
            throw new Error("RABBITMQ_URL is not defined");
        }

        if (this.isConnecting) {
            return;
        }

        this.isConnecting = true;

        try {
            console.log('Attempting to connect to RabbitMQ...');
            this.connection = await amqplib.connect(RABBITMQ_URL);
            
            this.connection.on('error', (error: Error) => {
                console.error('RabbitMQ connection error:', error);
                this.handleConnectionLoss();
            });

            this.connection.on('close', () => {
                console.warn('RabbitMQ connection closed');
                this.handleConnectionLoss();
            });

            this.channel = await this.connection.createChannel();
            
            this.channel.on('error', (error: Error) => {
                console.error('RabbitMQ channel error:', error);
                this.handleConnectionLoss();
            });

            this.channel.on('close', () => {
                console.warn('RabbitMQ channel closed');
                this.handleConnectionLoss();
            });

            console.log('Successfully connected to RabbitMQ');
            this.isConnecting = false;
            
            // Process queued messages
            await this.processQueuedMessages();
            
        } catch (error) {
            this.isConnecting = false;
            this.connection = null;
            this.channel = null;
            throw error;
        }
    }

    private handleConnectionLoss(): void {
        if (this.isShuttingDown) return;

        this.connection = null;
        this.channel = null;
        this.isConnecting = false;

        // Clear existing reconnect timer
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }

        // Schedule reconnection
        this.reconnectTimer = setTimeout(() => {
            this.reconnect();
        }, RECONNECT_DELAY_MS);
    }

    private async reconnect(): Promise<void> {
        if (this.isShuttingDown) return;

        try {
            await this.retryOperation(
                () => this.createConnection(),
                'RabbitMQ reconnection'
            );
        } catch (error) {
            console.error('Failed to reconnect to RabbitMQ, will retry later:', error);
            
            // Schedule another reconnection attempt
            this.reconnectTimer = setTimeout(() => {
                this.reconnect();
            }, RECONNECT_DELAY_MS);
        }
    }

    private async processQueuedMessages(): Promise<void> {
        const messages = [...this.messageQueue];
        this.messageQueue = [];

        for (const { queue, message, resolve, reject } of messages) {
            try {
                await this.internalPublishQueue(queue, message);
                resolve();
            } catch (error) {
                // Re-queue the message if still failing
                this.messageQueue.push({ queue, message, resolve, reject });
            }
        }
    }

    private async getChannel(): Promise<any> {
        if (this.channel) return this.channel;

        await this.retryOperation(
            () => this.createConnection(),
            'RabbitMQ connection'
        );

        return this.channel;
    }

    private async internalPublishQueue(queue: string, message: any): Promise<void> {
        const ch = await this.getChannel();
        await ch.assertQueue(queue, { durable: true });
        ch.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
    }

    public async publishQueue(queue: string, message: any): Promise<void> {
        return new Promise((resolve, reject) => {
            // If RabbitMQ is not available, queue the message for later
            if (!this.channel && !this.isConnecting) {
                console.warn(`RabbitMQ not available, queueing message for queue: ${queue}`);
                this.messageQueue.push({ queue, message, resolve, reject });
                
                // Trigger reconnection if not already in progress
                if (!this.reconnectTimer) {
                    this.reconnect();
                }
                return;
            }

            this.retryOperation(
                () => this.internalPublishQueue(queue, message),
                `Publishing to queue: ${queue}`
            ).then(resolve).catch((error) => {
                // If publishing fails, queue the message for retry
                console.warn(`Failed to publish to queue: ${queue}, queueing for retry`);
                this.messageQueue.push({ queue, message, resolve, reject });
                
                // Don't reject immediately, let the retry mechanism handle it
                if (!this.reconnectTimer) {
                    this.reconnect();
                }
            });
        });
    }

    public async consumeQueue(queue: string, handler: Function): Promise<void> {
        const consumeWithRetry = async (): Promise<void> => {
            const ch = await this.getChannel();
            await ch.assertQueue(queue, { durable: true });
            
            ch.consume(queue, (msg: any) => {
                if (msg) {
                    try {
                        const parsedMessage = JSON.parse(msg.content.toString());
                        handler(parsedMessage);
                        ch.ack(msg);
                    } catch (error) {
                        console.error('Error parsing message:', error);
                        ch.nack(msg, false, false);
                    }
                }
            });
        };

        return this.retryOperation(
            consumeWithRetry,
            `Consuming from queue: ${queue}`
        );
    }

    public async closeConnection(): Promise<void> {
        this.isShuttingDown = true;
        
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        if (this.channel) {
            try {
                await this.channel.close();
            } catch (error) {
                console.error('Error closing channel:', error);
            }
            this.channel = null;
        }

        if (this.connection) {
            try {
                await this.connection.close();
            } catch (error) {
                console.error('Error closing connection:', error);
            }
            this.connection = null;
        }

        // Reject any queued messages
        this.messageQueue.forEach(({ reject }) => {
            reject(new Error('Service is shutting down'));
        });
        this.messageQueue = [];

        console.log('RabbitMQ connection closed gracefully');
    }

    private async gracefulShutdown(): Promise<void> {
        console.log('Shutting down gracefully...');
        await this.closeConnection();
        process.exit(0);
    }

    public isConnected(): boolean {
        return !!this.channel;
    }

    public getQueuedMessageCount(): number {
        return this.messageQueue.length;
    }
}

// Create singleton instance
const rabbitMQService = new ResilientRabbitMQ();

// Export the public interface
export async function publishQueue(queue: string, message: any): Promise<void> {
    return rabbitMQService.publishQueue(queue, message);
}

export async function consumeQueue(queue: string, handler: Function): Promise<void> {
    return rabbitMQService.consumeQueue(queue, handler);
}

export async function closeConnection(): Promise<void> {
    return rabbitMQService.closeConnection();
}

export function isConnected(): boolean {
    return rabbitMQService.isConnected();
}

export function getQueuedMessageCount(): number {
    return rabbitMQService.getQueuedMessageCount();
}

// Health check endpoint helper
export function getHealthStatus(): { status: string; connected: boolean; queuedMessages: number } {
    return {
        status: rabbitMQService.isConnected() ? 'healthy' : 'degraded',
        connected: rabbitMQService.isConnected(),
        queuedMessages: rabbitMQService.getQueuedMessageCount()
    };
}