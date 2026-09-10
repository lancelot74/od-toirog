"use client";
import type { Chart, Planet } from '@/lib/types';
import { mn } from '@/lib/mn';

const signs=['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
export function ChartWheel({chart,onSelect}:{chart:Chart;onSelect:(planet:Planet)=>void}){
  const origin=chart.ascendant??0;
  const at=(longitude:number,r:number)=>{const angle=(180-longitude+origin)*Math.PI/180;return {x:250+Math.cos(angle)*r,y:250+Math.sin(angle)*r};};
  // Radial lanes keep close glyphs selectable without changing longitude.
  const placed: {p:Planet;r:number}[]=[];
  for(const p of [...chart.planets].sort((a,b)=>a.longitude-b.longitude)){
    let lane=0;
    while(placed.some(q=>q.r===177-lane*25&&Math.abs((q.p.longitude-p.longitude+540)%360-180)<10))lane++;
    placed.push({p,r:177-lane*25});
  }
  return <svg viewBox="0 0 500 500" className="real-chart" role="group" aria-label="Төрсөн мөчийн натал зураг"><circle cx="250" cy="250" r="240" className="chart-line strong"/><circle cx="250" cy="250" r="205" className="chart-line"/><circle cx="250" cy="250" r="130" className="chart-line faint"/>{signs.map((s,i)=>{const a=at(i*30,205),b=at(i*30,240),label=at(i*30+15,224);return <g key={s}><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="chart-line"/><text x={label.x} y={label.y} textAnchor="middle">{s}</text></g>;})}{chart.houses.map((lon,i)=>{const a=at(lon,130),b=at(lon,205),label=at(lon+8,195);return <g key={i}><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="chart-line"/><text x={label.x} y={label.y} fontSize="9">{i+1}</text></g>;})}{chart.aspects.map(a=>{const first=chart.planets.find(p=>p.id===a.a)!,second=chart.planets.find(p=>p.id===a.b)!,x=at(first.longitude,130),y=at(second.longitude,130);return <line key={`${a.a}-${a.b}`} x1={x.x} y1={x.y} x2={y.x} y2={y.y} className={a.kind==='square'||a.kind==='opposition'?'aspect cool':'aspect'}><title>{mn.planets[a.a]} · {mn.planets[a.b]} · {mn.aspects[a.kind]}</title></line>;})}{placed.map(({p,r})=>{const a=at(p.longitude,r);return <g key={p.id} role="button" tabIndex={0} aria-label={`${p.name} ${mn.signs[p.sign]} ${p.degree.toFixed(2)}°`} onClick={()=>onSelect(p)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(p);}}} className="body-select"><circle cx={a.x} cy={a.y} r="15" className="planet-dot"/><text x={a.x} y={a.y+4} textAnchor="middle">{mn.glyphs[p.id]}</text><title>{p.name} {p.degree.toFixed(2)}° {p.retrograde?'℞':''}</title></g>;})}{[[chart.ascendant,'ASC'],[chart.midheaven,'MC']].map(([lon,label])=>{if(lon===null)return null;const a=at(Number(lon),243);return <text key={label} x={a.x} y={a.y} textAnchor="middle" fontSize="8">{label}</text>;})}</svg>;
}
