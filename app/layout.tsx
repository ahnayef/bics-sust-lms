import { PWARegister } from "@/components/PWARegister";
import { AOSInit } from "@/lib/AOSInit";
import { I18nProvider } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Geist, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const notoSansBengali = Noto_Sans_Bengali({
  variable: "--font-noto-sans-bengali",
  subsets: ["bengali", "latin"],
});

export const viewport = {
  themeColor: "#2d4a35",
};

// Metadata temporarily removed to resolve build prerender issue


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
      <head>
        <title>BICS LMS</title>
        <meta name="description" content="BICS SUST Library Management System" />
        <meta name="theme-color" content="#2d4a35" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/192.png" sizes="192x192" type="image/png" />
        <link rel="apple-touch-icon" href="/icons/192.png" />
      </head>
      <body className="min-h-full flex flex-col">
        {/* shows up as a box in mobile screen */}
        {/*<GrainOverlay />*/}
        <PWARegister />
        <I18nProvider>
          <AOSInit />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
