# Од Тойрог — calculation foundation v0.1

A standalone Python backend you can add to the website on your computer. It runs
locally using Skyfield and NASA/JPL DE440s, with our own aspect, synastry, daily
scan, and editorial reading rules. No paid astrology API or AI API key is needed.

This is a deterministic calculation and rule engine, not a trained machine
learning model. Astronomical coordinates are measurable; the interpretation
rules are editorial choices, not scientifically validated personality or
relationship measurements.

## Start on WSL, Linux, or macOS

Use Python **3.12 or later**. Extract the archive and open its `od-toirog-engine`
folder. The release archive includes the verified 32.7 MB JPL data file.

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements-lock.txt
python -m pip install --no-deps -e .
od-toirog download-data
python -m uvicorn od_toirog.api:app --host 127.0.0.1 --port 8000
```

`download-data` verifies the bundled file and downloads only if it is missing.
Package installation needs internet access; calculations and tests run offline
once dependencies and the data file are present. Run commands from this project
folder, or set `OD_TOIROG_EPHEMERIS` to the absolute path of `de440s.bsp`.

Open [interactive API docs](http://127.0.0.1:8000/docs). In another terminal:

```bash
curl http://127.0.0.1:8000/health
curl -X POST http://127.0.0.1:8000/v1/natal \
  -H 'Content-Type: application/json' --data-binary @examples/natal.json
