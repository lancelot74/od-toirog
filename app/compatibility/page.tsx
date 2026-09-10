"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Workspace, Loading } from '@/components/workspace';
import { AspectTable, Reading } from '@/components/reading';
import { ChartWheel } from '@/components/chart-wheel';
import { Share } from '@/components/share';
import { api, profiles } from '@/lib/api';
import { asset } from '@/lib/paths';
import { mn } from '@/lib/mn';
import { track } from '@/lib/telemetry';
import type { Profile, Aspect, Reading as ReadingType, Chart } from '@/lib/types';
type Report={first_name:string;second_name:string;meaning:string;categories:Record<string,{prominence:number;aspects:Aspect[]}>;readings:ReadingType[];aspects:Aspect[];first_chart:Chart;second_chart:Chart};

function Comparison(){
  const [items,setItems]=useState<Profile[]>([]),[first,setFirst]=useState(''),[second,setSecond]=useState(''),[result,setResult]=useState<Report|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[placement,setPlacement]=useState('');
  useEffect(()=>{profiles().then(p=>{setItems(p);setFirst(p[0]?.id||'');setSecond(p[1]?.id||'');}).catch(e=>setError(e.message));},[]);
  async function compare(){
    setBusy(true);setError('');setResult(null);
    try{setResult(await api<Report>('/compatibility',{first,second}));void track('compatibility_completed');}
    catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  const strongest=result?.aspects[0];
  return <><p className="eyebrow">ХОЁР ЗУРГИЙН УУЛЗВАР</p><h1>Хослол</h1>
    <div className="data-grid"><Image src={asset('/assets/illustration/compatibility.webp')} alt="Хоёр зургийн бэлгэдлийн уулзвар" width={700} height={525}/><div><p>Хэн нэгний төрсөн мэдээллийг нэмээд та хоёрын зурлагыг харьцуулж болно.</p>
      <label>Миний зураг<select value={first} onChange={e=>{setFirst(e.target.value);setResult(null);}}>{items.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label>Хоёр дахь зураг<select value={second} onChange={e=>{setSecond(e.target.value);setResult(null);}}><option value="">Сонгох</option>{items.filter(p=>p.id!==first).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <div className="actions"><button className="button primary" disabled={!second||first===second||busy} onClick={compare}>Харьцуулах</button><Link className="button outline" href="/onboarding">Профайл нэмэх</Link></div>
    </div></div>
    {error&&<p className="error" role="alert">{error}</p>}{busy&&<Loading/>}
    {result&&<><h2>{result.first_name} + {result.second_name}</h2><p>{result.meaning}</p>
      <div className="data-grid"><ChartWheel chart={result.first_chart} onSelect={p=>setPlacement(`${result.first_name}: ${p.name} — ${mn.signs[p.sign]} ${p.degree.toFixed(2)}°`)}/><ChartWheel chart={result.second_chart} onSelect={p=>setPlacement(`${result.second_name}: ${p.name} — ${mn.signs[p.sign]} ${p.degree.toFixed(2)}°`)}/></div><p role="status">{placement}</p>
      {result.readings.map(r=><Reading key={r.key} reading={r}/>)}
      {Object.entries(result.categories).map(([name,c])=><section className="reading-block" key={name}><h3>{name}</h3><p>Холбоосын идэвх: {c.prominence}/100</p><AspectTable aspects={c.aspects}/></section>)}
      <Share title={`${result.first_name} + ${result.second_name}`} lines={strongest?[`${mn.planets[strongest.a]} · ${mn.planets[strongest.b]}`,mn.aspects[strongest.kind]]:['Тэнгэрийн зургуудын уулзвар']}/>
    </>}
  </>;
}
export default function Compatibility(){return <Workspace><Comparison/></Workspace>;}
