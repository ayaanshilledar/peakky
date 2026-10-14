import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Peaky — Minimalist Dynamic Island & Productivity Notch",
  description:
    "A discreet, tactile floating notch that seamlessly snaps to your display bezel — integrating Focus Timer, Tasks, iCal Meeting Sync, and Clipboard History.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#08080a] text-[#ededed] font-sans selection:bg-white/20 selection:text-white">
        {children}
      </body>
    </html>
  );
}
