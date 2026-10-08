"use client";
import { useEffect, useRef, useState } from 'react';
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
import type { Profile, Aspect, Reading as ReadingType, Chart, CalculationInfo } from '@/lib/types';
import { useCalculationMethod } from '@/lib/calculation-method';
import { MethodSelect, CalculationDetails } from '@/components/calculation-method';
type Report={first_name:string;second_name:string;meaning:string;categories:Record<string,{prominence:number|null;aspects:Aspect[]}>;readings:ReadingType[];aspects:Aspect[];first_chart:Chart;second_chart:Chart;calculation?:CalculationInfo;compatibility_score?:null};

function Comparison(){
  const [items,setItems]=useState<Profile[]>([]),[first,setFirst]=useState(''),[second,setSecond]=useState(''),[result,setResult]=useState<Report|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[placement,setPlacement]=useState('');
  const [method,setMethod]=useCalculationMethod();
  const generation=useRef(0);
  useEffect(()=>()=>{generation.current+=1;},[]);
  function invalidate(){
    generation.current+=1;
    setResult(null);setError('');setBusy(false);setPlacement('');
  }
  useEffect(()=>{profiles().then(p=>{setItems(p);setFirst(p[0]?.id||'');setSecond(p[1]?.id||'');}).catch(e=>setError(e.message));},[]);
  async function compare(){
    if(!method)return;
    const request=++generation.current;
    setBusy(true);setError('');setResult(null);setPlacement('');
    try{
      const report=await api<Report>('/compatibility',{first,second,method});
      if(request===generation.current){setResult(report);void track('compatibility_completed');}
    }catch(e){if(request===generation.current)setError((e as Error).message);}
    finally{if(request===generation.current)setBusy(false);}
  }
  const strongest=result?.aspects[0];
  return <><p className="eyebrow">ХОЁР ЗУРГИЙН УУЛЗВАР</p><h1>Хослол</h1>
    <MethodSelect value={method||'jpl-v0.1'} onChange={value=>{invalidate();setMethod(value);}}/>
    <div className="data-grid"><Image src={asset('/assets/illustration/compatibility.webp')} alt="Хоёр зургийн бэлгэдлийн уулзвар" width={700} height={525}/><div><p>Хэн нэгний төрсөн мэдээллийг нэмээд та хоёрын зурлагыг харьцуулж болно.</p>
      <label>Миний зураг<select value={first} onChange={e=>{invalidate();setFirst(e.target.value);if(e.target.value===second)setSecond('');}}>{items.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label>Хоёр дахь зураг<select value={second} onChange={e=>{invalidate();setSecond(e.target.value);}}><option value="">Сонгох</option>{items.filter(p=>p.id!==first).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <div className="actions"><button className="button primary" disabled={!method||!second||first===second||busy} onClick={compare}>Харьцуулах</button><Link className="button outline" href="/onboarding">Профайл нэмэх</Link></div>
    </div></div>
    {error&&<p className="error" role="alert">{error}</p>}{busy&&<Loading/>}
    {result&&<><h2>{result.first_name} + {result.second_name}</h2><p>{result.meaning}</p>
      <CalculationDetails calculation={result.calculation}/>
      <p className="muted">Эхний / зүүн гариг: {result.first_name}. Хоёр дахь / баруун гариг: {result.second_name}.</p>
      <div className="data-grid"><div><h3>{result.first_name}</h3><ChartWheel chart={result.first_chart} onSelect={p=>setPlacement(`${result.first_name}: ${p.name} — ${mn.signs[p.sign]} ${p.degree.toFixed(2)}°`)}/></div><div><h3>{result.second_name}</h3><ChartWheel chart={result.second_chart} onSelect={p=>setPlacement(`${result.second_name}: ${p.name} — ${mn.signs[p.sign]} ${p.degree.toFixed(2)}°`)}/></div></div><p role="status">{placement}</p>
      {result.readings.map(r=><Reading key={r.key} reading={r}/>)}
      {Object.entries(result.categories).map(([name,c])=><section className="reading-block" key={name}><h3>{name}</h3>{c.prominence===null?<p className="muted">Энэ арга тохирлын хувь өгдөггүй. Доорх нь хоёр зургийн геометрийн холбоосууд.</p>:<p>Холбоосын идэвх: {c.prominence}/100</p>}<AspectTable aspects={c.aspects}/></section>)}
      <Share title={`${result.first_name} + ${result.second_name}`} lines={strongest?[`${mn.planets[strongest.a]} · ${mn.planets[strongest.b]}`,mn.aspects[strongest.kind]]:['Тэнгэрийн зургуудын уулзвар']}/>
    </>}
  </>;
}
export default function Compatibility(){return <Workspace><Comparison/></Workspace>;}
