import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n";
import "./globals.css";

/**
 * Generic page title so Messenger link previews never reveal a student's name (AC15).
 * No external fonts or third-party scripts are loaded.
 */
export const metadata: Metadata = {
  title: "Pasok — Talaan ng Pagdalo sa Klase",
  description: "Pantulong sa pagtatala ng pagdalo sa advisory class",
  referrer: "no-referrer",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        {children}
      </body>
    </html>
  );
}
