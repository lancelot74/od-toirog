"use client";
import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';
import type { Aspect, Reading as ReadingType } from '@/lib/types';
import { AspectTable, Reading } from './reading';

export function TransitSnapshot({profileId}:{profileId:string}){
  const [result,setResult]=useState<{at_utc:string;aspects:Aspect[];readings:ReadingType[]}|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  async function calculate(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError('');setResult(null);const input=String(new FormData(e.currentTarget).get('at')).trim();try{if(!/(Z|[+-]\d{2}:\d{2})$/.test(input)||!Number.isFinite(new Date(input).getTime()))throw new Error('Огноо, цаг болон UTC зөрүүгээ шалгана уу.');setResult(await api(`/transits/${profileId}?at=${encodeURIComponent(input)}`));}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
  return <details className="reading-block"><summary>Тодорхой нэг мөчийн транзит</summary><p>ISO огноо/цагийг Z эсвэл UTC зөрүүтэй оруулна. Жишээ: 2026-09-19T12:00:00+08:00.</p><form className="day-controls" onSubmit={calculate}><label>Огноо / цаг / UTC зөрүү<input name="at" placeholder="2026-09-19T12:00:00+08:00" required/></label><button className="button outline" disabled={busy}>{busy?'Тооцоолж байна…':'Мөчийг харах'}</button></form>{error&&<p role="alert" className="error">{error}</p>}{result&&<><p>UTC {result.at_utc}</p><AspectTable aspects={result.aspects}/>{result.readings.map(r=><Reading key={r.evidence_id} reading={r}/>)}</>}</details>;
}
