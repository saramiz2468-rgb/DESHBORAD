import type { Metadata } from 'next';
import { TrackScreen } from '@/features/cycles/TrackScreen';

export const metadata: Metadata = { title: 'מעקב מחזור' };

export default function Page() {
  return <TrackScreen />;
}
