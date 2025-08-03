import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YETI DEX - Trade DeFi like a YETI",
  description: "Automate your TradingView strategies with secure, decentralized limit orders on Base. Connect TradingView alerts to automated trading.",
  keywords: ["DeFi", "TradingView", "limit orders", "automated trading", "Base", "1inch", "cryptocurrency"],
  authors: [{ name: "YETI DEX" }],
  openGraph: {
    title: "YETI DEX - Trade DeFi like a YETI",
    description: "Automate your TradingView strategies with secure, decentralized limit orders",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-900 text-white min-h-screen flex flex-col`}
      >
        <Providers>
          <div className="flex-1">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
