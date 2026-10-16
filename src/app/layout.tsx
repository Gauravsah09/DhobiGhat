import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LaundryProvider } from "@/context/LaundryContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DhobiGhat - Modern Laundry & Dry Cleaning Management",
  description: "DhobiGhat - Next-generation cloud-native point of sale, order tracking, and invoice management for dry cleaners and laundry businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <LaundryProvider>
          {children}
        </LaundryProvider>
      </body>
    </html>
  );
}
