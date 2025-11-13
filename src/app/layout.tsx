import type { Metadata } from "next";
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
  description: "Transform ideas into complete visual production bibles with AI-powered characters, aesthetics, and trailers.",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: "cover",
  },
  themeColor: "#090909",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Production Flow",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-display antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
