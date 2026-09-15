import Link from 'next/link';
import Image from 'next/image';
import { mn } from '@/lib/mn';
import { zodiacSlugs, zodiacArt } from '@/lib/astro-assets';
import { AstroSymbol } from './astro-symbol';

export function ZodiacLink({index}:{index:number}){
  if(!zodiacSlugs[index])return null;
  return <Link className="symbol-label zodiac-inline-link" href={`/zodiac/${zodiacSlugs[index]}`}><AstroSymbol kind="zodiac" index={index} size={26}/>{mn.signs[index]}</Link>;
}
export function ZodiacPortrait({index}:{index:number}){
  if(!zodiacSlugs[index])return null;
  return <Link className="zodiac-portrait" href={`/zodiac/${zodiacSlugs[index]}`}><Image src={zodiacArt(index,true)} width={640} height={400} alt={`${mn.signs[index]} ордын алтан сийлбэр`} sizes="(max-width: 900px) 90vw, 400px"/><span><AstroSymbol kind="zodiac" index={index}/>{mn.signs[index]} ордыг судлах <span aria-hidden="true">→</span></span></Link>;
}
