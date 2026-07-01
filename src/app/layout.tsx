import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EdgeInspect AI — Real-Time Aircraft Defect Detection",
  description:
    "Edge AI-powered aerospace inspection platform. Real-time defect detection, bounding-box inference, analytics, and digital inspection reports.",
  applicationName: "EdgeInspect AI",
  authors: [{ name: "EdgeInspect Aerospace" }],
  keywords: [
    "aircraft inspection",
    "defect detection",
    "edge AI",
    "computer vision",
    "aerospace",
    "NDT",
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="bg-[#07111F] text-[#e7f0fb] antialiased overflow-x-hidden">
        <div
          style={{
            fontFamily: "var(--font-inter), sans-serif",
          }}
        >
          {children}
        </div>
      </body>
    </html>
  );
}
