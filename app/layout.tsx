import type { Metadata } from "next"
import { Geist } from "next/font/google"

import "./globals.css"
import { FondoPagina } from "@/components/fondo-pagina"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Presupuesta mi web",
  description:
    "Describe tu proyecto, revisa los servicios que te proponemos y descarga tu presupuesto en PDF.",
}

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
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
      className={cn("font-sans antialiased", geist.variable)}
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
