"""Explicit online maintenance command; never run automatically by the app/tests.

Refreshes a small cross-implementation reference from JPL Horizons quantity 31.
Review diffs before accepting new results. Horizons uses IAU76/80 ecliptic-of-date;
Skyfield uses a different precession/nutation implementation. Test tolerance is
two arcseconds, not a claim that both systems have identical conventions.
"""

import csv
import json
import time
from datetime import UTC, datetime
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import urlopen

from od_toirog.astronomy import TARGETS

DATES = [
    "1986-01-01 00:00:00",
    "2000-01-01 12:00:00",
    "2016-07-01 03:00:00",
    "2024-04-08 18:00:00",
    "2026-09-17 00:00:00",
]


def fetch(item):
    body, target = item
    parameters = {
        "format": "json",
        "COMMAND": f"'{target}'",
        "OBJ_DATA": "'NO'",
        "MAKE_EPHEM": "'YES'",
        "EPHEM_TYPE": "'OBSERVER'",
        "CENTER": "'500@399'",
        "TLIST": ",".join(f"'{d}'" for d in DATES),
        "TLIST_TYPE": "'CAL'",
        "QUANTITIES": "'31'",
        "CSV_FORMAT": "'YES'",
        "EXTRA_PREC": "'YES'",
        "TIME_TYPE": "'UT'",
        "CAL_TYPE": "'GREGORIAN'",
        "APPARENT": "'AIRLESS'",
    }
    url = "https://ssd.jpl.nasa.gov/api/horizons.api?" + urlencode(parameters)
    for attempt in range(3):
        try:
            with urlopen(url, timeout=30) as response:
                payload = json.load(response)
            break
        except (HTTPError, URLError, TimeoutError) as error:
            if isinstance(error, HTTPError) and error.code not in (429, 502, 503, 504):
                raise
            if attempt == 2:
                raise
            time.sleep(attempt + 1)
    if "error" in payload:
        raise RuntimeError(payload["error"])
    result = payload["result"]
    block = result.split("$$SOE")[1].split("$$EOE")[0].strip()
    rows = list(csv.reader(block.splitlines()))
    if len(rows) != len(DATES):
        raise RuntimeError(f"Unexpected row count for {body}: {len(rows)}")
    values = []
    for row in rows:
        instant = datetime.strptime(row[0].strip(), "%Y-%b-%d %H:%M:%S.%f").replace(tzinfo=UTC)
        values.append(
            {
                "at": instant.isoformat(),
                "longitude_deg": float(row[3]),
                "latitude_deg": float(row[4]),
            }
        )
    return {
        "body": body,
        "target_id": target,
        "url": url,
        "values": values,
        "source_header": result.split("$$SOE")[0],
    }


def main():
    records = []
    for item in TARGETS.items():
        records.append(fetch(item))
        print(f"Retrieved {item[0]}", flush=True)
    payload = {
        "retrieved_at": datetime.now(UTC).isoformat(),
        "source": "NASA/JPL Horizons API; observer table, quantity 31; geocenter 500@399",
        "frame": "apparent IAU76/80 ecliptic and equinox of date; no refraction",
        "comparison_tolerance_arcsec": 2.0,
        "records": records,
    }
    destination = Path(__file__).resolve().parents[1] / "tests/fixtures/horizons.json"
    destination.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Saved {len(records) * len(DATES)} reference positions to {destination.name}")


if __name__ == "__main__":
    main()
