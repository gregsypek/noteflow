import type { Metadata } from "next";
import localFont from "next/font/local";

import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";

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
const RootLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const session = await auth();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/devicon.min.css"
          type="text/css"
        />
      </head>
      <SessionProvider session={session}>
        <body
          className={`${inter.className} ${SquadaOne.variable} antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
          <Toaster />
        </body>
      </SessionProvider>
    </html>
  );
};

export default RootLayout;
