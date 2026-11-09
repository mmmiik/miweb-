"use client"

import * as React from "react"
import {
  FlaskIcon,
  ReceiptIcon,
  TagIcon,
} from "@phosphor-icons/react"

import { CatalogoView } from "@/components/catalogo-view"
import { Flujo } from "@/components/presupuesto/flujo"
import { PruebasPanel } from "@/components/pruebas-panel"
import { ThemeToggle } from "@/components/theme-toggle"
import { obtenerEstado } from "@/lib/api"
import { cn } from "@/lib/utils"

type Vista = "presupuesto" | "catalogo" | "pruebas"
type Conexion = "comprobando" | "conectada" | "desconectada"

const VISTAS = [
  { id: "presupuesto", nombre: "Presupuesto", Icono: ReceiptIcon },
  { id: "catalogo", nombre: "Catálogo", Icono: TagIcon },
  { id: "pruebas", nombre: "Pruebas", Icono: FlaskIcon },
] as const

export function AppShell() {
  const [vista, setVista] = React.useState<Vista>("presupuesto")
  const [conexion, setConexion] = React.useState<Conexion>("comprobando")
  const [ms, setMs] = React.useState<number | null>(null)

  const comprobar = React.useCallback(async () => {
    setConexion("comprobando")
    const r = await obtenerEstado()
    setMs(r.ms)
    setConexion(r.ok ? "conectada" : "desconectada")
  }, [])

  React.useEffect(() => {
    // Comprobación inicial al montar: sincroniza con un sistema externo (la API).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void comprobar()
  }, [comprobar])

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-20 px-3 pt-3 sm:px-6 sm:pt-4">
        <div className="vidrio mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-2xl px-3 py-2 sm:px-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ReceiptIcon weight="bold" className="size-4" aria-hidden />
            </span>
            <span className="texto-encabezado hidden sm:block">Presupuesta mi web</span>
          </div>

          <nav
            aria-label="Secciones"
            className="flex gap-1 rounded-xl bg-black/[0.05] p-1 dark:bg-white/[0.07]"
          >
            {VISTAS.map(({ id, nombre, Icono }) => (
              <button
                key={id}
                type="button"
                onClick={() => setVista(id)}
                aria-current={vista === id ? "page" : undefined}
                className={cn(
                  "foco flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors",
                  vista === id
                    ? "bg-white text-foreground shadow-sm dark:bg-white/15"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icono weight="bold" className="size-4" aria-hidden />
                <span className={cn(vista !== id && "hidden sm:inline")}>{nombre}</span>
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={comprobar}
              title="Volver a comprobar la API"
              className="foco hidden min-h-11 items-center gap-2 rounded-xl px-3 text-xs text-muted-foreground hover:bg-black/[0.04] md:flex dark:hover:bg-white/[0.06]"
            >
              <span
                className={cn(
                  "size-2 rounded-full",
                  conexion === "conectada" && "bg-emerald-500",
                  conexion === "desconectada" && "bg-red-500",
                  conexion === "comprobando" && "animate-pulse bg-amber-500"
                )}
                aria-hidden
              />
              <span className="tabular-nums">
                {conexion === "conectada" && `API conectada${ms !== null ? ` · ${ms} ms` : ""}`}
                {conexion === "desconectada" && "API sin conexión"}
                {conexion === "comprobando" && "Comprobando…"}
              </span>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="px-4 py-8 sm:px-6 sm:py-10">
        {/* El flujo se mantiene montado para no perder lo escrito al cambiar de sección. */}
        <div hidden={vista !== "presupuesto"}>
          <Flujo />
        </div>
        {vista === "catalogo" && <CatalogoView />}
        {vista === "pruebas" && <PruebasPanel conexion={conexion} ms={ms} />}
      </main>
    </div>
  )
}
