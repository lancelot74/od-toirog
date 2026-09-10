# Calculation and interpretation rules

The authoritative aspect geometry is in `services/astrology/engine.py`; validated orb/weight defaults are in `services/astrology/rules.py` with versioned admin overrides. The frontend only converts longitudes to SVG coordinates; it never calculates astrology. Shared Mongolian terminology is in `packages/localization/terms.json` and is consumed by both runtimes.

- Ten bodies: Sun=0, Moon=1, Mercury=2, Venus=3, Mars=4, Jupiter=5, Saturn=6, Uranus=7, Neptune=8, Pluto=9.
- Tropical, geocentric ecliptic longitudes; speed and retrograde are returned by Swiss Ephemeris.
- Placidus house cusps, Ascendant and MC use location and UTC. House positions include planetary latitude using Swiss `house_pos`.
- Natal/synastry orbs: conjunction/opposition 8°, trine/square 6°, sextile 4°. Daily transits cap each orb at 2°.
- Strength = 1 − orb / allowed orb. Transit rank multiplies closeness, transit planet weight, natal planet weight, aspect weight and duration modifier.
- Daily UTC snapshot: 12:00. Approximate duration = twice allowed orb / current absolute longitudinal speed. Near stations it is unavailable. This is not an exact ingress/egress solver.
- Compatibility prominence is mean aspect strength × 100 in each category; it is not a success probability or objective relationship quality score. Coefficients need product/editor review.
- The current tests anchor Sun/Moon J2000 values, Greenwich Ascendant, houses, boundaries, DST gap/fold, historic Ulaanbaatar timezone, uncertainty, transits and deterministic synastry. More independent reference charts are required before claiming launch-grade cross-software agreement for all planets/locations.

Interpretation: structured approved knowledge first; unapproved/missing entries produce explicit calculated-fact fallbacks. Optional language synthesis has no ephemeris responsibility. No AI-generated charts or frontend aspect rules.
