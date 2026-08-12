.PHONY: dev test db-reset down logs

dev:
	docker compose up --build

test:
	npm test

db-reset:
	docker compose exec api sh -c "npm run db:rollback && npm run db:migrate && npm run db:seed"

down:
	docker compose down

logs:
	docker compose logs -f api
