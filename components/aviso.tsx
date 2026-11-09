import type { ReactNode } from "react"
import {
  CheckCircleIcon,
  InfoIcon,
  WarningIcon,
  XCircleIcon,
} from "@phosphor-icons/react"

import { cn } from "@/lib/utils"

// Estados solo suaves, siempre con icono + texto: sky (en curso), emerald (correcto),
// red (error), amber (aviso). Los neutros usan "bold"; completado/error, "fill".
const ESTILOS = {
  info: {
    caja: "border-sky-500/20 bg-sky-500/10 text-sky-900 dark:text-sky-200",
    Icono: InfoIcon,
    peso: "bold",
  },
  correcto: {
    caja: "border-emerald-500/20 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200",
    Icono: CheckCircleIcon,
    peso: "fill",
  },
  error: {
    caja: "border-red-500/20 bg-red-500/10 text-red-900 dark:text-red-200",
    Icono: XCircleIcon,
    peso: "fill",
  },
  aviso: {
    caja: "border-amber-500/25 bg-amber-500/10 text-amber-900 dark:text-amber-200",
    Icono: WarningIcon,
    peso: "bold",
  },
} as const

export type TipoAviso = keyof typeof ESTILOS

export function Aviso({
  tipo,
  titulo,
  children,
  accion,
  className,
}: {
  tipo: TipoAviso
  titulo?: string
  children?: ReactNode
  accion?: ReactNode
  className?: string
}) {
  const { caja, Icono, peso } = ESTILOS[tipo]
  return (
    <div
      role={tipo === "error" ? "alert" : "status"}
      className={cn(
        "flex flex-wrap items-start gap-3 rounded-xl border px-4 py-3 text-sm sm:flex-nowrap",
        caja,
        className
      )}
    >
      <Icono weight={peso} className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-[12rem] flex-1 space-y-1">
        {titulo && <p className="texto-encabezado">{titulo}</p>}
        {children && <div className="leading-relaxed">{children}</div>}
      </div>
      {accion && <div className="ml-7 sm:ml-0">{accion}</div>}
    </div>
  )
}
