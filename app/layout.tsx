import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sentra AI — AI Cyber Defense Team",
  description:
    "Sentra investigates suspicious digital interactions and helps protect apps with evidence-driven AI cybersecurity."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
