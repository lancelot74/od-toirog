"use client";
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createBrowserClient } from '@/lib/supabase/client';
import { asset } from '@/lib/paths';
import { mn } from '@/lib/mn';
import { MobileNavigation } from './mobile-navigation';

export function Loading() { return <div role="status" className="loading-plate"><Image src={asset('/assets/illustration/loading.webp')} width={200} height={200} alt=""/><p>{mn.loading}</p></div>; }
export function Workspace({children,privatePage=true}: {children:React.ReactNode;privatePage?:boolean}) {
  const pathname=usePathname();
  const [auth,setAuth]=useState<{user:User|null;ready:boolean}>({user:null,ready:false});
  useEffect(()=>{
    const client=createBrowserClient();
    if(!client) return;
    const {data:{subscription}}=client.auth.onAuthStateChange((_event,session)=>setAuth({user:session?.user||null,ready:true}));
    client.auth.getSession().then(({data})=>setAuth({user:data.session?.user||null,ready:true})).catch(()=>setAuth({user:null,ready:true}));
    return ()=>subscription.unsubscribe();
  },[]);
  const configured=Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  return <div className="workspace-frame"><nav className="workspace-nav" aria-label="Үндсэн цэс"><Link className="brand" href="/">ОД ТОЙРОГ</Link>{[['/today','Өнөөдөр'],['/chart','Зураг'],['/compatibility','Хослол'],['/learn','Мэдлэг'],['/profile','Профайл']].map(([href,label])=><Link key={href} href={href} aria-current={pathname.replace(/\/$/,'')===href?'page':undefined}>{label}</Link>)}</nav><main className="workspace">{!privatePage?children:!configured?<><h1>Холболтыг хүлээж байна.</h1><p>{mn.setup}</p><Link href="/auth">Нэвтрэх</Link></>:!auth.ready?<Loading/>:!auth.user?<><h1>Өөрийн орон зайд нэвтэрнэ үү.</h1><Link className="button primary" href="/auth">Нэвтрэх</Link></>:children}</main><MobileNavigation/></div>;
}
