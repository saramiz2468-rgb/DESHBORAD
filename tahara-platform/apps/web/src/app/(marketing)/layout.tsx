import type { ReactNode } from 'react';
import { PreviewBanner } from '@/components/PreviewBanner';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PreviewBanner text="האתר בבנייה. הרכישה וההרשמה עדיין לא פתוחות." />
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
