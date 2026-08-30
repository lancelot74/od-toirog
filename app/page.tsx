"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";

const logo = "/assets/brand/primary-logo/od-toirog.webp";
const zodiac = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
const planets = [
  { glyph: "☉", angle: 18, radius: 104 },
  { glyph: "☽", angle: 68, radius: 74 },
  { glyph: "☿", angle: 132, radius: 101 },
  { glyph: "♀", angle: 184, radius: 79 },
  { glyph: "♂", angle: 245, radius: 106 },
  { glyph: "♃", angle: 302, radius: 83 },
];

function point(angle: number, radius: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return { x: 160 + Math.cos(radians) * radius, y: 160 + Math.sin(radians) * radius };
}

function ChartWheel({ compact = false }: { compact?: boolean }) {
  return (
    <svg className={compact ? "chart compact" : "chart"} viewBox="0 0 320 320" role="img" aria-label="Натал зургийн жишээ дүрслэл">
      <circle cx="160" cy="160" r="148" className="chart-line strong" />
      <circle cx="160" cy="160" r="126" className="chart-line" />
      <circle cx="160" cy="160" r="112" className="chart-line faint" />
      <circle cx="160" cy="160" r="54" className="chart-line" />
      {zodiac.map((sign, index) => {
        const outer = point(index * 30, 148);
        const inner = point(index * 30, 54);
        const label = point(index * 30 + 15, 137);
        return (
          <g key={sign}>
            <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} className="chart-line faint" />
            <text x={label.x} y={label.y} className="zodiac" textAnchor="middle" dominantBaseline="middle">{sign}</text>
          </g>
        );
      })}
      {planets.map((planet, index) => {
        const location = point(planet.angle, planet.radius);
        const opposite = point(planet.angle + 137 + index * 8, 72 + (index % 2) * 18);
        return (
          <g key={planet.glyph}>
            <line x1={location.x} y1={location.y} x2={opposite.x} y2={opposite.y} className={index % 2 ? "aspect cool" : "aspect"} />
            <circle cx={location.x} cy={location.y} r="11" className="planet-dot" />
            <text x={location.x} y={location.y} className="planet" textAnchor="middle" dominantBaseline="central">{planet.glyph}</text>
          </g>
        );
      })}
      <circle cx="160" cy="160" r="4" className="center-star" />
    </svg>
  );
}

