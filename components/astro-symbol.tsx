import { symbolHref } from '@/lib/astro-assets';

export function AstroSymbol({kind,index,size=32,label}:{kind:'zodiac'|'planet';index:number;size?:number;label?:string}){
  const href=symbolHref(kind,index);
  if(!href)return null;
  return <svg className="astro-symbol" width={size} height={size} viewBox="0 0 64 64" role={label?'img':undefined} aria-label={label} aria-hidden={label?undefined:true} focusable="false"><use href={href}/></svg>;
}
