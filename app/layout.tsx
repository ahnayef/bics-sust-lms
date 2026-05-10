import { AOSInit } from "@/lib/AOSInit";
import type { Metadata } from "next";
import { Noto_Sans_Bengali, Geist } from "next/font/google";
import GrainOverlay from "./components/GrainOverlay";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-noto-sans-bengali",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BICS SUST LMS",
  description: "A Library Management System for BICS SUST",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", notoSansBengali.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col">
        <GrainOverlay />
        <AOSInit />
        {children}
      </body>
    </html>
  );
}
