# Imported calculation method: Od Toirog engine v0.1

## Integration and provenance

Source: `od-toirog-engine-v0.1.zip` from Windows Downloads. Its code, tests, examples, calculation contract, notices and fixtures are preserved in `vendor/od-toirog-engine/`. `IMPORT.json` records the archive and file hashes. The numerical source is unmodified, verified by an integrity test.

The verified 32,726,016-byte kernel is installed at `vendor/od-toirog-engine/data/de440s.bsp`, excluded from Git. Fresh clones run `python scripts/fetch_jpl_ephemeris.py`; Docker and CI do this explicitly. Calculations never download data. `OD_TOIROG_EPHEMERIS` can point to another copy with the same SHA-256:

`c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2`

`services/astrology/jpl.py` is the website adapter. It reshapes native results into existing UI types, maps body/sign IDs to Mongolian terms, translates the selected reflection cards, and preserves evidence/provenance. It does not recalculate aspect rules or add missing houses.

## Website behavior

- New calculations default to the labeled **JPL DE440s · v0.1** method.
- The new UI always sends its method explicitly. Unversioned API calls that omit `method` retain Swiss behavior for older clients; no silent reinterpretation of their responses.
- `/chart`, `/today`, and `/compatibility` have a method selector. **Swiss Ephemeris / Placidus** remains available as `swiss-v1` for houses and explicitly disclosed unknown-time partial charts.
- JPL never borrows Swiss houses, Ascendant, MC, transit weights, or category percentages.
- Unknown-time onboarding explicitly selects Swiss; direct JPL requests with unknown time fail with 422. No silent noon substitution in JPL.
- Old default `fold=0` values are not considered confirmed DST choices. Repeated clock times require an explicit saved choice (`time_fold_confirmed`). New profile UTC conversion also uses the pinned timezone package.
- `/learn/calculations` explains the method in Mongolian and displays a genuinely calculated J2000/Greenwich reference chart without requiring a personal account.
- The archive's unauthenticated example API is not mounted. Personal calculations use the site's verified auth/ownership boundary.

## Exact conventions

### Time

Recorded local date/time + IANA zone + explicit fold if needed. TZif files come from `tzdata==2026.4`, not the host OS. UTC is round-tripped under both folds; nonexistent clock times and skipped calendar dates are rejected. Display-day zone can differ from birth zone.

Skyfield uses bundled offline time tables for UTC/TT/TDB. Supported input UTC range: `[1900-01-01, 2100-01-01)`, proleptic Gregorian calendar. The site's birth form still disallows future birthdays. Pre-1972 civil time and future leap seconds need additional review.

### Positions and target centers

`earth.at(t).observe(target).apparent().frame_latlon(ecliptic_frame)`

Apparent geocentric true ecliptic/equinox-of-date coordinates, including light-time and apparent-direction corrections. Tropical, not sidereal; Earth-centered, not topocentric/heliocentric; not fixed J2000 coordinates.

| Body | JPL target | Meaning |
|---|---:|---|
| Sun | 10 | body center |
| Moon | 301 | body center |
| Mercury | 199 | body center |
| Venus | 299 | body center |
| Mars, Jupiter, Saturn, Uranus, Neptune, Pluto | 4, 5, 6, 7, 8, 9 | system barycenters |

The latter six body-center segments are absent from this kernel. Target kind is retained and displayed. Birth coordinates are preserved but do not alter this geocentric method's longitudes. Houses are not implemented.

Sign index = `floor((longitude mod 360)/30)`; degree within sign = `longitude mod 30`.

### Motion

Wrapped longitude difference at `t ± 300 SI seconds`, divided by `600/86400` days. Uniform TT offsets avoid artificial UTC leap-second speed spikes. Negative speed = retrograde. `abs(speed) ≤ 0.0001°/day` = stationary label, not an exact station-time solution.

### Aspects

```text
separation = abs((A - B + 180) % 360 - 180)
orb = abs(separation - aspect_angle)
geometric_strength = max(0, 1 - orb / allowed_orb) ** 2
```

