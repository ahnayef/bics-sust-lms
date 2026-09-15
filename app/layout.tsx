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

export const metadata: Metadata = {
  title: "BICS LMS",
  description: "BICS SUST Library Management System",
  authors: [{ name: "AHNayef", url: "https://github.com/ahnayef" }],
  keywords: ["education", "library", "sust", "bics", "management", "books"],
  metadataBase: new URL("https://bics-sust-lms.vercel.app"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BICS LMS",
    startupImage: [
      {
        url: "/icons/512.png",
        media:
          "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    url: "https://bics-sust-lms.vercel.app",
    siteName: "BICS LMS",
    images: [
      {
        url: "meta.png",
        width: 177,
        height: 112,
        alt: "Meta Image",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  icons: {
    icon: [
      {
        url: "/icons/192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/icons/192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/128.png",
        sizes: "128x128",
        type: "image/png",
      },
    ],
  },
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
        <PWARegister />
        <I18nProvider>
          <AOSInit />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
