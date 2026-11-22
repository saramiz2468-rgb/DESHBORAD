import type { Metadata } from 'next';
import { TaharaScreen } from '@/features/tahara/TaharaScreen';

export const metadata: Metadata = { title: 'טהרה' };

export default function Page() {
  return <TaharaScreen />;
}
