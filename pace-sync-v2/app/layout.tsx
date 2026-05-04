import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";

import { AppShell } from "@/components/app-shell";
import { isLoggedIn } from "@/lib/auth/session";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pacelist",
  description: "Map your Spotify playlist to race pace.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authenticated = await isLoggedIn();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AppShell authenticated={authenticated}>{children}</AppShell>
        <Toaster
          position="top-center"
          toastOptions={{
            classNames: {
              toast: "border-stone-200 bg-background text-foreground shadow-lg",
              description: "text-stone-700",
            },
          }}
        />
      </body>
    </html>
  );
}
