"use client"

import * as React from "react"
import {
  ArrowRightIcon,
  CheckIcon,
  ChatCircleTextIcon,
  DownloadSimpleIcon,
  FileTextIcon,
  ListChecksIcon,
  PencilSimpleLineIcon,
  SparkleIcon,
  TagIcon,
} from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/* ---------- Aparición al hacer scroll ---------- */

/**
 * Hace aparecer a su contenido (fundido + desplazamiento) cuando entra en pantalla, una sola vez.
 * Los hijos pueden reaccionar con `group-data-[visible=true]/rev:`. Con «reducir movimiento» las
 * transiciones duran casi 0 (regla global en globals.css).
 */
function Revelar({
  desde = "abajo",
  retraso = 0,
  className,
  children,
}: {
  desde?: "izquierda" | "derecha" | "abajo"
  retraso?: number
  className?: string
  children: React.ReactNode
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const oculto =
    desde === "izquierda"
      ? "-translate-x-10"
      : desde === "derecha"
        ? "translate-x-10"
        : "translate-y-8"

  return (
    <div
      ref={ref}
      data-visible={visible}
      style={{ transitionDelay: `${retraso}ms` }}
      className={cn(
        "group/rev transition-[opacity,transform] duration-700 ease-out",
        visible ? "translate-x-0 translate-y-0 opacity-100" : `${oculto} opacity-0`,
        className
      )}
    >
      {children}
    </div>
  )
}

/* ---------- Piezas visuales ---------- */

/** Chip flotante decorativo. */
function Chip({
  className,
  giro = "0deg",
  lento = false,
  children,
}: {
  className?: string
  giro?: string
  lento?: boolean
  children: React.ReactNode
}) {
  return (
    <span
      style={{ "--giro": giro } as React.CSSProperties}
      className={cn(
        "vidrio absolute inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium",
        lento ? "animate-flotar-lento" : "animate-flotar",
        className
      )}
    >
      {children}
    </span>
  )
}

/** Baldosa con icono, flotando. */
function Baldosa({
  className,
  giro = "0deg",
  grande = false,
  children,
}: {
  className?: string
  giro?: string
  grande?: boolean
  children: React.ReactNode
}) {
  return (
    <span
      style={{ "--giro": giro } as React.CSSProperties}
      className={cn(
        "vidrio animate-flotar flex items-center justify-center text-primary",
        grande ? "size-24 rounded-[1.75rem] [&_svg]:size-10" : "size-14 rounded-2xl [&_svg]:size-6",
        className
      )}
    >
      {children}
    </span>
  )
}

/** Visual 1: una idea que se escribe sola. */
function VisualIdea() {
  return (
    <div className="relative mx-auto w-full max-w-md py-8">
      <div className="vidrio rounded-3xl p-5">
        <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <PencilSimpleLineIcon weight="bold" className="size-4 text-primary" aria-hidden />
          La idea general
        </div>
        <div className="rounded-xl border border-black/10 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
          <div className="overflow-hidden">
            <p className="w-0 animate-escribir overflow-hidden border-r-2 border-primary text-sm font-medium whitespace-nowrap [animation-name:escribir,cursor] [animation-duration:6s,0.9s] [animation-iteration-count:infinite,infinite] [animation-timing-function:steps(38,end),steps(1)]">
              Somos un restaurante y queremos una web…
            </p>
          </div>
          <div className="mt-2 space-y-1.5" aria-hidden>
            <div className="h-2 w-11/12 rounded-full bg-black/[0.07] dark:bg-white/10" />
            <div className="h-2 w-7/12 rounded-full bg-black/[0.07] dark:bg-white/10" />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {["Clara", "Ambigua", "Fuera del catálogo"].map((t, i) => (
            <span
              key={t}
              className={cn(
                "rounded-lg border px-2.5 py-1 text-xs",
                i === 0
                  ? "border-primary/40 bg-primary/10 font-medium text-foreground"
                  : "border-black/10 text-muted-foreground dark:border-white/10"
              )}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <Baldosa className="absolute -top-1 -right-3" giro="8deg">
        <ChatCircleTextIcon weight="bold" aria-hidden />
      </Baldosa>
      <Chip className="-bottom-1 left-2" giro="-4deg" lento>
        <SparkleIcon weight="fill" className="size-3.5 text-primary" aria-hidden />
        La IA lo está leyendo
      </Chip>
    </div>
  )
}

/** Visual 2 (derecha): interruptores que se activan solos. */
function VisualSwitches() {
  const filas = [
    { nombre: "Web corporativa", retraso: "0s" },
    { nombre: "Formulario de contacto", retraso: "1.2s" },
    { nombre: "Segundo idioma", retraso: "2.4s" },
  ]
  return (
    <div className="relative mx-auto w-full max-w-xs py-8">
      <div className="vidrio overflow-hidden rounded-3xl">
        <div className="caja-cabecera">
          <span className="texto-encabezado">Tus servicios</span>
          <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[0.6875rem] font-medium text-primary">
            Sugerido
          </span>
        </div>
        <ul className="divide-y divide-black/[0.06] dark:divide-white/10">
          {filas.map((f) => (
            <li key={f.nombre} className="flex min-h-14 items-center justify-between gap-3 px-4">
              <span className="text-sm font-medium">{f.nombre}</span>
              <span
                style={{ animationDelay: f.retraso }}
                className="relative inline-flex h-[31px] w-[51px] shrink-0 animate-sw-fondo items-center rounded-full"
              >
                <span
                  style={{ animationDelay: f.retraso }}
                  className="block size-[27px] animate-sw-pulgar rounded-full bg-white shadow-md"
                />
              </span>
            </li>
          ))}
        </ul>
      </div>
      <Chip className="-top-1 -right-2" giro="6deg" lento>
        <CheckIcon weight="bold" className="size-3.5 text-primary" aria-hidden />
        Tú decides
      </Chip>
    </div>
  )
}

/** Visual 3: el PDF con su gráfica y el total. */
function VisualPdf() {
  const barras = [
    { n: "Web corporativa", w: "100%", d: 200 },
    { n: "Páginas adicionales", w: "34%", d: 400 },
    { n: "Segundo idioma", w: "26%", d: 600 },
  ]
  return (
    <div className="relative mx-auto w-full max-w-sm py-8">
      <div className="vidrio-opaco mx-auto w-64 rounded-2xl p-4 sm:w-72">
        <div className="flex items-center justify-between">
          <span className="text-[0.6875rem] font-bold tracking-tight">Presupuesta mi web</span>
          <span className="font-mono text-[0.625rem] text-muted-foreground">PM-0001</span>
        </div>
        <div className="my-3 h-px bg-primary" />
        <ul className="space-y-2.5">
          {barras.map((b) => (
            <li key={b.n} className="space-y-1">
              <span className="text-[0.625rem] font-medium">{b.n}</span>
              <div className="h-1.5 rounded-r-[3px] bg-black/[0.07] dark:bg-white/10">
                <div
                  style={{ width: b.w, transitionDelay: `${b.d}ms` }}
                  className="h-full origin-left scale-x-0 rounded-r-[3px] bg-primary transition-transform duration-1000 ease-out group-data-[visible=true]/rev:scale-x-100"
                />
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 text-right">
          <p className="font-mono text-[0.5625rem] tracking-widest text-muted-foreground uppercase">Total</p>
          <p className="text-2xl font-black tracking-tight text-primary tabular-nums">1.030,00 €</p>
        </div>
      </div>

      <Baldosa className="absolute -top-1 -left-8 sm:-left-12" giro="-8deg" grande>
        <FileTextIcon weight="duotone" aria-hidden />
      </Baldosa>
      <Chip className="right-0 bottom-0 sm:-right-3" giro="5deg" lento>
        <DownloadSimpleIcon weight="bold" className="size-3.5 text-primary" aria-hidden />
        PDF con desglose
      </Chip>
    </div>
  )
}

/* ---------- Contenido de cada peldaño ---------- */

function Texto({
  numero,
  titulo,
  texto,
  puntos,
  accion,
  alineado = "izquierda",
}: {
  numero: string
  titulo: string
  texto: string
  puntos: string[]
  accion: { texto: string; onClick: () => void }
  alineado?: "izquierda" | "centro"
}) {
  return (
    <div className={cn("space-y-4", alineado === "centro" && "md:text-center")}>
      <p className="font-mono text-sm font-medium text-primary tabular-nums">{numero}</p>
      <h3 className="text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{titulo}</h3>
      <p className="text-pretty text-muted-foreground">{texto}</p>
      <ul className={cn("space-y-2 text-sm", alineado === "centro" && "md:mx-auto md:w-fit md:text-left")}>
        {puntos.map((p) => (
          <li key={p} className="flex items-start gap-2.5">
            <CheckIcon weight="bold" className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <div className="pt-1">
        <Button variant="outline" onClick={accion.onClick}>
          {accion.texto}
          <ArrowRightIcon weight="bold" aria-hidden />
        </Button>
      </div>
    </div>
  )
}

/**
 * La escalera: tres peldaños en zigzag.
 *  1) contenido a la izquierda · visual a la derecha
 *  2) símbolo a la izquierda · contenido en medio · cosas a la derecha
 *  3) visual y cositas a la izquierda · contenido a la derecha
 */
export function Escalera({
  onEmpezar,
  onVerCatalogo,
  onVerPanel,
}: {
  onEmpezar: () => void
  onVerCatalogo: () => void
  onVerPanel: () => void
}) {
  return (
    <section id="como-funciona" aria-labelledby="titulo-escalera" className="scroll-mt-28 space-y-14 sm:space-y-20">
      <Revelar className="mx-auto max-w-2xl space-y-3 text-center">
        <p className="font-mono text-xs font-medium tracking-widest text-primary uppercase">Cómo funciona</p>
        <h2 id="titulo-escalera" className="text-4xl font-black tracking-tighter text-balance sm:text-5xl">
          Tres peldaños y tu presupuesto, <span className="font-light">listo.</span>
        </h2>
      </Revelar>

      {/* 1 · contenido izquierda, visual derecha */}
      <div className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
        <Revelar desde="izquierda">
          <Texto
            numero="01"
            titulo="Cuéntanos tu idea"
            texto="Escribe cómo se llama tu página y de qué va, con tus palabras. ¿Sin ideas? Empieza con un ejemplo ya preparado y mira cómo reacciona el asistente."
            puntos={[
              "Ejemplos: clara, ambigua, fuera del catálogo…",
              "Si algo no está claro, el asistente te lo pregunta",
            ]}
            accion={{ texto: "Probar un ejemplo", onClick: onEmpezar }}
          />
        </Revelar>
        <Revelar desde="derecha" retraso={120}>
          <VisualIdea />
        </Revelar>
      </div>

      {/* 2 · símbolo izquierda, contenido en medio, cosas a la derecha */}
      <div className="grid items-center gap-8 md:grid-cols-[1fr_1.35fr_1fr] md:gap-10">
        <Revelar desde="izquierda" className="hidden justify-self-center md:block">
          <div className="relative flex size-44 items-center justify-center">
            <span className="absolute inset-0 rounded-full border border-dashed border-primary/40" />
            <span className="absolute inset-5 rounded-full border border-primary/20" />
            <Baldosa grande className="animate-flotar">
              <ListChecksIcon weight="bold" aria-hidden />
            </Baldosa>
            <Chip className="-top-1 right-0" giro="6deg" lento>
              <TagIcon weight="bold" className="size-3.5 text-primary" aria-hidden />
              Catálogo
            </Chip>
          </div>
        </Revelar>
        <Revelar>
          <Texto
            numero="02"
            titulo="Elige tus servicios"
            texto="El asistente sugiere lo que encaja y te explica por qué. Tú aceptas, quitas o añades lo que quieras del catálogo."
            puntos={[
              "Cada sugerencia llega con su justificación",
              "Lo que no ofrecemos queda como pendiente, nunca como promesa",
            ]}
            accion={{ texto: "Ver el catálogo", onClick: onVerCatalogo }}
            alineado="centro"
          />
        </Revelar>
        <Revelar desde="derecha" retraso={120}>
          <VisualSwitches />
        </Revelar>
      </div>

      {/* 3 · visual y cositas izquierda, contenido derecha */}
      <div className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
        <Revelar desde="izquierda" className="order-2 md:order-1">
          <VisualPdf />
        </Revelar>
        <Revelar desde="derecha" retraso={120} className="order-1 md:order-2">
          <Texto
            numero="03"
            titulo="Descarga tu presupuesto"
            texto="El servidor calcula cada importe y te entrega un PDF que explica de dónde sale cada euro. Míralo también en el panel, con su gráfica."
            puntos={[
              "Importes calculados siempre por el servidor",
              "Desglose por servicio y composición del total",
            ]}
            accion={{ texto: "Ver el panel", onClick: onVerPanel }}
          />
        </Revelar>
      </div>
    </section>
  )
}
