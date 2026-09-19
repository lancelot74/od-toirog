"use client";
import Link from 'next/link';
import { useId } from 'react';
import type { CalculationInfo, CalculationMethod } from '@/lib/types';

export function MethodSelect({value,onChange,disabled=false}:{value:CalculationMethod;onChange:(value:CalculationMethod)=>void;disabled?:boolean}){
  const id=useId();
  return <section className="method-select"><label htmlFor={id}>Тооцооллын арга</label><select id={id} value={value} onChange={e=>onChange(e.target.value as CalculationMethod)} disabled={disabled}><option value="jpl-v0.1">JPL DE440s · v0.1 — шинэ арга</option><option value="swiss-v1">Swiss Ephemeris / Placidus — ордонтой</option></select><p className="muted">{value==='jpl-v0.1'?'Төрсөн цаг шаардлагатай. Ордон, Асцендент, Midheaven ороогүй. Тохирлын хувь гаргахгүй.':'Ордон болон Асцендент тооцоолно. Цаг тодорхойгүй үед ил тод 12:00 лавлах мөч ашиглана.'}</p><Link href="/learn/calculations">Аргуудын ялгаа ба тооцооллын тайлбар →</Link></section>;
}

export function CalculationDetails({calculation}:{calculation?:CalculationInfo}){
  if(!calculation)return null;
  const p=calculation.provenance;
  return <details className="calculation-details"><summary>Тооцооллын эх сурвалж · {calculation.name}</summary><p>{calculation.houses_supported?'Ордон: Placidus':'Ордон, Асцендент, Midheaven: энэ аргад байхгүй.'}</p>{p&&<><dl><dt>Хөдөлгүүр</dt><dd>{p.engine_version} · {p.astronomy_library}</dd><dt>Одон орны өгөгдөл</dt><dd>{p.ephemeris}</dd><dt>Цагийн бүсийн сан</dt><dd>{p.timezone_database}</dd><dt>Координатын хүрээ</dt><dd>Дэлхийн төвөөс харсан үзэгдэх байрлал · тропик · тухайн өдрийн жинхэнэ эклиптик</dd><dt>Дүрмийн хувилбар</dt><dd>{p.rules_version}</dd><dt>Гаригийн өгөгдлийн SHA-256</dt><dd><code>{p.ephemeris_sha256}</code></dd><dt>Цагийн өгөгдлийн SHA-256</dt><dd><code>{p.time_data_sha256}</code></dd><dt>Дүрмийн SHA-256</dt><dd><code>{p.rules_sha256}</code></dd></dl><p>Дэмжих хүрээ: 1900-01-01 ≤ UTC &lt; 2100-01-01.</p></>}<Link href="/learn/calculations">Томьёо, нарийвчлал, хязгаарлалтууд →</Link></details>;
}
