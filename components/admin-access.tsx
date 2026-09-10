"use client";
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Loading } from './workspace';
export function AdminAccess({children}:{children:React.ReactNode}){
  const [state,setState]=useState('loading');
  useEffect(()=>{api('/admin/settings').then(()=>setState('allowed')).catch(()=>setState('denied'));},[]);
  return state==='loading'?<Loading/>:state==='allowed'?children:<p className="status" role="alert">Админ эрх шаардлагатай эсвэл сервертэй холбогдох боломжгүй байна.</p>;
}
