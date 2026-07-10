import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/layout/Providers"

const inter = Inter({
  subsets: ["latin"],
})

export const metadata = {
  title: "Project Manager",
  description:
    "A modern system for managing your projects efficiently.",
  manifest: "/manifest.webmanifest",
  icons: {
    apple: [
      { url: "/logo-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/logo-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    icon: { url: "/favicon.png", type: "image/png" },
  },
  other: {
    "theme-color": "#000000",
    "mobile-web-app-capable": "yes",
    "application-name": "Project Manager",
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
  <head>
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

export const dynamic = "force-dynamic"
