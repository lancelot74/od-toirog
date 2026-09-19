"use client";
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Workspace } from '@/components/workspace';
import { api } from '@/lib/api';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Place, Profile } from '@/lib/types';

function Form(){
  const router=useRouter();
  const [step,setStep]=useState(0),[name,setName]=useState(''),[date,setDate]=useState(''),[time,setTime]=useState(''),[unknown,setUnknown]=useState(false),[query,setQuery]=useState(''),[place,setPlace]=useState<Place|null>(null),[results,setResults]=useState<Place[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false),[fold,setFold]=useState(''),[editing,setEditing]=useState<string|null>(null);
  useEffect(()=>{
    const id=new URLSearchParams(location.search).get('edit');
    if(!id)return;
    createBrowserClient()?.from('birth_profiles').select('*').eq('id',id).single().then(({data,error})=>{
      if(error){setError('Мэдээлэл олдсонгүй.');return;}
      const p=data as Profile;setEditing(p.id);setName(p.name);setDate(p.birth_date);setTime(p.birth_time?.slice(0,5)||'');setUnknown(!p.birth_time_known);setPlace({name:p.birth_city,country:p.birth_country,latitude:p.latitude,longitude:p.longitude,timezone:p.timezone});setQuery(p.birth_city);setFold(p.time_fold_confirmed?String(p.time_fold):'');
    });
  },[]);
  async function search(){setBusy(true);setError('');try{const rows=await api<Place[]>(`/locations?q=${encodeURIComponent(query)}`);setResults(rows);if(!rows.length)setError('Тохирох газар олдсонгүй. Хотын нэрийг латин үсгээр хайж үзнэ үү.');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  async function submit(e:FormEvent){
    e.preventDefault();setError('');
    if(step===3&&!place){setError('Жагсаалтаас төрсөн газраа сонгоно уу.');return;}
    if(step<4){setStep(step+1);return;}
    setBusy(true);
    try{
      const saved=await api<Profile>('/profiles',{id:editing,name,birth_date:date,birth_time:unknown?null:time,birth_time_known:!unknown,place,time_fold:!unknown&&fold!==''?Number(fold):null,time_fold_confirmed:!unknown&&fold!==''});
      router.push(`/chart?profile=${saved.id}&method=${unknown?'swiss-v1':'jpl-v0.1'}`);
    }catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  return <><p className="eyebrow">ТӨРСӨН МӨЧ</p><h1>{editing?'Мэдээллээ засах':'Таны аялал эндээс эхэлнэ.'}</h1>
    <div className="step-track" aria-label="Алхам">{[1,2,3,4,5].map(n=><span key={n} aria-current={step===n-1?'step':undefined}>{n}</span>)}</div>
    <form className="editor" onSubmit={submit}><fieldset disabled={busy}>
      <legend>{['Таны нэр','Төрсөн огноо','Төрсөн цаг','Төрсөн газар','Мэдээллээ шалгах'][step]}</legend>
      {step===0&&<label>Нэр<input value={name} onChange={e=>setName(e.target.value)} required maxLength={120} autoComplete="given-name"/></label>}
      {step===1&&<label>Төрсөн огноо<input type="date" value={date} onChange={e=>setDate(e.target.value)} min="1900-01-01" max={new Date().toISOString().slice(0,10)} required/></label>}
      {step===2&&<><label>Цаг<input type="time" value={time} onChange={e=>setTime(e.target.value)} disabled={unknown} required={!unknown}/></label><label><input type="checkbox" checked={unknown} onChange={e=>setUnknown(e.target.checked)}/> Төрсөн цагаа мэдэхгүй</label>{unknown&&<p className="status">JPL v0.1 нь цаггүй зураг тооцохгүй. Хэсэгчилсэн зурагт Swiss аргыг сонгож, тухайн газрын 12:00 цагийг лавлах мөч болгон ашиглана. Асцендент, ордон, Midheaven-ийг харуулахгүй. Сар болон орд солих гаригийн байрлал тодорхойгүй гэж тэмдэглэгдэнэ.</p>}</>}
      {step===3&&<><label>Хот / аймаг / улс<input value={query} onChange={e=>{setQuery(e.target.value);setPlace(null);}} minLength={2}/></label><button type="button" className="button outline" onClick={search} disabled={query.trim().length<2}>Хайх</button><ul className="result-list">{results.map(p=><li key={`${p.latitude},${p.longitude}`}><button type="button" onClick={()=>{setPlace(p);setQuery(p.name);setResults([]);}}>{p.name}, {p.country} · {p.timezone}</button></li>)}</ul>{place&&<p className="status">{place.name}, {place.country} · {place.timezone}</p>}</>}
      {step===4&&<><dl><dt>Нэр</dt><dd>{name}</dd><dt>Огноо / цаг</dt><dd>{date} · {unknown?'Цаг тодорхойгүй':time}</dd><dt>Төрсөн газар</dt><dd>{place?.name}, {place?.country} · {place?.timezone}</dd><dt>Анхны тооцооллын арга</dt><dd>{unknown?'Swiss · 12:00 лавлах мөч':'JPL DE440s · v0.1'}</dd></dl>{!unknown&&<details><summary>Зуны цаг шилжсэн үеийн давхардсан цаг</summary><label>Ижил цаг хоёр давтагдсан бол<select value={fold} onChange={e=>setFold(e.target.value)}><option value="">Тохиолдлыг сонгоогүй</option><option value="0">Эхний тохиолдол</option><option value="1">Хоёр дахь тохиолдол</option></select></label><p>Давхардсан цагт сонголт хийгээгүй бол тооцоолол тодруулга шаардана.</p></details>}</>}
    </fieldset>{error&&<p role="alert" className="error">{error}</p>}<div className="actions">{step>0&&<button type="button" className="button outline" onClick={()=>setStep(step-1)} disabled={busy}>Буцах</button>}<button className="button primary" disabled={busy}>{busy?'Хадгалж байна…':step===4?'Хадгалаад зургаа нээх':'Үргэлжлүүлэх'}</button></div></form>
  </>;
}
export default function Onboarding(){return <Workspace><Form/></Workspace>;}
