import { Suspense } from "react";
import type { Metadata } from "next";
import { Inter, Libre_Baskerville, Montserrat } from "next/font/google";
import { Header, HeaderFallback } from "@/components/layout/Header";
import { Footer, FooterFallback } from "@/components/layout/Footer";
import { siteConfig } from "@/config/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const libreBaskerville = Libre_Baskerville({
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-libre",
});

const montserrat = Montserrat({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: `${siteConfig.name} | ${siteConfig.university}`,
  description: siteConfig.description,
  keywords: [
    "AVISHKAR",
    "GD Goenka University",
    "Tech Fest 2026",
    "Hackathon",
    "RoboWars",
    "Engineering Fest",
    "Delhi NCR Tech Fest",
  ],
  authors: [{ name: siteConfig.university }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} ${libreBaskerville.variable} ${montserrat.variable} min-h-screen flex flex-col bg-[#F5F7FA] text-[#172033] font-sans antialiased selection:bg-[#0A2047] selection:text-white`}>
        <Suspense fallback={<HeaderFallback />}>
          <Header />
        </Suspense>
        <main className="flex-1">{children}</main>
        <Suspense fallback={<FooterFallback />}>
          <Footer />
        </Suspense>
      </body>
    </html>
  );
}

