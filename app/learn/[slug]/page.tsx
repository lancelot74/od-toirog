import { notFound } from 'next/navigation';
import Link from 'next/link';
import { articles } from '@/lib/education';
import { Workspace } from '@/components/workspace';
export function generateStaticParams(){return articles.map(a=>({slug:a.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const article=articles.find(a=>a.slug===slug);return {title:`${article?.title||'Мэдлэг'} | Од Тойрог`,description:article?.body};}
export default async function Article({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const article=articles.find(a=>a.slug===slug);if(!article)notFound();return <Workspace privatePage={false}><Link href="/learn">← Мэдлэг</Link><h1>{article.title}</h1><p>{article.body}</p><p className="status">Тэнгэрийн байрлалыг тооцоолж болно. Хувь хүний тухай утга нь бэлгэдлийн тайлал бөгөөд шинжлэх ухааны таамаглал биш.</p><Link href="/onboarding" className="button primary">Натал зургаа нээх</Link></Workspace>;}
