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

export const metadata: Metadata = {
  title: "Production Flow — AI Show Bible Generator",
  description:
    "Transform ideas into complete visual production bibles with AI-powered characters, aesthetics, and trailers.",
  themeColor: "#090909",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Production Flow",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
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
