"use client"

import * as React from "react"
import {
  ArrowLeftIcon,
  DownloadSimpleIcon,
  SparkleIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react"

import { Aviso } from "@/components/aviso"
import { Caja } from "@/components/caja"
import { GraficaBarras } from "@/components/panel/grafica-barras"
import type { CasoPanel } from "@/components/presupuesto/tipos"
import { Button } from "@/components/ui/button"
import {
  confirmarServicios,
  formatearEuros,
  pedirPdf,
  type Confirmacion,
} from "@/lib/api"
import { EJEMPLOS_PANEL } from "@/lib/ejemplos"
import { cn } from "@/lib/utils"

type Seleccion = "caso" | string

interface Vista {
  titulo: string
  cliente: string
  resumen: string
  pendientes: string[]
  confirmacion: Confirmacion
}

/**
 * Panel: el presupuesto desglosado. Muestra «Mi caso» (lo que has creado en el asistente)
 * y ejemplos ya creados que el servidor presupuesta al momento, sin usar la IA.
 */
export function PanelView({
  caso,
  onIrAsistente,
}: {
  caso: CasoPanel | null
  onIrAsistente: () => void
}) {
  const [seleccion, setSeleccion] = React.useState<Seleccion>(caso ? "caso" : EJEMPLOS_PANEL[0].id)
  const [ejemplos, setEjemplos] = React.useState<Record<string, Confirmacion>>({})
  const [errores, setErrores] = React.useState<Record<string, string>>({})
  const [descargando, setDescargando] = React.useState(false)
  const [errorPdf, setErrorPdf] = React.useState<string | null>(null)

  // Presupuesta el ejemplo elegido en el servidor (una sola vez por ejemplo).
  React.useEffect(() => {
    if (seleccion === "caso" || ejemplos[seleccion] || errores[seleccion]) return
    const ej = EJEMPLOS_PANEL.find((e) => e.id === seleccion)
    if (!ej) return
    let vivo = true
    confirmarServicios({ servicios: ej.servicios.map((id) => ({ id })), paginas: ej.paginas }).then((r) => {
      if (!vivo) return
      if (r.ok) setEjemplos((p) => ({ ...p, [ej.id]: r.datos }))
      else setErrores((p) => ({ ...p, [ej.id]: r.datos.error }))
    })
    return () => {
      vivo = false
    }
  }, [seleccion, ejemplos, errores])

  const ejemplo = EJEMPLOS_PANEL.find((e) => e.id === seleccion)
  const vista: Vista | null =
    seleccion === "caso" && caso
      ? {
          titulo: "Mi caso",
          cliente: caso.cliente,
          resumen: caso.resumen,
          pendientes: caso.pendientes,
          confirmacion: caso.confirmacion,
        }
      : ejemplo && ejemplos[ejemplo.id]
        ? {
            titulo: ejemplo.titulo,
            cliente: ejemplo.cliente,
            resumen: ejemplo.resumen,
            pendientes: [],
            confirmacion: ejemplos[ejemplo.id],
          }
        : null

  function guardar(blob: Blob, nombre: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = nombre
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }

  async function descargar() {
    setErrorPdf(null)
    if (seleccion === "caso" && caso) {
      guardar(caso.pdfBlob, `${caso.numero}.pdf`)
      return
    }
    if (!ejemplo) return
    setDescargando(true)
    const r = await pedirPdf({
      cliente: ejemplo.cliente,
      resumen: ejemplo.resumen,
      servicios: ejemplo.servicios.map((id) => ({ id })),
      paginas: ejemplo.paginas,
      pendientes: [],
    })
    setDescargando(false)
    if (r.ok) guardar(r.blob, `${r.numero}.pdf`)
    else setErrorPdf(r.datos.error)
  }

  const moneda = vista?.confirmacion.moneda ?? "EUR"
  const chips: { id: Seleccion; texto: string }[] = [
    ...(caso ? [{ id: "caso" as const, texto: "Mi caso" }] : []),
    ...EJEMPLOS_PANEL.map((e) => ({ id: e.id, texto: e.titulo })),
  ]

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Panel</h1>
        <p className="text-sm text-muted-foreground">
          Mira de dónde sale cada parte del presupuesto. Los importes los calcula el servidor.
        </p>
      </div>

      {!caso && (
        <Aviso
          tipo="info"
          titulo="Aún no has creado tu propuesta"
          accion={
            <Button variant="outline" size="sm" onClick={onIrAsistente}>
              <SparkleIcon weight="bold" aria-hidden />
              Ir al asistente
            </Button>
          }
        >
          Mientras tanto, explora estos ejemplos. Cuando termines el asistente, tu caso aparecerá
          aquí.
        </Aviso>
      )}

      <div role="tablist" aria-label="Qué presupuesto ver" className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c.id}
            role="tab"
            type="button"
            aria-selected={seleccion === c.id}
            onClick={() => {
              setSeleccion(c.id)
              setErrorPdf(null)
            }}
            className={cn(
              "foco min-h-11 rounded-xl border px-4 text-sm font-medium transition-colors",
              seleccion === c.id
                ? "border-primary/50 bg-primary/10 text-foreground"
                : "border-black/10 bg-white/50 text-muted-foreground hover:text-foreground dark:border-white/10 dark:bg-white/5"
            )}
          >
            {c.texto}
          </button>
        ))}
      </div>

      {!vista ? (
        errores[seleccion] ? (
          <Aviso tipo="error" titulo="No se ha podido calcular este ejemplo">
            {errores[seleccion]}
          </Aviso>
        ) : (
          <div role="status" className="flex items-center justify-center gap-3 py-16 text-sm text-muted-foreground">
            <SpinnerGapIcon weight="bold" className="size-5 animate-spin text-primary" aria-hidden />
            Calculando…
          </div>
        )
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <Caja titulo={vista.titulo}>
            <div className="space-y-6 p-4 sm:p-6">
              <div>
                <p className="texto-seccion">Cliente</p>
                <p className="texto-titulo mt-1">{vista.cliente}</p>
                <p className="mt-1 text-sm text-muted-foreground">{vista.resumen}</p>
              </div>

              <div>
                <p className="texto-seccion">Total</p>
                <p className="mt-1 text-5xl font-semibold tracking-tight tabular-nums">
                  {formatearEuros(vista.confirmacion.total, moneda, true)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Importes calculados por el servidor. Sin impuestos aplicados.
                </p>
              </div>

              {/* De dónde viene el total: base, páginas y extras */}
              <div>
                <p className="texto-seccion mb-2">Composición del total</p>
                <ul className="grupo-filas bg-white/40 dark:bg-white/[0.03]">
                  {vista.confirmacion.composicion.map((c) => (
                    <li key={c.clase} className="fila py-2.5">
                      <span className="min-w-0 flex-1 text-sm">{c.nombre}</span>
                      <span className="text-sm font-medium tabular-nums">
                        {formatearEuros(c.importe, moneda, true)}
                      </span>
                      <span className="w-12 text-right text-xs text-muted-foreground tabular-nums">
                        {c.porcentaje} %
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={descargar} disabled={descargando}>
                  {descargando ? (
                    <SpinnerGapIcon weight="bold" className="animate-spin" aria-hidden />
                  ) : (
                    <DownloadSimpleIcon weight="bold" aria-hidden />
                  )}
                  Descargar PDF
                </Button>
                {caso && seleccion === "caso" && (
                  <Button variant="outline" onClick={onIrAsistente}>
                    <ArrowLeftIcon weight="bold" aria-hidden />
                    Volver al asistente
                  </Button>
                )}
              </div>
              {errorPdf && (
                <Aviso tipo="error" titulo="No se ha podido generar el PDF">
                  {errorPdf}
                </Aviso>
              )}
            </div>
          </Caja>

          <div className="space-y-5">
            <Caja titulo="De dónde sale cada importe">
              <div className="p-3 sm:p-4">
                <GraficaBarras
                  key={`${seleccion}-${vista.confirmacion.total}`}
                  lineas={vista.confirmacion.lineas}
                  moneda={moneda}
                />
              </div>
            </Caja>

            {vista.pendientes.length > 0 && (
              <Aviso tipo="aviso" titulo="Pendientes de aclarar">
                <ul className="list-disc space-y-1 pl-4">
                  {vista.pendientes.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </Aviso>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
