"use client"

import { ArrowLeftIcon, ArrowRightIcon, WarningIcon } from "@phosphor-icons/react"

import { Caja } from "@/components/caja"
import { FilaParametro, FilaServicio } from "@/components/presupuesto/fila-servicio"
import { Button } from "@/components/ui/button"
import type { Catalogo } from "@/lib/api"

interface Props {
  catalogo: Catalogo
  /** Ids sugeridos por la IA con su justificación. */
  sugeridos: Record<string, string>
  activos: Record<string, boolean>
  paginas: string
  onAlternar: (id: string, activo: boolean) => void
  onPaginas: (valor: string) => void
  onVolver: () => void
  onContinuar: () => void
  /** Motivos por los que todavía no se puede continuar (vacío = se puede). */
  bloqueos: string[]
}

/** Paso 3: todo el catálogo. Lo sugerido arriba; debajo, lo que se puede añadir. */
export function PasoSeleccion({
  catalogo,
  sugeridos,
  activos,
  paginas,
  onAlternar,
  onPaginas,
  onVolver,
  onContinuar,
  bloqueos,
}: Props) {
  const delAsistente = catalogo.servicios.filter((s) => s.id in sugeridos)
  const otros = catalogo.servicios.filter((s) => !(s.id in sugeridos))

  function lista(servicios: typeof catalogo.servicios, esSugerido: boolean) {
    return (
      <ul className="grupo-filas bg-white/40 dark:bg-white/[0.03]">
        {servicios.map((s) => {
          const activo = !!activos[s.id]
          return (
            <li key={s.id}>
              <FilaServicio
                servicio={s}
                texto={esSugerido ? sugeridos[s.id] : s.descripcion}
                activo={activo}
                moneda={catalogo.moneda}
                etiqueta={esSugerido ? "Sugerido" : undefined}
                onCambio={(v) => onAlternar(s.id, v)}
              />
              {activo && <FilaParametro servicio={s} valor={paginas} onCambio={onPaginas} />}
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <div className="space-y-5">
      {delAsistente.length > 0 && (
        <Caja titulo="Sugeridos por el asistente">
          <div className="p-3 sm:p-4">{lista(delAsistente, true)}</div>
        </Caja>
      )}

      {otros.length > 0 && (
        <Caja titulo={delAsistente.length > 0 ? "Añade lo que quieras" : "Elige tus servicios"}>
          <div className="space-y-3 p-3 sm:p-4">
            {lista(otros, false)}
            <p className="px-1 text-xs text-muted-foreground">
              Los servicios base son excluyentes: al elegir uno, se quita el otro.
            </p>
          </div>
        </Caja>
      )}

      {bloqueos.length > 0 && (
        <p
          role="status"
          className="flex items-start gap-2 px-1 text-sm text-amber-700 dark:text-amber-300"
        >
          <WarningIcon weight="bold" className="mt-0.5 size-4 shrink-0" aria-hidden />
          {bloqueos.join(" ")}
        </p>
      )}

      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="outline" onClick={onVolver}>
          <ArrowLeftIcon weight="bold" aria-hidden />
          Volver a las sugerencias
        </Button>
        <Button size="lg" onClick={onContinuar} disabled={bloqueos.length > 0}>
          Ver mi presupuesto
          <ArrowRightIcon weight="bold" aria-hidden />
        </Button>
      </div>
    </div>
  )
}
