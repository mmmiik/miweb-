import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { FondoPagina } from "@/components/fondo-pagina"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Presupuesta mi web",
  description:
    "Describe tu proyecto, revisa los servicios que te proponemos y descarga tu presupuesto en PDF.",
}

// Geist como fuente variable completa (100–900): permite desde el trazo fino hasta el negro del hero.
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn("font-sans antialiased", geist.variable, geistMono.variable)}
    >
      <body>
        <ThemeProvider defaultTheme="system">
          <FondoPagina />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
