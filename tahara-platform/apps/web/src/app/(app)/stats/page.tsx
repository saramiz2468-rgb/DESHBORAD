import type { Metadata } from 'next';
import { StatsScreen } from '@/features/stats/StatsScreen';

export const metadata: Metadata = { title: 'סטטיסטיקות' };

export default function Page() {
  return <StatsScreen />;
}
