import type { Metadata } from "next";
import "./globals.css";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { EVENT } from "@/app/data/event";

const description = `A LAN-style Free Fire squad tournament for Grade 11 and 12 students from any college, hosted at ${EVENT.college} and organised by the ${EVENT.organiser}.`;

export const metadata: Metadata = {
  title: {
    default: `${EVENT.name} | ${EVENT.organiser}`,
    template: `%s | ${EVENT.name}`,
  },
  description,
  icons: { icon: "/gss-it-club-logo.png" },
  openGraph: {
    type: "website",
    siteName: EVENT.name,
    title: EVENT.name,
    description,
    images: [{ url: "/gss-it-club-logo.png", width: 420, height: 420 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`bg-white ${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="flex min-h-screen flex-col overflow-x-clip bg-white font-sans text-[#262626] antialiased">
        {children}
      </body>
    </html>
  );
}
