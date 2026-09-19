"""Civil time conversion using the pinned tzdata package on every operating system."""

from datetime import UTC, date, datetime, timedelta
from functools import lru_cache
from importlib.resources import files
from zoneinfo import ZoneInfo

from .errors import InputError

SUPPORTED_START = datetime(1900, 1, 1, tzinfo=UTC)
SUPPORTED_END = datetime(2100, 1, 1, tzinfo=UTC)


@lru_cache(maxsize=1)
def _zone_names() -> frozenset[str]:
    return frozenset(files("tzdata").joinpath("zones").read_text().splitlines())


@lru_cache(maxsize=128)
def get_zone(name: str) -> ZoneInfo:
    if name not in _zone_names():
        raise InputError("unknown_timezone", f"Unknown IANA timezone: {name}")
    resource = files("tzdata.zoneinfo").joinpath(*name.split("/"))
    with resource.open("rb") as stream:
        return ZoneInfo.from_file(stream, key=name)


def _candidates(naive: datetime, zone: ZoneInfo) -> list[datetime]:
    candidates = set()
    for fold in (0, 1):
        utc = naive.replace(tzinfo=zone, fold=fold).astimezone(UTC)
        if utc.astimezone(zone).replace(tzinfo=None) == naive:
            candidates.add(utc)
    return sorted(candidates)


def local_to_utc(naive: datetime, timezone: str, fold: int | None = None) -> datetime:
    if naive.tzinfo is not None:
        raise InputError("expected_local_time", "Supply a local datetime without an offset.")
    if fold not in (None, 0, 1):
        raise InputError("invalid_fold", "fold must be 0 or 1.")
    options = _candidates(naive, get_zone(timezone))
    if not options:
        raise InputError("nonexistent_local_time", "This local clock time did not occur.")
    if len(options) == 2:
        if fold is None:
            raise InputError(
                "ambiguous_local_time",
                "This clock time occurred twice. Supply fold=0 (earlier) or fold=1 (later).",
            )
        return options[fold]
    if fold == 1:
        raise InputError("unnecessary_fold", "fold=1 is only valid for a repeated clock time.")
    return options[0]


def require_supported(instant: datetime) -> datetime:
    if instant.tzinfo is None or instant.utcoffset() is None:
        raise InputError("missing_utc_offset", "Supply a timezone-aware instant.")
    utc = instant.astimezone(UTC)
    if not SUPPORTED_START <= utc < SUPPORTED_END:
        raise InputError("unsupported_date", "This version supports UTC dates from 1900 to 2099.")
    return utc


def _day_boundary(day: date, zone: ZoneInfo) -> datetime:
    """Earliest instant on or after this local date, including midnight DST gaps."""
    naive = datetime.combine(day, datetime.min.time())
    options = _candidates(naive, zone)
    if options:
        return options[0]
    # In a gap, the two fold projections straddle the transition. Bisect in UTC,
    # not wall time, to find the actual beginning of the civil day.
    projections = sorted(naive.replace(tzinfo=zone, fold=f).astimezone(UTC) for f in (0, 1))
    lo, hi = projections
    if not lo.astimezone(zone).date() < day <= hi.astimezone(zone).date():
        raise InputError("unsupported_day_boundary", "Unable to resolve this civil day boundary.")
    while (hi - lo).total_seconds() > 0.000001:
        mid = lo + (hi - lo) / 2
        if mid.astimezone(zone).date() >= day:
            hi = mid
        else:
            lo = mid
    return hi


def civil_day(day: date, timezone: str) -> tuple[datetime, datetime]:
    zone = get_zone(timezone)
    if not 1900 <= day.year <= 2099:
        raise InputError("unsupported_date", "This version supports dates from 1900 to 2099.")
    start = _day_boundary(day, zone)
    if start.astimezone(zone).date() != day:
        raise InputError("nonexistent_local_date", "This calendar date did not occur in this zone.")
    end = _day_boundary(day + timedelta(days=1), zone)
    require_supported(start)
    require_supported(end - timedelta(microseconds=1))
    return start, end
