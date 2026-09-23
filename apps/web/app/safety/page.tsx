import type {Metadata} from 'next';
import {SafetyCenter} from '@/components/safety-center';
export const metadata:Metadata={title:'Safety Centre | Kopa-Padi',description:'Report concerns privately, track reports, and manage blocked travelers.'};
export default function SafetyPage(){return <SafetyCenter/>}