function Icon({ name }: { name: "sun" | "chart" | "link" | "profile" }) {
  const paths = {
    sun: <><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2"/></>,
    chart: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 3v18M3 12h18"/></>,
    link: <><circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6"/></>,
    profile: <><circle cx="12" cy="8" r="3"/><path d="M5 21c.5-5 3-7 7-7s6.5 2 7 7"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

function BirthDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [phase, setPhase] = useState<"form" | "loading" | "reveal">("form");
  const [unknownTime, setUnknownTime] = useState(false);

  useEffect(() => {
    if (phase !== "loading") return;
    const timer = window.setTimeout(() => setPhase("reveal"), 2700);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (!open) return null;

  function close() {
    setPhase("form");
    setUnknownTime(false);
    onClose();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPhase("loading");
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="birth-title">
        <button className="dialog-close" onClick={close} aria-label="Хаах">×</button>
        {phase === "form" && (
          <form onSubmit={submit}>
            <p className="eyebrow">ТӨРСӨН МӨЧ</p>
            <h2 id="birth-title">Тэнгэрийн зургаа нээе.</h2>
            <p className="dialog-copy">Мэдээллээ нэг дор шалгаад оруулна уу. Таны төрсөн мэдээлэл зөвхөн хувийн зурлагад ашиглагдана.</p>
            <div className="form-grid">
              <label className="full">Таны нэр<input name="name" required placeholder="Нэр" autoFocus /></label>
              <label>Төрсөн огноо<input name="date" type="date" required /></label>
              <label>Төрсөн цаг<input name="time" type="time" required={!unknownTime} disabled={unknownTime} /></label>
              <label className="check full"><input type="checkbox" checked={unknownTime} onChange={(event) => setUnknownTime(event.target.checked)} />Төрсөн цагаа мэдэхгүй</label>
              <label className="full">Төрсөн газар<input name="place" required placeholder="Хот, аймаг, улс" /></label>
            </div>
            {unknownTime && <p className="notice">Төрсөн цаггүй үед Асцендент болон ордны байрлал тодорхойгүй байж болно. Та хэсэгчилсэн тайлал авах боломжтой.</p>}
            <button className="button primary wide" type="submit">Тэнгэрийн зургаа байгуулах <span>✦</span></button>
          </form>
        )}
        {phase === "loading" && (
          <div className="loading-state" aria-live="polite">
            <div className="loading-orbit"><span /></div>
            <p>Таны төрсөн мөчийг хайж байна.</p>
            <small>Тэнгэрийн зургийг байгуулж байна</small>
          </div>
        )}
        {phase === "reveal" && (
          <div className="reveal-state">
            <p className="eyebrow">ДҮРСЛЭЛИЙН ЖИШЭЭ</p>
            <h2>Таны зураг нээгдэхэд бэлэн.</h2>
            <ChartWheel compact />
            <p className="notice">Энэ бол интерфейсийн жишээ зураг. Бодит гаригийн байрлалыг backend дахь Swiss Ephemeris тооцоолно.</p>
            <button className="button primary wide" onClick={close}>Нүүр хуудас руу буцах</button>
          </div>
        )}
      </section>
    </div>
  );
}

export default function Home() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Од Тойрог нүүр хуудас">
          <span className="brand-mark"><Image src={logo} alt="" width={90} height={90} priority /></span>
          <span><b>ОД ТОЙРОГ</b><small>Таны төрсөн мөчийн тэнгэр.</small></span>
        </a>
        <nav aria-label="Үндсэн цэс">
          <a href="#idea">Натал зураг</a><a href="#daily">Өнөөдөр</a><a href="#compatibility">Хослол</a><a href="#story">Мэдлэг</a>
        </nav>
        <button className="button outline header-action" onClick={() => setDialogOpen(true)}>Зургаа нээх</button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span>✦</span> ӨӨРИЙГӨӨ УНШИХ ШИНЭ АРГА</p>
          <h1>Таны төрсөн мөчийн<br /><em>тэнгэрийг нээнэ.</em></h1>
          <p className="lead">Төрсөн огноо, цаг, газраа оруулж өөрийн натал зургаа нээнэ. Тэр мөчийн тэнгэрээс зан чанар, харилцаа, дотоод ертөнцийн холбоосыг уншина.</p>
          <div className="hero-actions"><button className="button primary" onClick={() => setDialogOpen(true)}>Натал зургаа нээх <span>✦</span></button><a href="#idea" className="text-link">Од Тойргийг судлах <span>↓</span></a></div>
          <div className="hero-note"><span className="mini-orbit">✦</span><p>Зурхай бол баттай зөгнөл биш.<br />Өөрийгөө эргэцүүлэх нэгэн хэл.</p></div>
        </div>
        <div className="hero-art" aria-label="Од Тойрог оуроборос ба аялагчийн бэлгэ тэмдэг">
          <div className="orbit orbit-one"/><div className="orbit orbit-two"/>
          <Image src={logo} alt="Оуроборосын хүрээн дэх тэнгэрийн аялагч, Од Тойрог лого" width={1100} height={1100} priority sizes="(max-width: 800px) 100vw, 50vw" />
        </div>
        <div className="scroll-mark" aria-hidden="true">01 <span /> НЭЭЛТ</div>
      </section>

      <section className="idea section" id="idea">
        <div className="section-number">I</div>
        <div className="section-intro"><p className="eyebrow">НАРНЫ ОРДООС ЦААШ</p><h2>Таны зурлага<br />нэг ордоос бүрдэхгүй.</h2></div>
        <div className="idea-copy"><p>Таны төрсөн мөчид арван гариг, арван хоёр орд, тэдгээрийн хоорондын олон холбоос зэрэгцэн оршиж байсан.</p><p>Од Тойрог энэ бүтэн зургийг тайван, ойлгомжтой монгол хэлээр дэлгэнэ.</p><div className="rule"/><span className="caption">НАР · САР · АСЦЕНДЕНТ</span></div>
      </section>

      <section className="process section">
        <div className="process-line" />
        {[['01','Төрсөн мөч','Огноо, цаг, төрсөн газраа оруулна.'],['02','Натал зураг','Гаригийн бодит байрлалыг тооцоолно.'],['03','Таны тайлал','Холбоос бүрийг монголоор уншина.']].map(([number,title,copy]) => <article key={number}><span>{number}</span><i>✦</i><h3>{title}</h3><p>{copy}</p></article>)}
      </section>

      <section className="chart-section section">
        <div className="chart-panel"><div className="chart-caption"><span>1998.09.21</span><span>УЛААНБААТАР · 07:42</span></div><ChartWheel /></div>
        <div className="chart-reading"><p className="eyebrow">ТАНЫ ГОЛ ГУРАВ</p><h2>Зургийн төвд<br />таны дотоод хэмнэл.</h2><div className="big-three"><div><span>☉</span><p>НАР</p><b>Охин</b><small>28° 14′</small></div><div><span>☽</span><p>САР</p><b>Жинлүүр</b><small>11° 08′</small></div><div><span>↑</span><p>АСЦЕНДЕНТ</p><b>Арслан</b><small>04° 31′</small></div></div><p className="reading-copy">Нар таны үндсэн чиглэлийг, Сар мэдрэмжийн ертөнцийг, Асцендент бусдад анх хэрхэн харагддагийг өгүүлнэ.</p><button className="text-button" onClick={() => setDialogOpen(true)}>Өөрийн гол гурвыг нээх <span>→</span></button></div>
      </section>

      <section className="daily section" id="daily">
        <div className="daily-heading"><p className="eyebrow">ӨНӨӨДӨР · 8-Р САРЫН 29</p><h2>Өнөөдрийн тэнгэр<br />тантай хэрхэн холбогдох вэ?</h2></div>
        <article className="reading-card"><div className="moon-phase">◐</div><span className="card-label">ӨНӨӨДРИЙН УНШЛАГА</span><h3>Хариу өгөхөөсөө өмнө<br />түр ажиглах өдөр.</h3><p>Буд болон таны төрсөн үеийн Сарны холбоо мэдрэмжээ үгээр илэрхийлэхэд анхаарал шаардаж байна.</p><button className="why-button">Яагаад? <span>＋</span></button></article>
        <div className="meters">{[['Сэтгэл',72],['Харилцаа',58],['Ажил',84],['Хайр',64]].map(([label,value]) => <div key={label}><span>{label}</span><div><i style={{width:`${value}%`}} /></div><small>{value}</small></div>)}</div>
      </section>

      <section className="compatibility section" id="compatibility">
        <div className="compat-visual"><div className="mini-chart left"><ChartWheel compact /></div><div className="mini-chart right"><ChartWheel compact /></div><span className="connection">✦</span></div>
        <div className="compat-copy"><p className="eyebrow">ХОЁР ЗУРГИЙН УУЛЗВАР</p><h2>Та хоёрын хооронд<br />юу өрнөдөг вэ?</h2><p>Хослол нь “тохирно, тохирохгүй” гэсэн ганц хариулт биш. Сэтгэл, хайр, харилцаа, зөрчлийн хэмнэлийг тус тусад нь харна.</p><button className="button outline" onClick={() => setDialogOpen(true)}>Хосын зураг судлах</button></div>
      </section>

      <section className="story section" id="story"><div className="story-symbol"><Image src={logo} alt="Од Тойргийн аялагч ба оуроборос" width={500} height={500} loading="lazy" /></div><div><p className="eyebrow">БЭЛГЭ ТЭМДГИЙН ТҮҮХ</p><h2>Аялал ба<br />мөнхийн тойрог.</h2><p>Аялагч бол өөрийгөө нээхээр үл мэдэгдэх зүг рүү алхаж буй хүн. Оуроборос бол цаг хугацаа, өөрчлөлт, буцан ирэх мөнхийн хөдөлгөөн.</p><blockquote>“Хүн илүү том тэнгэрийн тойрог дотор өөрийн замыг эхлүүлнэ.”</blockquote></div></section>

      <section className="final-cta"><span className="final-star">✦</span><p className="eyebrow">ТАНЫ ЗУРАГ ХҮЛЭЭЖ БАЙНА</p><h2>Таны төрсөн мөчийн<br />тэнгэр ямар байсан бэ?</h2><button className="button primary" onClick={() => setDialogOpen(true)}>Натал зургаа нээх <span>✦</span></button></section>

      <footer><a className="brand footer-brand" href="#top"><span className="brand-mark"><Image src={logo} alt="" width={80} height={80} /></span><span><b>ОД ТОЙРОГ</b><small>Od Toirog</small></span></a><p>Зурхайн тайлал нь өөрийгөө эргэцүүлэх, бэлгэдлийн уламжлал бөгөөд шинжлэх ухааны онош, баттай зөгнөл биш.</p><div><a href="#story">Бидний тухай</a><a href="#idea">Мэдлэг</a><a href="#top">Нууцлал</a></div><small>© 2026 ОД ТОЙРОГ</small></footer>

      <nav className="mobile-nav" aria-label="Гар утасны цэс"><a href="#daily"><Icon name="sun"/><span>Өнөөдөр</span></a><a href="#idea"><Icon name="chart"/><span>Зураг</span></a><a href="#compatibility"><Icon name="link"/><span>Хослол</span></a><button onClick={() => setDialogOpen(true)}><Icon name="profile"/><span>Профайл</span></button></nav>
      <BirthDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </main>
  );
}
