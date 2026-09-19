import pytest
from fastapi.testclient import TestClient

from od_toirog.api import create_app

pytestmark = pytest.mark.integration


def test_natal_synastry_and_transit_api(provider, birth):
    with TestClient(create_app(provider)) as client:
        assert client.get("/health").status_code == 200
        response = client.post("/v1/natal", json={"birth": birth})
        assert response.status_code == 200
        chart = response.json()["chart"]
        assert chart["utc"] == "2000-01-01T04:00:00Z"
        assert len(chart["positions"]) == 10
        assert chart["houses"] is None
        assert response.json()["provenance"]["ephemeris"] == "JPL DE440s"
        match = client.post("/v1/synastry", json={"person_a": birth, "person_b": birth})
        assert match.status_code == 200
        result = match.json()
        assert result["compatibility_score"] is None
        assert (
            sum(
                a["aspect"] == "conjunction" and a["left_body"] == a["right_body"]
                for a in result["aspects"]
            )
            == 10
        )
        assert all(
            card["evidence_id"] in {a["id"] for a in result["aspects"]}
            for card in result["reading"]
        )
        transit = client.post(
            "/v1/transits", json={"birth": birth, "at": "2026-09-17T08:00:00+08:00"}
        )
        assert transit.status_code == 200
        assert transit.json()["at_utc"] == "2026-09-17T00:00:00Z"


def test_daily_uses_display_zone_and_returns_evidence(provider, birth):
    with TestClient(create_app(provider)) as client:
        response = client.post(
            "/v1/daily",
            json={
                "birth": birth,
                "date": "2024-03-10",
                "timezone": "America/New_York",
            },
        )
    assert response.status_code == 200
    result = response.json()
    assert result["duration_hours"] == 23
    assert result["sample_step_minutes"] == 15
    assert result["aspects"]
    assert result["continuous_window_boundaries_supported"] is False
    assert all(
        card["evidence_id"] in {a["id"] for a in result["aspects"]} for card in result["reading"]
    )


def test_api_rejects_unknown_birth_time_and_implicit_offsets(provider, birth):
    with TestClient(create_app(provider)) as client:
        unknown = {key: value for key, value in birth.items() if key != "local_time"}
        assert client.post("/v1/natal", json={"birth": unknown}).status_code == 422
        assert (
            client.post(
                "/v1/transits", json={"birth": birth, "at": "2026-09-17T00:00:00"}
            ).status_code
            == 422
        )
        invalid = {**birth, "local_date": "0001-01-01"}
        assert client.post("/v1/natal", json={"birth": invalid}).status_code == 422
        invalid = {**birth, "timezone": "Unknown/City"}
        assert (
            client.post("/v1/natal", json={"birth": invalid}).json()["code"] == "unknown_timezone"
        )


def test_missing_kernel_has_actionable_error(monkeypatch, tmp_path, birth):
    monkeypatch.setenv("OD_TOIROG_EPHEMERIS", str(tmp_path / "absent.bsp"))
    with TestClient(create_app()) as client:
        assert client.get("/health").status_code == 503
        response = client.post("/v1/natal", json={"birth": birth})
    assert response.status_code == 503
    assert "download-data" in response.json()["detail"]
