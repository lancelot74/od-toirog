import hashlib
import json
from functools import lru_cache
from importlib.resources import files
from itertools import combinations, product
from typing import Literal

from .models import Aspect, Position

Mode = Literal["natal", "synastry", "transit"]
SIGNS = (
    "aries",
    "taurus",
    "gemini",
    "cancer",
    "leo",
    "virgo",
    "libra",
    "scorpio",
    "sagittarius",
    "capricorn",
    "aquarius",
    "pisces",
)


@lru_cache(maxsize=1)
def load_rules() -> dict:
    content = files("od_toirog").joinpath("rules/v1.json").read_bytes()
    data = json.loads(content)
    data["sha256"] = hashlib.sha256(content).hexdigest()
    return data


def signed_delta(left: float, right: float) -> float:
    return (left - right + 180.0) % 360.0 - 180.0


def separation(left: float, right: float) -> float:
    return abs(signed_delta(left, right))


def zodiac(longitude: float) -> tuple[str, float]:
    normalized = longitude % 360.0
    return SIGNS[int(normalized // 30)], normalized % 30.0


def tolerance(rule: dict, mode: Mode, left_body: str) -> float:
    if mode == "transit" and left_body == "moon":
        return float(load_rules()["transiting_moon_orb"])
    return float(rule[f"{mode}_orb"])


def strength(orb: float, allowed: float) -> float:
    return max(0.0, 1.0 - orb / allowed) ** 2


def find_aspects(
    left: list[Position], right: list[Position] | None = None, *, mode: Mode = "natal"
) -> list[Aspect]:
    if mode == "natal":
        if right is not None:
            raise ValueError("A natal chart takes one position list.")
        pairs = combinations(left, 2)
    else:
        if right is None:
            raise ValueError("Cross-chart aspects require two position lists.")
        pairs = product(left, right)
    result = []
    for a, b in pairs:
        distance = separation(a.longitude_deg, b.longitude_deg)
        for rule in load_rules()["aspects"]:
            allowed = tolerance(rule, mode, a.body)
            orb = abs(distance - rule["angle"])
            if orb <= allowed:
                result.append(
                    Aspect(
                        id=f"{mode}:{a.body}:{b.body}:{rule['name']}",
                        left_body=a.body,
                        right_body=b.body,
                        aspect=rule["name"],
                        angle_deg=rule["angle"],
                        separation_deg=distance,
                        orb_deg=orb,
                        allowed_orb_deg=allowed,
                        geometric_strength=strength(orb, allowed),
                    )
                )
    return sorted(result, key=lambda a: (-a.geometric_strength, a.id))
