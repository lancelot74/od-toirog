# PRD implementation audit

Updated 2026-09-15. **This is not a public-launch approval.** Code implementation, local verification, deployed integration, and human editorial/art approval are different states.

## MVP checklist (PRD §79)

| Requirement | Implementation/evidence | Remaining launch work |
|---|---|---|
| 1. Landing page | `app/page.tsx`; approved landscape, real SVG reference-chart component | Production-device performance measurement |
| 2. Visual identity | Original emblem, supplied three scenes, lossless-layer Canvas animation, simplified mark/favicon, OG image | Final art approval; remaining launch asset series below |
| 3. Authentication | `/auth`; Supabase Google PKCE, email/password, verification, recovery, logout, session-aware redirects | Configure your project/Google/SMTP; live callback checks |
| 4. Birth onboarding | `/onboarding`; five steps, confirmation, unknown time, edit mode | Real-account full-flow acceptance |
| 5. Location resolution | Authenticated `/locations`; Open-Meteo/GeoNames results and server-resolved coordinates/timezone | Mongolian locality spelling review; provider availability |
| 6. Historical timezone | IANA ZoneInfo; UTC conversion, rejected nonexistent times, fold selection | Additional historic boundary/reference cases |
| 7. Natal calculation | FastAPI + Swiss Ephemeris; official planetary/Moon files available through setup script and Docker build | Independent numerical validation across full reference corpus |
| 8. Chart visualization | `/chart`; actual longitudes, houses, glyphs, aspects, ASC/MC; mouse/keyboard/touch selection | Visual QA of densely clustered charts |
| 9. Mongolian interpretations | Shared terminology; structured approved knowledge; factual fallback; optional replaceable OpenAI synthesis and JSON/evidence validation | The broad interpretation catalogue is **not authored/approved**. Current seed is a single draft. Human language/semantic review remains essential |
| 10. Big Three | Actual Sun/Moon/Ascendant from chart response; explicit uncertainty | Live data acceptance |
| 11. Full placements | Ten bodies, signs, degrees, retrograde, house positions | Reference-chart review |
| 12. Houses | Placidus cusps and Swiss house positions including latitude; explicit polar/unknown-time limits | System/tolerance sign-off |
| 13. Major aspects | One server rules implementation, adjustable validated orbs, strength and separation | Editorial scoring review |
| 14. Daily transits | Central cached 12:00 UTC snapshot; per-natal matching and deterministic ranking | Exact transit ingress/egress is not implemented; duration is explicitly approximate |
| 15. Daily reading | `/today`; approved knowledge, four categories, optional provider, persistent versioned cache | Fill/approve knowledge; configure provider if desired; multi-process generation needs distributed single-flight before scaling |
| 16. Why explanations | Expandable calculated angles/orbs and evidence references | Mongolian copy acceptance |
| 17. Saved profiles | Private owner-scoped Supabase profiles, create/edit/delete/select | Apply migrations and exercise hosted RLS |
| 18. Compatibility | Two saved profiles, deterministic synastry, six categories, actual charts and readings | Relationship interpretation catalogue and scoring validation |
| 19. Social cards | Canvas PNG download: 1080² / 1080×1920; Big Three, selected placement, daily, strongest compatibility connection | Brand/share-device QA |
| 20. Profile/settings | `/profile`; email, saved profiles, Mongolian/free/private state, export, deletion, logout | Operator contact and retention details; live account checks |
| 21. Admin knowledge editor | Server-verified admin role; draft/review/approved/archive; version history; users/readings/logs/failed generations/subscriptions; prompt/orb/weight configuration | Admin provisioning; large-catalog pagination/search and richer analytics charts are not included |
| 22. Analytics | Allowlisted authenticated events, optional PostHog forwarding with opaque IDs | Configure provider; anonymous acquisition funnel is not instrumented; verify complete event coverage |
| 23. Error monitoring | Optional Sentry FastAPI integration; privacy-minimal client error events and branded retry/error UI | Configure project, alerts, retention; browser stack-trace/source-map monitoring not configured |
| 24. Account deletion | Authenticated backend Admin API deletion + database cascades; explicit UI confirmation | Live Supabase deletion/export verification |

## Verified locally

Core implementation: **18 Python tests and the PostgreSQL RLS/versioning integration test passed.** The zodiac update passes **21 browser tests** (the 8 existing flows plus 13 zodiac guide/asset checks), including actual external SVG geometry rendering and desktop/mobile layouts.

- Production static export, lint and TypeScript checks.
- Python tests for reference positions, historical timezones, DST gap/fold, houses, unknown-time handling, aspect orbs, transit/synastry rules, unapproved/invalid knowledge, invalid model JSON/evidence, access denial, ownership filters and deletion identity.
- PostgreSQL migrations executed in PGlite: owner isolation, anonymous denial, private calculation writes denied, cascades and immutable version history.
- Playwright with **mocked remote services**: responsive public pages, Google authorization URL/PKCE, actual Canvas animation initialization/pause, profile/onboarding request shape, chart interaction, PNG download, error retry, returning-user routing, compatibility, and deletion confirmation.
- These do not constitute a live Google or hosted Supabase test.

## Deployment requirements

1. Create your Supabase project and run all three SQL migrations.
2. Set public frontend values and backend service-role configuration as described in `SETUP.md`.
3. Enable Google and email providers, exact callback allowlist, production SMTP.
4. Deploy FastAPI on HTTPS with the correct CORS origin; Pages cannot host Python.
5. Redeploy the static frontend with its production public values.
6. Provision the editorial admin and approve the knowledge catalogue.

## Other PRD requirements that are not yet fully satisfied

- The twelve zodiac paintings and the zodiac/planet SVG sprites are supplied and integrated, including twelve educational guide pages. Full planetary paintings, a light-use mark, and an illustrated report cover remain outstanding. Remaining art briefs are in `ASSETS.md`.
- Full UI-string extraction into locale files is incomplete. Shared astrology terminology is centralized and all primary screens are Mongolian; the app currently ships one language only.
- Complete LCP/accessibility/manual device audit and an extensive cross-software astronomy reference corpus remain launch QA work.
- The initial privacy page still needs the operator's contact identity and chosen data-retention period.
- The implementation uses a simpler repo layout and structured chart JSON rather than every suggested table/module in §§57–62; chart facts are stored structurally, not only as prose. No separate social-network/friend system is included.
- Subscription payments, premium report generation, native apps, social feeds, gamification, and “Одноос асуу” are not initial-MVP requirements.

## Original PRD location

The supplied specification is `/mnt/c/Users/garhy/Downloads/ОД ТОЙРОГ.md` (96 sections). This status file records coverage without rewriting the user's source document or treating previews as completed calculations.
