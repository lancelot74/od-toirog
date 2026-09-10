"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { asset } from "@/lib/paths";

export function HeroArt() {
  const [play, setPlay] = useState(false);
  useEffect(() => {
    const query = matchMedia('(min-width: 901px) and (prefers-reduced-motion: no-preference)');
    const update = () => setPlay(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return <div className="landscape-art">
    <Image src={asset('/assets/illustration/hero.webp')} alt="Тэнгэрийн тойргийн доорх уулын замаар алхаж буй аялагч" fill priority sizes="100vw" />
    {play && <iframe title="Тэнгэрийн тойргийн удаан хөдөлгөөн" src={asset('/assets/illustration/animation.html')} tabIndex={-1} sandbox="allow-scripts allow-same-origin" />}
    <button className="motion-toggle" onClick={() => setPlay(!play)} aria-pressed={play}>{play ? 'Хөдөлгөөнийг зогсоох' : 'Хөдөлгөөнийг үзэх'}</button>
  </div>;
}
