import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { SITE_NAME, SITE_URL, TAGLINE } from "@/lib/seo";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — ${TAGLINE}`, template: `%s | ${SITE_NAME}` },
  description: "Find homes to rent or buy, commercial space and land across all 47 counties in Kenya. Contact landlords directly.",
  openGraph: { siteName: SITE_NAME, locale: "en_KE", type: "website" },
};
export const viewport: Viewport = { themeColor: "#174B3B", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-KE" className={`${manrope.variable} ${inter.variable}`}>
      <body>
        <AuthProvider><ToastProvider>{children}</ToastProvider></AuthProvider>
      </body>
    </html>
  );
}
