from datetime import datetime
import pytest
from od_toirog.errors import InputError
from services.astrology import jpl
from services.astrology.engine import natal, VERSION

BASE=dict(birth_date='2000-01-01',birth_time='12:00:00',birth_time_known=True,
          timezone='Asia/Ulaanbaatar',latitude=47.9189,longitude=106.9176,
          time_fold=0,time_fold_confirmed=False)

@pytest.mark.parametrize(('day','clock','zone','fold','expected'),[
    ('2016-07-01','12:00','Asia/Ulaanbaatar',None,'2016-07-01T03:00:00+00:00'),
    ('2017-07-01','12:00','Asia/Ulaanbaatar',None,'2017-07-01T04:00:00+00:00'),
    ('2024-11-03','01:30','America/New_York',0,'2024-11-03T05:30:00+00:00'),
    ('2024-11-03','01:30','America/New_York',1,'2024-11-03T06:30:00+00:00'),
])
def test_engines_use_identical_pinned_civil_time(day,clock,zone,fold,expected):
    profile=dict(BASE,birth_date=day,birth_time=clock,timezone=zone,
                 time_fold=fold or 0,time_fold_confirmed=fold is not None)
    assert natal(profile)['utc']==jpl.natal(profile)['utc']==expected

@pytest.mark.parametrize(('day','clock','code'),[
    ('2024-11-03','01:30','ambiguous_local_time'),
    ('2024-03-10','02:30','nonexistent_local_time'),
])
def test_both_engines_reject_unconfirmed_fold_or_gap(day,clock,code):
    profile=dict(BASE,birth_date=day,birth_time=clock,timezone='America/New_York')
    for calculate in [natal,jpl.natal]:
        with pytest.raises(InputError) as error:calculate(profile)
        assert error.value.code==code

def test_swiss_unknown_time_stays_noon_and_handles_midnight_dst_gap():
    chart=natal(dict(BASE,birth_date='2018-11-04',birth_time=None,
                     birth_time_known=False,timezone='America/Sao_Paulo'))
    assert chart['utc']=='2018-11-04T14:00:00+00:00'
    assert chart['houses']==[] and chart['ascendant'] is None
    assert chart['planets'][1]['uncertain']

def test_swiss_cache_version_changes_with_timezone_semantics():
    assert VERSION != 'tropical-placidus-v1'
