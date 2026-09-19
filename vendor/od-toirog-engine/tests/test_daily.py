from datetime import UTC, datetime, timedelta

import numpy as np
import pytest

from od_toirog.daily import bisect_crossing, day_grid, scan_day

START = datetime(2026, 9, 17, tzinfo=UTC)


class LinearProvider:
    def __init__(self, longitude, degrees_per_day):
        self.longitude = longitude
        self.degrees_per_day = degrees_per_day

    def longitude_series(self, instants, body):
        return np.array(
            [
                (self.longitude + (t - START).total_seconds() / 86400 * self.degrees_per_day) % 360
                for t in instants
            ]
        )


@pytest.mark.parametrize(
    "longitude,speed,aspect",
    [(359, 2, "conjunction"), (1, -2, "conjunction"), (179, 2, "opposition")],
)
def test_actual_crossing_across_wrap_or_retrograde(position, longitude, speed, aspect):
    result = scan_day(
        LinearProvider(longitude, speed),
        [position("sun", 0)],
        START,
        START + timedelta(days=1),
        "UTC",
    )
    evidence = next(a for a in result if a.transiting_body == "sun" and a.aspect == aspect)
    assert len(evidence.exact_crossings_utc) == 1
    expected = START + timedelta(hours=12)
    assert abs((evidence.exact_crossings_utc[0] - expected).total_seconds()) <= 0.1


def test_both_sextile_branches_and_multiple_passes_are_kept(position):
    # Artificial fast track tests the search independently of astronomy data.
    result = scan_day(
        LinearProvider(20, 320),
        [position("sun", 0)],
        START,
        START + timedelta(days=1),
        "UTC",
    )
    evidence = next(a for a in result if a.transiting_body == "sun" and a.aspect == "sextile")
    assert evidence.exact_crossings_utc == [START + timedelta(hours=3), START + timedelta(hours=21)]


def test_grid_includes_start_and_excludes_end():
    end = START + timedelta(hours=23)
    grid = day_grid(START, end, 15)
    assert grid[0] == START
    assert grid[-1] == end - timedelta(microseconds=1)
    assert all(START <= instant < end for instant in grid)


def test_refiner_rejects_unbracketed_root():
    with pytest.raises(ValueError, match="not bracketed"):
        bisect_crossing(lambda _: 1.0, START, START + timedelta(hours=1))
