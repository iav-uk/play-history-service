# Play History Service API Documentation
Base URL

Local: http://localhost:3000

Docker: http://localhost:3000

# Health
```
GET /health
```
Response:
```
{
  "status": "ok",
  "uptime": 120.34,
  "db": "connected"
}
```
# Play Events
```
POST /v1/play
```
Response:
```
{
  "eventId": "b9a50e7e-b530-4df8-8fd9-3ef7a431c012",
  "userId": "e7bcb0f5-871a-4c2f-80c2-9c8f7a7eaa99",
  "contentId": "3abffeed-679f-442c-8b8b-2c55c33cf2c3",
  "device": "web",
  "playbackDuration": 120,
  "playedAt": "2025-10-07T12:00:00Z"
}
```
Error Responses:

- 200 OK – event stored successfully

- 400 Bad Request – validation failed

- 409 Conflict – duplicate event ID


# Playback History
```
GET /v1/history/:userId
```
Retrieves all play events for a specific user.

Parameters:

- userId (path) – UUID of the user

Query parameters:

- page (optional, default = 1)

- limit (optional, default = 10)

Response:
```
{
  "data": [
    {
      "eventId": "...",
      "contentId": "...",
      "device": "mobile",
      "playbackDuration": 300,
      "playedAt": "2025-10-06T21:40:00Z"
    }
  ],
  "page": 1,
  "totalPages": 5
}
```

# Most Watched Content
```
GET /v1/most-watched
```
Returns the top-ranked content by watch time within a date range.

Query parameters:

- from (ISO date)

- to (ISO date)

- limit (default = 10)

Response:
```
[
  { "contentId": "...", "totalPlayback": 1200 },
  { "contentId": "...", "totalPlayback": 1100 }
]
```
# GDPR: Right to be Forgotten
```
DELETE /v1/users/:userId
```
Deletes all play history for a given user and records a tombstone entry.

Response:
```
{
  "message": "User data deleted under GDPR",
  "userId": "e7bcb0f5-871a-4c2f-80c2-9c8f7a7eaa99",
  "deletedRecords": 42
}
```
# Errors (standard format)

All endpoints return structured errors:
```
{
  "message": "Validation failed",
  "errors": [
    { "path": "userId", "message": "Invalid UUID format" }
  ]
}
```
# Authentication (planned)

Currently open; will later require API key via header:

Authorization: Bearer <API_KEY

# Other

Run locally: npm run dev

Run via Docker: docker compose up

Test endpoints: use curl or VSCode REST Client (.http file)

Migration scripts: in migrations/

Tests: in src/tests/
