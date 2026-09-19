"use client";
import { useEffect, useState } from 'react';
import { ChartWheel } from './chart-wheel';
import { asset } from '@/lib/paths';
import { mn } from '@/lib/mn';
import type { Chart, Planet } from '@/lib/types';
import { AstroSymbol } from './astro-symbol';
import { ZodiacPortrait } from './zodiac-link';
import { CalculationDetails } from './calculation-method';

export function ChartPreview({source='swiss'}:{source?:'swiss'|'jpl'}){
  const [chart,setChart]=useState<Chart|null>(null),[selected,setSelected]=useState<Planet|null>(null);
  useEffect(()=>{const controller=new AbortController();fetch(asset(source==='jpl'?'/assets/jpl-reference-chart.json':'/assets/reference-chart.json'),{signal:controller.signal}).then(r=>r.ok?r.json():null).then(c=>{setChart(c);setSelected(c?.planets[0]||null);}).catch(()=>{});return()=>controller.abort();},[source]);
  if(!chart)return null;
  return <div className="data-grid public-chart"><ChartWheel chart={chart} onSelect={setSelected}/><div><p className="eyebrow">ТООЦООЛСОН ЖИШЭЭ · {source==='jpl'?'JPL DE440s':'SWISS / PLACIDUS'}</p><p>2000.01.01 · 12:00 UTC · Greenwich</p><p className="muted">Хувийн зураг биш. Доорх дүрслэл нь бүтээгдэхүүний бодит SVG бүрэлдэхүүн юм.</p>{selected&&<><h3 className="symbol-label"><AstroSymbol kind="planet" index={selected.id}/>{selected.name} — {mn.signs[selected.sign]}</h3><p>{selected.degree.toFixed(2)}° · {selected.house===null?'Ордон тооцоогүй':`${selected.house}-р ордон`}</p><ZodiacPortrait index={selected.sign}/></>}<p>Гариг дээр дарж эсвэл Tab товчоор сонгон үзээрэй.</p><CalculationDetails calculation={chart.calculation}/></div></div>;
}
