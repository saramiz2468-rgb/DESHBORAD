import type { Metadata } from 'next';
import { FeatureScreen, medicalNotice } from '@/components/FeatureScreen';

export const metadata: Metadata = { title: 'תובנות ותחזיות' };

export default function Page() {
  return <FeatureScreen feature="insights" notice={medicalNotice} />;
}
