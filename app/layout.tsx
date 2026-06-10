import type { Metadata } from "next";
import { Barlow } from "next/font/google";
import { Footer } from "@/components/footer";
import { Toaster } from "sonner";
import "./globals.css";

const barlow = Barlow({
  variable: "--font-barlow",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
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
    <html lang="en" className={`${barlow.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Footer />
        <Toaster richColors />
      </body>
    </html>
  );
}
