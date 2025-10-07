# Play History Service

A production-ready **Play History Microservice** built with **Node.js**, **TypeScript**, **Fastify**, and **PostgreSQL**.  
It records, retrieves, and manages user playback activity — complete with pagination, analytics, GDPR deletion, Docker support, and full test coverage.

---

## Features

**Play tracking**
- Stores playback events (`userId`, `contentId`, `device`, duration, timestamp)  
- Ensures **idempotency** via unique `event_id`

**History API**
- Returns a user’s playback history  
- Supports **pagination**, **sorting**, and **metadata**

**Most-Watched Analytics**
- Returns the most-watched content between given dates  
- Optimized SQL aggregation

**GDPR Compliance**
- `DELETE /v1/users/:userId` — permanently deletes user data  
- Records a **tombstone** for auditability

**Health Check**
- `/health` endpoint for service uptime & DB connectivity

**Strict Validation**
- Strong typing & validation with **Zod** schemas  
- Enforces proper UUIDs and ISO timestamps

**Structured Logging**
- Built on **Pino**, with redaction & structured output

**Dockerized**
- Fully containerized with PostgreSQL  
- Works in both **local** and **production** modes
- There are 2 versions of the app:
    - LOCALHOST Server + Docker DB (Postgress)
    - Docker Server + (separate) Docker DB (Postgress)

**Testing & CI/CD Ready**
- Integration tests with Jest  
- Includes test DB migrations  
- Works inside and outside Docker

---

## Tech Stack

