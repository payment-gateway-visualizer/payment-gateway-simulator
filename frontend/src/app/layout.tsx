
import type { Metadata } from "next";
import { Sora, DM_Sans } from "next/font/google";
import "./globals.css";

const head = Sora({
  subsets: ["latin"],
  variable: "--head",
});

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--body",
});

export const metadata: Metadata = {
  title: "PesaPay",
  description: "Wallet and merchant payments",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${head.variable} ${body.variable} min-h-screen bg-white text-[#2B0A10] [font-family:var(--body),system-ui,sans-serif]`}>
        {children}
      </body>
    </html>
  );
}
