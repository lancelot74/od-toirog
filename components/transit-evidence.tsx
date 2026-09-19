import type { Aspect } from '@/lib/types';
import { mn } from '@/lib/mn';

export function TransitEvidence({aspect:a}:{aspect:Aspect}){
  if(a.closest_sample_local)return <div className="transit-evidence">
    <p>Өнөөгийн {mn.planets[a.a]} · төрсөн үеийн {mn.planets[a.b]} · {a.angle}° холбоос.</p>
    <dl><dt>Хамгийн ойр түүврийн цаг</dt><dd><time dateTime={a.closest_sample_local}>{a.closest_sample_local}</time></dd><dt>Түүврийн орб / зөвшөөрсөн орб</dt><dd>{a.orb.toFixed(4)}° / {a.allowed_orb}°</dd><dt>Геометрийн хүч · тохирлын хувь биш</dt><dd>{a.strength.toFixed(4)}</dd><dt>Орб доторх түүврийн тоо</dt><dd>{a.in_orb_sample_count}</dd></dl>
    <h4>Боловсруулж олсон яг огтлолцлын мөчүүд</h4>{a.exact_crossings_local?.length?<ul>{a.exact_crossings_local.map(t=><li key={t}><time dateTime={t}>{t}</time></li>)}</ul>:<p>Тэмдгээ сольсон хүрээлсэн огтлолцол олдсонгүй. Завсрын шүргэлтийг бүрэн үгүйсгэхгүй.</p>}
    <details><summary>Түүврийн хамрах хүрээ</summary><p>Эхний орб доторх түүвэр (UTC): {a.first_in_orb_sample_utc||'Байхгүй'}<br/>Сүүлийн орб доторх түүвэр (UTC): {a.last_in_orb_sample_utc||'Байхгүй'}</p><p>Эдгээрийн хооронд идэвх тасралтгүй үргэлжилсэн гэсэн үг биш. Энэ нь орб руу орох, гарах яг хугацаа биш.</p></details><small>Нотолгоо: {a.evidence_id}</small>
  </div>;
  return <><p>Өнөөгийн {mn.planets[a.a]} таны төрсөн үеийн {mn.planets[a.b]}-тай {a.separation?.toFixed(2)}° зайтай. {a.angle}° холбоосоос {a.orb.toFixed(2)}° зөрүүтэй.</p><p>Тооцоолсон ач холбогдол: {a.importance?.toFixed(2)} · Ойролцоо үргэлжлэх хугацаа: {a.duration_hours?`${Math.round(a.duration_hours)} цаг`:'станцын ойролцоо — тодорхойгүй'}</p></>;
}
