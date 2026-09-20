import type { Metadata } from 'next';
import Link from 'next/link';
import { Workspace } from '@/components/workspace';
import { LibraryNav,LibraryBreadcrumb } from '@/components/library/chrome';
import { SourceLink } from '@/components/library/source';
import { sourceGroups,libraryMetadata } from '@/lib/library/server';

export const metadata:Metadata={title:'Эх сурвалжийн бүртгэл | Од Тойрог',description:'117 эхийн хуудас, 33 бүтээл: зохиогч, эхийн төрөл, судалсан хүрээ, хязгаарлалтууд.'};
export default function Sources(){return <Workspace privatePage={false}><LibraryNav/><LibraryBreadcrumb items={[{label:'Эх сурвалж'}]}/><header className="library-heading"><p className="eyebrow">ЭШЛЭЛИЙН БҮРТГЭЛ</p><h1>Эх сурвалжийг нь нээ.</h1><p>{libraryMetadata.source_pages} холбоостой хуудас · {sourceGroups.length} бүтээл / лавлах өгүүлэл. Нэг номын олон бүлэг нь олон бие даасан эх сурвалж гэсэн үг биш.</p><p className="muted">Огноо нь судалсан өдрийг заана. Эх багцад холбогдох хэсгүүдийг уншсан гэж тэмдэглэсэн; бүтээл бүрийг бүрэн уншсан эсвэл холбоос одоо ажиллаж байгааг баталсан гэсэн утгагүй.</p><Link href="/library/search?mode=sources" className="button outline">Эх сурвалжаас хайх</Link></header>{sourceGroups.map(group=><details className="library-source-group" key={group.id} id={group.id}><summary><span lang="en">{group.title}</span><small>{group.sources.length} хуудас</small></summary><div className="library-entry-grid">{group.sources.map(source=><SourceLink key={source.id} source={source}/>)}</div></details>)}</Workspace>;}
