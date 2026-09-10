import { createBrowserClient } from './supabase/client';
import type { Profile } from './types';

export async function api<T>(path:string,body?:unknown,method?:string):Promise<T>{
  const root=process.env.NEXT_PUBLIC_API_URL;
  if(!root)throw new Error('Тооцооллын API холбогдоогүй байна.');
  const session=await createBrowserClient()?.auth.getSession();
  const response=await fetch(`${root.replace(/\/$/,'')}${path}`,{method:method||(body?'POST':'GET'),headers:{'Content-Type':'application/json',...(session?.data.session?{Authorization:`Bearer ${session.data.session.access_token}`}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)}).catch(()=>{throw new Error('Үйлчилгээтэй холбогдох боломжгүй байна. Дахин оролдоно уу.');});
  if(!response.ok){const error=await response.json().catch(()=>({}));throw new Error(typeof error.detail==='string'?error.detail:'Үйлчилгээнд алдаа гарлаа. Дахин оролдоно уу.');}
  return response.json();
}
export async function profiles():Promise<Profile[]>{
  const client=createBrowserClient();
  if(!client)throw new Error('Supabase холбогдоогүй байна.');
  const {data,error}=await client.from('birth_profiles').select('*').order('is_primary',{ascending:false}).order('created_at');
  if(error)throw new Error('Төрсөн мэдээллийг унших боломжгүй байна.');
  return data||[];
}
