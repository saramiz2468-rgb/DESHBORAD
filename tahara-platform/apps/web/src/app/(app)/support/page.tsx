import type { Metadata } from 'next';
import { FeatureScreen } from '@/components/FeatureScreen';

export const metadata: Metadata = { title: 'תמיכה' };

export default function Page() {
  return <FeatureScreen feature="support" />;
}
