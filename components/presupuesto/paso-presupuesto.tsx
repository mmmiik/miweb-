"use client"

import * as React from "react"
import {
  ArrowLeftIcon,
  ArrowSquareOutIcon,
  DownloadSimpleIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react"

import { Aviso } from "@/components/aviso"
import { Caja } from "@/components/caja"
import type { EstadoCalculo } from "@/components/presupuesto/tipos"
import { Button, buttonVariants } from "@/components/ui/button"
import { formatearEuros } from "@/lib/api"
import { cn } from "@/lib/utils"

export function PasoPresupuesto({
  estado,
  onVolver,
  onReintentar,
}: {
  estado: EstadoCalculo | null
  onVolver: () => void
  onReintentar: () => void
}) {
  const [descargado, setDescargado] = React.useState(false)

  if (!estado || estado.fase === "cargando") {
    return (
      <Caja titulo="Tu presupuesto">
        <div
          role="status"
          aria-live="polite"
          className="flex flex-col items-center gap-3 px-6 py-20 text-center"
        >
          <SpinnerGapIcon weight="bold" className="size-7 animate-spin text-primary" aria-hidden />
          <p className="texto-encabezado">Calculando…</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            El servidor está calculando los importes y preparando el PDF.
          </p>
        </div>
      </Caja>
    )
  }

  if (estado.fase === "error") {
    return (
      <Caja titulo="Tu presupuesto">
        <div className="space-y-4 p-4 sm:p-6">
          <Aviso tipo="error" titulo="No se ha podido calcular el presupuesto">
            {estado.mensaje}
          </Aviso>
          <div className="flex flex-wrap justify-between gap-2">
            <Button variant="outline" onClick={onVolver}>
              <ArrowLeftIcon weight="bold" aria-hidden />
              Revisar servicios
            </Button>
            <Button onClick={onReintentar}>Reintentar</Button>
          </div>
        </div>
      </Caja>
    )
  }

  const { confirmacion, pdfUrl, numero } = estado

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div className="space-y-5">
        <Caja titulo="Resumen del presupuesto">
          <div className="space-y-5 p-3 sm:p-4">
            <ul className="grupo-filas bg-white/40 dark:bg-white/[0.03]">
              {confirmacion.lineas.map((l) => (
                <li key={l.id} className="fila py-3">
                  <div className="min-w-0 flex-1">
                    <p className="texto-encabezado">{l.nombre}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{l.descripcion}</p>
                  </div>
                  <span className="shrink-0 text-sm font-medium tabular-nums">
                    {formatearEuros(l.importe, confirmacion.moneda, true)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="px-2 text-right">
              <p className="texto-seccion">Total</p>
              <p className="mt-1 text-5xl font-semibold tracking-tight tabular-nums">
                {formatearEuros(confirmacion.total, confirmacion.moneda, true)}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Importes calculados por el servidor. Sin impuestos aplicados.
              </p>
            </div>
          </div>
        </Caja>

        {descargado && (
          <Aviso tipo="correcto" titulo="Presupuesto aceptado">
            Se ha descargado el PDF {numero}.pdf. Es el mismo documento que ves en la vista previa.
          </Aviso>
        )}

        <div className="flex flex-wrap justify-between gap-2">
          <Button variant="outline" onClick={onVolver}>
            <ArrowLeftIcon weight="bold" aria-hidden />
            Revisar servicios
          </Button>
          {/* Descarga exactamente el PDF de la vista previa (mismo blob). */}
          <a
            href={pdfUrl}
            download={`${numero}.pdf`}
            onClick={() => setDescargado(true)}
            className={cn(buttonVariants({ size: "lg" }), "foco")}
          >
            <DownloadSimpleIcon weight="bold" aria-hidden />
            Aceptar y descargar
          </a>
        </div>
      </div>

      <Caja
        titulo={`Vista previa · ${numero}`}
        opaca
        accion={
          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "foco")}
          >
            <ArrowSquareOutIcon weight="bold" aria-hidden />
            <span className="hidden sm:inline">Abrir</span>
          </a>
        }
      >
        <div className="p-3">
          <object
            data={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`}
            type="application/pdf"
            aria-label="Vista previa del presupuesto en PDF"
            className="aspect-[1/1.414] w-full rounded-lg bg-white"
          >
            <div className="flex aspect-[1/1.414] flex-col items-center justify-center gap-3 rounded-lg bg-white/60 p-6 text-center text-sm text-muted-foreground">
              <p>Tu navegador no puede mostrar el PDF aquí.</p>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ variant: "outline" }), "foco")}
              >
                Abrir el PDF en una pestaña
              </a>
            </div>
          </object>
        </div>
      </Caja>
    </div>
  )
}