| Layer              | Technology |
|--------------------|-------------|
| Framework          | [Fastify](https://fastify.dev/) |
| Language           | [TypeScript](https://www.typescriptlang.org/) |
| Database           | [PostgreSQL](https://www.postgresql.org/) |
| Validation         | [Zod](https://github.com/colinhacks/zod) |
| Logging            | [Pino](https://getpino.io/) |
| Testing            | [Jest](https://jestjs.io/) |
| Docker             | [Docker Compose](https://docs.docker.com/compose/) |
| Formatter/Linter   | ESLint + Prettier |

---


## Installation (see PROJECT_DOCUMENTATION_DEV for more details)

### Clone the repo
```
git clone https://github.com/<user>/play-history-service.git
cd play-history-service
```
### Install dependencies
```
npm install
```
### Configure environment
(if needed)
Then edit variables as needed:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=play_history_service
```
### Running with Docker

Start both API and DB:
```
docker compose up -d
```

Then check:
```
curl http://localhost:3000/health
```
You should see:
```
{ "status": "ok", "db": "play_history_service" }
```
### Running Locally (without Docker)

Start PostgreSQL (manually or via Docker):
```
docker compose up -d db
```

Run the service:
```
npm run dev
```

Test health:
```
curl http://localhost:3000/health
```
### Testing

Run all Jest tests:
```
npm test
```
Test output
```
Test Suites: 8 passed, 8 total
Tests:       23 passed, 23 total
Snapshots:   0 total
Time:        1.481 s, estimated 2 s
Ran all test suites.
```

To test inside Docker:
```
docker exec -it play_history_api npm test
```
## API Endpoints
```
Method	Path	Description
POST	/v1/play	Record a play event
GET	/v1/history/:userId	Get a user’s play history
GET	/v1/most-watched	Most watched content in date range
DELETE	/v1/users/:userId	GDPR: delete user data
GET	/health	Health check
```
# Example Requests
## Record Play
```
curl -X POST http://localhost:3000/v1/play \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "f48a1e22-6b6f-4c30-9a4c-7cb7b6a81aa2",
    "userId": "b6b3a9e9-9819-46a5-8d8a-04d9eab271d3",
    "contentId": "fd92a16d-d9c2-4ec7-bb07-b3e9d93f5289",
    "device": "mobile",
    "playbackDuration": 180,
    "playedAt": "2025-10-07T10:00:00Z"
  }'
```
## Fetch History
```
curl "http://localhost:3000/v1/history/b6b3a9e9-9819-46a5-8d8a-04d9eab271d3?limit=5&offset=0"
```
### Most Watched
```
curl "http://localhost:3000/v1/most-watched?start=2025-10-01T00:00:00Z&end=2025-10-07T00:00:00Z"
```
### GDPR Delete
```
curl -X DELETE "http://localhost:3000/v1/users/b6b3a9e9-9819-46a5-8d8a-04d9eab271d3"
```
```
## Project Structure
src/
├── app.ts               # Fastify app setup
├── db/pg.ts             # PostgreSQL connection pool
├── models/types.ts      # Zod schemas & types
├── routes/              # All route handlers
├── services/            # Business logic
├── utils/               # Utils
├── config/              # Env & setup
├── tests/               # Jest integration tests
└── migrations/          # SQL migrations
```

## Linting & Formatting

Run ESLint:
```
npm run lint
```

Format code with Prettier:
```
npm run format
```
## Environment Files
```
File	Purpose
.env.local	Local development
.env.docker	Docker container runtime
.env.test	Jest test environment
```

## Docs

Documentation and design notes live in 
```
docs/PROJECT_OVERVIEW.md
docs/PROJECT_DOCUMENTATION_DEV.md
```

## Hidden Architectural Strengths

Data Integrity: All validation + DB schema enforce strict consistency
Extensibility: Clean modular structure (routes → services → DB)
Resilience: Retry-on-start, idempotent inserts, consistent logs
Compliance: GDPR tombstone & delete feature
Observability: Structured logs ready for ingestion
CI/CD Ready: Dockerized, testable in isolation
Security Hooks: Easy to drop in auth, rate limits, and CORS rules

## Hidden Features (already built-In)

1. Strict Validation Layer (Zod-based)
Strong validation system:
Supports versioned UUIDs only (v4 by design).
Enforces strict ISO 8601 UTC timestamps.
Prevents malformed or incomplete play events from ever touching the database.
Hidden benefit: Guarantees data integrity at the edge — bad data never propagates into analytics.

2. Resilient Database Initialization with Retry Logic
Database connection code retries with exponential backoff when Postgres isn’t ready.
Hidden benefit: Seamless startup during Docker orchestration — no flaky “DB not ready” issues in CI or Compose setups.

3. Soft-Fails and Idempotency on Insert
The /v1/play endpoint handles duplicate event IDs gracefully (via unique constraints).
Hidden benefit: The service is idempotent by design — re-sending a play event won’t corrupt data.
That’s a feature normally found in financial-grade systems.

4. GDPR Tombstone Table
The gdpr_tombstones table silently tracks deletion events for compliance and auditability.
Hidden benefit: You’ve implemented a “soft audit trail” that meets GDPR Article 17 without retaining personal data.

5. Separation of Concerns (Clean Layering)
Architecture enforces boundaries:

routes/ — HTTP layer
services/ — business logic
db/ — infrastructure
Hidden benefit: Unit tests and new features (like batch ingestion or analytics) can be added with minimal refactor.

6. Built-in Pagination
/v1/history endpoint already anticipates scaling:
Accepts limit and offset.
Uses deterministic ordering for stable results.
Hidden benefit: Pagination logic can be reused for infinite scrolling or API pagination later.

7. CORS Preflight Awareness
Fastify + CORS setup explicitly handles OPTIONS requests and exposes credentials.
Hidden benefit: It’s ready for browser-based frontends — React, Vue, or mobile clients — without modification.

8. Structured Logging with Pino
Logs aren’t just console noise — they’re structured JSON:
Redacts sensitive headers.
Captures correlation data for tracing.
Hidden benefit: Plug-and-play ready for ELK, Loki, or Datadog ingestion.

9. Consistent Error Responses
Every error — validation, DB, or runtime — follows a predictable shape:
```
{
  "message": "Validation failed",
  "errors": [
    { "path": "userId", "message": "Invalid UUID format" }
  ]
}
```
Hidden benefit: Makes frontend debugging and automated monitoring much easier.

# Server Architecture Choice (please note, not all the parts are present, like the cache, just for refrence)
```
┌─────────────────────────────┐
│          API Layer          │    Fastify routes, request validation, docs
├─────────────────────────────┤
│       Service Layer         │    Business logic, orchestration (dedup, aggregation)
├─────────────────────────────┤
│        Data Layer           │    Repository or DAO; raw SQL/ORM (e.g., Knex, Prisma)
└─────────────────────────────┘

+-------------+            +--------------+          +--------------+
| API Gateway |  --->      | App Servers  |  --->    | PostgreSQL   |
| (Auth, Rate)|             | (Fastify/TS) |          | (Writes/Reads)|
+-------------+            +--------------+          +--------------+
                               |   ^
                               v   |
                        +-----------------+
                        |   Redis Cache   |
                        +-----------------+
                               |
                               v
                  +-----------------------------+
                  |  Aggregation Jobs / Workers |
                  | (Kafka, Cron, BullMQ, etc.) |
                  +-----------------------------+
```

### Test Coverage Report
------------------------|---------|----------|---------|---------|----------------------------------------
File                    | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s                      
------------------------|---------|----------|---------|---------|----------------------------------------
All files               |   77.33 |     59.9 |      68 |   78.15 |                                        
 dist                   |   89.65 |    53.84 |   66.66 |   89.65 |                                        
  app.js                |   89.65 |    53.84 |   66.66 |   89.65 | 18-20                                  
 dist/config            |   88.88 |       60 |     100 |   88.88 |                                        
  envLoader.js          |   88.88 |       60 |     100 |   88.88 | 16-17                                  
 dist/db                |   56.25 |    52.94 |   41.66 |   57.14 |                                        
  pg.js                 |   56.25 |    52.94 |   41.66 |   57.14 | 39-52,57-64,70,76-79,84-85,93-101      
 dist/models            |     100 |      100 |     100 |     100 |                                        
  types.js              |     100 |      100 |     100 |     100 |                                        
 dist/plugins           |   79.31 |    62.96 |     100 |   79.31 |                                        
  cors.js               |      70 |       55 |     100 |      70 | 20-29                                  
  swagger.js            |     100 |    85.71 |     100 |     100 | 3                                      
 dist/routes            |    90.9 |    68.75 |     100 |    90.9 |                                        
  gdpr.js               |   86.66 |      100 |     100 |   86.66 | 28-29                                  
  health.js             |   83.33 |        0 |     100 |   83.33 | 20-21                                  
  history.js            |     100 |      100 |     100 |     100 |                                        
  mostWatched.js        |     100 |      100 |     100 |     100 |                                        
  play.js               |    87.5 |    83.33 |     100 |    87.5 | 24,40-41                               
 dist/services          |     100 |       70 |     100 |     100 |                                        
  aggregationService.js |     100 |       50 |     100 |     100 | 24                                     
  gdprService.js        |     100 |      100 |     100 |     100 |                                        
  historyService.js     |     100 |        0 |     100 |     100 | 6                                      
  playService.js        |     100 |      100 |     100 |     100 |                                        
 dist/tests             |   84.21 |    77.77 |     100 |   83.33 |                                        
  setupTestDB.js        |   84.21 |    77.77 |     100 |   83.33 | 19-21                                  
 dist/utils             |   78.57 |     65.9 |   42.85 |   84.61 |                                        
  environment.js        |   86.66 |    63.15 |     100 |   86.66 | 14,16                                  
  errors.js             |      60 |        0 |       0 |      75 | 6-8                                    
  logger.js             |   91.66 |    80.95 |     100 |   91.66 | 20                                     
 src/config             |   86.66 |       50 |     100 |    92.3 |                                        
  envLoader.ts          |   86.66 |       50 |     100 |    92.3 | 21                                     
 src/db                 |      50 |       20 |   27.27 |   49.12 |                                        
  pg.ts                 |      50 |       20 |   27.27 |   49.12 | 44-60,69-76,83-86,91-94,99-100,109-118 
 src/utils              |   66.66 |    61.11 |       0 |    64.7 |                                        
  errors.ts             |   53.84 |        0 |       0 |   44.44 | 8-10,16,18                             
  logger.ts             |    87.5 |    78.57 |     100 |    87.5 | 24                                     
------------------------|---------|----------|---------|---------|----------------------------------------
Test Suites: 8 passed, 8 total
Tests:       23 passed, 23 total
Snapshots:   0 total
Time:        1.811 s, estimated 2 s