| Aspect | Angle | Natal/synastry orb | Transit orb |
|---|---:|---:|---:|
| Conjunction | 0° | 6° | 2° |
| Sextile | 60° | 4° | 2° |
| Square | 90° | 6° | 2° |
| Trine | 120° | 6° | 2° |
| Opposition | 180° | 6° | 2° |

Transiting Moon uses **1°** for every aspect. Previously the website used a uniform 2° transit limit, 8° natal conjunction/opposition orbs and linear closeness. A 3° orb under a 6° limit now gives **0.25**, not a 25% relationship probability.

Natal checks 45 unordered pairs; synastry checks 100 directional cross-chart pairs. Sort order is decreasing geometric strength then evidence ID. Evidence IDs are response-local; use the stored result/profile/date identity when referring to them externally.

### Daily scan

Resolve `[local-day start, next local-day start)` in UTC. Scan every 15 minutes, including the start and the final microsecond before the exclusive end. A day can be 23/25 hours. Compare each moving target with all fixed natal positions.

Search both branches for 60°, 90°, 120°; conjunction/opposition need one. Reject false brackets across ±180°. Bisect genuine sign-changing brackets with fresh astronomy to ≤0.1-second bracket width, preserving distinct crossings.

The UI distinguishes closest sample time/orb, refined crossing times, and first/last in-orb samples/counts. **Sample spans are not continuous activity windows or orb ingress/egress.** Station tangencies and very short grazes can be missed. Solver tolerance is not real-world timing accuracy or a predictive guarantee.

### Interpretation and compatibility

At most five deterministic reflection cards. Synastry cards require at least one personal planet; daily cards require a personal natal planet (Sun, Moon, Mercury, Venus, Mars). Selection and evidence IDs are preserved; themes/prompts are translated in the adapter (`jpl-web-mn-v1`). These are labeled method reflections, not scientific findings or approved personalized knowledge.

`compatibility_score` stays **null**. Existing UI categories only group evidence, with `prominence=null` for JPL. All aspect evidence remains available even without a selected card. The JPL path never invokes OpenAI; approved natal sign knowledge may still explain its positions. Optional AI synthesis remains confined to the legacy Swiss daily path.

## Storage and caching

Migration **004_calculation_methods.sql is required** for private live profiles.

- Natal key: profile UUID + calculation key.
- Daily key: profile UUID + date + profile version + calculation key + display zone.
- JPL key hashes provenance + adapter version, including kernel/time/rule checksums and timezone/library versions.
- Old rows remain `legacy-swiss-v1`, never relabeled as JPL scans.
- Equal UTC grids are centrally cached; user-specific comparisons remain separate.
- Per-profile locks suppress concurrent duplicates in the documented single-worker deployment.

## Validation performed here

The original **37 tests pass**, including 50 saved Horizons comparisons and DST/leap-second/wrap tests. Recomputed maxima: longitude **0.059809033″**, latitude **0.040882247″**, under the fixture's predeclared **2″** tolerance. Full report and current provenance: `JPL_VALIDATION.json`.

New adapter/API tests verify exact native-value preservation, unavailable houses, unknown-time rejection, confirmed folds, 23-hour scans, evidence links, null scores, requested-method dispatch and cache separation. PostgreSQL tests verify coexistence of old/new charts and day caches under existing owner RLS.

Both compared implementations use JPL-derived dynamical data. This does not validate personality claims, a global error bound over 1900–2099, houses, unknown-time inference, or a continuous event solver.

## Deployment and deliberate rule changes

Install from the repository root with `pip install -r apps/api/requirements.txt`. Numerical dependencies match release pins; the website retains its compatible FastAPI/Pydantic versions, separately integration-tested. The archive's full release lock remains under `vendor/`.

The package is installed as a local wheel. To deliberately edit its rules: change `vendor/od-toirog-engine/src/od_toirog/rules/v1.json`, bump the version, reinstall, restart, and consciously update the source audit. The integrity test detects source changes. Existing admin astrology/LLM settings apply to Swiss, not silently to JPL.

Private profiles still need Supabase and the hosted Python API. The new calculation method itself needs neither a paid astrology API nor an AI key.
