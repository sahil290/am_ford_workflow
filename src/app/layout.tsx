import type { Metadata } from "next";
import { Lato, Space_Grotesk } from "next/font/google";
import "./globals.css";

const bodyFont = Lato({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "700", "900"],
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Recon Command Center",
  description: "Enterprise dealership operations platform",
};

import NextTopLoader from 'nextjs-toploader';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${bodyFont.variable} ${displayFont.variable} min-h-screen bg-[var(--bg)] font-sans text-[var(--text-primary)] antialiased`}
        suppressHydrationWarning
      >
        <NextTopLoader 
          color="#D4325C"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #D4325C,0 0 5px #D4325C"
        />
        {children}
      </body>
    </html>
  );
}
