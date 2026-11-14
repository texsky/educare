.PHONY: dev prod build down logs mongo-shell seed seed-class20 help

COMPOSE_BASE = docker-compose -f docker-compose.yml
COMPOSE_DEV  = $(COMPOSE_BASE) -f docker-compose.dev.yml

# ─── Default target ─────────────────────────────────────────
help:
	@echo ""
	@echo "  EduCare Solutions — Available Make Commands"
	@echo "  ─────────────────────────────────────────────"
	@echo "  make dev          Start all services in development mode (hot-reload)"
	@echo "  make prod         Start all services in production mode"
	@echo "  make build        Build / rebuild all Docker images"
	@echo "  make down         Stop and remove all containers"
	@echo "  make logs         Tail logs for all services"
	@echo "  make mongo-shell  Open an interactive MongoDB shell"
	@echo "  make seed         Run the database seed script"
	@echo "  make seed-class20 Add Class 20A and its eight students without clearing data"
	@echo "  make help         Show this help message"
	@echo ""

# ─── Development mode (hot-reload, exposed ports) ───────────
dev:
	$(COMPOSE_DEV) up --build

# ─── Production mode ────────────────────────────────────────
prod:
	$(COMPOSE_BASE) up -d

# ─── Build images ───────────────────────────────────────────
build:
	$(COMPOSE_BASE) build --no-cache

# ─── Stop all containers ────────────────────────────────────
down:
	$(COMPOSE_BASE) down

# ─── Tail logs ──────────────────────────────────────────────
logs:
	$(COMPOSE_BASE) logs -f

# ─── Open MongoDB shell ─────────────────────────────────────
mongo-shell:
	docker exec -it educare_mongodb mongosh \
	  -u $${MONGO_ROOT_USER:-admin} \
	  -p $${MONGO_ROOT_PASSWORD:-secret} \
	  --authenticationDatabase admin \
	  $${MONGO_DB_NAME:-educare}

# ─── Run seed script ────────────────────────────────────────
seed:
	docker exec -it educare_backend node src/scripts/seed.js

# ─── Add Class 20A students without clearing existing data ───
seed-class20:
	docker exec -it educare_backend node src/scripts/seed-class20.js
