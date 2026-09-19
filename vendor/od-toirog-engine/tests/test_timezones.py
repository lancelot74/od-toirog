from datetime import UTC, date, datetime

import pytest

from od_toirog.errors import InputError
from od_toirog.timezones import civil_day, get_zone, local_to_utc


@pytest.mark.parametrize("year,utc_hour", [(2016, 3), (2017, 4)])
def test_mongolian_historical_summer_offsets(year, utc_hour):
    assert local_to_utc(datetime(year, 7, 1, 12), "Asia/Ulaanbaatar") == datetime(
        year, 7, 1, utc_hour, tzinfo=UTC
    )


def test_ambiguous_time_requires_explicit_fold():
    naive = datetime(2024, 11, 3, 1, 30)
    with pytest.raises(InputError, match="occurred twice") as error:
        local_to_utc(naive, "America/New_York")
    assert error.value.code == "ambiguous_local_time"
    first = local_to_utc(naive, "America/New_York", 0)
    second = local_to_utc(naive, "America/New_York", 1)
    assert first == datetime(2024, 11, 3, 5, 30, tzinfo=UTC)
    assert second == datetime(2024, 11, 3, 6, 30, tzinfo=UTC)


def test_nonexistent_clock_time_rejected():
    with pytest.raises(InputError) as error:
        local_to_utc(datetime(2024, 3, 10, 2, 30), "America/New_York")
    assert error.value.code == "nonexistent_local_time"


@pytest.mark.parametrize("day,hours", [(date(2024, 3, 10), 23), (date(2024, 11, 3), 25)])
def test_daily_duration_uses_real_civil_day(day, hours):
    start, end = civil_day(day, "America/New_York")
    assert (end - start).total_seconds() == hours * 3600


def test_midnight_gap_starts_at_first_existing_clock_time():
    start, end = civil_day(date(2018, 11, 4), "America/Sao_Paulo")
    assert start == datetime(2018, 11, 4, 3, tzinfo=UTC)
    assert start.astimezone(get_zone("America/Sao_Paulo")).hour == 1
    assert (end - start).total_seconds() == 23 * 3600


def test_skipped_calendar_date_is_rejected():
    with pytest.raises(InputError) as error:
        civil_day(date(2011, 12, 30), "Pacific/Apia")
    assert error.value.code == "nonexistent_local_date"
    start, end = civil_day(date(2011, 12, 29), "Pacific/Apia")
    assert (end - start).total_seconds() == 24 * 3600


@pytest.mark.parametrize("zone", ["Asia/Imaginary", "../../etc/passwd", "/etc/passwd"])
def test_invalid_zone_is_rejected(zone):
    with pytest.raises(InputError) as error:
        get_zone(zone)
    assert error.value.code == "unknown_timezone"
