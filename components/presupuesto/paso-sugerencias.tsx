"use client"

import { ArrowLeftIcon, ArrowRightIcon, SpinnerGapIcon } from "@phosphor-icons/react"

import { Aviso } from "@/components/aviso"
import { Caja } from "@/components/caja"
import { FilaServicio } from "@/components/presupuesto/fila-servicio"
import type { CatalogoPorId, EstadoPropuesta } from "@/components/presupuesto/tipos"
import { Button } from "@/components/ui/button"

interface Props {
  estado: EstadoPropuesta
  catalogoPorId: CatalogoPorId
  moneda: string
  activos: Record<string, boolean>
  onAlternar: (id: string, activo: boolean) => void
  onReintentar: () => void
  onVolver: () => void
  onContinuar: () => void
}

/** Paso 2: lo que la IA sugiere para tu idea (con su justificación). Aquí solo se acepta o se quita. */
export function PasoSugerencias({
  estado,
  catalogoPorId,
  moneda,
  activos,
  onAlternar,
  onReintentar,
  onVolver,
  onContinuar,
}: Props) {
  if (estado.fase === "cargando") {
    return (
      <Caja titulo="Lo que te sugerimos">
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-3 px-6 py-16 text-center"
        >
          <SpinnerGapIcon weight="bold" className="size-7 animate-spin text-primary" aria-hidden />
          <p className="texto-encabezado">Analizando tu idea…</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            El asistente está buscando en el catálogo los servicios que encajan con lo que has
            contado. Suele tardar unos segundos.
          </p>
        </div>
      </Caja>
    )
  }

  if (estado.fase === "error") {
    return (
      <Caja titulo="Lo que te sugerimos">
        <div className="space-y-4 p-4 sm:p-6">
          <Aviso tipo="error" titulo="No hemos podido obtener las sugerencias">
            {estado.mensaje}
          </Aviso>
          <p className="text-sm text-muted-foreground">
            Lo que has escrito se conserva. Puedes reintentarlo o editar tu idea.
          </p>
          <div className="flex flex-wrap justify-between gap-2">
            <Button variant="outline" onClick={onVolver}>
              <ArrowLeftIcon weight="bold" aria-hidden />
              Editar mi idea
            </Button>
            <Button onClick={onReintentar}>Reintentar</Button>
          </div>
        </div>
      </Caja>
    )
  }

  const { resumen, servicios, pendientes, avisos } = estado.datos
  const sugeridos = servicios.filter((s) => catalogoPorId[s.id])

  return (
    <div className="space-y-5">
      <Caja titulo="Así hemos entendido tu idea">
        <p className="p-4 text-sm leading-relaxed sm:px-6">{resumen}</p>
      </Caja>

      <Caja titulo="Lo que te sugerimos">
        <div className="space-y-3 p-3 sm:p-4">
          {sugeridos.length === 0 ? (
            <Aviso tipo="info" titulo="Todavía no hay servicios claros para tu idea">
              Con lo que nos has contado no podemos proponer nada del catálogo. Mira las dudas de
              abajo; en el siguiente paso podrás elegir tú los servicios.
            </Aviso>
          ) : (
            <ul className="grupo-filas bg-white/40 dark:bg-white/[0.03]">
              {sugeridos.map((s) => (
                <li key={s.id}>
                  <FilaServicio
                    servicio={catalogoPorId[s.id]}
                    texto={s.justificacion}
                    activo={!!activos[s.id]}
                    moneda={moneda}
                    onCambio={(v) => onAlternar(s.id, v)}
                  />
                </li>
              ))}
            </ul>
          )}
          <p className="px-1 text-xs text-muted-foreground">
            Puedes quitar lo que no te convenza. En el siguiente paso añades lo que quieras.
          </p>
        </div>
      </Caja>

      {pendientes.length > 0 && (
        <Aviso tipo="aviso" titulo="Pendientes de aclarar">
          <ul className="list-disc space-y-1 pl-4">
            {pendientes.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs opacity-80">
            Son dudas para que lo tengas todo claro antes de continuar. No suman importe y no aparecen en el PDF.
          </p>
        </Aviso>
      )}

      {avisos.length > 0 && (
        <Aviso tipo="info" titulo="Ajustes automáticos">
          <ul className="list-disc space-y-1 pl-4">
            {avisos.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </Aviso>
      )}

      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="outline" onClick={onVolver}>
          <ArrowLeftIcon weight="bold" aria-hidden />
          Editar mi idea
        </Button>
        <Button size="lg" onClick={onContinuar}>
          Elegir mis servicios
          <ArrowRightIcon weight="bold" aria-hidden />
        </Button>
      </div>
    </div>
  )
}
