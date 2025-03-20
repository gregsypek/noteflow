import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";

const inter = localFont({
  src: "./fonts/InterVF.ttf",
  variable: "--font-inter",
  weight: "100 200 300 400 500 700 800 900",
});

const SquadaOne = localFont({
  src: "./fonts/SquadaOne.ttf",
  variable: "--font-squada",
  weight: "400",
});

export const metadata: Metadata = {
  title: "NoteFlow",
  description:
    "Create, organize, and perfect your notes effortlessly with NoteFlow – your ultimate tool for streamlined note-taking and productivity.",
  icons: {
    icon: "/images/site-logo.svg",
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${SquadaOne.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
