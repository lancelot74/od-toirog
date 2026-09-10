from datetime import date, time, datetime, timezone
import pytest
from services.astrology.engine import local_to_utc, positions, natal, aspects, separation, transits, synastry

@pytest.fixture
def birth():
    return dict(birth_date='2000-01-01',birth_time='12:00',birth_time_known=True,timezone='Etc/UTC',latitude=51.4779,longitude=0)

def test_j2000_reference_positions():
    p=positions('2000-01-01T12:00:00+00:00')
    # Swiss Ephemeris reference ecliptic longitudes at J2000; 0.01 degree tolerance.
    assert p[0]['longitude']==pytest.approx(280.36892,abs=.01)
    assert p[1]['longitude']==pytest.approx(223.32378,abs=.01)
    assert len(p)==10

def test_historical_timezone():
    assert local_to_utc(date(2000,1,1),time(12),'Asia/Ulaanbaatar').hour==4
    assert local_to_utc(date(1988,7,1),time(12),'Asia/Ulaanbaatar').hour==3

def test_dst_gap_and_fold():
    with pytest.raises(ValueError):local_to_utc(date(2024,3,10),time(2,30),'America/New_York')
    a=local_to_utc(date(2024,11,3),time(1,30),'America/New_York',0)
    b=local_to_utc(date(2024,11,3),time(1,30),'America/New_York',1)
    assert (b-a).total_seconds()==3600

def test_houses_ascendant_and_placements(birth):
    c=natal(birth)
    assert len(c['houses'])==12
    assert c['houses'][0]==pytest.approx(c['ascendant'])
    assert c['houses'][9]==pytest.approx(c['midheaven'])
    assert c['ascendant']==pytest.approx(24.3,abs=.5)
    assert all(1<=p['house']<=12 for p in c['planets'])
    assert c['planets'][0]['sign']==9

def test_unknown_time_omits_sensitive_features(birth):
    c=natal(dict(birth,birth_time_known=False,birth_time=None))
    assert c['ascendant'] is None and c['midheaven'] is None and c['houses']==[]
    assert c['planets'][1]['uncertain']
    assert all(a['a']!=1 and a['b']!=1 for a in c['aspects'])

def test_wrap_orbs_and_aspects():
    assert separation(359,1)==2
    assert aspects([dict(id=0,longitude=359),dict(id=1,longitude=1)])[0]['kind']=='conjunction'
    assert aspects([dict(id=0,longitude=0),dict(id=1,longitude=99)])==[]
    assert aspects([dict(id=0,longitude=0),dict(id=1,longitude=120)])[0]['strength']==1

def test_transits_and_synastry(birth):
    c=natal(birth)
    t=transits(c,date(2000,1,1))
    assert len(t)>=10 and t[0]['importance']>=t[-1]['importance']
    s=synastry(c,c)
    assert len(s['categories'])==6
    assert all(0<=v['prominence']<=100 for v in s['categories'].values())

def test_validated_rule_overrides_change_detection():
    from services.astrology.rules import Rules
    bodies=[dict(id=0,longitude=0),dict(id=1,longitude=7)]
    assert len(aspects(bodies))==1
    rules=Rules(orbs=dict(conjunction=5,opposition=8,trine=6,square=6,sextile=4))
    assert aspects(bodies,rules=rules)==[]
    with pytest.raises(ValueError):Rules(transit_weights=[-1]*10)
