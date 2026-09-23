import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = "https://offreslocal.ch";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "OffresLocal",
    template: "%s · OffresLocal",
  },
  applicationName: "OffresLocal",
  description:
    "Les bons plans de ton quartier, tous les jours. Réservez les offres de proximité à Villeneuve. Gratuit, rapide, local.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "OffresLocal",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "fr_CH",
    url: siteUrl,
    siteName: "OffresLocal",
    title: "OffresLocal",
    description:
      "Les bons plans de ton quartier, tous les jours. Réserve gratuitement, retire en commerce.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "OffresLocal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OffresLocal",
    description:
      "Les bons plans de ton quartier, tous les jours. Réserve gratuitement, retire en commerce.",
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#EAFF4F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
