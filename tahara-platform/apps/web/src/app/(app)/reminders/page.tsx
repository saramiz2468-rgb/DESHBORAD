import type { Metadata } from 'next';
import { RemindersScreen } from '@/features/reminders/RemindersScreen';

export const metadata: Metadata = { title: 'תזכורות' };

export default function Page() {
  return <RemindersScreen />;
}
