"use client"

import * as React from "react"
import { ChartBarIcon, TableIcon } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { formatearEuros, type LineaPresupuesto } from "@/lib/api"
import { cn } from "@/lib/utils"

const NOMBRE_CLASE: Record<string, string> = {
  base: "Servicio base",
  paginas: "Páginas adicionales",
  extra: "Extra",
}

// Espacio reservado a la derecha de cada barra para escribir el importe en su punta.
const RESERVA = "6.5rem"

/**
 * Barras horizontales ordenadas de mayor a menor importe, de un solo tono (el acento):
 * comparan los importes sobre una misma línea base. Cada barra dice de dónde sale
 * (clase de servicio y cálculo del servidor), de modo que la identidad nunca depende solo
 * del color. Incluye una vista alternativa en tabla.
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
                <div className="relative h-5" role="presentation">
                  {/* Pista tenue sobre la misma línea base */}
                  <div
                    className="absolute inset-y-[7px] left-0 rounded-r-[4px] bg-black/[0.06] dark:bg-white/10"
                    style={{ right: RESERVA }}
                  />
                  {/* Barra: base recta, extremo de datos redondeado 4 px */}
                  <div
                    className={cn(
                      "absolute inset-y-[5px] left-0 rounded-r-[4px] bg-primary",
                      "transition-[width] duration-700 ease-out"
                    )}
                    style={{ width: `calc((100% - ${RESERVA}) * ${fraccion})`, minWidth: l.importe > 0 ? 4 : 0 }}
                  />
                  {/* Valor en la punta */}
                  <span
                    className="absolute top-0 flex h-5 items-center text-sm font-semibold tabular-nums transition-[left] duration-700 ease-out"
                    style={{ left: `calc((100% - ${RESERVA}) * ${fraccion} + 0.5rem)` }}
                  >
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
