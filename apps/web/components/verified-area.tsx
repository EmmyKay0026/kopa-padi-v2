'use client'; import { useEffect,useState } from 'react'; import { api } from '@/lib/api';
export function VerifiedArea(){const [message,setMessage]=useState('Checking access…');useEffect(()=>{api<{message:string}>('/verified-area').then(x=>setMessage(x.message)).catch(e=>setMessage(e.message));},[]);return <div className="card"><p>{message}</p></div>}
