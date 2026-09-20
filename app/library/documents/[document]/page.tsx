import { notFound } from 'next/navigation';
import { Workspace } from '@/components/workspace';
import { LibraryNav,LibraryBreadcrumb } from '@/components/library/chrome';
import { LibraryMarkdown } from '@/components/library/markdown';
import { documents,documentText } from '@/lib/library/server';

export const dynamicParams=false;
export function generateStaticParams(){return ['integration','validation','readme'].map(document=>({document}));}
function findDocument(slug:string){return ['integration','validation','readme'].includes(slug)?slug as Exclude<keyof typeof documents,'research'>:null;}
export async function generateMetadata({params}:{params:Promise<{document:string}>}){const key=findDocument((await params).document);return {title:`${key?documents[key].title:'Баримт'} | Од Тойрог`};}
export default async function DocumentPage({params}:{params:Promise<{document:string}>}){const key=findDocument((await params).document);if(!key)notFound();return <Workspace privatePage={false}><LibraryNav/><LibraryBreadcrumb items={[{href:'/library/about',label:'Судалгааны тухай'},{label:documents[key].title}]}/><h1>{documents[key].title}</h1><p className="muted">Импортолсон багцын эх баримт · English · v1.0</p><LibraryMarkdown text={documentText(key)}/></Workspace>;}
