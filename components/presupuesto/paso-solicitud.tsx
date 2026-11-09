"use client"

import { ArrowRightIcon, SparkleIcon, SpinnerGapIcon } from "@phosphor-icons/react"

import { Aviso } from "@/components/aviso"
import { Caja } from "@/components/caja"
import { DESCRIPCION_MAX } from "@/components/presupuesto/tipos"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { EJEMPLOS_ASISTENTE, type EjemploAsistente } from "@/lib/ejemplos"
import { cn } from "@/lib/utils"

export function PasoSolicitud({
  cliente,
  descripcion,
  errores,
  enviando,
  onCliente,
  onDescripcion,
  onEnviar,
}: {
  cliente: string
  descripcion: string
  /** Mensajes 400 del servidor (null si no hay). */
  errores: string[] | null
  enviando: boolean
  onCliente: (v: string) => void
  onDescripcion: (v: string) => void
  onEnviar: () => void
}) {
  // El contador solo orienta; quien hace cumplir el límite es el servidor.
  const largo = descripcion.length
  const cerca = largo > DESCRIPCION_MAX * 0.9
  const pasado = largo > DESCRIPCION_MAX

  function usarEjemplo(e: EjemploAsistente) {
    onCliente(e.cliente)
    onDescripcion(e.descripcion)
  }

  return (
    <Caja
      titulo="Cuéntanos tu idea"
      icono={<SparkleIcon weight="bold" className="size-4 text-primary" aria-hidden />}
    >
      <form
        className="space-y-5 p-4 sm:p-6"
        onSubmit={(e) => {
          e.preventDefault()
          onEnviar()
        }}
      >
        <p className="text-sm text-muted-foreground">
          Dinos cómo se llama tu página y de qué va. El asistente te sugerirá los servicios que
          mejor encajan y después podrás añadir lo que quieras.
        </p>

        {/* Ejemplos ya creados */}
        <div className="space-y-2">
          <p className="texto-seccion">¿Quieres verlo en acción? Prueba un ejemplo</p>
          <ul className="flex flex-wrap gap-2">
            {EJEMPLOS_ASISTENTE.map((e) => {
              const activo = cliente === e.cliente && descripcion === e.descripcion
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => usarEjemplo(e)}
                    aria-pressed={activo}
                    className={cn(
                      "foco min-h-11 rounded-xl border px-3 text-sm transition-colors",
                      activo
                        ? "border-primary/50 bg-primary/10 text-foreground"
                        : "border-black/10 bg-white/50 text-muted-foreground hover:text-foreground dark:border-white/10 dark:bg-white/5"
                    )}
                  >
                    <span className="font-medium">{e.etiqueta}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cliente" className="texto-seccion">
            Nombre de tu página o proyecto
          </Label>
          <Input
            id="cliente"
            value={cliente}
            onChange={(e) => onCliente(e.target.value)}
            placeholder="Por ejemplo: Restaurante La Cepa"
            autoComplete="organization"
            aria-invalid={errores !== null && cliente.trim() === ""}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <Label htmlFor="descripcion" className="texto-seccion">
              La idea general
            </Label>
            <span
              className={cn(
                "text-xs tabular-nums",
                pasado
                  ? "font-medium text-red-600 dark:text-red-400"
                  : cerca
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground"
              )}
              aria-live="polite"
            >
              {largo.toLocaleString("es-ES")} / {DESCRIPCION_MAX.toLocaleString("es-ES")}
            </span>
          </div>
          <Textarea
            id="descripcion"
            value={descripcion}
            onChange={(e) => onDescripcion(e.target.value)}
            placeholder="Somos un restaurante y queremos una web con nuestra carta, reservas online y versión en inglés…"
            aria-invalid={pasado || (errores !== null && descripcion.trim() === "")}
          />
        </div>

        {errores && errores.length > 0 && (
          <Aviso tipo="error" titulo="Revisa la solicitud">
            <ul className="list-disc space-y-0.5 pl-4">
              {errores.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </Aviso>
        )}

        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={enviando}>
            {enviando ? (
              <SpinnerGapIcon weight="bold" className="animate-spin" aria-hidden />
            ) : null}
            Pedir sugerencias
            {!enviando && <ArrowRightIcon weight="bold" aria-hidden />}
          </Button>
        </div>
      </form>
    </Caja>
  )
}
