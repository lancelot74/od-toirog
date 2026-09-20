"use client";
import { useState } from 'react';
import type { ResearchEntry } from '@/lib/library/types';

export function DownloadEntry({entry}:{entry:ResearchEntry}){
  const [message,setMessage]=useState('');
  function download(){
    const url=URL.createObjectURL(new Blob([JSON.stringify(entry,null,2)],{type:'application/json;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download=`${entry.id}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setMessage('Эх бичлэгийг JSON хэлбэрээр татлаа.');
  }
  return <div><button className="button outline" onClick={download}>Бичлэгийг JSON татах</button><span className="library-download-status" role="status">{message}</span></div>;
}
