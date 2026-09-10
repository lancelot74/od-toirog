"""Deterministic tropical/geocentric astrology. No language-model dependencies."""
from datetime import datetime, time, timezone, timedelta
from functools import lru_cache
from itertools import combinations, product
from zoneinfo import ZoneInfo
import os
import json
from pathlib import Path
import threading
import swisseph as swe
from services.astrology.rules import DEFAULT_RULES

LOCK = threading.RLock()
TERMS=json.loads((Path(__file__).resolve().parents[2]/'packages/localization/terms.json').read_text())
PLANETS = TERMS['planets']
SIGNS = TERMS['signs']
# One authoritative rule set for natal, transit and synastry calculations.
ASPECTS = [('conjunction', 0), ('opposition', 180), ('trine', 120), ('square', 90), ('sextile', 60)]
VERSION = 'tropical-placidus-v1'

def local_to_utc(date, clock, zone, fold=0):
    naive = datetime.combine(date, clock or time(12))
    local = naive.replace(tzinfo=ZoneInfo(zone), fold=fold)
    utc = local.astimezone(timezone.utc)
    if utc.astimezone(local.tzinfo).replace(tzinfo=None) != naive:
        raise ValueError('Энэ орон нутгийн цаг зуны цагийн шилжилтээс шалтгаалан байхгүй. Цагаа шалгана уу.')
    return utc

def julian(dt):
    dt = dt.astimezone(timezone.utc)
    return swe.julday(dt.year, dt.month, dt.day, dt.hour + dt.minute/60 + dt.second/3600)

@lru_cache(maxsize=512)
def positions(utc_iso):
    with LOCK:
        swe.set_ephe_path(os.environ.get('EPHEMERIS_PATH') or str(Path(__file__).resolve().parents[2]/'ephemeris'))
        jd = julian(datetime.fromisoformat(utc_iso))
        result = []
        for ident, name in enumerate(PLANETS):
            values, flags = swe.calc_ut(jd, ident, swe.FLG_SWIEPH | swe.FLG_SPEED)
            lon, lat, _, speed, *_ = values
            result.append(dict(id=ident, name=name, longitude=lon, latitude=lat, speed=speed,
                               sign=int(lon//30), degree=lon%30, retrograde=speed<0,
                               ephemeris='Swiss' if flags & swe.FLG_SWIEPH else 'Moshier'))
        return result

def separation(a, b):
    return abs((a-b+180)%360-180)

def aspects(first, second=None, transit=False, rules=DEFAULT_RULES):
    pairs = product(first, second) if second is not None else combinations(first, 2)
    result = []
    for a, b in pairs:
        if a.get('uncertain') or b.get('uncertain'): continue
        gap = separation(a['longitude'], b['longitude'])
        for kind, angle in ASPECTS:
            natal_orb=rules.orbs[kind]
            limit = min(natal_orb, rules.transit_orb) if transit else natal_orb
            orb = abs(gap-angle)
            if orb > limit: continue
            strength = 1-orb/limit
            row = dict(a=a['id'],b=b['id'],kind=kind,angle=angle,separation=gap,orb=orb,strength=strength)
            if transit:
                speed = abs(a['speed'])
                hours = 2*limit/speed*24 if speed>.01 else None
                duration_modifier = min(2, 1+(hours or 720)/720)
                row.update(duration_hours=hours,importance=strength*rules.transit_weights[a['id']]*rules.natal_weights[b['id']]*rules.aspect_weights[kind]*duration_modifier)
            result.append(row)
            break
    return sorted(result, key=lambda a:a.get('importance',a['strength']), reverse=True)

def natal(profile, rules=DEFAULT_RULES):
    date = datetime.fromisoformat(str(profile['birth_date'])).date()
    clock = time.fromisoformat(profile['birth_time']) if profile['birth_time_known'] else None
    utc = local_to_utc(date, clock, profile['timezone'], profile.get('time_fold',0))
    bodies = [dict(p,house=None,uncertain=False) for p in positions(utc.isoformat())]
    cusps, asc, mc = [], None, None
    if clock:
        with LOCK:
            try:
                cusps, angles = swe.houses_ex(julian(utc),profile['latitude'],profile['longitude'],b'P')
            except swe.Error as exc:
                raise ValueError('Энэ өргөрөгт Placidus ордны тооцоо боломжгүй байна.') from exc
            asc, mc = angles[:2]
            obliquity=swe.calc_ut(julian(utc),swe.ECL_NUT)[0][0]
            for p in bodies:
                p['house']=int(swe.house_pos(angles[2],profile['latitude'],obliquity,(p['longitude'],p['latitude']),b'P'))
    else:
        begin=local_to_utc(date,time.min,profile['timezone'])
        end=local_to_utc(date+timedelta(days=1),time.min,profile['timezone'])
        starts, ends=positions(begin.isoformat()),positions(end.isoformat())
        for p in bodies:
            p['uncertain']=p['id']==1 or starts[p['id']]['sign']!=ends[p['id']]['sign']
    return dict(planets=bodies,houses=list(cusps),ascendant=asc,midheaven=mc,aspects=aspects(bodies,rules=rules),utc=utc.isoformat(),rules_version=rules.version,
                ephemeris='/'.join(sorted({p['ephemeris'] for p in bodies})),house_system='Placidus' if clock else 'unavailable',
                notice='' if clock else 'Цаг тодорхойгүй: орон нутгийн 12:00 лавлах мөч. Ордон, Асцендент, Midheaven байхгүй. Сарны байрлал тодорхойгүй.',readings=[])

def transits(chart, date, rules=DEFAULT_RULES):
    # A documented daily snapshot; cached centrally across all users.
    current=positions(datetime.combine(date,time(12),timezone.utc).isoformat())
    return aspects(current,chart['planets'],transit=True,rules=rules)

CATEGORIES={'Сэтгэл':{1},'Хайр':{3,4},'Харилцаа':{2},'Урт хугацаа':{5,6},'Зөрчил':{4,6},'Ерөнхий холбоо':set(range(10))}
def synastry(first,second,rules=DEFAULT_RULES):
    links=aspects(first['planets'],second['planets'],rules=rules)
    categories={}
    for label, ids in CATEGORIES.items():
        selected=[a for a in links if a['a'] in ids or a['b'] in ids]
        # Connection prominence, not relationship quality or a probability.
        prominence=round(sum(a['strength'] for a in selected)/len(selected)*100) if selected else 0
        categories[label]={'prominence':prominence,'aspects':selected}
    return {'aspects':links,'categories':categories,'rules_version':VERSION,'meaning':'Идэвх нь холбоосын ойролцоо байдлыг заана. Харилцааны чанар, амжилтын хувь биш.'}
