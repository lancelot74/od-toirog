# Supabase and deployment setup

## 1. Supabase project

Create a project. Run migrations in order in the SQL editor:

1. `supabase/migrations/001_foundation.sql`
2. `supabase/migrations/002_knowledge_seed.sql`
3. `supabase/migrations/003_admin_history.sql`

These create private profiles, structured chart storage, versioned daily caches, compatibility reports, an editorial knowledge table, and operation logs. RLS is enabled on every table. Authenticated users can only CRUD their own profiles; calculated rows are written through the backend and are read-only to their owners. The seed interpretation is **draft**.

## 2. Environment

Frontend public values (build-time):

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Backend secrets, in `.env.local` locally or the backend host's secret settings:

```env
SUPABASE_URL=https://PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_OR_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
WEB_ORIGINS=http://localhost:3001,http://localhost:3000,https://lancelot74.github.io
EPHEMERIS_PATH=/absolute/path/to/od-toirog/ephemeris
```

Do not put a service-role key in GitHub Pages variables or any `NEXT_PUBLIC_*` variable. The backend verifies each bearer token against Supabase and checks ownership before using its service role.

## 3. Google sign-in

In Google Cloud, configure the OAuth consent screen and a **Web application** OAuth client. For its authorized redirect URI, use the Supabase provider callback displayed in your project, normally:

`https://PROJECT.supabase.co/auth/v1/callback`

Put the Google client ID and client secret into **Supabase → Authentication → Providers → Google**. The Google secret stays there.

In **Supabase → Authentication → URL Configuration**, set the Site URL to your deployed site and allow these exact application redirects:

- `http://localhost:3000/auth/`
- `http://localhost:3000/auth/?flow=recovery`
- `http://localhost:3001/auth/`
- `http://localhost:3001/auth/?flow=recovery`
- `https://lancelot74.github.io/od-toirog/auth/`
- `https://lancelot74.github.io/od-toirog/auth/?flow=recovery`

Use your actual hostname if different. PKCE callback handling runs in the browser. Email verification/recovery links must be opened in the browser that initiated the request. Configure production SMTP and test new account, returning account, expired link, password reset and logout.

## 4. Backend and astronomy

Run `python scripts/fetch_ephemeris.py` once to obtain the official planetary and Moon data, then set `EPHEMERIS_PATH`. Without these files Swiss Ephemeris uses its built-in Moshier calculation; the API explicitly reports the engine actually used. Check Swiss Ephemeris licensing for the deployment model before public distribution.

The service uses tropical/geocentric positions, Placidus houses and IANA historical timezone rules. Coordinates determine the timezone server-side. Date range: 1900 to today. Open-Meteo/GeoNames supplies place search; results should be reviewed for Mongolian locality spelling and historic boundary edge cases.

The provided backend runs one worker. Per-profile async locks prevent concurrent duplicate daily generation in that worker, with PostgreSQL enforcing unique daily cache records. Use a distributed job/lease mechanism before scaling generation across multiple backend processes; database uniqueness alone cannot prevent duplicate provider costs.

Unknown time: explicitly use 12:00 local as a reference, omit Ascendant/MC/houses, mark Moon and sign-changing bodies uncertain, and exclude uncertain bodies from aspect interpretations. DST gaps reject input; repeated local times support first/second occurrence.

## 5. Editorial administration

Assign `app_metadata.role = admin` to the intended admin user using Supabase's **server-side Admin API**. Never use user-editable `user_metadata` for privileges. Open `/admin` after signing in. Create structured entries and advance draft → review → approved. Database triggers retain previous knowledge/config versions. New approved entries affect new readings; cached daily readings retain their stored version metadata. The operations panel exposes users, readings, history, failed generation, event records and subscriptions. Rule weights/orbs and language prompts can be versioned there without redeployment.

Entry keys: `planet_0_sign_0`, `planet_1_house_4`, `aspect_0_1_trine`, `transit_2_1_square`, `synastry_3_4_trine`. Planet IDs are documented in `services/astrology/engine.py`; sign IDs start at Aries=0.

Optional daily language synthesis: set backend `OPENAI_API_KEY` and `OPENAI_MODEL`. Only approved knowledge is passed; model output is schema-validated and unknown evidence keys rejected. Invalid/provider-error outputs fall back to deterministic facts and are logged. Output still needs Mongolian editorial and semantic review before launch; schema validation cannot prove prose is astrologically consistent.

## 6. Monitoring and analytics

Optional backend `SENTRY_DSN` enables FastAPI exception monitoring with no request body or default PII collection. `ANALYTICS_KEY`, `POSTHOG_HOST`, and `ANALYTICS_SALT` forward allowlisted events to PostHog. Client error events deliberately contain no exception text, URL query, names, birthdays or coordinates. Anonymous visitor tracking is not enabled.

## 7. GitHub Pages

Set repository Actions variables `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`, then rerun Pages deployment. The API URL must be public HTTPS, not localhost. `WEB_ORIGINS` uses origins (e.g. `https://lancelot74.github.io`), not paths. Redeploy after changing public values.

Before launch, test RLS using two ordinary accounts against Supabase REST directly, not just the UI. Account deletion requires backend service-role access and cascades through private records. The UI does not serve as the authorization boundary.
