import type { Daily } from '@/lib/types';
export function DailyText({data}:{data:Daily}){
  const text=data.synthesis;if(!text)return null;
  return <section className="reading-block"><p className="eyebrow">ӨНӨӨДРИЙН ТАЙЛАЛ</p><h2>{text.headline}</h2><p>{text.summary}</p>{[['Хайр',text.love],['Ажил',text.work],['Сэтгэл',text.emotion],['Харилцаа',text.communication]].map(([label,body])=>body?<div key={label}><h3>{label}</h3><p>{body}</p></div>:null)}<details><summary>Яагаад?</summary><p>Ашигласан батлагдсан мэдлэг:</p><ul>{text.evidence_keys.map(k=><li key={k}>{k}</li>)}</ul><small>{data.model_version} · {data.prompt_version}</small></details></section>;
}
