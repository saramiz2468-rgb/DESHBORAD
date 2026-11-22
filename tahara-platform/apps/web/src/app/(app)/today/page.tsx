import type { Metadata } from 'next';
import { FeatureScreen } from '@/components/FeatureScreen';

export const metadata: Metadata = { title: 'היום שלי' };

export default function Page() {
  return <FeatureScreen feature="today" />;
}
