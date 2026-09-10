"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, profiles } from '@/lib/api';
import type { Profile } from '@/lib/types';
import { Loading } from './workspace';

export function ProfileData<T>({endpoint,children}:{endpoint:string;children:(data:T,profile:Profile)=>React.ReactNode}){
  const [items,setItems]=useState<Profile[]>([]),[selected,setSelected]=useState(''),[data,setData]=useState<T|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(true),[retry,setRetry]=useState(0);
  useEffect(()=>{
    let active=true;
    profiles().then(rows=>{if(!active)return;setItems(rows);const id=new URLSearchParams(location.search).get('profile');setSelected(rows.find(p=>p.id===id)?.id||rows[0]?.id||'');if(!rows.length)setBusy(false);}).catch(e=>{if(active){setError(e.message);setBusy(false);}});
    return()=>{active=false;};
  },[retry]);
  useEffect(()=>{
    if(!selected)return;
    let active=true;
    api<T>(`${endpoint}/${selected}`).then(value=>{if(active){setData(value);setError('');setBusy(false);}}).catch(e=>{if(active){setError(e.message);setBusy(false);}});
    return()=>{active=false;};
  },[selected,endpoint,retry]);
  const p=items.find(p=>p.id===selected);
  return <>{items.length>0&&<label>Төрсөн профайл<select value={selected} onChange={e=>{setSelected(e.target.value);setData(null);setBusy(true);setError('');}}>{items.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>}{error?<div className="error" role="alert"><p>{error}</p><button className="button outline" onClick={()=>{setError('');setBusy(true);setRetry(retry+1);}}>Дахин оролдох</button></div>:busy?<Loading/>:data&&p?children(data,p):<div className="status"><p>Төрсөн мэдээллээ нэмээд тэнгэрийн зургаа нээнэ үү.</p><Link href="/onboarding" className="button primary">Мэдээлэл нэмэх</Link></div>}</>;
}
