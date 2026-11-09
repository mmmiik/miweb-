"use client"

import * as React from "react"
import { ArrowRightIcon, SpinnerGapIcon, TagIcon } from "@phosphor-icons/react"

import { Aviso } from "@/components/aviso"
import { Caja } from "@/components/caja"
import { Button } from "@/components/ui/button"
import {
  formatearEuros,
  obtenerCatalogo,
  type Catalogo,
  type ClaseServicio,
} from "@/lib/api"

const GRUPOS: { clase: ClaseServicio; titulo: string; nota: string }[] = [
  {
    clase: "base",
    titulo: "Servicios base",
    nota: "Se elige uno solo. Incluye la primera página.",
  },
  {
    clase: "paginas",
    titulo: "Páginas adicionales",
    nota: "Se cobra cada página a partir de la primera.",
  },
  { clase: "extra", titulo: "Extras", nota: "Precio fijo, se pueden combinar." },
]

export function CatalogoView({ onEmpezar }: { onEmpezar: () => void }) {
  const [catalogo, setCatalogo] = React.useState<Catalogo | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [cargando, setCargando] = React.useState(true)

  const cargar = React.useCallback(async () => {
    setCargando(true)
    setError(null)
    const r = await obtenerCatalogo()
    if (r.ok) setCatalogo(r.datos)
    else setError(r.datos.error)
    setCargando(false)
  }, [])

  React.useEffect(() => {
    // Carga inicial desde la API (sistema externo).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void cargar()
  }, [cargar])

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Catálogo de servicios</h1>
        <p className="text-sm text-muted-foreground">
          Lo que ofrecemos y lo que cuesta. Son los únicos servicios que la IA puede proponer y
          los precios los fija siempre el servidor.
        </p>
      </div>

      {cargando && (
        <Aviso tipo="info">
          <span className="flex items-center gap-2">
            <SpinnerGapIcon weight="bold" className="size-4 animate-spin" aria-hidden />
            Cargando el catálogo…
          </span>
        </Aviso>
      )}

      {error && (
        <Aviso
          tipo="error"
          titulo="No se ha podido cargar el catálogo"
          accion={
            <Button variant="outline" size="sm" onClick={cargar}>
              Reintentar
            </Button>
          }
        >
          {error}
        </Aviso>
      )}

      {catalogo &&
        GRUPOS.map(({ clase, titulo, nota }) => {
          const servicios = catalogo.servicios.filter((s) => s.clase === clase)
          if (servicios.length === 0) return null
          return (
            <Caja
              key={clase}
              titulo={titulo}
              icono={<TagIcon weight="bold" className="size-4 text-muted-foreground" aria-hidden />}
              accion={<span className="texto-seccion hidden sm:block">{nota}</span>}
            >
              <ul className="grupo-filas m-3 bg-white/40 dark:bg-white/[0.03]">
                {servicios.map((s) => (
                  <li key={s.id} className="fila items-start py-3">
                    <div className="min-w-0 flex-1">
                      <p className="texto-encabezado">{s.nombre}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{s.descripcion}</p>
                      {s.parametros.map((p) => (
                        <p key={p.nombre} className="mt-1 text-xs text-muted-foreground">
                          Necesita: {p.descripcion}
                        </p>
                      ))}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-base font-semibold tracking-tight tabular-nums">
                        {s.precio !== undefined
                          ? formatearEuros(s.precio, catalogo.moneda)
                          : s.precioUnitario !== undefined
                            ? formatearEuros(s.precioUnitario, catalogo.moneda)
                            : "—"}
                      </p>
                      {s.precioUnitario !== undefined && (
                        <p className="texto-seccion">por página</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </Caja>
          )
        })}

      {catalogo && (
        <div className="flex justify-end">
          <Button size="lg" onClick={onEmpezar}>
            Pedir sugerencias al asistente
            <ArrowRightIcon weight="bold" aria-hidden />
          </Button>
        </div>
      )}
    </div>
  )
}
