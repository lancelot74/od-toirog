import Link from 'next/link';
import { Workspace } from '@/components/workspace';
import { articles } from '@/lib/education';
export default function Learn(){return <Workspace privatePage={false}><p className="eyebrow">ТЭНГЭРИЙН ХЭЛ</p><h1>Зургаа уншиж сурах.</h1><p>Тооцоо ба тайлбарын ялгааг ойлгохоос эхэлнэ.</p>{articles.map((a,i)=><article className="reading-block" key={a.slug}><span className="eyebrow">{String(i+1).padStart(2,'0')}</span><h2><Link href={`/learn/${a.slug}`}>{a.title} →</Link></h2><p>{a.body.slice(0,100)}…</p></article>)}</Workspace>;}
