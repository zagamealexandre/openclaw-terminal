import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono, Playfair_Display, Press_Start_2P } from "next/font/google";
import { getServerSession } from "next-auth";

import "./globals.css";

import { AuthSessionProvider } from "@/components/auth-session-provider";
import { authOptions } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const pressStart = Press_Start_2P({
  variable: "--font-press",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Context Vault",
  description: "Private interface to capture ideas, projects, and context.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${pressStart.variable} retro-body`}
      >
        <AuthSessionProvider session={session}>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
