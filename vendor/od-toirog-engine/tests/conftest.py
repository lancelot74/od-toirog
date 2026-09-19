from pathlib import Path

import pytest

from od_toirog.astronomy import SkyfieldProvider
from od_toirog.models import Position


@pytest.fixture(scope="session")
def provider():
    path = Path(__file__).resolve().parents[1] / "data/de440s.bsp"
    instance = SkyfieldProvider(path)
    yield instance
    instance.close()


@pytest.fixture
def position():
    def make(body: str, longitude: float) -> Position:
        return Position(
            body=body,
            target_id=10,
            target_kind="body_center",
            longitude_deg=longitude,
            latitude_deg=0,
            distance_au=1,
            sign="aries",
            degree_in_sign=0,
            speed_deg_per_day=1,
            retrograde=False,
            motion="direct",
        )

    return make


@pytest.fixture
def birth():
    # Invented demonstration birth; not the user's personal data.
    return {
        "local_date": "2000-01-01",
        "local_time": "12:00:00",
        "timezone": "Asia/Ulaanbaatar",
        "latitude": 47.9189,
        "longitude": 106.9176,
    }
