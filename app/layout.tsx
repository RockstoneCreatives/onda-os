import type { Metadata } from "next";
import { Barlow_Condensed } from "next/font/google";
import { Footer } from "@/components/footer";
import { Toaster } from "sonner";
import "./globals.css";

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Onda OS - Wine Menu Generator",
  description: "Wine inventory and menu generation system for Onda Restaurant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${barlowCondensed.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-condensed">
        {children}
        <Footer />
        <Toaster richColors />
      </body>
    </html>
  );
}
