import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Workspace } from '@/components/workspace';
import { LibraryNav,LibraryBreadcrumb,EntryLink } from '@/components/library/chrome';
import { collections,sectionFor,type Category } from '@/lib/library/config';
import { entriesFor } from '@/lib/library/server';

export const dynamicParams=false;
export function generateStaticParams(){return Object.keys(collections).map(category=>({category}));}
function collection(slug:string){return Object.hasOwn(collections,slug)?slug as Category:null;}
export async function generateMetadata({params}:{params:Promise<{category:string}>}):Promise<Metadata>{const category=collection((await params).category);return {title:`${category?collections[category].title:'Цуглуулга'} | Од Тойрог`,description:category?collections[category].description:undefined};}
export default async function Collection({params}:{params:Promise<{category:string}>}){
  const category=collection((await params).category);if(!category)notFound();const info=collections[category],section=sectionFor(category),records=entriesFor(category);
  const groups=category==='tarot'?[{id:'major',title:'Их аркан · Major Arcana',records:records.filter(e=>e.details.arcana==='major')},...['Wands','Cups','Swords','Pentacles'].map(suit=>({id:suit.toLowerCase(),title:`Бага аркан · ${suit}`,records:records.filter(e=>e.details.suit===suit)}))]:[{id:'entries',title:info.title,records}];
  return <Workspace privatePage={false}><LibraryNav/><LibraryBreadcrumb items={[{href:`/library/${section.slug}`,label:section.title},{label:info.title}]}/><header className="library-heading"><p className="eyebrow">{info.english}</p><h1>{info.title}</h1><p>{info.description}</p><div className="library-section-heading"><span>{records.length} тэмдэглэл</span><Link href={`/library/search?category=${category}`}>Энэ цуглуулгаас хайх →</Link></div></header>
    {category==='tarot'&&<><nav className="library-collection-nav" aria-label="Хөзрийн бүлгүүд">{groups.map(g=><a key={g.id} href={`#${g.id}`}>{g.title} <span>{g.records.length}</span></a>)}</nav><p className="library-context">RWS: Strength VIII, Justice XI. Бага арканы Page–King нь өгөгдөлд 11–14 эрэмбэтэй; энэ нь хөзөр дээр хэвлэгдсэн дугаар гэсэн үг биш.</p></>}
    {groups.map(group=><section className="library-collection-preview" id={group.id} key={group.id}><h2>{group.title} <small>({group.records.length})</small></h2><div className="library-entry-grid">{group.records.map(entry=><EntryLink key={entry.id} entry={entry}/>)}</div></section>)}
  </Workspace>;
}
