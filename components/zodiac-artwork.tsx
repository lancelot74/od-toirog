import { zodiacArt,zodiacSlugs } from '@/lib/astro-assets';
import { asset } from '@/lib/paths';

export function ZodiacArtwork({index,alt,preview=false,priority=false,mobileSizes='100vw'}:{index:number;alt:string;preview?:boolean;priority?:boolean;mobileSizes?:string}){
  const slug=zodiacSlugs[index];
  return <picture className="zodiac-artwork">
    <source media="(max-width: 900px)" width={1024} height={1536} sizes={mobileSizes} srcSet={[384,768,1024].map(width=>`${asset(`/assets/zodiac/mobile/${slug}-${width}.webp`)} ${width}w`).join(', ')}/>
    <img src={zodiacArt(index,preview)} width={preview?640:1600} height={preview?400:1000} alt={alt} loading={priority?'eager':'lazy'} fetchPriority={priority?'high':undefined} decoding="async"/>
  </picture>;
}
