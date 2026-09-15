import { asset } from './paths';

// Ordering matches the backend's sign and planet IDs, not download order.
export const zodiacSlugs = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces'] as const;
export const planetSlugs = ['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'] as const;
export type ZodiacSlug = typeof zodiacSlugs[number];
export function symbolHref(kind:'zodiac'|'planet', index:number){
  const slug=(kind==='zodiac'?zodiacSlugs:planetSlugs)[index];
  return slug ? `${asset(`/assets/sprites/${kind}.svg`)}#ot-${slug}` : undefined;
}
export function zodiacArt(index:number, thumbnail=false){
  return asset(`/assets/zodiac/${zodiacSlugs[index]}${thumbnail?'-thumb':''}.webp`);
}
