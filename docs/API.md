# API boundary

Run FastAPI from the repository root: `.venv/bin/uvicorn apps.api.main:app --port 8000`.
Interactive OpenAPI documentation is at `/docs`.

All endpoints below except `/health` require `Authorization: Bearer <Supabase access token>`. The backend verifies the token against Supabase Auth. Every profile lookup filters **both** profile UUID and authenticated owner UUID.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Readiness and calculation version |
| GET | `/locations?q=...` | Place candidates; no birth details sent to geocoder |
| POST | `/profiles` | Validate date/time/location, resolve timezone, convert UTC, create or edit owned profile |
| GET | `/charts/{profile_id}` | Real natal calculations, structured placements/houses/aspects, knowledge-backed readings |
| GET | `/today/{profile_id}` | Cached daily transit reading and version metadata |
| POST | `/compatibility` | `{first, second}` owned profile UUIDs; deterministic synastry report |
| GET | `/account/export` | Owner-scoped JSON export, paginated retrieval from storage |
| DELETE | `/account` | Delete verified authenticated account; database cascades remove records |
| POST | `/events` | Allowlisted event name only; no arbitrary properties |
| GET/POST | `/admin/knowledge` | Read/write structured editorial entries |
| GET/POST | `/admin/settings` | Versioned astrology rules / language prompt config |
| GET | `/admin/logs` | Recent operation log |
| GET | `/admin/records/{kind}` | Users, readings, histories, failures, reports, event records, subscriptions |

Admin endpoints require **server-verified `app_metadata.role=admin`**. Client-side visibility is only a usability feature, never the authorization boundary.

Private user state is fetched at runtime. Static exported HTML contains no user records. Service-role credentials and language-provider credentials exist only on the backend.
