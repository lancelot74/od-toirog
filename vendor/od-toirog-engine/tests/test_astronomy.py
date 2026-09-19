import json
from datetime import UTC, datetime
from pathlib import Path

import pytest

from od_toirog.aspects import separation

pytestmark = pytest.mark.integration


def test_all_bodies_against_independently_retrieved_horizons_coordinates(provider):
    reference = json.loads((Path(__file__).parent / "fixtures/horizons.json").read_text())
    tolerance = reference["comparison_tolerance_arcsec"] / 3600
    cache = {}
    count = 0
    for record in reference["records"]:
        for expected in record["values"]:
            at = expected["at"]
            if at not in cache:
                cache[at] = {p.body: p for p in provider.positions(datetime.fromisoformat(at))}
            actual = cache[at][record["body"]]
            assert actual.target_id == record["target_id"]
            assert separation(actual.longitude_deg, expected["longitude_deg"]) < tolerance, (
                record["body"],
                at,
                actual.longitude_deg,
                expected["longitude_deg"],
            )
            assert abs(actual.latitude_deg - expected["latitude_deg"]) < tolerance
            count += 1
    assert count == 50


def test_known_mars_retrograde_and_solar_motion(provider):
    positions = {p.body: p for p in provider.positions(datetime(2024, 12, 15, tzinfo=UTC))}
    assert positions["mars"].retrograde
    assert positions["mars"].speed_deg_per_day < 0
    assert not positions["sun"].retrograde
    assert 0.9 < positions["sun"].speed_deg_per_day < 1.1


def test_solar_longitude_wrap_preserves_speed(provider):
    positions = {p.body: p for p in provider.positions(datetime(2024, 3, 20, 3, 6, tzinfo=UTC))}
    sun = positions["sun"]
    assert separation(sun.longitude_deg, 0) < 0.02
    assert 0.9 < sun.speed_deg_per_day < 1.1


def test_speed_is_continuous_across_a_utc_leap_second(provider):
    before = {p.body: p for p in provider.positions(datetime(2016, 12, 31, 23, 50, tzinfo=UTC))}
    during = {p.body: p for p in provider.positions(datetime(2016, 12, 31, 23, 59, 30, tzinfo=UTC))}
    after = {p.body: p for p in provider.positions(datetime(2017, 1, 1, 0, 10, tzinfo=UTC))}
    # A derivative in naive UTC would contain an artificial ~0.02 deg/day
    # lunar spike when the finite-difference stencil spans the leap second.
    average = (before["moon"].speed_deg_per_day + after["moon"].speed_deg_per_day) / 2
    assert abs(during["moon"].speed_deg_per_day - average) < 0.002
