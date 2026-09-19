"use client";
import { Workspace } from '@/components/workspace';
import { ProfileData } from '@/components/profile-data';
import { Reading } from '@/components/reading';
import { DailyText } from '@/components/daily-text';
import { Share } from '@/components/share';
import type { Daily } from '@/lib/types';
import { mn } from '@/lib/mn';
import { CalculationDetails } from '@/components/calculation-method';
import { TransitEvidence } from '@/components/transit-evidence';
import { TransitSnapshot } from '@/components/transit-snapshot';

export default function Today(){
  return <Workspace><ProfileData<Daily> endpoint="/today">{(data,p)=><>
    <p className="eyebrow">{data.date} · ӨНӨӨДӨР</p>
    <h1>{p.name}, өнөөдрийн тэнгэр.</h1>
    {data.day_scan?<div className="status"><p>{data.timezone} · {data.day_scan.duration_hours} цагийн өдөр · {data.day_scan.sample_step_minutes} минутын алхам</p><p>UTC {data.day_scan.start_utc} → {data.day_scan.end_utc_exclusive} (төгсгөлийг оруулахгүй)</p><p>Түүврийн хооронд хүрээлэгдсэн огтлолцлыг нарийвчилсан. Тасралтгүй идэвхтэй хугацааны хил биш.</p></div>:<p className="muted">Өдрийн лавлах мөч: 12:00 UTC. Хугацаа нь тухайн мөчийн хурднаас тооцсон ойролцоо утга.</p>}
    <CalculationDetails calculation={data.calculation}/>
    <DailyText data={data}/>
    {data.reflection_cards?.map(r=><Reading key={r.evidence_id} reading={r}/>)}
    {!data.synthesis&&!data.reflection_cards?.length && (data.readings[0]?<Reading reading={data.readings[0]}/>:<p>Тогтоосон орбын хүрээнд холбоос олдсонгүй.</p>)}
    <div className="data-grid">{Object.entries(data.areas).map(([area,readings])=><section key={area}><h2>{area}</h2>{readings.length?readings.map(r=><Reading key={r.key} reading={r}/>):<p className="muted">{data.day_scan?'Энэ хэсэгт сонгогдсон эргэцүүлэх карт алга. Бүх холбоосыг доороос үзнэ үү.':'Онцлох идэвхтэй холбоосгүй.'}</p>}</section>)}</div>
    <h2>Өнөөдрийн хамгийн хүчтэй холбоосууд</h2>
    {data.transits.slice(0,8).map((a,i)=><article className="reading-block" key={a.evidence_id||`${a.a}-${a.b}-${a.kind}`}><h3>{mn.planets[a.a]} · {mn.planets[a.b]} · {mn.aspects[a.kind]}</h3><details><summary>Яагаад?</summary><TransitEvidence aspect={a}/>{data.readings[i]&&<Reading reading={data.readings[i]}/>}</details></article>)}
    {data.transits.length>8&&<details className="reading-block"><summary>Бүх холбоос ({data.transits.length})</summary>{data.transits.slice(8).map(a=><section key={a.evidence_id||`${a.a}-${a.b}-${a.kind}`}><h3>{mn.planets[a.a]} · {mn.planets[a.b]} · {mn.aspects[a.kind]}</h3><TransitEvidence aspect={a}/></section>)}</details>}
    {data.calculation?.id==='jpl-v0.1'&&<TransitSnapshot key={p.id} profileId={p.id}/>}
    {data.readings[0]&&<Share title={data.date} lines={[data.synthesis?.headline||data.readings[0].headline]}/>}
  </>}</ProfileData></Workspace>;
}
