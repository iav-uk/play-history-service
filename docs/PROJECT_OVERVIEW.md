
---

## **docs/PROJECT_OVERVIEW.md**

```markdown
# Project Overview

## System Purpose
Play History Service tracks playback events and provides analytics APIs for user and content activity.

## Architecture
- Fastify REST API
- PostgreSQL database with migrations
- TypeScript + Zod for type-safe validation
- Services layer (business logic)
- Repositories (database access)
- Dockerized for local + CI/CD use

## Data Flow
1. Client sends playback event (`POST /v1/play`)
2. Service validates request → inserts into DB
3. Analytics endpoints aggregate data via SQL
4. GDPR endpoint allows data removal

## Tables
- `plays` — main playback history
- `gdpr_tombstones` — deleted user records

## Error Handling
- All routes use structured error middleware
- Validation via Zod with descriptive messages

## Logging
- Pino-based structured logging with redaction
- Request/response lifecycle logged at info/debug

## Testing Strategy
- Jest integration tests (run inside Docker)
- Uses test database migrations
- Health, Play, History, Analytics, and GDPR coverage

# Design Decisions & Trade-offs

1. Framework Choice: Fastify over Express

Decision: 
Chose Fastify as the core HTTP framework instead of Express.

Rationale:
 - Higher throughput and lower overhead, especially under load.
 - Built-in schema validation, logging, and plugin system.
 - Simpler integration with TypeScript types and async/await.
Trade-offs:
 - Slightly smaller ecosystem and fewer tutorials than Express.
 - Some middleware requires wrappers or reimplementation.

2. Validation Layer: Zod instead of Joi or Yup

Decision:
Used Zod for request validation and type inference.

Rationale:
 - Type inference integrates seamlessly with TypeScript (z.infer<>).
 - Self-contained and lightweight, no runtime dependencies.
 - Declarative syntax makes schemas easy to maintain.
Trade-offs:
 - Slightly less performant for very large nested schemas.
 - Some 3rd-party integrations (e.g., Swagger) lag behind Zod’s latest version.

3. Database Layer: Raw SQL via pg instead of ORM

Decision:
Used raw SQL queries via the official pg library, rather than ORMs like Prisma or TypeORM.

Rationale:
 - Full control over queries, indexes, and transaction boundaries.
 - No hidden abstractions; easier to profile and tune for performance.
 - Lightweight dependency footprint (important for microservices).
Trade-offs:
 - More boilerplate for mapping results to objects.
 - No built-in migrations or schema synchronization (handled manually).
 - Developers must understand SQL well.

Future option:
Could introduce a minimal query builder like Kysely or Drizzle ORM if complexity grows.

4. Architecture: Service + Repository Pattern

Decision:
Introduced a clean separation between:

routes/ — handles HTTP and validation
services/ — contains business logic
repositories/ (planned) — encapsulates database access

Rationale:
 - Encourages testability and clear dependency boundaries.
 - Makes domain logic reusable (e.g., background jobs, batch processing).
 - Easier to refactor if DB schema or framework changes.
Trade-offs:
 - Slightly more initial boilerplate for small APIs.
 - Developers must maintain consistency between layers.

5. Error Handling and Logging

Decision:
Centralized error handling middleware with structured Pino logging.

Rationale:
 - Structured JSON logs integrate cleanly with log aggregators (ELK, Datadog).
 - Redacts sensitive fields automatically (req.headers.authorization).
 - Consistent error responses across routes.
Trade-offs:
 - Logs are verbose during development.
 - Pino requires some setup for pretty-printing in local mode.

6. GDPR Delete with Tombstone Table

Decision:
Instead of hard-deleting silently, maintain a gdpr_tombstones table for audit tracking.

Rationale:
 - Satisfies GDPR “right to be forgotten” while preserving deletion metadata.
 - Prevents accidental re-insertion of deleted users.
Trade-offs:
 - Slightly more disk space usage.
 - Must ensure other services respect the tombstone state.

7. Deployment Strategy: Docker Compose

Decision:
Dockerize both API and PostgreSQL for parity between local and production.

Rationale:
 - Easy environment isolation.
 - Simplifies CI/CD pipelines.
 - Reproducible developer setup (no "works on my machine").
Trade-offs:
 - Slightly slower startup on macOS/Windows.
 - Requires Docker knowledge for debugging network issues.

8. Strict UUID and Timestamp Validation

Decision:
Enforced strong validation for UUID (version 4 only) and ISO 8601 timestamps.

Rationale:
 - Ensures data integrity before persistence.
 - Prevents invalid UUID formats leaking into analytics or other services.
Trade-offs:
 - Stricter validation may reject legacy or third-party IDs.
 - More developer friction during testing, but higher production safety.

9. Testing Strategy: Integration over Unit Tests

Decision:
Prioritized end-to-end integration tests using Jest with real DB migrations.

Rationale:
 - Catches schema, query, and validation mismatches.
 - Confirms end-user behavior across the entire stack.
Trade-offs:
 - Tests run slower than pure unit tests.
 - Requires Dockerized DB setup for CI.

10. Future Improvements
better pagination (cursor-based), more metrics and tracing, caching for /most-watched (Redis or in-memory), authentification and Token-based API gating with rate limiting, useses transactions (BEGIN / COMMIT / ROLLBACK), use query builders
