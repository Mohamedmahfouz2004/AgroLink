import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({ subsets: ["arabic"], variable: "--font-cairo" });

export const metadata: Metadata = {
  title: "أجرو لينك | AgroLink",
  description: "نظام متكامل لإدارة توريد المحاصيل الزراعيه للمصانع",
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍅</text></svg>'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark" suppressHydrationWarning>
      <body
        className={`${cairo.variable} font-sans antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
