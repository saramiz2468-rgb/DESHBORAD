import type { Metadata } from 'next';
import { FertilityScreen } from '@/features/fertility/FertilityScreen';

export const metadata: Metadata = { title: 'פוריות וביוץ' };

export default function Page() {
  return <FertilityScreen />;
}
