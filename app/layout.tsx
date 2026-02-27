import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '../components/auth/AuthProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Digital Ink',
  description: 'AI-powered document extraction and analysis platform',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="min-h-screen bg-gray-100">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
