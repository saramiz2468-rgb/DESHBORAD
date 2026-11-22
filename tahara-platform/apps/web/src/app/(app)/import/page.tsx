import type { Metadata } from 'next';
import { FeatureScreen } from '@/components/FeatureScreen';

export const metadata: Metadata = { title: 'ייבוא מהגרסה הקודמת' };

export default function Page() {
  return <FeatureScreen feature="import" />;
}
