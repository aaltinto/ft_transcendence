COMPOSE_LOCATION=srcs/docker-compose.yml

all: up

up:
	docker compose -f $(COMPOSE_LOCATION) up --build
down:
	docker compose -f $(COMPOSE_LOCATION) down --remove-orphans
build:
	docker compose -f $(COMPOSE_LOCATION) build
crt:
	-@mkdir srcs/nginx/certs
	openssl req -x509 -newkey rsa:4096 -sha256 -days 365 \
	-nodes -keyout srcs/nginx/certs/server.key -out srcs/requirements/nginx/certs/server.crt \
	-subj "/CN=aaltinto.42.fr"
fclean:
	-docker stop $$(docker ps -qa)
	-docker rm $$(docker ps -qa)
	-docker rmi -f $$(docker images -qa)
	-docker volume rm $$(docker volume ls -q)
	-docker network rm $$(docker network ls -q)
	docker system prune --all --volumes
	rm -rf srcs/nginx/certs/server.key srcs/nginx/certs/server.crt
.PHONY: all up down build