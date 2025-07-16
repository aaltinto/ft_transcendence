import Fastify from 'fastify';
import db from './data/db.js';
import userManagement from './routes/userManagement.js';
import dotenv from 'dotenv';
import { consumeQueue } from './routes/message.js';

dotenv.config();

const app = Fastify();


consumeQueue('user_created', (msg: {username: string}) => {
    // Check if user exists, if not, create in user DB
    const exists = db.prepare('SELECT * FROM users WHERE username = ?').get(msg.username);
    if (!exists) {
        db.prepare('INSERT INTO users (username) VALUES (?)').run(msg.username);
        console.log('User created in user service from RabbitMQ:', msg.username);
    }
    console.log('user create', msg.username);
});
userManagement(app, db);

app.listen( {port : 3002, host: '0.0.0.0'}, () => {
    console.log("Server running at localhost:3000");
});