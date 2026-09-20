import Link from 'next/link';
import type { LibraryValue,ResearchEntry } from '@/lib/library/types';
import { fieldLabels } from '@/lib/library/config';
import { referencedEntry } from '@/lib/library/server';

export function DetailValue({value,field}:{value:LibraryValue;field:string}){
  if(value===null)return <span className="muted">—</span>;
  if(typeof value==='string'){
    const target=referencedEntry(field,value);
    return target?<Link className="library-crosslink" href={`/library/entries/${target.id}`}>{target.title} →</Link>:<p>{value}</p>;
  }
  if(typeof value==='number'||typeof value==='boolean')return <p>{String(value)}</p>;
  if(Array.isArray(value))return <ol className={field==='positions'?'library-positions':'library-values'}>{value.map((item,index)=><li key={index}>{field==='positions'&&<span className="position-number" aria-hidden="true">{String(index+1).padStart(2,'0')}</span>}<DetailValue value={item} field={field}/></li>)}</ol>;
  return <dl className="library-detail-object">{Object.entries(value).map(([key,item])=><div key={key}><dt lang="mn">{fieldLabels[key]||key.replaceAll('_',' ')}</dt><dd lang={key==='mongolian_candidate'?'mn':'en'}><DetailValue value={item} field={key}/></dd></div>)}</dl>;
}

export function EntryDetails({entry}:{entry:ResearchEntry}){
  const facts=entry.category==='tarot'?['deck_system','arcana','number','suit']:[];
  return <div className="library-details">{facts.length>0&&<dl className="library-card-facts">{facts.map(key=><div key={key} id={`detail-${key}`} data-detail-field={key}><dt>{fieldLabels[key]}</dt><dd lang="en"><DetailValue value={entry.details[key]} field={key}/></dd></div>)}</dl>}{Object.entries(entry.details).filter(([key])=>!facts.includes(key)).map(([key,value])=><section key={key} id={`detail-${key}`} data-detail-field={key} className={key==='original_interpretation'?'library-original-section':''}><h2>{fieldLabels[key]||key.replaceAll('_',' ')}</h2><div lang={key==='mongolian_candidate'?'mn':'en'}><DetailValue value={value} field={key}/></div></section>)}</div>;
}
