import type { Metadata } from 'next';
import { PrivacyScreen } from '@/features/settings/PrivacyScreen';

export const metadata: Metadata = { title: 'פרטיות ואבטחה' };

export default function Page() {
  return <PrivacyScreen />;
}
