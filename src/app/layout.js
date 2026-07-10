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
  other: {
    "theme-color": "#000000",
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
  <head>
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="default" />
    <meta name="apple-mobile-web-app-title" content="Project Manager" />
    <link rel="apple-touch-icon" href="/logo.png" />
    <link rel="icon" type="image/png" href="/favicon.png" />
  </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

export const dynamic = "force-dynamic"
