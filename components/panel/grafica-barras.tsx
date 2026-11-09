"use client"

import * as React from "react"
import { ChartBarIcon, TableIcon } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { formatearEuros, type LineaPresupuesto } from "@/lib/api"

const NOMBRE_CLASE: Record<string, string> = {
  base: "Servicio base",
  paginas: "Páginas adicionales",
  extra: "Extra",
}

/**
 * Barras horizontales ordenadas de mayor a menor importe, de un solo tono (el acento):
 * comparan los importes sobre una misma línea base y todas las cifras van alineadas a la
 * derecha, en una columna. Cada barra dice de dónde sale (clase de servicio y cálculo del
 * servidor), de modo que la identidad nunca depende solo del color. Incluye una vista
 * alternativa en tabla.
 *
 * Los importes vienen del servidor; aquí solo se dibujan.
 */
export function GraficaBarras({
  lineas,
  moneda,
}: {
  lineas: LineaPresupuesto[]
  moneda: string
}) {
  const [tabla, setTabla] = React.useState(false)
  const [listo, setListo] = React.useState(false)

  // Las barras crecen desde cero al aparecer (se desactiva con «reducir movimiento»).
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setListo(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const ordenadas = [...lineas].sort((a, b) => b.importe - a.importe)
  const maximo = Math.max(1, ...lineas.map((l) => l.importe))
  const euros = (n: number) => formatearEuros(n, moneda, true)

  return (
    <figure className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <figcaption className="texto-seccion">
          Importe de cada servicio, de mayor a menor
        </figcaption>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTabla((v) => !v)}
          aria-pressed={tabla}
        >
          {tabla ? (
            <ChartBarIcon weight="bold" aria-hidden />
          ) : (
            <TableIcon weight="bold" aria-hidden />
          )}
          {tabla ? "Ver gráfica" : "Ver como tabla"}
        </Button>
      </div>

      {tabla ? (
        <div className="overflow-x-auto rounded-xl bg-white/40 dark:bg-white/[0.03]">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead>
              <tr className="border-b border-black/[0.06] dark:border-white/10">
                <th className="texto-seccion px-4 py-2.5 font-medium">Servicio</th>
                <th className="texto-seccion px-4 py-2.5 font-medium">De dónde sale</th>
                <th className="texto-seccion px-4 py-2.5 text-right font-medium">Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.06] dark:divide-white/10">
              {ordenadas.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3 font-medium">{l.nombre}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {NOMBRE_CLASE[l.clase]} · {l.calculo}
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {euros(l.importe)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ul
          aria-label="Gráfica de barras con el importe de cada servicio"
          className="space-y-5 rounded-xl bg-white/40 p-4 dark:bg-white/[0.03]"
        >
          {ordenadas.map((l) => {
            const fraccion = listo ? l.importe / maximo : 0
            return (
              <li
                key={l.id}
                title={`${l.nombre}: ${euros(l.importe)} · ${l.calculo}`}
                className="space-y-1.5"
              >
                <p className="texto-encabezado">{l.nombre}</p>
                <div className="flex items-center gap-4" role="presentation">
                  {/* Pista tenue y barra sobre la misma línea base (base recta, extremo redondeado 4 px) */}
                  <div className="relative h-2.5 flex-1 overflow-hidden rounded-r-[4px] bg-black/[0.06] dark:bg-white/10">
                    <div
                      className="absolute inset-y-0 left-0 rounded-r-[4px] bg-primary transition-[width] duration-700 ease-out"
                      style={{ width: `${fraccion * 100}%`, minWidth: l.importe > 0 ? 4 : 0 }}
                    />
                  </div>
                  {/* Importe: columna fija, alineada a la derecha del todo */}
                  <span className="w-28 shrink-0 text-right text-sm font-semibold tabular-nums">
                    {euros(l.importe)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">{NOMBRE_CLASE[l.clase]}</span> · {l.calculo}
                </p>
              </li>
            )
          })}
        </ul>
      )}
    </figure>
  )
}
