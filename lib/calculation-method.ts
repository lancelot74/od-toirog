'use client';
import { useEffect, useState } from 'react';
import type { CalculationMethod } from './types';

const KEY='od-toirog:calculation-method';
function valid(value:string|null):value is CalculationMethod {
  return value==='jpl-v0.1'||value==='swiss-v1';
}

// Store only a calculation preference, never profile or authentication data.
export function useCalculationMethod(){
  const [method,setMethod]=useState<CalculationMethod|null>(null);
  useEffect(()=>{
    let active=true;
    Promise.resolve().then(()=>{
      const requested=new URLSearchParams(location.search).get('method');
      let saved:string|null=null;
      try{saved=localStorage.getItem(KEY);}catch{}
      const value=valid(requested)?requested:valid(saved)?saved:'jpl-v0.1';
      if(active){
        setMethod(value);
        try{localStorage.setItem(KEY,value);}catch{}
      }
    });
    return()=>{active=false;};
  },[]);
  function select(value:CalculationMethod){
    setMethod(value);
    try{localStorage.setItem(KEY,value);}catch{}
    const url=new URL(location.href);
    if(url.searchParams.has('method')){
      url.searchParams.set('method',value);
      history.replaceState(history.state,'',url);
    }
  }
  return [method,select] as const;
}
