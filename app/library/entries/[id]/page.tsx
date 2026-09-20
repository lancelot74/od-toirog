import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Workspace } from '@/components/workspace';
import { LibraryNav,LibraryBreadcrumb,EntryBadges,EntryLink } from '@/components/library/chrome';
import { EntryDetails } from '@/components/library/details';
import { DownloadEntry } from '@/components/library/download-entry';
import { collections,sectionFor,evidenceLabels,fieldLabels } from '@/lib/library/config';
import { entries,entryById,entriesFor,sourceById,libraryMetadata } from '@/lib/library/server';

export const dynamicParams=false;
export function generateStaticParams(){return entries.map(e=>({id:e.id}));}
export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{const entry=entryById((await params).id);return {title:`${entry?.title||'Тэмдэглэл'} | Од Тойрог`,description:entry?.summary.slice(0,180)};}
export default async function EntryPage({params}:{params:Promise<{id:string}>}){
  const entry=entryById((await params).id);if(!entry)notFound();
  const section=sectionFor(entry.category),collection=collections[entry.category],siblings=entriesFor(entry.category),index=siblings.findIndex(e=>e.id===entry.id);
  const sourceIds=new Set(entry.source_refs.map(r=>r.source_id));
  const related=entries.filter(e=>e.id!==entry.id&&e.source_refs.some(r=>sourceIds.has(r.source_id))).slice(0,4);
  const bodyDuplicatesSummary=entry.details.text===entry.summary;
  return <Workspace privatePage={false}><LibraryNav/><LibraryBreadcrumb items={[{href:`/library/${section.slug}`,label:section.title},{href:`/library/collections/${entry.category}`,label:collection.title},{label:entry.title}]}/>
    <article className="library-article" data-entry-id={entry.id}>
      <header className="library-heading"><EntryBadges entry={entry}/><h1 lang="en">{entry.title}</h1>{!bodyDuplicatesSummary&&<p className="entry-lede" lang={entry.locale==='mn-draft'?'mn':'en'}>{entry.summary}</p>}<p className="muted">{evidenceLabels[entry.evidence_status]||entry.evidence_status} · v{entry.version} · {libraryMetadata.researched_at}</p></header>
      {entry.product_use==='review_required'&&<aside className="library-draft-note"><strong>Монгол нэршлийн ноорог</strong><p>Эх багцад редакторын хяналт шаардлагатай гэж тэмдэглэсэн хувилбар. Батлагдсан орчуулга эсвэл уламжлалт ариун нэршил гэж үзэхгүй.</p></aside>}
      <div className="library-article-layout"><aside className="library-toc"><p className="eyebrow">ЭНЭ ТЭМДЭГЛЭЛД</p>{Object.keys(entry.details).map(key=><a key={key} href={`#detail-${key}`}>{fieldLabels[key]||key.replaceAll('_',' ')}</a>)}<a href="#citations">Эх сурвалж ба хүрээ</a></aside><div>
        <EntryDetails entry={entry}/>
        <section className="library-citations" id="citations"><h2>Эх сурвалж ба хүрээ</h2>{entry.source_refs.length?entry.source_refs.map(ref=>{const source=sourceById(ref.source_id)!;return <article key={source.id}><h3><Link href={`/library/sources/${source.id}`} lang="en">{source.title} →</Link></h3><p lang="en">{source.author}</p><h4>Энэ бичлэгт юуг дэмждэг вэ?</h4><p lang="en">{ref.scope}</p><a href={source.url} target="_blank" rel="noreferrer">Эх хуудсыг нээх ↗</a></article>;}):<p>Энэ нь шинээр бичсэн редакцын материал эсвэл нэршлийн ноорог. Эх багцад түүхэн эхийн эшлэл холбогоогүй.</p>}</section>
        <section className="library-record-meta"><h2>Бичлэгийн мэдээлэл</h2><dl><dt>Уламжлал / хүрээ</dt><dd lang="en">{entry.traditions.join(' · ')}</dd><dt>Түлхүүр үгс</dt><dd className="library-tags">{entry.tags.map(tag=><Link key={tag} href={`/library/search?q=${encodeURIComponent(tag)}`} lang="en">{tag}</Link>)}</dd><dt>Эхийн төлөв</dt><dd><code>{entry.evidence_status}</code></dd><dt>Хэл / ID</dt><dd><code>{entry.locale} · {entry.id}</code></dd></dl><DownloadEntry entry={entry}/></section>
      </div></div>
    </article>
    <nav className="library-record-nav" aria-label="Тэмдэглэл хооронд шилжих"><div>{index>0&&<Link href={`/library/entries/${siblings[index-1].id}`}><small>← Өмнөх</small><span lang="en">{siblings[index-1].title}</span></Link>}</div><Link href={`/library/collections/${entry.category}`}>Жагсаалт</Link><div>{index<siblings.length-1&&<Link href={`/library/entries/${siblings[index+1].id}`}><small>Дараах →</small><span lang="en">{siblings[index+1].title}</span></Link>}</div></nav>
    {related.length>0&&<section className="library-collection-preview"><h2>Ижил эхтэй бусад тэмдэглэл</h2><p className="muted">Нийтлэг эшлэлээр холбогдсон бичлэгүүд.</p><div className="library-entry-grid">{related.map(e=><EntryLink key={e.id} entry={e}/>)}</div></section>}
  </Workspace>;
}
