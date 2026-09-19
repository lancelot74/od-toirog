# Third-party components

The release bundles one unmodified public NASA/JPL data file. Python dependency
code is installed separately; each dependency retains its own license and
notices. This document does not replace those notices or assign a license to
the custom Од Тойрог application code.

| Component | Purpose | Upstream source / license information |
| --- | --- | --- |
| Skyfield | Time scales, apparent positions, frame transformations | https://github.com/skyfielders/python-skyfield — MIT |
| JPL DE440s | Solar-system ephemeris data | https://ssd.jpl.nasa.gov/planets/eph_export.html |
| jplephem | Reading SPK ephemeris segments | https://github.com/brandon-rhodes/python-jplephem |
| NumPy | Array calculations | https://numpy.org/doc/stable/license.html |
| Python tzdata | Packaged IANA timezone files | https://github.com/python/tzdata |
| FastAPI | HTTP API | https://github.com/fastapi/fastapi |
| Pydantic | Request and response validation | https://github.com/pydantic/pydantic |
| Uvicorn | Local ASGI server | https://github.com/encode/uvicorn |

Transitive runtime and development dependencies are recorded in
`requirements-lock.txt`. Their installed distribution metadata includes their
own licenses. No dependencies are redistributed as source or wheels here.

## Bundled data

- File: `data/de440s.bsp`
- Provider: NASA / Jet Propulsion Laboratory, Solar System Dynamics
- Source: https://ssd.jpl.nasa.gov/ftp/eph/planets/bsp/de440s.bsp
- Bytes: 32,726,016
- SHA-256: `c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2`
- The file's original internal SPK comments remain intact.

The checked-in Horizons fixture records the queried target IDs, source header,
request URLs, retrieval timestamp, and returned coordinates. It is reference
data for reproducible tests, not an API dependency at runtime.
