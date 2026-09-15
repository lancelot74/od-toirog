"use client";
import { useState } from 'react';
import Link from 'next/link';
import { Workspace } from '@/components/workspace';
import { ProfileData } from '@/components/profile-data';
import { ChartWheel } from '@/components/chart-wheel';
import { Reading, AspectTable } from '@/components/reading';
import { ChartShare } from '@/components/chart-share';
import type { Chart, Profile, Planet } from '@/lib/types';
import { mn } from '@/lib/mn';
import { AstroSymbol } from '@/components/astro-symbol';
import { ZodiacLink, ZodiacPortrait } from '@/components/zodiac-link';

function Result({chart,profile}:{chart:Chart;profile:Profile}){
  const [selected,setSelected]=useState<Planet>(chart.planets[0]),[tab,setTab]=useState('Гаригууд');
  const reading=chart.readings.find(r=>r.key===`planet_${selected.id}_sign_${selected.sign}`);
  const tabs=['Гаригууд','Орд','Ордон','Холбоос','Тайлбар'];
  return <>
    <h1>{profile.name} · Төрсөн мөчийн тэнгэр</h1>
    <p>{profile.birth_date} · {profile.birth_time||'Цаг тодорхойгүй'} · {profile.birth_city}</p>
    <Link href={`/onboarding?edit=${profile.id}`}>Мэдээлэл засах</Link>
    {chart.notice&&<p className="status">{chart.notice}</p>}
    <div className="big-three">{[chart.planets[0],chart.planets[1]].map(p=><div key={p.id}><AstroSymbol kind="planet" index={p.id} size={40}/><p>{p.name}</p><b>{p.uncertain?'Тодорхойгүй':<ZodiacLink index={p.sign}/>}</b><small>{p.uncertain?'Лавлах байрлал':p.degree.toFixed(2)+'°'}</small></div>)}<div>{chart.ascendant!==null&&<AstroSymbol kind="zodiac" index={Math.floor(chart.ascendant/30)} size={40}/>}<p>Асцендент</p><b>{chart.ascendant===null?'Тодорхойгүй':<ZodiacLink index={Math.floor(chart.ascendant/30)}/>}</b></div></div>
    <div className="data-grid"><ChartWheel chart={chart} onSelect={setSelected}/><div>
      <label>Гариг сонгох<select value={selected.id} onChange={e=>setSelected(chart.planets.find(p=>p.id===Number(e.target.value))!)}>{chart.planets.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <section aria-live="polite"><h2 className="symbol-label"><AstroSymbol kind="planet" index={selected.id} size={40}/>{selected.name}</h2><p>{mn.signs[selected.sign]} · {selected.degree.toFixed(2)}° {selected.retrograde?'℞':''}</p>{!selected.uncertain&&<ZodiacPortrait index={selected.sign}/>} {reading?<Reading reading={reading}/>:<p>Төрсөн цаг тодорхойгүй тул энэ гаригийн тайлал боломжгүй байна.</p>}</section>
    </div></div>
    <div className="tabs" role="tablist" aria-label="Зургийн мэдээлэл">{tabs.map((t,i)=><button role="tab" id={`tab-${i}`} aria-controls="chart-panel" aria-selected={tab===t} tabIndex={tab===t?0:-1} key={t} onClick={()=>setTab(t)} onKeyDown={e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){const next=(i+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length;setTab(tabs[next]);document.getElementById(`tab-${next}`)?.focus();}}}>{t}</button>)}</div>
    <section role="tabpanel" id="chart-panel" aria-labelledby={`tab-${tabs.indexOf(tab)}`} tabIndex={0}>
      {tab==='Гаригууд'&&<div className="table-wrap"><table><thead><tr><th>Гариг</th><th>Орд</th><th>Хэм</th><th>Ордон</th></tr></thead><tbody>{chart.planets.map(p=><tr key={p.id}><td><span className="planet-name"><AstroSymbol kind="planet" index={p.id} size={26}/>{p.name} {p.retrograde?'℞':''}</span></td><td><ZodiacLink index={p.sign}/> {p.uncertain?'(лавлах)':''}</td><td>{p.degree.toFixed(2)}°</td><td>{p.house??'—'}</td></tr>)}</tbody></table></div>}
      {tab==='Орд'&&mn.signs.map((sign,i)=><p key={sign}><ZodiacLink index={i}/>: {chart.planets.filter(p=>p.sign===i&&!p.uncertain).map(p=>p.name).join(', ')||'—'}</p>)}
      {tab==='Ордон'&&(chart.houses.length?chart.houses.map((lon,i)=><p key={i}>{i+1}-р ордон · {mn.signs[Math.floor(lon/30)]} {(lon%30).toFixed(2)}°</p>):<p>Төрсөн цаг шаардлагатай.</p>)}
      {tab==='Холбоос'&&<AspectTable aspects={chart.aspects}/>}
      {tab==='Тайлбар'&&chart.readings.map(r=><Reading key={r.key+':'+r.headline} reading={r}/>)}
    </section>
    <p className="muted">{chart.ephemeris} · {chart.house_system} · UTC {chart.utc}</p>
    <ChartShare chart={chart} name={profile.name}/>
  </>;
}
export default function ChartPage(){return <Workspace><ProfileData<Chart> endpoint="/charts">{(chart,p)=><Result key={p.id} chart={chart} profile={p}/>}</ProfileData></Workspace>;}
