import type { Metadata } from "next";
import "./globals.css";
import { PresenceBeacon } from "@/components/client/PresenceBeacon";

export const metadata: Metadata = {
  title: "Épicerie Club — Offres locales Villeneuve",
  description:
    "Les bons plans de ton quartier, tous les jours. Réservez les offres de proximité à Villeneuve. Gratuit, rapide, local.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="font-sans antialiased">
        <PresenceBeacon />
        {children}
      </body>
    </html>
  );
}
