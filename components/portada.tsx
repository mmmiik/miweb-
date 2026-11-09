"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import {
  ArrowRightIcon,
  ChartBarIcon,
  DownloadSimpleIcon,
  SparkleIcon,
  ListChecksIcon,
} from "@phosphor-icons/react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

// El fondo usa WebGL: solo se carga en el navegador y no pesa en el resto de secciones.
const RippleGrid = dynamic(() => import("@/components/RippleGrid"), { ssr: false })

const PASOS = [
  {
    Icono: SparkleIcon,
    titulo: "Cuéntanos tu idea",
    texto: "Nombre de tu página y de qué va. Puedes empezar con un ejemplo.",
  },
  {
    Icono: ListChecksIcon,
    titulo: "Elige tus servicios",
    texto: "El asistente sugiere lo que encaja y tú añades lo que quieras.",
  },
  {
    Icono: DownloadSimpleIcon,
    titulo: "Descarga tu presupuesto",
    texto: "PDF con el desglose de cada importe, calculado por el servidor.",
  },
] as const

const subscribe = () => () => {}

/** Portada: hero con la rejilla de ondas de fondo, dos accesos y el resumen del recorrido. */
export function Portada({
  onEmpezar,
  onVerPanel,
}: {
  onEmpezar: () => void
  onVerPanel: () => void
}) {
  const { resolvedTheme } = useTheme()
  // El tema solo se conoce en el navegador: hasta entonces no se pinta la rejilla (evita parpadeos).
  const cliente = React.useSyncExternalStore(subscribe, () => true, () => false)
  const claro = resolvedTheme !== "dark"

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <section className="vidrio relative isolate overflow-hidden rounded-[2rem]">
        {/* Fondo: rejilla de ondas en el azul de acento */}
        <div aria-hidden className="absolute inset-0 -z-10">
          {cliente && (
            <RippleGrid
              key={claro ? "claro" : "oscuro"}
              color="#3b82f6"
              lightMode={claro}
              variant="lines"
              cellSize={44}
              lineWidth={1}
              glow={claro ? 0.5 : 0.7}
              autoRipple="none"
              rippleStrength={1}
              fade={0.65}
              opacity={claro ? 0.7 : 0.9}
            />
          )}
        </div>

        <div className="mx-auto flex min-h-[32rem] max-w-3xl flex-col items-center justify-center gap-6 px-6 py-16 text-center sm:min-h-[36rem] sm:py-20">
          <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-black/10 bg-white/60 px-3 text-xs font-medium text-muted-foreground dark:border-white/10 dark:bg-white/5">
            <SparkleIcon weight="fill" className="size-3.5 text-primary" aria-hidden />
            La IA propone · el servidor calcula
          </span>

          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            Tu web, presupuestada con claridad
          </h1>

          <p className="max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
            Cuéntanos tu idea y un asistente te sugiere los servicios que encajan. Tú eliges y el
            servidor calcula cada importe: sin sorpresas y con un PDF que explica de dónde sale
            todo.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button size="lg" onClick={onEmpezar}>
              Empezar con el asistente
              <ArrowRightIcon weight="bold" aria-hidden />
            </Button>
            <Button size="lg" variant="outline" onClick={onVerPanel}>
              <ChartBarIcon weight="bold" aria-hidden />
              Ver el panel
            </Button>
          </div>
        </div>
      </section>

      <section aria-labelledby="como-funciona" className="space-y-3">
        <h2 id="como-funciona" className="texto-seccion px-1">
          Cómo funciona
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {PASOS.map(({ Icono, titulo, texto }, i) => (
            <li key={titulo} className="vidrio flex gap-4 rounded-2xl p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icono weight="bold" className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 space-y-1">
                <p className="texto-encabezado">
                  <span className="mr-1.5 text-muted-foreground tabular-nums">{i + 1}.</span>
                  {titulo}
                </p>
                <p className="text-sm text-muted-foreground">{texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
