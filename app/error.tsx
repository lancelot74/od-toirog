"use client";
export default function ErrorPage({reset}:{error:Error;reset:()=>void}){return <main className="workspace"><h1>Хуудсыг нээхэд алдаа гарлаа.</h1><p>Мэдээллээ дахин уншуулах боломжтой.</p><button className="button primary" onClick={reset}>Дахин оролдох</button></main>;}
