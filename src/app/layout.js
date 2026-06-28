import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/layout/Providers"

const inter = Inter({
  subsets: ["latin"],
})

export const metadata = {
  title: "NanoPiCode - Project Management System",
  description:
    "A modern project management system for managing your projects efficiently.",
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

export const dynamic = "force-dynamic"
