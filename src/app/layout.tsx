import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Paradox | Production Discord Bot & Web Dashboard",
  description: "Configure reaction roles, publish rich embeds, and enhance social video embeds in Discord with a secure companion dashboard.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-discord-darkest text-slate-100 flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
