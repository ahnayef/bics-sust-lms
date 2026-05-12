import { AOSInit } from "@/lib/AOSInit";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Geist, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-noto-sans-bengali",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SUST LMS",
  description: "A Library Management System for SUST",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        notoSansBengali.variable,
        "font-sans",
        geist.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        {/* shows up as a box in mobile screen */}
        {/*<GrainOverlay />*/}
        <AOSInit />
        {children}
      </body>
    </html>
  );
}
