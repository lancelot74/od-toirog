# Calculation contract

## 1. Civil birth time → UTC → astronomical time

`BirthInput` preserves a local date, local time, IANA timezone, optional DST
fold, and optional latitude/longitude. The calendar is proleptic Gregorian.
Use the recorded birthplace's historical zone identity, not a current device
zone or a hard-coded `UTC+8`.

`timezones.py` loads TZif files directly from the pinned `tzdata` package on
every platform. System zone files cannot silently change a result. A local time
is round-tripped through UTC under both fold values: zero valid instants means
a skipped time; two means the caller must explicitly choose the earlier or later
occurrence. A daily reading independently resolves the requested display zone's
calendar boundaries in UTC.

Skyfield then handles UTC/TT/TDB conversion and evaluates the JPL kernel. Its
bundled time tables are used offline. Python inputs cannot encode a literal
`23:59:60`; longitude derivatives use uniform TT increments and do not acquire
an artificial jump when their interval spans a leap second. Historical UTC and
future leap-second limitations still apply as stated in README.md.

## 2. Ten apparent, geocentric tropical longitudes

For each target:

```python
earth.at(t).observe(target).apparent().frame_latlon(ecliptic_frame)
```

This includes light travel time and apparent-direction corrections, expressed
against the true ecliptic/equinox of date. It is not a heliocentric position,
sidereal zodiac, topocentric position, or J2000 ecliptic coordinate. No atmospheric
refraction is requested.

| Display body | JPL target | Target convention |
| --- | ---: | --- |
| Sun | 10 | Body center |
| Moon | 301 | Body center |
| Mercury | 199 | Body center |
| Venus | 299 | Body center |
| Mars | 4 | Planetary system barycenter |
| Jupiter | 5 | Planetary system barycenter |
| Saturn | 6 | Planetary system barycenter |
| Uranus | 7 | Planetary system barycenter |
| Neptune | 8 | Planetary system barycenter |
| Pluto | 9 | Planetary system barycenter |

DE440s does not contain body-center segments for the latter six targets. The API
reports `target_kind` explicitly; adding satellite kernels would be necessary
to change this convention. Reference checks use the same target IDs.

Longitude is normalized into `[0, 360)`. Sign index is `floor(longitude / 30)`;
degree within sign is `longitude % 30`. The tropical signs are twelve equal
30-degree intervals, not astronomical constellation boundaries.

Speed is the signed, wrapped longitude difference at ±300 SI seconds divided by
600/86400 days. Negative speed sets `retrograde=true`. `motion="stationary"`
means absolute speed is at most the configurable threshold of 0.0001 deg/day;
it is a label, not an exact station-time calculation.

## 3. Aspects and compatibility evidence

For longitudes A and B:

```text
separation = abs((A - B + 180) % 360 - 180)
orb = abs(separation - aspect_angle)
geometric_strength = max(0, 1 - orb / allowed_orb) ** 2
```

| Aspect | Angle | Natal/synastry orb | Transit orb |
| --- | ---: | ---: | ---: |
| Conjunction | 0° | 6° | 2° |
| Sextile | 60° | 4° | 2° |
| Square | 90° | 6° | 2° |
| Trine | 120° | 6° | 2° |
| Opposition | 180° | 6° | 2° |

All transiting Moon aspects use a tighter 1° orb. These tolerances are editable
design choices. No angular speed, orb, or editorial weight is a measured
relationship probability.

A natal chart considers 45 unordered pairs among ten bodies. Synastry considers
100 pairs: each body of A against each body of B. `A Sun / B Moon` is distinct
from `A Moon / B Sun`. A transit snapshot places the moving body on the left and
the fixed natal body on the right. Every returned aspect has a stable evidence
ID within its response. Prefix it with a chart/request identity if storing it.

Results sort by orb-based strength, then by ID for reproducibility. Synastry
reading cards require at least one personal planet; daily cards require the
natal body to be personal. The complete aspect evidence remains available.

## 4. Daily scan

1. Resolve `[start, next-day-start)` in the requested display zone. It need not
   last 24 hours. Reject dates that never occurred, such as Apia 2011-12-30.
2. Evaluate the ten moving targets on a UTC grid, normally 15 minutes apart,
   including the beginning and the last representable microsecond of the day.
3. Compare each moving longitude to every fixed natal longitude under each
   configured aspect rule. Keep the closest **sample** and the in-orb samples.
4. Search both directional branches for 60°, 90°, and 120°. Conjunction and
   opposition each need one branch. Discard false brackets created by the
   signed-angle discontinuity at ±180°.
5. Bisect genuine sign-changing brackets using fresh astronomy evaluations
   until the bracket is at most 0.1 seconds wide. Preserve distinct crossings.
6. Build reflection cards linked to the resulting evidence IDs.

The refinement tolerance is a numerical convergence setting, not a guarantee of
0.1-second real-world predictive accuracy. `closest_sample_utc` is deliberately
different from `exact_crossings_utc`. Sample spans do not assert continuous
activity and are not orb entry/exit windows. Station tangencies and excursions
entirely between samples can be missed. A continuous event engine is the next
stage, not something this release claims to provide.

## 5. Reproducibility and extension

Pin dependencies with `requirements-lock.txt`; keep the bundled kernel checksum
and rule version with saved results. Do not silently upgrade the ephemeris,
timezone database, aspect rules, or conventions when regenerating existing
charts. `astronomy.py` is the data adapter; `engine.py` joins the calculation
stages; `readings.py` and `rules/v1.json` own the editable interpretation model.

No Swiss Ephemeris dependency, copied implementation, or proprietary astrology
API is used in this project. No training data or claimed compatibility
statistics are invented.
