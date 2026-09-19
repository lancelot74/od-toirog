"""Website adapter for the unmodified, vendored Od Toirog JPL engine.

The adapter localizes and reshapes results. It does not recalculate aspects,
add houses, invent birth times, or turn geometric strength into match scores.
"""
from datetime import datetime, date, time
from functools import lru_cache
from pathlib import Path
import hashlib
import json
import os
import threading

from od_toirog.astronomy import SkyfieldProvider, TARGETS
from od_toirog.aspects import SIGNS, load_rules
from od_toirog.engine import Engine
from od_toirog.errors import InputError
from od_toirog.models import BirthInput, NatalRequest, DailyRequest, SynastryRequest, TransitRequest
from od_toirog.timezones import get_zone, require_supported
from services.astrology.engine import PLANETS, CATEGORIES

METHOD = 'jpl-v0.1'
ADAPTER_VERSION = 'jpl-web-mn-v1'
DATA_PATH = Path(__file__).resolve().parents[2]/'vendor/od-toirog-engine/data/de440s.bsp'
BODY_IDS = {body: i for i, body in enumerate(TARGETS)}
LOCK = threading.RLock()


class CachedProvider(SkyfieldProvider):
    """Reuse identical UTC grids across users; the numerical routine is unchanged."""
    def longitude_series(self, instants, body):
        return self._series(tuple(instants), body)

    @lru_cache(maxsize=256)
    def _series(self, instants, body):
        result = super().longitude_series(list(instants), body)
        result.setflags(write=False)
        return result

    def close(self):
        self._series.cache_clear()
        super().close()


@lru_cache(maxsize=1)
def _engine():
    return Engine(CachedProvider(Path(os.getenv('OD_TOIROG_EPHEMERIS') or DATA_PATH)))


def close():
    with LOCK:
        if _engine.cache_info().currsize:
            _engine().provider.close()
            _engine.cache_clear()


def provenance():
    with LOCK:
        return _engine().provider.provenance.model_dump(mode='json')


def calculation_key():
    payload = dict(provenance(), adapter_version=ADAPTER_VERSION)
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()
    return f'{METHOD}:{digest}'


def birth_input(profile):
    if not profile['birth_time_known'] or not profile.get('birth_time'):
        raise InputError('birth_time_required', 'JPL v0.1 requires a recorded birth time.')
    return BirthInput(
        local_date=date.fromisoformat(str(profile['birth_date'])),
        local_time=time.fromisoformat(profile['birth_time']),
        timezone=profile['timezone'],
        fold=profile.get('time_fold') if profile.get('time_fold_confirmed') else None,
        latitude=profile['latitude'], longitude=profile['longitude'],
    )


def metadata(birth):
    return dict(id=METHOD, name='JPL DE440s · v0.1', adapter_version=ADAPTER_VERSION,
                provenance=provenance(), birth_input=birth.model_dump(mode='json'),
                houses_supported=False, unknown_time_supported=False)


def aspect(a):
    return dict(a=BODY_IDS[a.left_body], b=BODY_IDS[a.right_body], kind=a.aspect,
                angle=a.angle_deg, separation=a.separation_deg, orb=a.orb_deg,
                allowed_orb=a.allowed_orb_deg, strength=a.geometric_strength, evidence_id=a.id)


def chart_response(chart):
    return dict(
        planets=[dict(id=BODY_IDS[p.body], name=PLANETS[BODY_IDS[p.body]],
                      longitude=p.longitude_deg, latitude=p.latitude_deg, degree=p.degree_in_sign,
                      sign=SIGNS.index(p.sign), house=None, uncertain=False,
                      speed=p.speed_deg_per_day, retrograde=p.retrograde, motion=p.motion,
                      distance_au=p.distance_au, target_id=p.target_id, target_kind=p.target_kind)
                 for p in chart.positions],
        houses=[], ascendant=None, midheaven=None,
        aspects=[aspect(a) for a in chart.aspects], utc=chart.utc.isoformat(),
        utc_offset_seconds=chart.utc_offset_seconds, ephemeris='JPL DE440s',
        house_system='unavailable', readings=[], calculation=metadata(chart.birth),
        notice='JPL v0.1 нь ордон, Асцендент, Midheaven тооцоолдоггүй. Эдгээрийг харахын тулд Swiss / Placidus аргыг сонгоно уу.',
    )


