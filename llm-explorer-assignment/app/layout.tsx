import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LLM Explorer",
  description: "Explore, refine, and manage LLM-generated content",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-gray-50 text-gray-900 font-sans">
        {children}
      </body>
    </html>
  );
}
