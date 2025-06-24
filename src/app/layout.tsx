import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TeamThemeProvider } from '@/contexts/TeamThemeContext';
import { PerformanceLayout } from '@/components/PerformanceLayout';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "FIFA Manager",
  description: "Manage your FIFA team",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  themeColor: "#3c5c34",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        <link rel="prefetch" href="/manager" />
        <link rel="prefetch" href="/edit-tactics" />
        <link rel="prefetch" href="/player-stats" />
        <link rel="prefetch" href="/best-xi" />
        <link rel="prefetch" href="/create-team" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TeamThemeProvider>
          <PerformanceLayout>
            {children}
          </PerformanceLayout>
        </TeamThemeProvider>
      </body>
    </html>
  );
}
