import type { Metadata } from 'next';
import { CalendarScreen } from '@/features/calendar/CalendarScreen';

export const metadata: Metadata = { title: 'לוח שנה' };

export default function Page() {
  return <CalendarScreen />;
}
