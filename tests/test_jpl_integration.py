from copy import deepcopy
from datetime import date, datetime, UTC
from urllib.parse import parse_qs
import pytest
from fastapi.testclient import TestClient
from od_toirog.errors import InputError
from od_toirog.models import NatalRequest
from services.astrology import jpl
from apps.api import main

PROFILE = dict(id='00000000-0000-0000-0000-000000000001',user_id='00000000-0000-0000-0000-000000000010',
               name='Reference',birth_date='2000-01-01',birth_time='12:00:00',birth_time_known=True,
               timezone='Asia/Ulaanbaatar',latitude=47.9189,longitude=106.9176,
               time_fold=0,time_fold_confirmed=False,updated_at='2026-09-01T00:00:00+00:00')


@pytest.fixture(autouse=True)
def reset_provider():
    yield
    jpl.close()


def test_adapter_preserves_native_positions_and_aspects_without_houses():
    native=jpl._engine().natal(NatalRequest(birth=jpl.birth_input(PROFILE)))
    adapted=jpl.natal(PROFILE)
    assert adapted['houses']==[] and adapted['ascendant'] is None and adapted['midheaven'] is None
    assert adapted['utc']==native.chart.utc.isoformat()
    assert adapted['calculation']['provenance']==native.provenance.model_dump(mode='json')
    for actual, expected in zip(adapted['planets'], native.chart.positions, strict=True):
        assert actual['longitude']==expected.longitude_deg
        assert actual['speed']==expected.speed_deg_per_day
        assert actual['target_id']==expected.target_id
        assert actual['target_kind']==expected.target_kind
        assert actual['house'] is None
    assert [a['strength'] for a in adapted['aspects']]==[a.geometric_strength for a in native.chart.aspects]
    assert [a['evidence_id'] for a in adapted['aspects']]==[a.id for a in native.chart.aspects]


def test_unknown_time_is_rejected_and_old_default_fold_is_not_treated_as_confirmed():
    with pytest.raises(InputError) as unknown:
        jpl.natal(dict(PROFILE,birth_time_known=False,birth_time=None))
    assert unknown.value.code=='birth_time_required'
    repeated=dict(PROFILE,birth_date='2024-11-03',birth_time='01:30:00',timezone='America/New_York')
    with pytest.raises(InputError) as ambiguous:jpl.natal(repeated)
    assert ambiguous.value.code=='ambiguous_local_time'
    first=jpl.natal(dict(repeated,time_fold_confirmed=True,time_fold=0))
    second=jpl.natal(dict(repeated,time_fold_confirmed=True,time_fold=1))
    assert (datetime.fromisoformat(second['utc'])-datetime.fromisoformat(first['utc'])).total_seconds()==3600


def test_local_day_scan_and_reflection_evidence_are_preserved():
    result=jpl.daily(PROFILE,date(2024,3,10),'America/New_York')
    assert result['day_scan']['duration_hours']==23
    assert result['day_scan']['sample_step_minutes']==15
    assert result['day_scan']['continuous_window_boundaries_supported'] is False
    evidence={a['evidence_id']:a for a in result['transits']}
    assert len(result['reflection_cards'])<=5
    assert all(evidence[r['evidence_id']]['b']<5 for r in result['reflection_cards'])
    assert all(a['allowed_orb']==1 for a in result['transits'] if a['a']==1)
    assert all(a['separation'] is None for a in result['transits'])  # A sample orb is not a snapshot angle.
    assert all('duration_hours' not in a for a in result['transits'])  # No invented continuous windows.
    assert all('evidence_id' in r for r in result['reflection_cards'])


def test_synastry_has_no_compatibility_percentage_or_category_score():
    result=jpl.synastry(PROFILE,dict(PROFILE,birth_date='2001-02-03'))
    assert result['compatibility_score'] is None
    assert all(c['prominence'] is None for c in result['categories'].values())
    ids={a['evidence_id'] for a in result['aspects']}
    assert all(r['evidence_id'] in ids for r in result['readings'])
    assert len(result['readings'])<=5


