import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Timestamp Notes",
  description: "Take notes with editable timestamps",
  generator: "mehraDotDev",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/github-fork-ribbon-css/0.2.3/gh-fork-ribbon.min.css"
        />
      </head>
      <body className={inter.className}>
        <a
          className="github-fork-ribbon"
          href="https://github.com/mehradotdev/timestamp-notes"
          target="_blank"
          data-ribbon="View code on GitHub"
          title="View code on GitHub"
        >
          View code on GitHub
        </a>
        {children}
      </body>
    </html>
  );
}
