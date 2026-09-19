"""Free astronomy adapter; no Swiss Ephemeris code or service calls."""

import hashlib
import os
from datetime import datetime
from importlib.metadata import version
from importlib.resources import files
from pathlib import Path

import numpy as np
import tzdata
from skyfield.api import load, load_file
from skyfield.framelib import ecliptic_frame

from . import __version__
from .aspects import load_rules, signed_delta, zodiac
from .errors import DataError
from .models import Position, Provenance
from .timezones import SUPPORTED_END, SUPPORTED_START, require_supported

EPHEMERIS_URL = "https://ssd.jpl.nasa.gov/ftp/eph/planets/bsp/de440s.bsp"
EPHEMERIS_SHA256 = "c1c7feeab882263fc493a9d5a5b2ddd71b54826cdf65d8d17a76126b260a49f2"
TARGETS = {
    "sun": 10,
    "moon": 301,
    "mercury": 199,
    "venus": 299,
    "mars": 4,
    "jupiter": 5,
    "saturn": 6,
    "uranus": 7,
    "neptune": 8,
    "pluto": 9,
}
SPEED_STEP_SECONDS = 300


def data_path() -> Path:
    return Path(os.environ.get("OD_TOIROG_EPHEMERIS", "data/de440s.bsp"))


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


class SkyfieldProvider:
    def __init__(self, path: Path | None = None):
        path = path or data_path()
        if not path.is_file():
            raise DataError("JPL data is missing. Run: od-toirog download-data")
        checksum = sha256_file(path)
        if checksum != EPHEMERIS_SHA256:
            raise DataError("JPL data checksum mismatch. Obtain the verified DE440s file.")
        self.ephemeris = load_file(str(path))
        # builtin=True prevents time-table downloads during calculations.
        self.timescale = load.timescale(builtin=True)
        self.earth = self.ephemeris[399]
        rules = load_rules()
        self.provenance = Provenance(
            engine_version=__version__,
            astronomy_library=f"skyfield {version('skyfield')}",
            ephemeris="JPL DE440s",
            ephemeris_sha256=checksum,
            time_data_sha256=hashlib.sha256(
                files("skyfield").joinpath("data/iers.npz").read_bytes()
            ).hexdigest(),
            timezone_database=f"tzdata {tzdata.__version__} / IANA {tzdata.IANA_VERSION}",
            coordinate_system="apparent geocentric true ecliptic and equinox of date",
            speed_method="centered difference of longitude at t +/- 300 SI seconds",
            rules_version=rules["version"],
            rules_sha256=rules["sha256"],
            supported_utc_start=SUPPORTED_START,
            supported_utc_end_exclusive=SUPPORTED_END,
        )

    def close(self) -> None:
        self.ephemeris.close()

    def _coordinates(self, instants: list[datetime], body: str):
        times = self.timescale.from_datetimes(instants)
        return self._coordinates_at_times(times, body)

    def _coordinates_at_times(self, times, body: str):
        apparent = self.earth.at(times).observe(self.ephemeris[TARGETS[body]]).apparent()
        lat, lon, distance = apparent.frame_latlon(ecliptic_frame)
        return np.asarray(lat.degrees), np.asarray(lon.degrees), np.asarray(distance.au)

    def longitude_series(self, instants: list[datetime], body: str) -> np.ndarray:
        if not instants:
            return np.empty(0)
        instants = [require_supported(t) for t in instants]
        return self._coordinates(instants, body)[1]

    def positions(self, instant: datetime) -> list[Position]:
        utc = require_supported(instant)
        # Neighbours can extend 5 minutes past the API bounds; the kernel safely
        # covers 1849–2150. Keep input validation on the requested instant.
        # Offset in TT to keep the derivative denominator correct at leap seconds.
        t = self.timescale.from_datetime(utc)
        times = self.timescale.tt_jd(
            t.whole, t.tt_fraction + np.array([-1, 0, 1]) * SPEED_STEP_SECONDS / 86400
        )
        result = []
        for body, target in TARGETS.items():
            lat, lon, distance = self._coordinates_at_times(times, body)
            speed = signed_delta(float(lon[2]), float(lon[0])) / (2 * SPEED_STEP_SECONDS / 86400)
            sign, degree = zodiac(float(lon[1]))
            threshold = load_rules()["stationary_speed_deg_per_day"]
            motion = (
                "stationary" if abs(speed) <= threshold else "retrograde" if speed < 0 else "direct"
            )
            result.append(
                Position(
                    body=body,
                    target_id=target,
                    target_kind="system_barycenter" if target in range(4, 10) else "body_center",
                    longitude_deg=float(lon[1]) % 360,
                    latitude_deg=float(lat[1]),
                    distance_au=float(distance[1]),
                    sign=sign,
                    degree_in_sign=degree,
                    speed_deg_per_day=speed,
                    retrograde=speed < 0,
                    motion=motion,
                )
            )
        return result
