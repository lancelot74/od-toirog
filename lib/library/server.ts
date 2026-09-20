// Server/build-time data only: client search fetches a separate compact index.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ResearchEntry, ResearchSource, LibraryMetadata } from './types';
import type { Category } from './config';

const root=join(process.cwd(),'content/research');
export const entries:ResearchEntry[]=JSON.parse(readFileSync(join(root,'data/catalog.json'),'utf8'));
export const sources:ResearchSource[]=JSON.parse(readFileSync(join(root,'data/sources.json'),'utf8'));
export const libraryMetadata:LibraryMetadata=JSON.parse(readFileSync(join(root,'data/metadata.json'),'utf8'));
export const importMetadata:{archive:string;archive_sha256:string;manifest_files_verified:number}=JSON.parse(readFileSync(join(root,'IMPORT.json'),'utf8'));
const entryMap=new Map(entries.map(e=>[e.id,e]));
const sourceMap=new Map(sources.map(s=>[s.id,s]));
export const entryById=(id:string)=>entryMap.get(id);
export const sourceById=(id:string)=>sourceMap.get(id);
export const entriesFor=(category:Category)=>entries.filter(e=>e.category===category);
export const citationsFor=(sourceId:string)=>entries.filter(e=>e.source_refs.some(r=>r.source_id===sourceId));
export const sourceGroups=Array.from(new Set(sources.map(s=>s.independent_work_id))).map(id=>({id,title:id==='agrippa-occult-philosophy'?'Three Books of Occult Philosophy':id==='waite-pictorial-key'?'The Pictorial Key to the Tarot':sources.find(s=>s.independent_work_id===id)!.title,sources:sources.filter(s=>s.independent_work_id===id)}));

export function referencedEntry(field:string,value:string){
  if(entryMap.has(value))return entryMap.get(value);
  if(field==='spread_title')return entries.find(e=>e.category==='spread'&&e.title===value);
  if(field==='reference_card'){
    const normalize=(s:string)=>s.replace(/^The\s+/i,'').toLowerCase();
    return entries.find(e=>e.category==='tarot'&&normalize(e.title)===normalize(value));
  }
}

export const documents={
  research:{title:'Судалгааны тайлан',file:'docs/research-report.md'},
  integration:{title:'Өгөгдөл холбох заавар',file:'docs/integration.md'},
  validation:{title:'Шалгалт ба редакцын төлөв',file:'docs/validation.md'},
  readme:{title:'Эх багцын танилцуулга',file:'README.md'},
} as const;
export function documentText(id:keyof typeof documents){return readFileSync(join(root,documents[id].file),'utf8');}
