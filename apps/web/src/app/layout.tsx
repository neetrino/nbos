import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Source_Serif_4 } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import './globals.css';
import { auth } from '@/auth';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { PwaRegister } from '@/components/pwa/PwaRegister';
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

const sourceSerif = Source_Serif_4({
  variable: '--font-source-serif',
  subsets: ['latin'],
  preload: false,
});

const NBOS_BRAND_COLOR = '#2e3192';

export const viewport: Viewport = {
  themeColor: NBOS_BRAND_COLOR,
  viewportFit: 'cover',
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

/**
 * The session is resolved on the server and handed to `SessionProvider` as the initial value.
 * Without it the client fetches `/api/auth/session`, and that endpoint re-signs the session
 * cookie from the token sent with the request, which can roll back a refresh rotation that the
 * BFF performed in parallel and get the session killed as refresh reuse.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <SessionProvider session={session} refetchOnWindowFocus={false}>
      <QueryProvider>
        <html
          lang="en"
          suppressHydrationWarning
          className={cn('font-sans', inter.variable, sourceSerif.variable)}
        >
          <body
            className={`${inter.variable} ${sourceSerif.variable} ${jetbrainsMono.variable} font-sans antialiased`}
          >
            <ThemeProvider>
              {children}
              <PwaRegister />
              <Toaster richColors closeButton position="top-center" />
            </ThemeProvider>
          </body>
        </html>
      </QueryProvider>
    </SessionProvider>
  );
}
