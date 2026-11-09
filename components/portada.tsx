"use client"

import { ArrowDownIcon, ArrowRightIcon, ChartBarIcon } from "@phosphor-icons/react"

import { Escalera } from "@/components/escalera"
import { Button } from "@/components/ui/button"

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
      <section className="relative flex min-h-[calc(100svh-9rem)] flex-col items-center justify-center gap-7 py-10 text-center">
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
