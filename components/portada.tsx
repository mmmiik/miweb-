"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { useTheme } from "next-themes"
import { ArrowDownIcon, ArrowRightIcon, ChartBarIcon } from "@phosphor-icons/react"

import { Escalera } from "@/components/escalera"
import { Button } from "@/components/ui/button"

// WebGL: solo se carga en el navegador.
const Prism = dynamic(() => import("@/components/Prism"), { ssr: false })

const subscribe = () => () => {}

/** Prisma 3D que gira despacio tras el titular, en azules del acento. No sigue al ratón. */
function Prisma() {
  const { resolvedTheme } = useTheme()
  const cliente = React.useSyncExternalStore(subscribe, () => true, () => false)
  const claro = resolvedTheme !== "dark"
  if (!cliente) return null
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 -top-10 -bottom-10 -z-10 animate-in fade-in-0 duration-1000 opacity-80 [mask-image:radial-gradient(ellipse_at_50%_35%,black_40%,transparent_75%)]"
    >
      <Prism
        key={claro ? "claro" : "oscuro"}
        lightMode={claro}
        animationType="rotate"
        colors={["#3b82f6", "#60a5fa", "#38bdf8", "#818cf8"]}
        glow={claro ? 0.55 : 0.6}
        scale={5.6}
        offset={{ x: 0, y: -90 }}
        height={3.5}
        baseWidth={5.5}
        timeScale={0.35}
        saturation={1.3}
        interactive={false}
        intro={false}
      />
    </div>
  )
}

/**
 * Portada. El hero no lleva fondo propio: el fondo de toda la página es la rejilla de ondas
 * (ver FondoPagina). Titular con tres pesos y tamaños de Geist, y debajo la escalera de pasos.
 */
export function Portada({
  onEmpezar,
  onVerPanel,
  onVerCatalogo,
}: {
  onEmpezar: () => void
  onVerPanel: () => void
  onVerCatalogo: () => void
}) {
  // Entrada escalonada del hero (fundido + subida suave).
  const entra = "animate-in fade-in-0 slide-in-from-bottom-6 duration-700 fill-mode-both"

  return (
    <div className="mx-auto w-full max-w-6xl space-y-24 sm:space-y-32">
      <section className="relative isolate flex min-h-[calc(100svh-9rem)] flex-col items-center justify-center gap-7 py-10 text-center">
        <Prisma />

        <h1 className="flex flex-col items-center leading-[0.9] tracking-tighter">
          <span
            style={{ animationDelay: "100ms" }}
            className={`${entra} text-5xl font-extralight text-foreground/70 sm:text-7xl`}
          >
            Tu idea
          </span>
          <span
            style={{ animationDelay: "220ms" }}
            className={`${entra} mt-1 text-6xl font-extrabold sm:text-8xl`}
          >
            ya tiene
          </span>
          <span
            style={{ animationDelay: "340ms" }}
            className={`${entra} relative mt-1 inline-block text-7xl font-black text-primary sm:text-[9.5rem]`}
          >
            precio.
            {/* Subrayado que se dibuja solo */}
            <svg
              viewBox="0 0 300 18"
              preserveAspectRatio="none"
              aria-hidden
              className="absolute -bottom-1 left-0 h-3 w-full text-primary sm:-bottom-2 sm:h-5"
            >
              <path
                d="M4 12 C 60 2, 110 18, 160 9 S 260 4, 296 11"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                className="animate-trazo"
              />
            </svg>
          </span>
        </h1>

        <p
          style={{ animationDelay: "520ms" }}
          className={`${entra} flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 text-xl tracking-tight sm:text-3xl`}
        >
          <span className="font-light text-muted-foreground">La IA propone.</span>
          <span className="font-semibold">Tú eliges.</span>
          <span className="font-black">El servidor hace las cuentas.</span>
        </p>

        <p
          style={{ animationDelay: "620ms" }}
          className={`${entra} max-w-xl text-pretty text-base text-muted-foreground sm:text-lg`}
        >
          Cuéntanos tu proyecto con tus palabras y llévate un presupuesto en PDF con el desglose
          de cada importe. Sin registro y sin sorpresas.
        </p>

        <div
          style={{ animationDelay: "720ms" }}
          className={`${entra} flex flex-wrap items-center justify-center gap-3 pt-1`}
        >
          <Button size="lg" onClick={onEmpezar} className="h-14 rounded-2xl px-7 text-base font-semibold">
            Empezar con el asistente
            <ArrowRightIcon weight="bold" aria-hidden />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={onVerPanel}
            className="h-14 rounded-2xl px-6 text-base"
          >
            <ChartBarIcon weight="bold" aria-hidden />
            Ver el panel
          </Button>
        </div>

        <a
          href="#como-funciona"
          style={{ animationDelay: "900ms" }}
          className={`${entra} foco absolute bottom-0 flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm text-muted-foreground hover:text-foreground`}
        >
          Descubre cómo funciona
          <ArrowDownIcon weight="bold" className="size-4 animate-rebote" aria-hidden />
        </a>
      </section>

      <Escalera onEmpezar={onEmpezar} onVerCatalogo={onVerCatalogo} onVerPanel={onVerPanel} />
    </div>
  )
}
