import type { Metadata } from 'next';
import { MatchingStatus } from '@/components/matching-status';

export const metadata: Metadata = {
  title: 'Matching | Kopa-Padi',
  description: 'See your private travel matching and Travel Circle status.',
};

export default function MatchingPage() {
  return <MatchingStatus/>;
}
