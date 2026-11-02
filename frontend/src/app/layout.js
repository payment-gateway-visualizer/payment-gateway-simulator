import { Sora, DM_Sans } from "next/font/google";
import "./globals.css";

const head = Sora({ subsets: ["latin"], variable: "--head" });
const body = DM_Sans({ subsets: ["latin"], variable: "--body" });

export const metadata = { title: "PesaPay", description: "Wallet and merchant payments" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${head.variable} ${body.variable}`}>{children}</body>
    </html>
  );
}
