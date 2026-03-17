import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Archives Treasures Hunt | Archives Concept Store",
  description:
    "Application evenementielle synchronisee pour la chasse au tresor Archives Treasures Hunt a Rennes."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
