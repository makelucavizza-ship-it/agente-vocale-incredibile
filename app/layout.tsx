import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Centro Estetico — Dashboard",
  description: "Pannello di controllo agente vocale",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