def test_snapshot_requires_explicit_offset():
    with pytest.raises(InputError):jpl.snapshot(PROFILE,datetime(2026,9,19,12))
    result=jpl.snapshot(PROFILE,datetime(2026,9,19,12,tzinfo=UTC))
    assert len(result['transiting_positions'])==10
    assert all(a['separation'] is not None for a in result['aspects'])


@pytest.fixture
def private_api(monkeypatch):
    writes=[]
    cached=[]
    async def fake_db(request,path,method='GET',body=None,prefer=None):
        if method=='POST':
            writes.append((path,deepcopy(body)))
            if path.startswith('daily_readings?'):cached.append(deepcopy(body))
            return None
        if path.startswith('birth_profiles?'):return [deepcopy(PROFILE)]
        if path.startswith('daily_readings?'):
            query=parse_qs(path.split('?',1)[1])
            return [row for row in cached if all(row[key]==query[key][0][3:] for key in ('date','calculation_key','display_timezone'))]
        return []
    monkeypatch.setattr(main,'db',fake_db)
    main.app.dependency_overrides[main.user]=lambda:{'id':PROFILE['user_id'],'app_metadata':{}}
    try:
        with TestClient(main.app) as client:yield client,writes
    finally:main.app.dependency_overrides.clear()


def test_owned_chart_api_uses_requested_method_and_writes_provenance(private_api):
    client,writes=private_api
    result=client.get(f"/charts/{PROFILE['id']}?method=jpl-v0.1")
    assert result.status_code==200
    chart=result.json()
    assert chart['calculation']['id']=='jpl-v0.1'
    assert len(chart['calculation']['provenance']['ephemeris_sha256'])==64
    assert writes[-1][1]['calculation_key'].startswith('jpl-v0.1:')
    assert 'calculation_key' in writes[-1][0]
    assert client.get(f"/charts/{PROFILE['id']}?method=invalid").status_code==422
    legacy=client.get(f"/charts/{PROFILE['id']}?method=swiss-v1").json()
    assert legacy['calculation']['id']=='swiss-v1'
    assert len(legacy['houses'])==12
    assert legacy['calculation_key']!=chart['calculation_key']
    implicit=client.get(f"/charts/{PROFILE['id']}").json()
    assert implicit['calculation']['id']=='swiss-v1'  # Older clients are not silently switched.


def test_daily_cache_separates_method_zone_and_caches_repeat_request(private_api):
    client,writes=private_api
    url=f"/today/{PROFILE['id']}?date=2024-03-10"
    ny=client.get(url+'&method=jpl-v0.1&timezone=America/New_York').json()
    assert ny['day_scan']['duration_hours']==23
    before=len(writes)
    repeated=client.get(url+'&method=jpl-v0.1&timezone=America/New_York').json()
    assert repeated==ny and len(writes)==before
    utc=client.get(url+'&method=jpl-v0.1&timezone=UTC').json()
    assert utc['day_scan']['duration_hours']==24
    legacy=client.get(url+'&method=swiss-v1').json()
    assert 'day_scan' not in legacy
    assert legacy['calculation_key']!=ny['calculation_key']
    rows=[body for path,body in writes if path.startswith('daily_readings?')]
    assert len(rows)==3
    assert {r['display_timezone'] for r in rows}=={'UTC','America/New_York'}


def test_imported_core_files_still_match_archive_manifest():
    import hashlib
    import json
    from pathlib import Path
    root=Path(__file__).resolve().parents[1]/'vendor/od-toirog-engine'
    manifest=json.loads((root/'IMPORT.json').read_text())
    for name,digest in manifest['files'].items():
        if name.startswith('src/'):
            assert hashlib.sha256((root/name).read_bytes()).hexdigest()==digest
