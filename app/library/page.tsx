import type { Metadata } from 'next';
import Link from 'next/link';
import { Workspace } from '@/components/workspace';
import { LibraryNav } from '@/components/library/chrome';
import { sections,collections } from '@/lib/library/config';
import { libraryMetadata } from '@/lib/library/server';

export const metadata:Metadata={title:'Бэлгэдэл, уламжлалын номын сан | Од Тойрог',description:'518 тэмдэглэл: таро, нэр томьёо, уламжлал, бэлгэдэл, тайлах арга, найруулга, монгол нэршлийн ноорог.'};
export default function Library(){return <Workspace privatePage={false}>
  <LibraryNav/>
  <header className="library-cover"><div><p className="eyebrow">ОД ТОЙРОГ · СУДАЛГААНЫ САН · VOL. I</p><h1>Бэлгэдэл бүрийн цаана<br/><em>нэгэн түүх бий.</em></h1><p>Түүх, нэр томьёо, хөзрийн дүрслэл, эргэцүүлэх асуултууд. Утгыг нь уншаад, эх сурвалжийг нь нээгээд, өөрийн өнцгийг ол.</p><Link className="button primary" href="/library/search">Номын сангаас хайх →</Link></div><div className="library-volume" aria-label={`${libraryMetadata.entry_count} тэмдэглэл`}><span>СУДАЛГААНЫ ТЭМДЭГЛЭЛ</span><strong>{libraryMetadata.entry_count}</strong><span>VI БҮЛЭГ · XI ЦУГЛУУЛГА</span></div></header>
  <div className="library-edition"><span>Судалгааны хувилбар {libraryMetadata.version} · {libraryMetadata.researched_at}</span><Link href="/library/sources">{libraryMetadata.source_pages} эхийн хуудас · {libraryMetadata.grouped_source_works} бүтээл →</Link></div>
  <section aria-labelledby="library-chapters"><p className="eyebrow">АГУУЛГЫН ЗУРАГ</p><h2 id="library-chapters">Зургаан хаалгаар нэвтрэх нь.</h2><div className="library-chapters">{sections.map(section=><article key={section.slug}><span className="chapter-number">{section.number}</span><div><p className="eyebrow">{section.subtitle}</p><h3><Link href={`/library/${section.slug}`}>{section.title} →</Link></h3><p>{section.description}</p><small>{section.categories.reduce((n,c)=>n+libraryMetadata.counts[c],0)} тэмдэглэл · {section.categories.map(c=>collections[c].title).join(' / ')}</small></div></article>)}</div></section>
  <section className="library-start"><div><p className="eyebrow">ХААНААС ЭХЛЭХ ВЭ?</p><h2>Нэг асуултаар<br/>номын сангаа нээ.</h2></div><ol><li><Link href="/library/entries/term-mysticism">Мистицизм гэж юу вэ?</Link><p>Ойлголт, уламжлалын ялгаанаас эхлэх.</p></li><li><Link href="/library/entries/tarot-the-fool">The Fool: аяллын эхлэл</Link><p>Дүрслэл, түүх, шинэ тайлбарыг зэрэгцүүлэн унших.</p></li><li><Link href="/library/entries/spread-daily-lantern">Daily lantern: гурван байрлал</Link><p>Асуултаа тодорхой бүтэцтэй болгох.</p></li></ol></section>
  <aside className="library-context"><h2>Эхийг хэрхэн унших вэ?</h2><p>Түүхэн тэмдэглэл, уламжлалын итгэл үнэмшил, шинээр бичсэн тайлбар өөр өөр шошготой. Эшлэл бүр яг юуг дэмжиж байгааг харуулна. Үндсэн эх бичвэр англи хэлээр; монгол нэршлийн 37 хувилбар ноорог төлөвтэй.</p><Link href="/library/about">Судалгааны хүрээ ба эх тайлан →</Link></aside>
  </Workspace>;}
