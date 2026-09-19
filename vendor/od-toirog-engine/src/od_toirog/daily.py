"""Sample a full civil day and refine bracketed transit crossings.

Sample minima and sample spans deliberately keep their names: they are not
continuous minima or orb-entry/exit windows. Unbracketed station tangencies and
very short grazes need a later continuous event-search implementation.
"""

from datetime import datetime, timedelta

import numpy as np

from .aspects import load_rules, signed_delta, strength, tolerance
from .astronomy import TARGETS, SkyfieldProvider
from .models import DailyAspect, Position
from .timezones import get_zone


def bisect_crossing(function, start: datetime, end: datetime) -> datetime:
    """Refine a continuous signed crossing to a bracket no wider than 0.1 seconds."""
    lo, hi = start, end
    f_lo, f_hi = function(lo), function(hi)
    if f_lo == 0:
        return lo
    if f_hi == 0:
        return hi
    if f_lo * f_hi > 0:
        raise ValueError("Root is not bracketed.")
    for _ in range(60):
        mid = lo + (hi - lo) / 2
        if (hi - lo).total_seconds() <= 0.1:
            return mid
        f_mid = function(mid)
        if f_mid == 0:
            return mid
        if f_lo * f_mid < 0:
            hi = mid
        else:
            lo, f_lo = mid, f_mid
    raise RuntimeError("Crossing did not converge.")


def day_grid(start: datetime, end: datetime, step_minutes: int) -> list[datetime]:
    if end <= start or step_minutes <= 0:
        raise ValueError("Require a positive interval and sampling step.")
    points = []
    current = start
    while current < end:
        points.append(current)
        current += timedelta(minutes=step_minutes)
    last = end - timedelta(microseconds=1)
    if points[-1] != last:
        points.append(last)
    return points


def scan_day(
    provider: SkyfieldProvider,
    natal: list[Position],
    start: datetime,
    end: datetime,
    timezone: str,
) -> list[DailyAspect]:
    rules = load_rules()
    grid = day_grid(start, end, rules["daily_sample_minutes"])
    zone = get_zone(timezone)
    result = []
    for body in TARGETS:
        longitudes = provider.longitude_series(grid, body)
        for natal_position in natal:
            natal_lon = natal_position.longitude_deg
            distance = np.abs((longitudes - natal_lon + 180) % 360 - 180)
            for rule in rules["aspects"]:
                angle = rule["angle"]
                allowed = tolerance(rule, "transit", body)
                orbs = np.abs(distance - angle)
                best_index = int(np.argmin(orbs))
                # A linear step cannot reach exact from farther away than its
                # total movement. Keep an extra movement-sized margin so an
                # exact crossing between samples cannot be prefiltered away.
                moves = np.abs((np.diff(longitudes) + 180) % 360 - 180)
                if orbs[best_index] > allowed + float(np.max(moves)):
                    continue
                roots = []
                angles = [angle] if angle in (0, 180) else [angle, -angle]
                for branch in angles:
                    target = (natal_lon + branch) % 360
                    residuals = (longitudes - target + 180) % 360 - 180
                    for index in range(len(grid) - 1):
                        fa, fb = float(residuals[index]), float(residuals[index + 1])
                        # Reject the signed-angle discontinuity at +/-180°.
                        if abs(fa - fb) >= 180 or fa * fb > 0:
                            continue

                        def residual(instant, target=target, body=body):
                            lon = provider.longitude_series([instant], body)[0]
                            return signed_delta(float(lon), target)

                        root = bisect_crossing(residual, grid[index], grid[index + 1])
                        if start <= root < end and not any(
                            abs((root - other).total_seconds()) < 0.2 for other in roots
                        ):
                            roots.append(root)
                active = np.flatnonzero(orbs <= allowed)
                if not len(active) and not roots:
                    continue
                roots.sort()
                best_time = grid[best_index]
                orb = float(orbs[best_index])
                result.append(
                    DailyAspect(
                        id=f"daily:{body}:{natal_position.body}:{rule['name']}",
                        transiting_body=body,
                        natal_body=natal_position.body,
                        aspect=rule["name"],
                        angle_deg=angle,
                        allowed_orb_deg=allowed,
                        closest_sample_utc=best_time,
                        closest_sample_local=best_time.astimezone(zone),
                        closest_sample_orb_deg=orb,
                        geometric_strength_at_sample=strength(orb, allowed),
                        first_in_orb_sample_utc=grid[int(active[0])] if len(active) else None,
                        last_in_orb_sample_utc=grid[int(active[-1])] if len(active) else None,
                        in_orb_sample_count=len(active),
                        exact_crossings_utc=roots,
                        exact_crossings_local=[root.astimezone(zone) for root in roots],
                    )
                )
    return sorted(result, key=lambda a: (-a.geometric_strength_at_sample, a.id))
