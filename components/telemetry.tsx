"use client";
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@/lib/telemetry';
export function Telemetry(){
  const path=usePathname();
  useEffect(()=>{
    const event:Record<string,string>={'/':'landing_view','/auth':'signup_started','/onboarding':'birth_info_started','/chart':'chart_viewed','/today':'today_viewed','/compatibility':'compatibility_started'};
    const key=path==='/'?'/':path.replace(/\/$/,'');if(event[key])void track(event[key]);
    const failure=()=>{void track('client_error');};
    window.addEventListener('error',failure);window.addEventListener('unhandledrejection',failure);
    return()=>{window.removeEventListener('error',failure);window.removeEventListener('unhandledrejection',failure);};
  },[path]);
  return null;
}
