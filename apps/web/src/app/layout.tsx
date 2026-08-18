import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { QueryProvider } from '@/lib/query/query-provider';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  preload: false,
});

const NBOS_BRAND_COLOR = '#2e3192';

export const viewport: Viewport = {
  themeColor: NBOS_BRAND_COLOR,
};

export const metadata: Metadata = {
  title: 'NBOS — Business Operation System',
  description: 'Internal Business Operation System by Neetrino',
  applicationName: 'NBOS',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/logo/icon.png', type: 'image/png' },
      { url: '/logo/icon.svg', type: 'image/svg+xml', sizes: 'any' },
      { url: '/icons/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icons/icon-256.png', type: 'image/png', sizes: '256x256' },
      { url: '/icons/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
  appleWebApp: {
    capable: true,
    title: 'NBOS',
    statusBarStyle: 'default',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <QueryProvider>
        <html lang="en" suppressHydrationWarning className={cn('font-sans', inter.variable)}>
          <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
            <ThemeProvider>
              {children}
              <Toaster richColors closeButton position="top-center" />
            </ThemeProvider>
          </body>
        </html>
      </QueryProvider>
    </SessionProvider>
  );
}
