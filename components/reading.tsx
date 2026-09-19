import type { Reading as ReadingType, Aspect } from '@/lib/types';
import { mn } from '@/lib/mn';
import { AstroSymbol } from './astro-symbol';
import { ZodiacLink } from './zodiac-link';

export function Reading({reading}:{reading:ReadingType}){
  const placement=/^planet_(\d+)_sign_(\d+)$/.exec(reading.key);
  const planet=/^(?:planet|transit|synastry|aspect)_(\d+)_/.exec(reading.key);
  const pair=/^(?:transit|synastry|aspect)_\d+_(\d+)_/.exec(reading.key);
  return <article className="reading-block">
    {planet&&<div className="reading-symbols"><AstroSymbol kind="planet" index={Number(planet[1])} size={40}/>{placement&&<span className="reading-sign-name">Орд · <ZodiacLink index={Number(placement[2])}/></span>} {pair&&<AstroSymbol kind="planet" index={Number(pair[1])} size={40}/>}</div>}
    <p className="eyebrow">{reading.status==='approved'?'РЕДАКЦЫН ТАЙЛАЛ':reading.status==='method_reflection'?'ЗАГВАРЫН ЭРГЭЦҮҮЛЭХ АСУУЛТ':'ТООЦООЛСОН БАРИМТ'}</p><h3>{reading.headline}</h3><p>{reading.summary}</p>
    {[['Давуу тал',reading.strengths],['Анхаарах зүйл',reading.challenges],['Харилцаа',reading.relationships]].map(([label,items])=>Array.isArray(items)&&items.length>0?<div key={String(label)}><h4>{String(label)}</h4><ul>{items.map(s=><li key={s}>{s}</li>)}</ul></div>:null)}
    {placement&&<p><ZodiacLink index={Number(placement[2])}/> · Ордын тухай</p>}
    <small className="muted">Эх сурвалж: {reading.source}</small>
  </article>;
}
export function AspectTable({aspects}:{aspects:Aspect[]}){return <div className="table-wrap"><table><thead><tr><th>Гаригууд</th><th>Холбоос</th><th>Өнцөг</th><th>Зөрүү</th></tr></thead><tbody>{aspects.map(a=><tr key={a.evidence_id||`${a.a}-${a.b}-${a.kind}`}><td><span className="planet-name"><AstroSymbol kind="planet" index={a.a} size={24}/>{mn.planets[a.a]}</span> · <span className="planet-name"><AstroSymbol kind="planet" index={a.b} size={24}/>{mn.planets[a.b]}</span></td><td>{mn.aspects[a.kind]}</td><td>{a.separation===null?'Түүврийн утга':`${a.separation.toFixed(2)}°`}</td><td>{a.orb.toFixed(2)}°</td></tr>)}</tbody></table>{!aspects.length&&<p>Тогтоосон орбын хүрээнд гол холбоос олдсонгүй.</p>}</div>;}
