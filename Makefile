COMPOSE_LOCATION=srcs/docker-compose.yml

all: crt up

up:
	docker compose -f $(COMPOSE_LOCATION) up --build

down:
	docker compose -f $(COMPOSE_LOCATION) down --remove-orphans

build:
	docker compose -f $(COMPOSE_LOCATION) build

start:
	docker compose -f $(COMPOSE_LOCATION) up -d

stop:
	docker compose -f $(COMPOSE_LOCATION) stop

restart: down up

logs:
	docker compose -f $(COMPOSE_LOCATION) logs -f

status:
	docker compose -f $(COMPOSE_LOCATION) ps

crt:
	@echo "Creating SSL certificates..."
	@mkdir -p srcs/services/nginx/certs
	@if [ ! -f srcs/services/nginx/certs/server.crt ]; then \
		openssl req -x509 -newkey rsa:4096 -sha256 -days 365 \
		-nodes -keyout srcs/services/nginx/certs/server.key -out srcs/services/nginx/certs/server.crt \
		-subj "/CN=localhost"; \
	else \
		echo "SSL certificates already exist"; \
	fi

clean:
	docker compose -f $(COMPOSE_LOCATION) down --remove-orphans
	docker system prune -f

fclean: clean
	@echo "Performing full cleanup..."
	-docker stop $$(docker ps -qa) 2>/dev/null
	-docker rm $$(docker ps -qa) 2>/dev/null
	-docker rmi -f $$(docker images -qa) 2>/dev/null
	-docker volume rm $$(docker volume ls -q) 2>/dev/null
	-docker network rm $$(docker network ls -q) 2>/dev/null || true
	docker system prune --all --volumes -f
	rm -rf srcs/services/nginx/certs/

test:
	@echo "Testing services..."
	@curl -k https://localhost:3000 > /dev/null 2>&1 && echo "✅ Nginx service is running" || echo "❌ Nginx service is not responding"

help:
	@echo "Available commands:"
	@echo "  make all     - Create certificates and start all services"
	@echo "  make up      - Start all services with build"
	@echo "  make down    - Stop all services"
	@echo "  make start   - Start services in background"
	@echo "  make stop    - Stop services"
	@echo "  make restart - Restart all services"
	@echo "  make build   - Build all images"
	@echo "  make logs    - Show logs"
	@echo "  make status  - Show container status"
	@echo "  make crt     - Create SSL certificates"
	@echo "  make test    - Test if services are running"
	@echo "  make clean   - Clean containers and images"
	@echo "  make fclean  - Full cleanup (removes everything)"
	@echo "  make help    - Show this help"

.PHONY: all up down build start stop restart logs status crt clean fclean test help