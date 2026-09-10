"use client";
import { useState } from 'react';
import { track } from '@/lib/telemetry';
export function Share({title,lines}:{title:string;lines:string[]}){
  const [shape,setShape]=useState('square'),[error,setError]=useState('');
  async function download(){
    try{
      await document.fonts.ready;
      const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=shape==='square'?1080:1920;
      const c=canvas.getContext('2d');if(!c)throw new Error();
      c.fillStyle='#0B0D10';c.fillRect(0,0,1080,canvas.height);c.strokeStyle='#A98936';c.strokeRect(45,45,990,canvas.height-90);
      c.strokeStyle='#D4AF37';c.beginPath();c.arc(540,220,75,0,2*Math.PI);c.stroke();
      c.fillStyle='#D4AF37';c.font='48px Prata';c.textAlign='center';c.fillText('✦',540,236);
      c.fillStyle='#F6F3E6';c.font='42px Prata';
      let y=380;
      for(const text of [title,...lines]){
        const words=text.split(' ');let line='';
        for(const word of words){if(c.measureText(line+' '+word).width>870){c.fillText(line.trim(),540,y);y+=60;line=word;}else line+=' '+word;}
        c.fillText(line.trim(),540,y);y+=85;
      }
      c.fillStyle='#D4AF37';c.font='30px Prata';c.fillText('ОД ТОЙРОГ',540,canvas.height-100);
      const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error();
      const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='od-toirog.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      void track('share_created');
    }catch{setError('Зураг татах боломжгүй байна.');}
  }
  return <section className="reading-block"><h3>Хуваалцах зураг</h3><p className="muted">Зөвхөн доорх нэр, тайллыг зурагт оруулна. Төрсөн огноо, цаг, газрыг оруулахгүй.</p><label>Хэмжээ<select value={shape} onChange={e=>setShape(e.target.value)}><option value="square">1080 × 1080</option><option value="story">1080 × 1920</option></select></label><button className="button outline" onClick={download}>PNG татах</button>{error&&<p role="alert">{error}</p>}</section>;
}
