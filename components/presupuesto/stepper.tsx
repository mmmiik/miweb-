"use client"

import { CheckIcon } from "@phosphor-icons/react"

import type { Paso } from "@/components/presupuesto/tipos"
import { cn } from "@/lib/utils"

const PASOS: { n: Paso; nombre: string }[] = [
  { n: 1, nombre: "Tu idea" },
  { n: 2, nombre: "Sugerencias" },
  { n: 3, nombre: "Tu selección" },
  { n: 4, nombre: "Presupuesto" },
]

/** Indicador de los 3 pasos. Los ya completados se pueden pulsar para volver. */
export function Stepper({
  paso,
  maximo,
  onIr,
}: {
  paso: Paso
  /** Último paso alcanzado: no se puede saltar hacia delante. */
  maximo: Paso
  onIr: (paso: Paso) => void
}) {
  return (
    <nav aria-label="Pasos del asistente">
      <ol className="flex items-center gap-2">
        {PASOS.map(({ n, nombre }, i) => {
          const actual = n === paso
          const hecho = n < paso
          const accesible = n <= maximo && !actual
          return (
            <li key={n} className="flex flex-1 items-center gap-2 last:flex-none">
              <button
                type="button"
                disabled={!accesible}
                onClick={() => onIr(n)}
                aria-current={actual ? "step" : undefined}
                className={cn(
                  "foco flex min-h-11 items-center gap-2.5 rounded-xl pr-2 text-left",
                  accesible && "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums transition-colors",
                    actual && "bg-primary text-primary-foreground",
                    hecho && "bg-primary/15 text-primary",
                    !actual && !hecho && "bg-black/[0.06] text-muted-foreground dark:bg-white/10"
                  )}
                >
                  {hecho ? <CheckIcon weight="bold" className="size-3.5" aria-hidden /> : n}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    actual ? "text-foreground" : "text-muted-foreground",
                    // En móvil solo se rotula el paso actual.
                    !actual && "hidden sm:inline"
                  )}
                >
                  {nombre}
                </span>
              </button>
              {i < PASOS.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    "h-px flex-1 transition-colors",
                    hecho ? "bg-primary/40" : "bg-black/10 dark:bg-white/15"
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
