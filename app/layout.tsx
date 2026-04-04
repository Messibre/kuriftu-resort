import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import { ReactQueryProvider } from "@/components/react-query-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Gezana Solution Admin Dashboard",
  description: "Resort Management System - AI Powered",
  generator: "Gezana Solution",
  icons: {
    icon: [
      {
        url: "/Gezana.jpg",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/Gezana.jpg",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/Gezana.jpg",
        type: "image/jpeg",
      },
    ],
    apple: "/Gezana.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ReactQueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </ReactQueryProvider>
        <Analytics />
      </body>
    </html>
  );
}
