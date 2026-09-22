"use client";
import { useEffect, useState } from "react";
import { asset } from "@/lib/paths";

export function HeroArt() {
  const [play, setPlay] = useState(false);
  useEffect(() => {
    const query = matchMedia('(min-width: 901px) and (hover: hover)');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPlay(query.matches&&!reduced.matches);
    update();
    query.addEventListener('change', update);
    reduced.addEventListener('change', update);
    return () => {query.removeEventListener('change', update);reduced.removeEventListener('change', update);};
  }, []);
  return <div className="landscape-art">
    <picture className="landscape-picture">
      <source media="(max-width: 900px)" width={1440} height={2560} sizes="100vw" srcSet={[450,900,1440].map(width=>`${asset(`/assets/illustration/mobile/hero-${width}.webp`)} ${width}w`).join(', ')}/>
      <img src={asset('/assets/illustration/hero.webp')} width={1586} height={992} alt="Тэнгэрийн тойргийн доорх уулын замаар алхаж буй аялагч" fetchPriority="high" decoding="async"/>
    </picture>
    {play && <iframe title="Тэнгэрийн тойргийн удаан хөдөлгөөн" src={asset('/assets/illustration/animation.html')} tabIndex={-1} sandbox="allow-scripts allow-same-origin" />}
  </div>;
}
