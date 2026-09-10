"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Workspace } from '@/components/workspace';
import { api, profiles } from '@/lib/api';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';
function Account(){
  const router=useRouter();
  const [items,setItems]=useState<Profile[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false),[confirmation,setConfirmation]=useState(''),[email,setEmail]=useState('');
  useEffect(()=>{profiles().then(setItems).catch(e=>setError(e.message));createBrowserClient()?.auth.getUser().then(({data})=>setEmail(data.user?.email||''));},[]);
  async function logout(){const {error}=await createBrowserClient()!.auth.signOut();if(error)setError('Гарах боломжгүй байна.');else router.replace('/auth');}
  async function remove(id:string){if(!window.confirm('Энэ профайл болон холбоотой зургуудыг устгах уу?'))return;const {error}=await createBrowserClient()!.from('birth_profiles').delete().eq('id',id);if(error)setError('Устгах боломжгүй байна.');else setItems(items.filter(p=>p.id!==id));}
  async function exportData(){setBusy(true);try{const value=await api('/account/export');const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='od-toirog-data.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  async function deleteAccount(){setBusy(true);try{await api('/account',undefined,'DELETE');await createBrowserClient()!.auth.signOut({scope:'local'});router.replace('/');}catch(e){setError((e as Error).message);setBusy(false);}}
  return <><h1>Миний орон зай</h1><p>{email}</p><p className="muted">Хэл: Монгол · Үндсэн хэрэглээ: Үнэгүй · Профайлууд: хувийн</p><div className="actions"><Link className="button primary" href="/onboarding">Төрсөн мэдээлэл нэмэх</Link><button className="button outline" onClick={logout}>Гарах</button></div>{error&&<p className="error" role="alert">{error}</p>}<h2>Хадгалсан профайлууд</h2><div className="profile-list">{items.map(p=><article className="profile-entry" key={p.id}><h3>{p.name}</h3><p>{p.birth_date} · {p.birth_time||'Цаг тодорхойгүй'} · {p.birth_city}</p><div className="actions"><Link href={`/chart?profile=${p.id}`}>Зураг</Link><Link href={`/today?profile=${p.id}`}>Өнөөдөр</Link><Link href={`/onboarding?edit=${p.id}`}>Засах</Link><button className="text-button" onClick={()=>remove(p.id)}>Устгах</button></div></article>)}</div><section className="reading-block"><h2>Нууцлал</h2><Link href="/privacy">Нууцлалын мэдээлэл →</Link><p>Төрсөн мэдээлэл, тооцоолол, хадгалсан тайллуудаа татаж авна.</p><button className="button outline" onClick={exportData} disabled={busy}>Мэдээллээ JSON татах</button><details><summary>Бүртгэлээ бүрмөсөн устгах</summary><p>Таны бүртгэл, бүх профайл болон хадгалсан тайллууд устна.</p><label>Баталгаажуулахын тулд УСТГАХ гэж бичнэ үү<input value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></label><button className="button outline" disabled={confirmation!=='УСТГАХ'||busy} onClick={deleteAccount}>Бүрмөсөн устгах</button></details></section></>;
}
export default function ProfilePage(){return <Workspace><Account/></Workspace>;}
