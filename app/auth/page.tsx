"use client";
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { asset, siteUrl } from '@/lib/paths';
import { mn } from '@/lib/mn';
import { profiles } from '@/lib/api';

let callback: {code:string;promise:Promise<unknown>} | undefined;
export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'login'|'signup'|'reset'|'update'>('login');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  useEffect(() => {
    const supabase = createBrowserClient();
    if (!supabase) return;
    const finish = async () => {
      const params = new URLSearchParams(location.search);
      if (params.has('error')) throw new Error(mn.authError);
      const code = params.get('code');
      if (code) {
        if(callback?.code!==code)callback={code,promise:supabase.auth.exchangeCodeForSession(code).then(({ error }) => { if (error) throw error; })};
        await callback.promise;
        history.replaceState(null, '', location.pathname + (params.get('flow') === 'recovery' ? '?flow=recovery' : ''));
      }
      if (params.get('flow') === 'recovery') { setMode('update'); return; }
      const { data } = await supabase.auth.getSession();
      if (data.session) router.replace((await profiles()).length ? '/today' : '/onboarding');
    };
    finish().catch(() => setMessage('Баталгаажуулах холбоос хүчингүй эсвэл хугацаа нь дууссан байна. Дахин нэвтэрнэ үү.'));
  }, [router]);

  async function google() {
    const supabase = createBrowserClient();
    if (!supabase) return setMessage(mn.setup);
    setPending(true); setMessage('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({provider:'google', options:{redirectTo:siteUrl('/auth/')}});
      if (error) throw error;
    } catch { setMessage(mn.network); setPending(false); }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createBrowserClient();
    if (!supabase) return setMessage(mn.setup);
    const values = new FormData(event.currentTarget);
    const email = String(values.get('email') || '').trim();
    const password = String(values.get('password') || '');
    setPending(true); setMessage('');
    try {
      if (mode === 'reset') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {redirectTo:siteUrl('/auth/?flow=recovery')});
        if (error) throw error;
        setMessage('Бүртгэлтэй хаяг бол нууц үг сэргээх холбоос илгээгдэнэ.');
      } else if (mode === 'update') {
        const { error } = await supabase.auth.updateUser({password});
        if (error) throw error;
        router.replace('/profile');
      } else if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({email,password,options:{emailRedirectTo:siteUrl('/auth/')}});
        if (error) throw error;
        if (data.session) router.replace('/onboarding');
        else setMessage('Имэйлээ шалгаж, баталгаажуулах холбоосыг энэ хөтөч дээр нээнэ үү.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({email,password});
        if (error) throw error;
        router.replace((await profiles()).length ? '/today' : '/onboarding');
      }
    } catch { setMessage(mn.authError); }
    finally { setPending(false); }
  }
  const title = {login:'Буцаж ирсэнд тавтай морил.',signup:'Өөрийн аяллыг эхлүүлнэ үү.',reset:'Нууц үгээ сэргээх',update:'Шинэ нууц үг'}[mode];
  return <main className="auth-shell"><Link className="auth-back" href="/">← Нүүр хуудас</Link><section className="auth-brand"><Image src={asset('/assets/brand/primary-logo/od-toirog.webp')} width={720} height={720} alt="Од Тойрог" priority/><blockquote>Таны төрсөн мөчийн тэнгэр.</blockquote></section><section className="auth-panel"><div className="auth-card"><p className="eyebrow">ХУВИЙН ОРОН ЗАЙ</p><h1>{title}</h1><p className="auth-intro">Хувийн зургаа нээж, төрсөн мэдээллээ хадгална.</p>{(mode==='login'||mode==='signup')&&<><button className="google-button" onClick={google} disabled={pending}><span aria-hidden="true">G</span> Google-ээр үргэлжлүүлэх</button><div className="auth-divider">эсвэл</div></>}<form className="auth-form" onSubmit={submit}>{mode!=='update'&&<label>Имэйл<input name="email" type="email" autoComplete="email" required/></label>}{mode!=='reset'&&<label>Нууц үг<input name="password" type="password" minLength={mode==='login'?1:8} autoComplete={mode==='login'?'current-password':'new-password'} required/></label>}<button className="button primary wide" disabled={pending}>{pending?mn.loading:mode==='login'?'Нэвтрэх':mode==='signup'?'Бүртгэл үүсгэх':mode==='reset'?'Холбоос илгээх':'Хадгалах'}</button></form>{mode==='login'&&<button className="forgot-button" onClick={()=>{setMode('reset');setMessage('');}}>Нууц үгээ мартсан уу?</button>}<p className="auth-switch"><button onClick={()=>{setMode(mode==='login'?'signup':'login');setMessage('');}}>{mode==='login'?'Шинээр бүртгүүлэх':'Нэвтрэх хэсэг рүү буцах'}</button></p>{message&&<p className="auth-message" role="status">{message}</p>}<Link href="/privacy" className="auth-terms">Нууцлал ба ашиглах нөхцөл</Link></div></section></main>;
}
