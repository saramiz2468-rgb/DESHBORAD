import type { Metadata } from 'next';
import { VestotScreen } from '@/features/tahara/VestotScreen';

export const metadata: Metadata = { title: 'מעקב וסתות' };

export default function Page() {
  return <VestotScreen />;
}
