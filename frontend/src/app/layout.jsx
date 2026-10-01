import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { ToastProvider } from "../context/ToastContext";
import { CartProvider } from "../context/CartContext";
import AppShell from "../components/AppShell";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ruchistore.com";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Ruchi Store — 10-Minute Grocery & Essentials Delivery",
    template: "%s | Ruchi Store",
  },
  description:
    "Order fresh fruits, vegetables, dairy, snacks, beverages, and daily home essentials from your nearby local stores with ultra-fast 10-15 minute doorstep delivery.",
  keywords: [
    "Ruchi Store",
    "Grocery delivery",
    "Quick commerce",
    "10 minute delivery",
    "Fresh vegetables",
    "Daily essentials",
    "Online supermarket",
    "Instant grocery delivery Hyderabad",
    "Fast grocery app",
    "Fruits and dairy online",
  ],
  authors: [{ name: "Ruchi Store", url: siteUrl }],
  creator: "Ruchi Store",
  publisher: "Ruchi Store Quick Commerce",
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "Ruchi Store",
    title: "Ruchi Store — 10-Minute Grocery & Essentials Delivery",
    description:
      "Order fresh fruits, vegetables, dairy, snacks, and daily essentials with ultra-fast 10-15 minute doorstep delivery.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ruchi Store — 10-Minute Grocery Delivery",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ruchi Store — 10-Minute Grocery & Essentials Delivery",
    description:
      "Get farm-fresh fruits, vegetables, dairy, and household essentials at your door in minutes.",
    images: ["/og-image.png"],
    creator: "@ruchistore",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
};

// Organization & WebSite JSON-LD Schema
const jsonLdData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "Ruchi Store",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.png`,
        caption: "Ruchi Store Logo",
      },
      sameAs: [
        "https://twitter.com/ruchistore",
        "https://www.facebook.com/ruchistore",
        "https://www.instagram.com/ruchistore",
      ],
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+91-9999999999",
        contactType: "customer service",
        areaServed: "IN",
        availableLanguage: ["en", "hi", "te"],
      },
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "Ruchi Store",
      description: "10-Minute Grocery & Essentials Delivery Platform",
      publisher: {
        "@id": `${siteUrl}/#organization`,
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body
        className="antialiased selection:bg-emerald-500 selection:text-white"
        suppressHydrationWarning
      >
        <AuthProvider>
          <ToastProvider>
            <CartProvider>
              <AppShell>{children}</AppShell>
            </CartProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
