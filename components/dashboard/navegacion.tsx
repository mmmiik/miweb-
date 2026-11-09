"use client"

import * as React from "react"
import { FlaskConical, LayoutDashboard, Receipt, Tags } from "lucide-react"

import type { EstadoConexion, Vista } from "@/components/dashboard/tipos"
import { cn } from "@/lib/utils"

export const VISTAS: {
  id: Vista
  nombre: string
  titulo: string
  descripcion: string
  icono: React.ElementType
}[] = [
  {
    id: "resumen",
    nombre: "Resumen",
    titulo: "Resumen",
    descripcion: "Configura una web y calcula su presupuesto",
    icono: LayoutDashboard,
  },
  {
    id: "tarifas",
    nombre: "Tarifas",
    titulo: "Tarifas",
    descripcion: "Los precios que publica el servidor",
    icono: Tags,
  },
  {
    id: "pruebas",
    nombre: "Pruebas",
    titulo: "Pruebas",
    descripcion: "Las rutas y los nueve casos del enunciado",
    icono: FlaskConical,
  },
]

interface PropsNavegacion {
  vista: Vista
  onCambiar: (vista: Vista) => void
}

/** Barra lateral fija (pantallas medianas y grandes). */
export function BarraLateral({
  vista,
  onCambiar,
  estado,
  ms,
  urlApi,
}: PropsNavegacion & {
  estado: EstadoConexion
  ms: number | null
  urlApi: string
}) {
  return (
    <aside className="hidden border-r bg-sidebar text-sidebar-foreground md:sticky md:top-0 md:flex md:h-svh md:flex-col md:self-start">
      <div className="flex items-center gap-3 px-5 py-5">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Receipt className="size-5" />
        </span>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold">Presupuesta mi web</span>
          <span className="text-xs text-muted-foreground">Panel de la API</span>
        </div>
      </div>

      <nav aria-label="Secciones" className="flex flex-1 flex-col gap-1 px-3">
        {VISTAS.map(({ id, nombre, icono: Icono }) => (
          <button
            key={id}
            type="button"
            onClick={() => onCambiar(id)}
            aria-current={vista === id ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
              vista === id && "bg-sidebar-accent text-sidebar-accent-foreground"
            )}
          >
            <Icono
              className={cn("size-4", vista === id && "text-sidebar-primary")}
            />
            {nombre}
          </button>
        ))}
      </nav>

      {/* Estado del servicio */}
      <div className="m-3 rounded-lg border bg-background/40 p-3 text-xs">
        <div className="flex items-center gap-2 font-medium">
          <PuntoEstado estado={estado} />
          {estado === "conectada" && "API conectada"}
          {estado === "desconectada" && "API desconectada"}
          {estado === "comprobando" && "Comprobando…"}
        </div>
        <p className="mt-1 text-muted-foreground tabular-nums">
          {urlApi}
          {ms !== null && estado === "conectada" && ` · ${ms} ms`}
        </p>
      </div>
    </aside>
  )
}

/** Pestañas horizontales (móvil). */
export function NavegacionMovil({ vista, onCambiar }: PropsNavegacion) {
  return (
    <nav
      aria-label="Secciones"
      className="flex gap-1 overflow-x-auto border-b px-4 py-2 md:hidden"
    >
      {VISTAS.map(({ id, nombre, icono: Icono }) => (
        <button
          key={id}
          type="button"
          onClick={() => onCambiar(id)}
          aria-current={vista === id ? "page" : undefined}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            vista === id && "bg-muted text-foreground"
          )}
        >
          <Icono className="size-4" />
          {nombre}
        </button>
      ))}
    </nav>
  )
}

export function PuntoEstado({ estado }: { estado: EstadoConexion }) {
  return (
    <span className="relative flex size-2">
      {estado === "conectada" && (
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
      )}
      <span
        className={cn(
          "relative inline-flex size-2 rounded-full",
          estado === "conectada" && "bg-emerald-500",
          estado === "desconectada" && "bg-destructive",
          estado === "comprobando" && "bg-amber-500"
        )}
      />
    </span>
  )
}
