import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import ThemeProvider from '@/components/shared/theme-provider';

// Suppress React DevTools error in development (React 19 compatibility issue)
import '@/lib/suppress-devtools-error';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'nxfs.no - Modern Platform',
  description:
    'A modern platform for sharing ideas and knowledge with AI-powered features',
  keywords: ['nxfs', 'blog', 'AI', 'chat', 'platform', 'knowledge sharing'],
  authors: [{ name: 'nxfs.no Team' }],
  icons: {
    icon: '/logo_dark.svg',
    shortcut: '/logo_dark.svg',
    apple: '/logo_dark.svg',
  },
  openGraph: {
    title: 'nxfs.no',
    description: 'Modern platform for sharing ideas and knowledge',
    url: 'https://www.nxfs.no',
    siteName: 'nxfs.no',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'nxfs.no',
    description: 'Modern platform for sharing ideas and knowledge',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ErrorBoundary>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
