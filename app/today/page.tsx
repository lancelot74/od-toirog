"use client";
import { Workspace } from '@/components/workspace';
import { ProfileData } from '@/components/profile-data';
import { Reading } from '@/components/reading';
import { DailyText } from '@/components/daily-text';
import { Share } from '@/components/share';
import type { Daily } from '@/lib/types';
import { mn } from '@/lib/mn';

export default function Today(){
  return <Workspace><ProfileData<Daily> endpoint="/today">{(data,p)=><>
    <p className="eyebrow">{data.date} · ӨНӨӨДӨР</p>
    <h1>{p.name}, өнөөдрийн тэнгэр.</h1>
    <p className="muted">Өдрийн лавлах мөч: 12:00 UTC. Хугацаа нь тухайн мөчийн хурднаас тооцсон ойролцоо утга.</p>
    <DailyText data={data}/>
    {!data.synthesis && (data.readings[0]?<Reading reading={data.readings[0]}/>:<p>Өнөөдрийн лавлах мөчид тогтоосон орбын хүрээнд холбоос олдсонгүй.</p>)}
    <div className="data-grid">{Object.entries(data.areas).map(([area,readings])=><section key={area}><h2>{area}</h2>{readings.length?readings.map(r=><Reading key={r.key} reading={r}/>):<p className="muted">Онцлох идэвхтэй холбоосгүй.</p>}</section>)}</div>
    <h2>Өнөөдрийн хамгийн хүчтэй холбоосууд</h2>
    {data.transits.slice(0,8).map((a,i)=><article className="reading-block" key={`${a.a}-${a.b}`}><h3>{mn.planets[a.a]} · {mn.planets[a.b]} · {mn.aspects[a.kind]}</h3><details><summary>Яагаад?</summary><p>Өнөөгийн {mn.planets[a.a]} таны төрсөн үеийн {mn.planets[a.b]}-тай {a.separation.toFixed(2)}° зайтай. {a.angle}° холбоосоос {a.orb.toFixed(2)}° зөрүүтэй.</p><p>Тооцоолсон ач холбогдол: {a.importance?.toFixed(2)} · Ойролцоо үргэлжлэх хугацаа: {a.duration_hours?`${Math.round(a.duration_hours)} цаг`:'станцын ойролцоо — тодорхойгүй'}</p><Reading reading={data.readings[i]}/></details></article>)}
    {data.readings[0]&&<Share title={data.date} lines={[data.synthesis?.headline||data.readings[0].headline]}/>}
  </>}</ProfileData></Workspace>;
}