def natal(profile):
    with LOCK:
        return chart_response(_engine().natal(NatalRequest(birth=birth_input(profile))).chart)


THEMES = ['өөрийн дүр төрх, илэрхийлэл','тайван байдал, мэдрэмжийн хэрэгцээ',
          'харилцаа, суралцах үйл явц','хайр, хамтын үнэт зүйл','санаачилга, зөрчил',
          'өсөлт, боломж','амлалт, хил хязгаар','бие даасан байдал, өөрчлөлт',
          'төсөөлөл, идеал','мэдрэмжийн эрчим, өөрчлөлт']
TRANSIT_PROMPTS = {
    'conjunction':'Нэг зорилго сонгож, түүнд анхаарлаа хандуулаарай.',
    'sextile':'Өнөөдөр хийж болох жижиг, бүтээлч алхмыг бодож үзээрэй.',
    'square':'Хариу үйлдэл хийхээсээ өмнө түр зогсоод, юу хэрэгтэй байгаагаа ажиглаарай.',
    'trine':'Танд аяндаа эвтэйхэн санагддаг үйлдэлд зай гаргаарай.',
    'opposition':'Өөрийн хэрэгцээг өөр хүний өнцөгтэй зэрэгцүүлэн хараарай.',
}
SYNASTRY_PROMPTS = {
    'conjunction':'Тэргүүлэх хэрэгцээ хаана давхцаж, хэнд ямар орон зай хэрэгтэйг ярилцаарай.',
    'sextile':'Бие биеэ дэмжих жижиг хамтын үйлдэл олоорой.',
    'square':'Хүлээлтээ илэн далангүй харьцуулж, нэг бодит тохиролцоо хийгээрэй.',
    'trine':'Хамтдаа байхад юу эвтэйхэн байдгийг анзаарч, түүнийг үнэлэх цаг гаргаарай.',
    'opposition':'Тэнцвэр олохын өмнө хоёр талын өнцгийг тус тусад нь нэрлээрэй.',
}


def cards(native_cards, evidence, context):
    """Translate the archive's selected cards; preserve selection and evidence IDs."""
    by_id={a['evidence_id']:a for a in evidence}
    result=[]
    for card in native_cards:
        a=by_id[card.evidence_id]
        left, right=a['a'],a['b']
        prompt=(SYNASTRY_PROMPTS if context=='synastry' else TRANSIT_PROMPTS)[a['kind']]
        left_label=f"Эхний хүний {PLANETS[left]}" if context=='synastry' else f"Өнөөгийн {PLANETS[left]}"
        right_label=f"хоёр дахь хүний {PLANETS[right]}" if context=='synastry' else f"төрсөн үеийн {PLANETS[right]}"
        result.append(dict(
            key=f"{context}_{left}_{right}_{a['kind']}",
            headline=f"{left_label} · {right_label} · {a['angle']}°",
            summary=f"Энэ бэлгэдлийн загварт {left_label.lower()} нь {THEMES[left]}, {right_label} нь {THEMES[right]} гэсэн сэдэвтэй холбогдоно. {prompt}",
            strengths=[],challenges=[],relationships=[],status='method_reflection',
            evidence_id=card.evidence_id,source=f"{ADAPTER_VERSION}:{card.evidence_id}",
        ))
    return result


