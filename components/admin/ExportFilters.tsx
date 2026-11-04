'use client';
import {createContext,useContext,useEffect} from 'react';
export const ExportFiltersContext=createContext<(query:string)=>void>(()=>{});
export function useExportFilters(filters:Record<string,string|number|undefined>){
 const publish=useContext(ExportFiltersContext),serialized=JSON.stringify(filters);
 useEffect(()=>{const params=new URLSearchParams();for(const[key,value]of Object.entries(JSON.parse(serialized)))if(value!==undefined&&value!==''&&value!=='all')params.set(key,String(value));publish(params.size?'&'+params.toString():'');return()=>publish('')},[serialized,publish]);
}
