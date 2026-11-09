"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { formatearEuros, type ServicioCatalogo } from "@/lib/api"

/** Texto del precio tal como lo publica el catálogo del servidor (no se calcula nada). */
export function textoPrecio(s: ServicioCatalogo, moneda: string): string | null {
  if (s.precio !== undefined) return formatearEuros(s.precio, moneda)
  if (s.precioUnitario !== undefined) return `${formatearEuros(s.precioUnitario, moneda)} / página`
  return null
}

/** Fila estilo Ajustes de iOS: nombre, texto de apoyo, precio de catálogo e interruptor. */
export function FilaServicio({
  servicio,
  texto,
  activo,
  moneda,
  etiqueta,
  onCambio,
}: {
  servicio: ServicioCatalogo
  texto: string
  activo: boolean
  moneda: string
  /** Pequeña marca opcional, p. ej. «Sugerido». */
  etiqueta?: string
  onCambio: (activo: boolean) => void
}) {
  const nombreId = `servicio-${servicio.id}`
  const precio = textoPrecio(servicio, moneda)
  return (
    <div className="fila py-3">
      <div className="min-w-0 flex-1">
        <p id={nombreId} className="texto-encabezado flex flex-wrap items-center gap-2">
          {servicio.nombre}
          {etiqueta && (
            <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[0.6875rem] font-medium text-primary">
              {etiqueta}
            </span>
          )}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">{texto}</p>
      </div>
      {precio && (
        <span className="hidden shrink-0 text-xs text-muted-foreground tabular-nums sm:block">
          {precio}
        </span>
      )}
      <Switch checked={activo} onCheckedChange={onCambio} aria-labelledby={nombreId} />
    </div>
  )
}

/** Campo para un parámetro que falta (hoy, el nº total de páginas). Bloquea «Continuar» hasta completarlo. */
export function FilaParametro({
  servicio,
  valor,
  onCambio,
}: {
  servicio: ServicioCatalogo
  valor: string
  onCambio: (v: string) => void
}) {
  return (
    <>
      {servicio.parametros.map((p) => {
        const num = Number(valor)
        const invalido = valor.trim() === "" || !Number.isInteger(num) || num < p.min || num > p.max
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
              value={valor}
              onChange={(e) => onCambio(e.target.value)}
              aria-invalid={invalido}
              className="w-24 text-right tabular-nums"
            />
          </div>
        )
      })}
    </>
  )
}
