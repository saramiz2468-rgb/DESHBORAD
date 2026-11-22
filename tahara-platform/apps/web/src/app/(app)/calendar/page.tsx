import type { Metadata } from 'next';
import { FeatureScreen } from '@/components/FeatureScreen';

export const metadata: Metadata = { title: 'לוח שנה' };

export default function Page() {
  return <FeatureScreen feature="calendar" />;
}
