import type { Metadata } from 'next';
import { PrishahScreen } from '@/features/tahara/PrishahScreen';

export const metadata: Metadata = { title: 'ימי פרישה' };

export default function Page() {
  return <PrishahScreen />;
}
