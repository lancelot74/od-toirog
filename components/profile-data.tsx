"use client";
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api, profiles } from '@/lib/api';
import type { Profile, CalculationMethod } from '@/lib/types';
import { Loading } from './workspace';
import { MethodSelect } from './calculation-method';

export function ProfileData<T>({endpoint,children}:{endpoint:string;children:(data:T,profile:Profile)=>React.ReactNode}){
  const [items,setItems]=useState<Profile[]>([]),[selected,setSelected]=useState(''),[data,setData]=useState<T|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(true),[retry,setRetry]=useState(0);
  const [method,setMethod]=useState<CalculationMethod>('jpl-v0.1');
  const methodFromUrl=useRef(false);
  const [period,setPeriod]=useState({date:'',timezone:''});
  useEffect(()=>{
    let active=true;
    profiles().then(rows=>{if(!active)return;setItems(rows);const params=new URLSearchParams(location.search);const id=params.get('profile');const requested=params.get('method');if(!methodFromUrl.current){if(requested==='swiss-v1'||requested==='jpl-v0.1')setMethod(requested);methodFromUrl.current=true;}setSelected(rows.find(p=>p.id===id)?.id||rows[0]?.id||'');if(!rows.length)setBusy(false);}).catch(e=>{if(active){setError(e.message);setBusy(false);}});
    return()=>{active=false;};
  },[retry]);
  useEffect(()=>{
    if(!selected)return;
    let active=true;
    const query=new URLSearchParams({method});
    if(endpoint==='/today'){
      if(period.date)query.set('date',period.date);
      if(method==='jpl-v0.1'&&period.timezone)query.set('timezone',period.timezone);
    }
    api<T>(`${endpoint}/${selected}?${query}`).then(value=>{if(active){setData(value);setError('');setBusy(false);}}).catch(e=>{if(active){setError(e.message);setBusy(false);}});
    return()=>{active=false;};
  },[selected,endpoint,retry,method,period]);
  const p=items.find(p=>p.id===selected);
  return <>{items.length>0&&<>
    <label>Төрсөн профайл<select value={selected} onChange={e=>{setSelected(e.target.value);setData(null);setBusy(true);setError('');}}>{items.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    <MethodSelect value={method} onChange={value=>{setMethod(value);setData(null);setBusy(true);setError('');}}/>
    {endpoint==='/today'&&<form key={`${selected}:${method}`} className="day-controls" onSubmit={e=>{e.preventDefault();const form=new FormData(e.currentTarget);setPeriod({date:String(form.get('date')||''),timezone:String(form.get('timezone')||'').trim()});setData(null);setBusy(true);setError('');}}><label>Огноо · хоосон бол өнөөдөр<input name="date" type="date" min="1900-01-01" max="2099-12-31" defaultValue={period.date}/></label>{method==='jpl-v0.1'&&<label>Унших өдрийн цагийн бүс<input name="timezone" defaultValue={period.timezone||p?.timezone||'Asia/Ulaanbaatar'} required maxLength={100}/></label>}<button className="button outline">Өдрийг харах</button></form>}
  </>}{error?<div className="error" role="alert"><p>{error}</p><button className="button outline" onClick={()=>{setError('');setBusy(true);setRetry(retry+1);}}>Дахин оролдох</button></div>:busy?<Loading/>:data&&p?children(data,p):<div className="status"><p>Төрсөн мэдээллээ нэмээд тэнгэрийн зургаа нээнэ үү.</p><Link href="/onboarding" className="button primary">Мэдээлэл нэмэх</Link></div>}</>;
}
