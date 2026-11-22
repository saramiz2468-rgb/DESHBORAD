import type { Metadata } from 'next';
import { FeatureScreen, halachaNotice } from '@/components/FeatureScreen';

export const metadata: Metadata = { title: 'טהרת המשפחה' };

export default function Page() {
  return <FeatureScreen feature="halacha" notice={halachaNotice} />;
}
