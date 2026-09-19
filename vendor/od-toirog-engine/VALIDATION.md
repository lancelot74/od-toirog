# Release validation — v0.1.0

Executed on 2026-09-17 using Python 3.12.14 on Linux with the exact package
versions recorded in `requirements-lock.txt`.

## Results

- **37 tests passed.** No skipped tests in the full run.
- Ruff code checks passed; source, tests, and scripts were formatted.
- A real Uvicorn process returned HTTP 200 for readiness and all four POST
  endpoints. The command-line natal calculation and data verification also ran.
- Fifty apparent positions were compared against independently requested
  NASA/JPL Horizons results: ten target IDs at five dates between 1986 and 2026.
- Maximum longitude difference: **0.059809 arcseconds**.
- Maximum latitude difference: **0.040882 arcseconds**.
- The predeclared comparison tolerance was 2 arcseconds per component.
- All four example calculations executed and their actual JSON responses are
  included in `examples/`. The daily example completed in approximately
  0.19 seconds in this environment; this is an observed run, not a load benchmark.

The Horizons fixture, request URLs, original headers, and retrieval timestamp
are in `tests/fixtures/horizons.json`. Per-body comparison differences are in
`tests/fixtures/comparison-results.json`.

## What the external comparison establishes

The comparison checks target identity, frame orientation, apparent-coordinate
handling, and time conversion at the selected dates. Both implementations use
JPL-derived dynamical data; this is a cross-implementation check, not a new
independent measurement of planetary orbits. Horizons' quantity 31 uses
IAU76/80 ecliptic-of-date conventions, while Skyfield uses its own reference-frame
implementation; their outputs need not match exactly.

These results do not establish a global worst-case error over 1900–2099 or the
validity of astrological interpretations. They also do not validate houses,
Ascendant, unknown birth times, or a continuous station-aware event engine,
which are outside this release.

## Other covered risks

- Mongolia's July 2016 UTC+9 offset versus July 2017 UTC+8.
- Explicit selection for a repeated New York birth time and rejection of a
  nonexistent time.
- 23- and 25-hour local days, a skipped midnight in São Paulo, and Apia's skipped
  calendar date.
- Correct angle wrapping at 0°/360°, sign boundaries, and natal/synastry pair
  counts without losing directional cross-chart pairs.
- Positive solar speed across the Aries boundary, a real Mars retrograde, and
  a lunar derivative without an artificial UTC leap-second spike.
- Analytic exact-crossing cases, retrograde crossings, both sextile branches,
  and exclusive day-end handling.
- API input validation, response evidence links, and actionable missing-data
  errors.

Two dependency deprecation warnings appeared in the test HTTP client, relating
to its HTTPX adapter and AnyIO portal alias. They did not affect the test
results. They are recorded here rather than suppressed.