```

On Windows PowerShell, create the environment with `py -3.12 -m venv .venv`
and use `.venv\Scripts\python.exe` in place of `python`; the commands otherwise
work the same. Invoke the CLI as `.venv\Scripts\python.exe -m od_toirog.cli`.

## What works

| Endpoint | What it returns |
| --- | --- |
| `GET /health` | Readiness, including whether verified astronomy data is loaded |
| `GET /v1/config` | Versions, conventions, and implemented features |
| `POST /v1/natal` | Ten body positions, signs, speeds, retrograde flags, and natal aspects |
| `POST /v1/synastry` | Cross-chart aspects and up to five evidence-linked reflection cards |
| `POST /v1/transits` | Transiting-to-natal aspects at one explicit instant |
| `POST /v1/daily` | Full local-day scan, sampled close approaches, bracketed exact crossings, and cards |

The ten bodies are Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus,
Neptune, and Pluto. Five aspects are implemented: conjunction, sextile, square,
trine, and opposition. See [CALCULATIONS.md](CALCULATIONS.md) for exact conventions.

Every result includes the engine version, Skyfield version, ephemeris checksum,
time-data checksum, pinned time-zone database, rule version, and rule checksum.
Birth inputs are echoed so the caller can retain the calculation provenance.
The API has no database and does not save birth records.

## Try the model without running a server

```bash
od-toirog natal examples/natal.json
od-toirog synastry examples/synastry.json
od-toirog transits examples/transits.json
od-toirog daily examples/daily.json
```

All example birthdays are fictional. `examples/*-response.json` contains actual
outputs from this release. `openapi.json` is the API contract for later frontend
integration.

You can also call the framework-independent service from an existing backend:

```python
from od_toirog.astronomy import SkyfieldProvider
from od_toirog.engine import Engine
from od_toirog.models import NatalRequest

provider = SkyfieldProvider()  # Load once per application worker.
engine = Engine(provider)
request = NatalRequest.model_validate({
    "birth": {
        "local_date": "2000-01-01",
        "local_time": "12:00:00",
        "timezone": "Asia/Ulaanbaatar",
    }
})
result = engine.natal(request).model_dump(mode="json")
# Close the provider when the application worker shuts down.
provider.close()
```

## Change our interpretation model

Edit `src/od_toirog/rules/v1.json` to change aspect tolerances, the Moon's transit
tolerance, planet themes, reflection prompts, and daily sampling. Bump its
`version` when changing content. Restart the process after editing; the rules
are loaded once. The content checksum catches edits even if a version bump was
forgotten. Sampling must remain positive and no greater than 15 minutes for the
current tested scan behaviour.

`readings.py` chooses which evidence receives a card. The initial text is English
and deliberately simple. Mongolian copy and richer planet-pair interpretations
can be added there without touching the astronomy adapter. No language model
generates or invents the planetary data.

`geometric_strength` measures closeness to an aspect using the configured orb.
It is **not a compatibility percentage**. `compatibility_score` remains `null`.

## Current boundaries

- Recorded birth time is required. Missing times are rejected; noon is never
  silently invented. Approximate and unknown-time uncertainty need a later layer.
- Houses, Ascendant, and Midheaven are explicitly `null`. Placidus has not been
  implemented, and no alternative house system is silently substituted.
- Positions are geocentric. Optional coordinates are preserved for later house
  calculations; they do not change this version's planetary longitudes.
- A caller supplies an IANA zone such as `Asia/Ulaanbaatar`. Place search and
  historical place-to-zone assignment are not implemented. Offset conversion
  uses the pinned database, including historical rules.
- The daily endpoint samples every 15 minutes and refines **bracketed** crossings.
  It does not promise continuous orb entry/exit windows, complete station
  tangencies, or all very short grazes. First/last in-orb samples can span gaps.
- The supported input window is UTC 1900-01-01 through 2099-12-31. Historical
  pre-1972 civil-to-dynamical time conventions and future leap seconds require
  additional review before claiming fine timing accuracy for those eras.
- This is a local integration foundation. Authentication, a user database,
  production rate limits, cross-origin browser configuration, and deployment
  belong in the website integration. The example server binds to localhost.

## Verify

```bash
pytest -q
ruff check src tests scripts
ruff format --check src tests scripts
```

Tests cover real JPL comparisons, circular angle arithmetic, pair counting,
historical Mongolia offsets, daylight-saving gaps and folds, skipped calendar
dates, 23/25-hour days, leap-second-safe speeds, crossing refinement, and the API.
Reference fixtures are checked in; tests make no network requests.

See [VALIDATION.md](VALIDATION.md) for the actual release results.
To deliberately refresh the external reference later:

```bash
python scripts/refresh_horizons_fixtures.py
```

Review the fixture diff before accepting it. It makes public requests to JPL
Horizons and is never run during API startup.

## Next implementation steps

1. Represent birth-time uncertainty with intervals and suppress unsupported
   time-sensitive claims; never treat unknown time as exact noon.
2. Add Ascendant/Midheaven and independently tested Placidus houses, including
   explicit treatment of polar latitudes.
3. Extend the daily scan into a continuous event finder with station extrema,
   orb entry/exit times, and multi-day retrograde passes.
4. Write and review Mongolian interpretations for specific planet/aspect pairs,
   keeping the supporting evidence IDs attached.
5. Connect these endpoints to the existing website and its user/profile storage.

## Sources and dependencies

- [Skyfield coordinates](https://rhodesmill.org/skyfield/coordinates.html) and
  [reference frames](https://rhodesmill.org/skyfield/api-framelib.html).
- [Skyfield planetary files](https://rhodesmill.org/skyfield/planets.html) and
  [MIT-licensed source](https://github.com/skyfielders/python-skyfield).
- [JPL planetary ephemerides](https://ssd.jpl.nasa.gov/planets/eph_export.html)
  and [DE440s data](https://ssd.jpl.nasa.gov/ftp/eph/planets/bsp/de440s.bsp).
- [JPL Horizons API](https://ssd-api.jpl.nasa.gov/doc/horizons.html) and
  [observer quantity 31](https://ssd.jpl.nasa.gov/horizons/manual.html#obsquan).
- [IANA time-zone database](https://www.iana.org/time-zones) and
  [Python zoneinfo](https://docs.python.org/3/library/zoneinfo.html).

Third-party packages retain their own licenses. Their source/license pointers
are recorded in `THIRD_PARTY_NOTICES.md`; installed wheels carry their notices.
