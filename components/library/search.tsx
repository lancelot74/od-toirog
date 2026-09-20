"use client";
import { useEffect,useMemo,useState } from 'react';
import { asset } from '@/lib/paths';
import { collections,sourceKindLabels,useLabels } from '@/lib/library/config';
import type { SearchIndex } from '@/lib/library/types';
import { EntryLink } from './chrome';
import { SourceLink } from './source';

const normalize=(value:string)=>value.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase();
const pageSize=24;
type Filters={q:string;category:string;locale:string;use:string;kind:string;mode:'entries'|'sources';page:number};
const defaults:Filters={q:'',category:'all',locale:'all',use:'all',kind:'all',mode:'entries',page:1};

export function LibrarySearch(){
  const [index,setIndex]=useState<SearchIndex|null>(null),[filters,setFilters]=useState(defaults),[error,setError]=useState(''),[retry,setRetry]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();
    fetch(asset('/assets/library/search-index.json'),{signal:controller.signal}).then(response=>{
      if(!response.ok)throw new Error('index unavailable');return response.json() as Promise<SearchIndex>;
    }).then(data=>{
      const query=new URLSearchParams(location.search);
      setFilters({q:(query.get('q')||'').slice(0,200),category:Object.hasOwn(collections,query.get('category')||'')?query.get('category')!:'all',locale:['en','mn-draft'].includes(query.get('locale')||'')?query.get('locale')!:'all',use:Object.hasOwn(useLabels,query.get('use')||'')?query.get('use')!:'all',kind:Object.hasOwn(sourceKindLabels,query.get('kind')||'')?query.get('kind')!:'all',mode:query.get('mode')==='sources'?'sources':'entries',page:Math.max(1,Number.parseInt(query.get('page')||'1',10)||1)});
      setIndex(data);setError('');
    }).catch(()=>{if(!controller.signal.aborted)setError('Хайлтын өгөгдлийг ачаалж чадсангүй. Дахин оролдоно уу.');});
    return()=>controller.abort();
  },[retry]);
  const prepared=useMemo(()=>index?{entries:index.entries.map(e=>({...e,normalized:normalize(e.search_text)})),sources:index.sources.map(s=>({...s,normalized:normalize(s.search_text)}))}:null,[index]);
  const tokens=normalize(filters.q).trim().split(/\s+/).filter(Boolean);
  const matchingEntries=(prepared?.entries||[]).filter(e=>(filters.category==='all'||e.category===filters.category)&&(filters.locale==='all'||e.locale===filters.locale)&&(filters.use==='all'||e.product_use===filters.use)&&tokens.every(t=>e.normalized.includes(t)));
  const matchingSources=(prepared?.sources||[]).filter(s=>(filters.kind==='all'||s.kind===filters.kind)&&tokens.every(t=>s.normalized.includes(t)));
  const count=filters.mode==='entries'?matchingEntries.length:matchingSources.length;
  const pages=Math.max(1,Math.ceil(count/pageSize)),page=Math.min(filters.page,pages),offset=(page-1)*pageSize;
  function update(change:Partial<Filters>){
    const next={...filters,...change,page:change.page??1};setFilters(next);
    const params=new URLSearchParams();
    for(const key of ['q','category','locale','use','kind','mode','page'] as const){if(next[key]!==defaults[key])params.set(key,String(next[key]));}
    history.replaceState(null,'',`${location.pathname}${params.size?'?'+params.toString():''}`);
  }
  return <section className="library-search">
    <fieldset disabled={!index}><legend className="sr-only">Хайлтын шүүлтүүрүүд</legend><label className="library-query" htmlFor="library-query">Үг, ойлголт, хөзөр эсвэл зохиогч<input id="library-query" type="search" maxLength={200} value={filters.q} onChange={e=>update({q:e.target.value})} placeholder="Жишээ: lantern, Sophia, Сар"/></label><div className="library-filters">
      <div><label htmlFor="library-mode">Хайх хүрээ</label><select id="library-mode" value={filters.mode} onChange={e=>update({mode:e.target.value==='sources'?'sources':'entries'})}><option value="entries">Тэмдэглэлүүд</option><option value="sources">Эх сурвалжууд</option></select></div>
      {filters.mode==='entries'?<><div><label htmlFor="library-category">Цуглуулга</label><select id="library-category" value={filters.category} onChange={e=>update({category:e.target.value})}><option value="all">Бүх цуглуулга</option>{Object.entries(collections).map(([key,value])=><option key={key} value={key}>{value.title}</option>)}</select></div><div><label htmlFor="library-locale">Эхийн хэл</label><select id="library-locale" value={filters.locale} onChange={e=>update({locale:e.target.value})}><option value="all">Бүх хэл</option><option value="en">Англи эх</option><option value="mn-draft">Монгол ноорог</option></select></div><div><label htmlFor="library-use">Материалын төлөв</label><select id="library-use" value={filters.use} onChange={e=>update({use:e.target.value})}><option value="all">Бүх төлөв</option>{Object.entries(useLabels).map(([key,value])=><option key={key} value={key}>{value}</option>)}</select></div></>:<div><label htmlFor="library-kind">Эхийн төрөл</label><select id="library-kind" value={filters.kind} onChange={e=>update({kind:e.target.value})}><option value="all">Бүх төрөл</option>{Object.entries(sourceKindLabels).map(([key,value])=><option key={key} value={key}>{value}</option>)}</select></div>}
      <button className="button outline" type="button" onClick={()=>update(defaults)}>Шүүлтүүр цэвэрлэх</button>
    </div></fieldset>
    {error?<div className="error" role="alert"><p>{error}</p><button className="button outline" onClick={()=>{setError('');setRetry(retry+1);}}>Дахин оролдох</button></div>:!index?<p role="status">Номын сангийн индексийг ачаалж байна…</p>:<><p className="library-result-count" role="status" aria-live="polite">{count} үр дүн · Хуудас {page} / {pages}</p>{count===0?<div className="library-empty"><h2>Тохирох бичлэг олдсонгүй.</h2><p>Илүү ерөнхий үгээр хайх эсвэл шүүлтүүрээ цэвэрлээрэй.</p></div>:<><div className="library-entry-grid" data-search-results>{filters.mode==='entries'?matchingEntries.slice(offset,offset+pageSize).map(entry=><EntryLink key={entry.id} entry={entry}/>):matchingSources.slice(offset,offset+pageSize).map(source=><SourceLink key={source.id} source={source}/>)}</div><nav className="library-pagination" aria-label="Хайлтын хуудас"><button className="button outline" disabled={page===1} onClick={()=>update({page:page-1})}>Өмнөх хуудас</button><span>{page} / {pages}</span><button className="button outline" disabled={page===pages} onClick={()=>update({page:page+1})}>Дараах хуудас</button></nav></>}</>}
    <noscript>Хайлт JavaScript шаарддаг. Цуглуулгын жагсаалтууд болон тэмдэглэл бүрийн хуудсыг шууд нээж болно.</noscript>
  </section>;
}
