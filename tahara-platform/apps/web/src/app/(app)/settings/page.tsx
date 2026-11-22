import type { Metadata } from 'next';
import { FeatureScreen } from '@/components/FeatureScreen';

export const metadata: Metadata = { title: 'הגדרות' };

export default function Page() {
  return <FeatureScreen feature="settings" />;
}
