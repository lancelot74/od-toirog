import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Workspace } from '@/components/workspace';
import { LibraryNav,LibraryBreadcrumb,EntryLink } from '@/components/library/chrome';
import { sources,sourceById,citationsFor } from '@/lib/library/server';
import { sourceKindLabels } from '@/lib/library/config';

export const dynamicParams=false;
export function generateStaticParams(){return sources.map(s=>({id:s.id}));}
export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{const source=sourceById((await params).id);return {title:`${source?.title||'Эх сурвалж'} | Од Тойрог`,description:source?.supports};}
export default async function SourcePage({params}:{params:Promise<{id:string}>}){
  const source=sourceById((await params).id);if(!source)notFound();const cited=citationsFor(source.id);
  return <Workspace privatePage={false}><LibraryNav/><LibraryBreadcrumb items={[{href:'/library/sources',label:'Эх сурвалж'},{label:source.title}]}/><article className="library-source-page"><p className="eyebrow">{sourceKindLabels[source.kind]||source.kind}</p><h1 lang="en">{source.title}</h1><p className="entry-lede" lang="en">{source.author}</p><a className="button outline" href={source.url} target="_blank" rel="noreferrer">Эх хуудсыг нээх ↗</a><dl className="library-source-meta"><dt>Судалсан огноо</dt><dd>{source.accessed}</dd><dt>Хяналтын төлөв</dt><dd lang="en">{source.review_status}</dd><dt>Бүтээлийн бүлэг</dt><dd><Link href={`/library/sources#${source.independent_work_id}`}>{source.independent_work_id}</Link></dd><dt>Эхийн ID / төрөл</dt><dd><code>{source.id} · {source.kind}</code></dd><dt>URL</dt><dd><a href={source.url} target="_blank" rel="noreferrer">{source.url}</a></dd></dl><section><h2>Юуг дэмждэг вэ?</h2><p lang="en">{source.supports}</p></section><section><h2>Хамрах хүрээний хязгаар</h2><p lang="en">{source.limitations}</p></section></article><section className="library-collection-preview"><h2>Энэ эхийг ашигласан тэмдэглэлүүд ({cited.length})</h2><div className="library-entry-grid">{cited.map(entry=><EntryLink key={entry.id} entry={entry}/>)}</div></section></Workspace>;
}
