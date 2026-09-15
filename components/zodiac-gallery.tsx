import Image from 'next/image';
import Link from 'next/link';
import { zodiacGuides } from '@/lib/zodiac';
import { zodiacArt } from '@/lib/astro-assets';

export function ZodiacGallery({indices}: {indices?:number[]}){
  const signs=indices?zodiacGuides.filter(s=>indices.includes(s.index)):zodiacGuides;
  return <div className="zodiac-gallery">{signs.map(sign=><Link className="zodiac-tile" href={`/zodiac/${sign.slug}`} key={sign.slug}>
    <Image src={zodiacArt(sign.index,true)} width={640} height={400} alt={sign.alt} sizes="(max-width: 600px) 100vw, (max-width: 1100px) 45vw, 30vw"/>
    <div className="zodiac-tile-title"><h3>{sign.name}</h3><span aria-hidden="true">↗</span></div>
    <p>{sign.subtitle}</p><small>{sign.element} · {sign.modality}</small>
  </Link>)}</div>;
}
