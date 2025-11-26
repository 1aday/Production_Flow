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

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://production-flow-nine.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "As You Wish — Turn One Sentence Into a Complete Show Bible",
    template: "%s | As You Wish",
  },
  description:
    "Create complete TV show bibles in minutes. AI-powered character design, visual aesthetics, trailers, and production documents. From idea to pitch-ready in one click.",
  keywords: [
    "AI show bible generator",
    "TV show pitch",
    "character design AI",
    "production bible creator",
    "show development tool",
    "AI storytelling",
    "visual development",
    "show concept generator",
    "TV pitch deck",
    "character portrait AI",
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
    title: "As You Wish — Turn One Sentence Into a Complete Show Bible",
    description:
      "Create complete TV show bibles in minutes. AI-powered character design, visual aesthetics, trailers, and production documents. From idea to pitch-ready in one click.",
    images: [
      {
        url: `${baseUrl}/api/og?title=As%20You%20Wish&genre=AI%20Show%20Bible%20Generator&logline=Turn%20one%20sentence%20into%20a%20complete%20show%20bible%20with%20characters%2C%20visuals%2C%20and%20trailers`,
        width: 1200,
        height: 630,
        alt: "As You Wish - AI Show Bible Generator",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "As You Wish — Turn One Sentence Into a Complete Show Bible",
    description:
      "Create complete TV show bibles in minutes. AI-powered character design, visual aesthetics, trailers, and production documents.",
    images: [`${baseUrl}/api/og?title=As%20You%20Wish&genre=AI%20Show%20Bible%20Generator&logline=Turn%20one%20sentence%20into%20a%20complete%20show%20bible%20with%20characters%2C%20visuals%2C%20and%20trailers`],
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
