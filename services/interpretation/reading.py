"""Approved semantic knowledge -> deterministic Mongolian prose; factual fallback."""
from pydantic import BaseModel, Field
from services.astrology.engine import SIGNS, PLANETS

class Knowledge(BaseModel):
    headline: str = Field(min_length=1,max_length=200)
    summary: str = Field(min_length=1,max_length=2000)
    strengths: list[str] = Field(default_factory=list,max_length=10)
    challenges: list[str] = Field(default_factory=list,max_length=10)
    relationships: list[str] = Field(default_factory=list,max_length=10)

def from_entry(key, entries, headline, summary):
    entry=entries.get(key)
    if entry and entry['status']=='approved':
        try:
            payload=Knowledge.model_validate(entry['payload']).model_dump()
            return dict(payload,key=key,source=f"knowledge:{key}:v{entry['version']}",status='approved')
        except ValueError:
            pass
    return dict(key=key,headline=headline,summary=summary,strengths=[],challenges=[],relationships=[],source='calculation',status='facts')

def natal_readings(chart,entries):
    readings = [from_entry(f"planet_{p['id']}_sign_{p['sign']}",entries,
                       f"{p['name']} — {SIGNS[p['sign']]}",
                       f"{p['degree']:.2f}° байрлалтай. "+('Төрсөн цаг тодорхойгүй тул энэ байрлал лавлах утга болно.' if p['uncertain'] else 'Энэ байрлалын редакцын тайлал хараахан батлагдаагүй байна.'))
            if not p['uncertain'] else from_entry('uncertain',{},f"{p['name']} — байрлал тодорхойгүй",'Төрсөн цаггүй учир хувийн тайлал өгөхгүй.') for p in chart['planets']]
    for p in chart['planets']:
        if p['house'] is not None:
            readings.append(from_entry(f"planet_{p['id']}_house_{p['house']}",entries,f"{p['name']} — {p['house']}-р ордон",'Ордны байрлал нь төрсөн цаг, газар болон Placidus системээр тооцоологдсон.'))
    for a in chart['aspects'][:8]:
        readings.append(from_entry(f"aspect_{a['a']}_{a['b']}_{a['kind']}",entries,f"{PLANETS[a['a']]} · {PLANETS[a['b']]} · {a['angle']}°",f"Холбоосын орб {a['orb']:.2f}°. Редакцын тайлал батлагдаагүй үед зөвхөн тооцоог харуулна."))
    return readings

def compatibility_readings(links,entries):
    return [from_entry(f"synastry_{a['a']}_{a['b']}_{a['kind']}",entries,f"{PLANETS[a['a']]} · {PLANETS[a['b']]} · {a['angle']}°",f"Эхний хүний {PLANETS[a['a']]} ба хоёр дахь хүний {PLANETS[a['b']]}-ийн холбоос. Орб {a['orb']:.2f}°. Энэ тооцоо харилцааны чанарыг тогтоохгүй.") for a in links[:8]]

def transit_readings(links,entries):
    return [from_entry(f"transit_{a['a']}_{a['b']}_{a['kind']}",entries,
                       f"{PLANETS[a['a']]} · {PLANETS[a['b']]} · {a['angle']}°",
                       f"Өнөөгийн {PLANETS[a['a']]} ба төрсөн үеийн {PLANETS[a['b']]}: өнцгийн зөрүү {a['orb']:.2f}°. Тайлал нь редакцын баталгаажуулалт хүлээж байна.") for a in links]
