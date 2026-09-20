import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Workspace } from '@/components/workspace';
import { LibraryNav,LibraryBreadcrumb,EntryLink } from '@/components/library/chrome';
import { sections,collections } from '@/lib/library/config';
import { entriesFor,libraryMetadata } from '@/lib/library/server';

export const dynamicParams=false;
export function generateStaticParams(){return sections.map(s=>({section:s.slug}));}
export async function generateMetadata({params}:{params:Promise<{section:string}>}):Promise<Metadata>{const {section:slug}=await params;const section=sections.find(s=>s.slug===slug);return {title:`${section?.title||'Номын сан'} | Од Тойрог`,description:section?.description};}
export default async function Section({params}:{params:Promise<{section:string}>}){
  const {section:slug}=await params;const section=sections.find(s=>s.slug===slug);if(!section)notFound();
  return <Workspace privatePage={false}><LibraryNav/><LibraryBreadcrumb items={[{label:section.title}]}/><header className="library-heading"><span className="library-roman">{section.number}</span><p className="eyebrow">{section.subtitle}</p><h1>{section.title}</h1><p>{section.description}</p><p className="muted">{section.categories.reduce((n,c)=>n+libraryMetadata.counts[c],0)} тэмдэглэл · {section.categories.length} цуглуулга</p></header>
    <nav className="library-collection-nav" aria-label="Бүлгийн цуглуулгууд">{section.categories.map(category=><Link href={`/library/collections/${category}`} key={category}>{collections[category].title} <span>{libraryMetadata.counts[category]}</span></Link>)}</nav>
    {section.categories.map(category=><section className="library-collection-preview" key={category}><div className="library-section-heading"><div><p className="eyebrow">{collections[category].english}</p><h2>{collections[category].title}</h2></div><Link href={`/library/collections/${category}`}>Бүгдийг үзэх ({libraryMetadata.counts[category]}) →</Link></div><p>{collections[category].description}</p><div className="library-entry-grid">{entriesFor(category).slice(0,6).map(entry=><EntryLink key={entry.id} entry={entry}/>)}</div></section>)}
    <Link className="button outline" href="/library">Бүх бүлэг рүү буцах</Link></Workspace>;
}
