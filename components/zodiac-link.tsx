import Link from 'next/link';
import { mn } from '@/lib/mn';
import { zodiacSlugs } from '@/lib/astro-assets';
import { ZodiacArtwork } from './zodiac-artwork';

export function ZodiacLink({index}:{index:number}){
  if(!zodiacSlugs[index])return null;
  return <Link className="zodiac-inline-link" href={`/zodiac/${zodiacSlugs[index]}`}>{mn.signs[index]}</Link>;
}
export function ZodiacPortrait({index}:{index:number}){
  if(!zodiacSlugs[index])return null;
  return <Link className="zodiac-portrait" href={`/zodiac/${zodiacSlugs[index]}`}><ZodiacArtwork index={index} preview alt={`${mn.signs[index]} ордын алтан сийлбэр`} mobileSizes="(max-width: 900px) 90vw, 400px"/><span>{mn.signs[index]} ордыг судлах <span aria-hidden="true">→</span></span></Link>;
}
