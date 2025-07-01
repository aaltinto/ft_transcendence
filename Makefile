COMPOSE_LOCATION=srcs/docker-compose.yml

all: up

up:
	docker compose -f $(COMPOSE_LOCATION) up --build
down:
	docker compose -f $(COMPOSE_LOCATION) down --remove-orphans
build:
	docker compose -f $(COMPOSE_LOCATION) build
crt:
	-@mkdir srcs/services/nginx/certs
	openssl req -x509 -newkey rsa:4096 -sha256 -days 365 \
	-nodes -keyout srcs/services/nginx/certs/server.key -out srcs/services/nginx/certs/server.crt \
	-subj "/CN=aaltinto.42.fr"
fclean:
	-docker stop $$(docker ps -qa)
	-docker rm $$(docker ps -qa)
	-docker rmi -f $$(docker images -qa)
	-docker volume rm $$(docker volume ls -q)
	-docker network rm $$(docker network ls -q)
	docker system prune --all --volumes
	rm -rf srcs/services/nginx/certs/server.key srcs/services/nginx/certs/server.crt
.PHONY: all up down build