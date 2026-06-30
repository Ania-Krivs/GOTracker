include .env
export

export PRJ_PATH=${CURDIR}


db-up:
	@docker compose up -d postgresql

db-down:
	@docker compose down postgresql

migrate-create:
	@docker compose run --rm postgresql-migrations \
		create \
		-ext sql \
		-dir /migrations \
		-seq "${seq}"

migrate-up:
	@make migrate-action action=up

migrate-down:
	@make migrate-action action=down

migrate-action:
	docker compose run --rm postgresql-migrations \
		-path /migrations \
		-database postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgresql:5432/${POSTGRES_DB}?sslmode=disable \
		"${action}"

run:
	@go run cmd/app/main.go