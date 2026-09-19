import pytest

from od_toirog.aspects import find_aspects, separation, strength, zodiac
from od_toirog.astronomy import TARGETS


@pytest.mark.parametrize(
    "a,b,expected", [(359, 1, 2), (42, 164, 122), (15, 105, 90), (0, 180, 180)]
)
def test_circular_separation(a, b, expected):
    assert separation(a, b) == expected
    assert separation(b, a) == expected
    assert separation(a + 367, b + 367) == expected


@pytest.mark.parametrize(
    "longitude,sign,degree",
    [(0, "aries", 0), (30, "taurus", 0), (359.5, "pisces", 29.5), (360, "aries", 0)],
)
def test_sign_boundaries(longitude, sign, degree):
    assert zodiac(longitude) == (sign, degree)


def test_natal_does_not_double_count_pairs(position):
    positions = [position(body, 0) for body in TARGETS]
    aspects = find_aspects(positions)
    assert len(aspects) == 45
    assert len({a.id for a in aspects}) == 45


def test_synastry_keeps_all_directional_cross_pairs(position):
    positions = [position(body, 0) for body in TARGETS]
    aspects = find_aspects(positions, positions, mode="synastry")
    assert len(aspects) == 100
    assert len({a.id for a in aspects}) == 100


def test_trine_has_two_degree_orb(position):
    (aspect,) = find_aspects([position("sun", 42), position("moon", 164)])
    assert aspect.aspect == "trine"
    assert aspect.orb_deg == 2
    assert aspect.geometric_strength == pytest.approx(4 / 9)


def test_moon_transit_uses_tighter_orb(position):
    moon = [position("moon", 1.5)]
    venus = [position("venus", 1.5)]
    natal = [position("sun", 0)]
    assert find_aspects(moon, natal, mode="transit") == []
    assert len(find_aspects(venus, natal, mode="transit")) == 1
    assert strength(5, 4) == 0
