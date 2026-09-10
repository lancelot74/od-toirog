import Link from 'next/link';
export function MobileNavigation(){
  const links=[['/today','Өнөөдөр'],['/chart','Зураг'],['/compatibility','Хослол'],['/profile','Профайл']];
  return <nav className="mobile-nav" aria-label="Гар утасны цэс">{links.map(([href,title],i)=><Link key={href} href={href}><svg viewBox="0 0 24 24" aria-hidden="true">{i===0?<><circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2"/></>:i===1?<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 3v18M3 12h18"/></>:i===2?<><circle cx="8" cy="12" r="6"/><circle cx="16" cy="12" r="6"/></>:<><circle cx="12" cy="8" r="3"/><path d="M5 22c0-10 14-10 14 0"/></>}</svg><span>{title}</span></Link>)}</nav>;
}
