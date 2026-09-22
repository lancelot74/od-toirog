import Link from 'next/link';
import { zodiacGuides } from '@/lib/zodiac';
import { ZodiacArtwork } from './zodiac-artwork';

export function ZodiacGallery({indices}: {indices?:number[]}){
  const signs=indices?zodiacGuides.filter(s=>indices.includes(s.index)):zodiacGuides;
  return <div className="zodiac-gallery">{signs.map(sign=><Link className="zodiac-tile" href={`/zodiac/${sign.slug}`} key={sign.slug}>
    <div className="zodiac-tile-art"><ZodiacArtwork index={sign.index} alt={sign.alt} preview mobileSizes="(max-width: 900px) 45vw, 30vw"/>
    <div className="zodiac-tile-title"><h3>{sign.name}</h3><span aria-hidden="true">↗</span></div></div>
    <p>{sign.subtitle}</p><small>{sign.element} · {sign.modality}</small>
  </Link>)}</div>;
}
