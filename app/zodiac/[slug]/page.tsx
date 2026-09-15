import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Workspace } from '@/components/workspace';
import { AstroSymbol } from '@/components/astro-symbol';
import { ZodiacGallery } from '@/components/zodiac-gallery';
import { zodiacGuide,zodiacGuides } from '@/lib/zodiac';
import { zodiacArt } from '@/lib/astro-assets';
import { mn } from '@/lib/mn';

export const dynamicParams=false;
export function generateStaticParams(){return zodiacGuides.map(({slug})=>({slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const sign=zodiacGuide((await params).slug);
  if(!sign)return {title:'Орд олдсонгүй | Од Тойрог'};
  return {title:`${sign.name} — ${sign.subtitle} | Од Тойрог`,description:sign.summary,
    openGraph:{title:`${sign.name} | Од Тойрог`,description:sign.summary,images:[{url:zodiacArt(sign.index),width:1600,height:1000,alt:sign.alt}]}};
}

export default async function ZodiacPage({params}:{params:Promise<{slug:string}>}){
  const sign=zodiacGuide((await params).slug);if(!sign)notFound();
  const previous=zodiacGuides[(sign.index+11)%12],next=zodiacGuides[(sign.index+1)%12];
  return <Workspace privatePage={false}>
    <nav className="zodiac-breadcrumb" aria-label="Хуудасны зам"><Link href="/learn">Мэдлэг</Link><span aria-hidden="true">/</span><Link href="/zodiac">Арван хоёр орд</Link><span aria-hidden="true">/</span><span aria-current="page">{sign.name}</span></nav>
    <article>
      <header className="zodiac-hero">
        <Image src={zodiacArt(sign.index)} alt={sign.alt} fill priority sizes="(max-width: 900px) 100vw, 1100px"/>
        <div className="zodiac-hero-copy"><p className="eyebrow">{String(sign.index+1).padStart(2,'0')} / 12 · {sign.slug.toUpperCase()}</p><AstroSymbol kind="zodiac" index={sign.index} size={64}/><h1>{sign.name}</h1><p>{sign.subtitle}</p></div>
      </header>
      <dl className="zodiac-facts"><div><dt>Элемент</dt><dd>{sign.element}</dd></div><div><dt>Хэмнэл</dt><dd>{sign.modality}</dd></div><div><dt>Удирдагч гариг</dt><dd>{sign.rulers.map(id=><span className="symbol-label" key={id}><AstroSymbol kind="planet" index={id} size={26}/>{mn.planets[id]}</span>)}</dd></div><div><dt>Нарны орд · ойролцоогоор</dt><dd>{sign.dates}</dd></div></dl>
      <p className="zodiac-date-note">Огнооны зааг нь жил, цагийн бүсээс хамаарч өөрчлөгдөж болно. Нарны ордыг яг төрсөн мөчөөр тооцоолно.{sign.rulerNote&&` ${sign.rulerNote}`}</p>
      <div className="zodiac-editorial"><aside><p className="eyebrow">ЭНЭ ОРДЫН ТУХАЙ</p><a href="#meaning">Бэлгэдэл</a><a href="#strengths">Давуу тал ба сорилт</a><a href="#relationships">Харилцаа ба ажил</a><a href="#placements">Таны зурагт</a></aside><div>
        <section id="meaning"><p className="eyebrow">I · БЭЛГЭДЭЛ</p><h2>{sign.summary}</h2><p>{sign.overview}</p></section>
        <section id="strengths"><p className="eyebrow">II · ХОЁР ТАЛ</p><h2>Дэмжих чанар ба анхаарах зүйл.</h2><ul className="zodiac-strengths">{sign.strengths.map((s,i)=><li key={s}><span>{String(i+1).padStart(2,'0')}</span>{s}</li>)}</ul><p>{sign.challenge}</p></section>
        <section id="relationships"><p className="eyebrow">III · ӨДӨР ТУТМЫН ХЭЛ</p><h2>Харилцаанд</h2><p>{sign.relationships}</p><h3>Ажил, бүтээлд</h3><p>{sign.work}</p></section>
        <section id="placements"><p className="eyebrow">IV · ТАНЫ ЗУРАГТ</p><h2>Нэг орд, өөр өөр үүрэг.</h2><p>Аль гариг эсвэл цэг энэ ордод байгаагаас тайлбарын сэдэв өөрчлөгдөнө. Бусад байрлал, ордон, холбоосыг хамтад нь уншина.</p>{[[0,'Нар',sign.sun],[1,'Сар',sign.moon],[-1,'Асцендент',sign.ascendant]].map(([id,name,body])=><div className="zodiac-placement" key={String(name)}>{Number(id)>=0?<AstroSymbol kind="planet" index={Number(id)} size={44}/>:<AstroSymbol kind="zodiac" index={sign.index} size={44}/>}<div><h3>{name} — {sign.name}</h3><p>{body}</p></div></div>)}<Link className="button outline" href="/chart">Өөрийн зураг дээрээс харах →</Link></section>
        <section className="zodiac-reflection"><p className="eyebrow">ӨӨРТӨӨ ТАВИХ АСУУЛТ</p><blockquote>{sign.question}</blockquote></section>
        <p className="zodiac-context">Энэ хуудас нь ордын тухай ерөнхий, бэлгэдлийн тайлбар. Таны тухай баттай дүгнэлт, ирээдүйн зөгнөл эсвэл хувийн натал тайлал биш.</p>
      </div></div>
    </article>
    <nav className="zodiac-neighbours" aria-label="Өмнөх ба дараагийн орд"><Link href={`/zodiac/${previous.slug}`}><span>← Өмнөх орд</span><b>{previous.name}</b></Link><Link href="/zodiac">Бүх орд</Link><Link href={`/zodiac/${next.slug}`}><span>Дараагийн орд →</span><b>{next.name}</b></Link></nav>
    <section className="zodiac-related"><p className="eyebrow">ИЖИЛ ЭЛЕМЕНТ · {sign.element.toUpperCase()}</p><h2>Ижил үндэс, өөр хэмнэл.</h2><ZodiacGallery indices={zodiacGuides.filter(s=>s.element===sign.element&&s.index!==sign.index).map(s=>s.index)}/></section>
  </Workspace>;
}
