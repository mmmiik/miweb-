import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/** Caja de vidrio con cabecera h-11 y borde inferior (rounded-2xl). */
export function Caja({
  titulo,
  icono,
  accion,
  opaca = false,
  className,
  children,
}: {
  titulo: string
  icono?: ReactNode
  accion?: ReactNode
  opaca?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl",
        opaca ? "vidrio-opaco" : "vidrio",
        className
      )}
    >
      <header className="caja-cabecera">
        <h2 className="texto-encabezado flex items-center gap-2">
          {icono}
          {titulo}
        </h2>
        {accion}
      </header>
      {children}
    </section>
  )
}
