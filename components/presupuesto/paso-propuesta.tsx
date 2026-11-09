"use client"

import * as React from "react"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  PlusIcon,
  SpinnerGapIcon,
  WarningIcon,
  XIcon,
} from "@phosphor-icons/react"

import { Aviso } from "@/components/aviso"
import { Caja } from "@/components/caja"
import type {
  CatalogoPorId,
  EstadoPropuesta,
  ItemServicio,
} from "@/components/presupuesto/tipos"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { formatearEuros, type Catalogo, type ServicioCatalogo } from "@/lib/api"

interface Props {
  estado: EstadoPropuesta
  catalogo: Catalogo | null
  catalogoPorId: CatalogoPorId
  items: ItemServicio[]
  activos: Record<string, boolean>
  paginas: string
  onAlternar: (id: string, activo: boolean) => void
  onAnadir: (id: string) => void
  onPaginas: (valor: string) => void
  onReintentar: () => void
  onVolver: () => void
  onContinuar: () => void
  /** Motivos por los que todavía no se puede continuar (vacío = se puede). */
  bloqueos: string[]
  resumen?: string
  pendientes?: string[]
  avisos?: string[]
}

export function PasoPropuesta(props: Props) {
  const { estado } = props

  if (estado.fase === "cargando") {
    return (
      <Caja titulo="Propuesta de servicios">
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-3 px-6 py-16 text-center"
        >
          <SpinnerGapIcon weight="bold" className="size-7 animate-spin text-primary" aria-hidden />
          <p className="texto-encabezado">Analizando tu proyecto…</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Estamos buscando en el catálogo los servicios que encajan con lo que has contado.
            Suele tardar unos segundos.
          </p>
        </div>
      </Caja>
    )
  }

  if (estado.fase === "error") {
    return (
      <Caja titulo="Propuesta de servicios">
        <div className="space-y-4 p-4 sm:p-6">
          <Aviso tipo="error" titulo="No hemos podido obtener la propuesta">
            {estado.mensaje}
          </Aviso>
          <p className="text-sm text-muted-foreground">
            Lo que has escrito se conserva. Puedes reintentarlo o editar la solicitud.
          </p>
          <div className="flex flex-wrap justify-between gap-2">
            <Button variant="outline" onClick={props.onVolver}>
              <ArrowLeftIcon weight="bold" aria-hidden />
              Editar solicitud
            </Button>
            <Button onClick={props.onReintentar}>Reintentar</Button>
          </div>
        </div>
      </Caja>
    )
  }

  return <Lista {...props} />
}

function Lista({
  catalogo,
  catalogoPorId,
  items,
  activos,
  paginas,
  onAlternar,
  onAnadir,
  onPaginas,
  onVolver,
  onContinuar,
  bloqueos,
  resumen,
  pendientes = [],
  avisos = [],
}: Props) {
  const [anadiendo, setAnadiendo] = React.useState(false)
  const moneda = catalogo?.moneda ?? "EUR"
  const disponibles: ServicioCatalogo[] = (catalogo?.servicios ?? []).filter(
    (s) => !items.some((i) => i.id === s.id)
  )

  return (
    <div className="space-y-5">
      {resumen && (
        <Caja titulo="Resumen del proyecto">
          <p className="p-4 text-sm leading-relaxed sm:px-6">{resumen}</p>
        </Caja>
      )}

      <Caja titulo="Servicios propuestos">
        <div className="space-y-4 p-3 sm:p-4">
          {items.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              La propuesta no incluye ningún servicio del catálogo. Añade alguno para continuar.
            </p>
          ) : (
            <ul className="grupo-filas bg-white/40 dark:bg-white/[0.03]">
              {items.map((item) => {
                const s = catalogoPorId[item.id]
                const activo = !!activos[item.id]
                const nombreId = `servicio-${item.id}`
                return (
                  <li key={item.id}>
                    <div className="fila py-3">
                      <div className="min-w-0 flex-1">
                        <p id={nombreId} className="texto-encabezado">
                          {s?.nombre ?? item.id}
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {item.justificacion ?? s?.descripcion}
                        </p>
                      </div>
                      {s && (
                        <span className="hidden shrink-0 text-xs text-muted-foreground tabular-nums sm:block">
                          {s.precio !== undefined
                            ? formatearEuros(s.precio, moneda)
                            : s.precioUnitario !== undefined
                              ? `${formatearEuros(s.precioUnitario, moneda)} / página`
                              : null}
                        </span>
                      )}
                      <Switch
                        checked={activo}
                        onCheckedChange={(v) => onAlternar(item.id, v)}
                        aria-labelledby={nombreId}
                      />
                    </div>

                    {activo &&
                      s?.parametros.map((p) => {
                        const num = Number(paginas)
                        const invalido =
                          paginas.trim() === "" ||
                          !Number.isInteger(num) ||
                          num < p.min ||
                          num > p.max
                        return (
                          <div
                            key={p.nombre}
                            className="flex flex-wrap items-center gap-3 bg-amber-500/[0.06] px-4 py-3"
                          >
                            <div className="min-w-0 flex-1">
                              <Label htmlFor={`param-${p.nombre}`} className="texto-encabezado">
                                Número total de páginas
                              </Label>
                              <p className="text-xs text-muted-foreground">
                                Entre {p.min} y {p.max}. La primera está incluida en el servicio base.
                              </p>
                            </div>
                            <Input
                              id={`param-${p.nombre}`}
                              type="number"
                              inputMode="numeric"
                              min={p.min}
                              max={p.max}
                              step={1}
                              value={paginas}
                              onChange={(e) => onPaginas(e.target.value)}
                              aria-invalid={invalido}
                              className="w-24 text-right tabular-nums"
                            />
                          </div>
                        )
                      })}
                  </li>
                )
              })}
            </ul>
          )}

          {disponibles.length > 0 && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAnadiendo((v) => !v)}
                aria-expanded={anadiendo}
                className="min-h-11"
              >
                {anadiendo ? (
                  <XIcon weight="bold" aria-hidden />
                ) : (
                  <PlusIcon weight="bold" aria-hidden />
                )}
                {anadiendo ? "Cerrar" : "Añadir servicio"}
              </Button>

              {anadiendo && (
                <ul className="grupo-filas mt-2 bg-white/40 dark:bg-white/[0.03]">
                  {disponibles.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onAnadir(s.id)
                          if (disponibles.length === 1) setAnadiendo(false)
                        }}
                        className="fila foco w-full py-3 text-left"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="texto-encabezado block">{s.nombre}</span>
                          <span className="mt-0.5 block text-sm text-muted-foreground">
                            {s.descripcion}
                          </span>
                        </span>
                        <PlusIcon weight="bold" className="size-4 shrink-0 text-primary" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
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
            Aparecerán en el PDF como aspectos pendientes de concretar. No suman importe.
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
          Editar solicitud
        </Button>
        <Button size="lg" onClick={onContinuar} disabled={bloqueos.length > 0}>
          Continuar
          <ArrowRightIcon weight="bold" aria-hidden />
        </Button>
      </div>
    </div>
  )
}
