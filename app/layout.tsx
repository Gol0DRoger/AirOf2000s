import type { Metadata } from "next";
import { Press_Start_2P, Space_Mono } from "next/font/google";
import "./globals.css";
import LoadingScreen from "@/components/LoadingScreen";
import BackgroundPixelsClient from "@/components/BackgroundPixelsClient";

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Air of 2000s — Feel the Decade",
  description:
    "Relive the 2001-2010 decade. No purpose. Just nostalgia and calm.",
  keywords: ["2000s", "nostalgia", "retro", "y2k", "india", "millennium"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${pressStart2P.variable} ${spaceMono.variable}`}
    >
      <body className="bg-xp-bg font-body text-xp-text">
        <LoadingScreen />
        <BackgroundPixelsClient />
        {children}
      </body>
    </html>
  );
}
