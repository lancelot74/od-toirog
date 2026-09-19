# API boundary

Run FastAPI from the repository root: `.venv/bin/uvicorn apps.api.main:app --port 8000`.
Interactive OpenAPI documentation is at `/docs`.

All endpoints below except `/health` and `/calculation-methods` require `Authorization: Bearer <Supabase access token>`. The backend verifies the token against Supabase Auth. Every profile lookup filters **both** profile UUID and authenticated owner UUID.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Verified default JPL readiness, calculation version and kernel checksum; 503 for unavailable data |
| GET | `/calculation-methods` | Public JPL conventions, provenance, rules and feature limits |
| GET | `/locations?q=...` | Place candidates; no birth details sent to geocoder |
| POST | `/profiles` | Validate date/time/location, resolve timezone, convert UTC, create or edit owned profile |
| GET | `/charts/{profile_id}?method=jpl-v0.1` | JPL positions/aspects/provenance. `method=swiss-v1` explicitly selects Placidus |
| GET | `/today/{profile_id}?method=jpl-v0.1&date=2026-09-19&timezone=Asia/Ulaanbaatar` | Local-day scan. Omitted date means today in the display zone; omitted zone uses birth zone. Swiss alternative is 12:00 UTC |
| GET | `/transits/{profile_id}?at=2026-09-19T12:00:00Z` | JPL instantaneous transit evidence; explicit UTC offset required |
| POST | `/compatibility` | `{first, second, method}` owned profile UUIDs. Explicit `jpl-v0.1` keeps compatibility score null |
| GET | `/account/export` | Owner-scoped JSON export, paginated retrieval from storage |
| DELETE | `/account` | Delete verified authenticated account; database cascades remove records |
| POST | `/events` | Allowlisted event name only; no arbitrary properties |
| GET/POST | `/admin/knowledge` | Read/write structured editorial entries |
| GET/POST | `/admin/settings` | Versioned astrology rules / language prompt config |
| GET | `/admin/logs` | Recent operation log |
| GET | `/admin/records/{kind}` | Users, readings, histories, failures, reports, event records, subscriptions |

Admin endpoints require **server-verified `app_metadata.role=admin`**. Client-side visibility is only a usability feature, never the authorization boundary.

The new website defaults to JPL and always sends `method` explicitly. Existing clients that omit the parameter keep legacy Swiss response semantics.

Private user state is fetched at runtime. Static exported HTML contains no user records. Service-role credentials and language-provider credentials exist only on the backend.
