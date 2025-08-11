import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/app/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Visionairy - AI Image Party Game",
  description: "Generate hilarious AI images with DALL-E in this multiplayer party game. Create a room, invite friends, and let creativity reign!",
  keywords: ["AI", "party game", "multiplayer", "DALL-E", "image generation", "creative", "friends"],
  authors: [{ name: "Visionairy" }],
  creator: "Visionairy",
  openGraph: {
    title: "Visionairy - AI Image Party Game",
    description: "The ultimate AI-powered party game for you and your friends",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Visionairy - AI Image Party Game",
    description: "The ultimate AI-powered party game for you and your friends",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/convex.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}