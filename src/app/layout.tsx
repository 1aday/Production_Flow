import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Display font - Bold, modern, Netflix/Apple style
const inter = Inter({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

// Mono font - For code/technical content
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL 
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
  || "https://production-flow-nine.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "As You Wish — AI Show Bible Generator",
    template: "%s | As You Wish",
  },
  description:
    "Transform ideas into complete visual production bibles with AI-powered characters, aesthetics, and trailers.",
  keywords: [
    "AI show bible",
    "production bible",
    "character design",
    "show development",
    "TV production",
    "character generator",
    "AI storytelling",
    "production flow",
  ],
  authors: [{ name: "As You Wish" }],
  creator: "As You Wish",
  publisher: "As You Wish",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "As You Wish",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "As You Wish",
    title: "As You Wish — AI Show Bible Generator",
    description:
      "Transform ideas into complete visual production bibles with AI-powered characters, aesthetics, and trailers.",
    images: [
      {
        url: "/og-image-temp.webp",
        width: 1200,
        height: 630,
        alt: "As You Wish - AI Show Bible Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "As You Wish — AI Show Bible Generator",
    description:
      "Transform ideas into complete visual production bibles with AI-powered characters, aesthetics, and trailers.",
    images: ["/og-image-temp.webp"],
    creator: "@asyouwish",
    site: "@asyouwish",
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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#090909",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-display antialiased`}
        style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', margin: 0, padding: 0 }}
      >
        {children}
      </body>
    </html>
  );
}
