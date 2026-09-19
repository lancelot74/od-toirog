"use client";
import { useState } from 'react';
import type { Chart } from '@/lib/types';
import { mn } from '@/lib/mn';
import { Share } from './share';
export function ChartShare({chart,name}:{chart:Chart;name:string}){
  const [selection,setSelection]=useState('three');
  const planet=chart.planets.find(p=>String(p.id)===selection);
  const describe=(p:Chart['planets'][number])=>`${p.name} — ${p.uncertain?'Тодорхойгүй':mn.signs[p.sign]}`;
  const lines=planet?[describe(planet)]:[...chart.planets.slice(0,2).map(describe),`Асцендент — ${chart.ascendant===null?(chart.calculation?.id==='jpl-v0.1'?'Энэ аргад тооцохгүй':'Тодорхойгүй'):mn.signs[Math.floor(chart.ascendant/30)]}`];
  return <><label>Зургийн агуулга<select value={selection} onChange={e=>setSelection(e.target.value)}><option value="three">Гол гурав</option>{chart.planets.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><Share title={name} lines={lines}/></>;
}
