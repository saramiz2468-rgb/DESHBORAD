import type { Metadata } from 'next';
import { MoreScreen } from '@/features/more/MoreScreen';

export const metadata: Metadata = { title: 'עוד' };

export default function Page() {
  return <MoreScreen />;
}
