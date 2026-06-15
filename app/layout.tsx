import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
import { Footer } from "@/components/footer";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
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
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-screen bg-onda-50 flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <Toaster richColors />
      </body>
    </html>
  );
}
