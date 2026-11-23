import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'TAHARA',
    short_name: 'TAHARA',
    description: 'יומן אישי ומאובטח למעקב אחר מחזור, טהרת המשפחה ופוריות.',
    lang: 'he',
    dir: 'rtl',
    start_url: '/today',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f7f5f6',
    theme_color: '#f7f5f6',
    categories: ['health', 'lifestyle'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icons/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