def daily(profile, day, display_zone):
    with LOCK:
        native=_engine().daily(DailyRequest(birth=birth_input(profile),date=day,timezone=display_zone))
        evidence=[]
        for a in native.aspects:
            evidence.append(dict(
                a=BODY_IDS[a.transiting_body], b=BODY_IDS[a.natal_body], kind=a.aspect,
                angle=a.angle_deg, orb=a.closest_sample_orb_deg, separation=None,
                strength=a.geometric_strength_at_sample, allowed_orb=a.allowed_orb_deg,
                evidence_id=a.id, closest_sample_utc=a.closest_sample_utc.isoformat(),
                closest_sample_local=a.closest_sample_local.isoformat(),
                first_in_orb_sample_utc=a.first_in_orb_sample_utc.isoformat() if a.first_in_orb_sample_utc else None,
                last_in_orb_sample_utc=a.last_in_orb_sample_utc.isoformat() if a.last_in_orb_sample_utc else None,
                in_orb_sample_count=a.in_orb_sample_count,
                exact_crossings_utc=[t.isoformat() for t in a.exact_crossings_utc],
                exact_crossings_local=[t.isoformat() for t in a.exact_crossings_local],
            ))
        reflections=cards(native.reading,evidence,'transit')
        readings=[dict(key=f"transit_{a['a']}_{a['b']}_{a['kind']}",
                       headline=f"{PLANETS[a['a']]} · {PLANETS[a['b']]} · {a['angle']}°",
                       summary=f"Өдрийн хамгийн ойр түүврийн орб: {a['orb']:.4f}°. Энэ нь тасралтгүй идэвхтэй хугацааны хил биш.",
                       strengths=[],challenges=[],relationships=[],source=a['evidence_id'],
                       status='facts',evidence_id=a['evidence_id']) for a in evidence]
        area_ids={'Хайр':{3,4},'Ажил':{0,6},'Сэтгэл':{1},'Харилцаа':{2}}
        by_id={a['evidence_id']:a for a in evidence}
        return dict(
            date=str(day),timezone=display_zone,chart=chart_response(native.natal),
            calculation=metadata(native.natal.birth),transits=evidence,readings=readings,
            reflection_cards=reflections,
            areas={name:[r for r in reflections if by_id[r['evidence_id']]['b'] in ids] for name,ids in area_ids.items()},
            day_scan=dict(start_utc=native.start_utc.isoformat(),end_utc_exclusive=native.end_utc_exclusive.isoformat(),
                          duration_hours=native.duration_hours,sample_step_minutes=native.sample_step_minutes,
                          sampling_status=native.sampling_status,continuous_window_boundaries_supported=False),
            model_version=ADAPTER_VERSION,prompt_version='deterministic-editorial-mn-v1',
            knowledge_version=native.provenance.rules_sha256,
        )


def synastry(first, second):
    with LOCK:
        native=_engine().synastry(SynastryRequest(person_a=birth_input(first),person_b=birth_input(second)))
        links=[aspect(a) for a in native.aspects]
        return dict(first_chart=chart_response(native.person_a),second_chart=chart_response(native.person_b),
                    aspects=links,readings=cards(native.reading,links,'synastry'),
                    calculation=metadata(native.person_a.birth),compatibility_score=None,
                    categories={label:{'prominence':None,'aspects':[a for a in links if a['a'] in ids or a['b'] in ids]} for label,ids in CATEGORIES.items()},
                    meaning='Геометрийн хүч нь өнцөгт хэр ойр байгааг илэрхийлнэ. JPL v0.1 нь хосын тохирлын хувь тооцоолдоггүй.')


def snapshot(profile, at):
    with LOCK:
        native=_engine().transits(TransitRequest(birth=birth_input(profile),at=require_supported(at)))
        links=[aspect(a) for a in native.aspects]
        return dict(at_utc=native.at_utc.isoformat(),chart=chart_response(native.natal),
                    calculation=metadata(native.natal.birth),aspects=links,
                    transiting_positions=[p.model_dump(mode='json') for p in native.transiting_positions],
                    readings=cards(native.reading,links,'transit'))


def today_in(zone):
    return datetime.now(get_zone(zone)).date()


def configuration():
    return dict(id=METHOD,provenance=provenance(),rules=load_rules(),
                unsupported=['houses','ascendant','midheaven','unknown_birth_time','compatibility_score','continuous_windows'])
