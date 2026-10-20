"use client"

import * as React from "react"
import {
  Building2,
  Calculator,
  FileText,
  Languages,
  LoaderCircle,
  Mail,
  Rocket,
} from "lucide-react"

import type { Solicitud } from "@/components/dashboard/tipos"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { formatearEuros, type RespuestaTarifas, type Tipo } from "@/lib/api"
import { cn } from "@/lib/utils"

const TIPOS: {
  id: Tipo
  nombre: string
  descripcion: string
  icono: React.ElementType
}[] = [
  {
    id: "landing",
    nombre: "Landing",
    descripcion: "Una página para captar clientes",
    icono: Rocket,
  },
  {
    id: "corporativa",
    nombre: "Corporativa",
    descripcion: "Web completa para tu empresa",
    icono: Building2,
  },
]

interface Props {
  tarifas: RespuestaTarifas | null
  /** Hay una solicitud en curso: el botón se bloquea y muestra "Calculando…". */
  calculando: boolean
  /** Envía la solicitud tal cual. Quien la manda y recoge la respuesta es el dashboard. */
  onCalcular: (solicitud: Solicitud) => void
}

export function Calculadora({ tarifas, calculando, onCalcular }: Props) {
  const [tipo, setTipo] = React.useState<Tipo>("corporativa")
  // Se guarda como texto para poder enviar también valores incorrectos (0, 25, 2.5…)
  // y que sea el servidor quien los rechace.
  const [paginasTexto, setPaginasTexto] = React.useState("4")
  const [formulario, setFormulario] = React.useState(true)
  const [segundoIdioma, setSegundoIdioma] = React.useState(false)

  const paginas = paginasTexto.trim() === "" ? null : Number(paginasTexto)
  const solicitud: Solicitud = { tipo, paginas, formulario, segundoIdioma }
  const sliderValor = Math.min(20, Math.max(1, Math.round(paginas ?? 1) || 1))

  const precio = (clave: keyof RespuestaTarifas["tarifas"]) =>
    tarifas
      ? formatearEuros(tarifas.tarifas[clave].precio, tarifas.moneda)
      : "—"

  function calcular(evento: React.FormEvent) {
    evento.preventDefault()
    // La solicitud se envía tal cual: el cliente no valida ni calcula nada.
    if (!calculando) onCalcular(solicitud)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Nuevo presupuesto</CardTitle>
        <CardDescription>
          Los precios los publica la API en /api/tarifas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="form-presupuesto"
          onSubmit={calcular}
          className="flex flex-col gap-6"
        >
          {/* Tipo de web */}
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">Tipo de web</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {TIPOS.map(({ id, nombre, descripcion, icono: Icono }) => (
                <label
                  key={id}
                  className={cn(
                    "relative flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/50",
                    "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                    tipo === id && "border-primary bg-primary/10"
                  )}
                >
                  <input
                    type="radio"
                    name="tipo"
                    value={id}
                    checked={tipo === id}
                    onChange={() => setTipo(id)}
                    className="sr-only"
                  />
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors",
                      tipo === id && "bg-primary text-primary-foreground"
                    )}
                  >
                    <Icono className="size-4" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-sm font-medium">{nombre}</span>
                    <span className="text-xs text-muted-foreground">
                      {descripcion}
                    </span>
                    <span className="mt-1 text-sm font-semibold tabular-nums">
                      {precio(id)}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Páginas */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="paginas" className="gap-2">
                <FileText className="size-4 text-muted-foreground" />
                Páginas
              </Label>
              <Input
                id="paginas"
                type="number"
                inputMode="numeric"
                step="any"
                value={paginasTexto}
                onChange={(e) => setPaginasTexto(e.target.value)}
                className="w-20 text-right tabular-nums"
                aria-describedby="paginas-ayuda"
              />
            </div>
            <Slider
              min={1}
              max={20}
              step={1}
              value={[sliderValor]}
              onValueChange={(valor) =>
                setPaginasTexto(String(Array.isArray(valor) ? valor[0] : valor))
              }
              aria-label="Número de páginas"
            />
            <p
              id="paginas-ayuda"
              className="text-xs text-muted-foreground tabular-nums"
            >
              Entre 1 y 20 · cada página adicional a la primera{" "}
              {precio("paginaAdicional")}
            </p>
          </div>

          <Separator />

          {/* Extras */}
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">Extras</legend>
            <Extra
              id="formulario"
              icono={Mail}
              titulo="Formulario de contacto"
              precio={precio("formulario")}
              activo={formulario}
              onCambiar={setFormulario}
            />
            <Extra
              id="segundoIdioma"
              icono={Languages}
              titulo="Segundo idioma"
              precio={precio("segundoIdioma")}
              activo={segundoIdioma}
              onCambiar={setSegundoIdioma}
            />
          </fieldset>
        </form>
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-3">
        <Button
          type="submit"
          form="form-presupuesto"
          size="lg"
          disabled={calculando}
          className="h-10 w-full"
        >
          {calculando ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <Calculator />
          )}
          {calculando ? "Calculando…" : "Calcular presupuesto"}
        </Button>
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer select-none hover:text-foreground">
            Ver la solicitud que se enviará
          </summary>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-background p-3 font-mono leading-relaxed ring-1 ring-foreground/10">
            {`POST /api/presupuesto\nContent-Type: application/json\n\n${JSON.stringify(solicitud, null, 2)}`}
          </pre>
        </details>
      </CardFooter>
    </Card>
  )
}

function Extra({
  id,
  icono: Icono,
  titulo,
  precio,
  activo,
  onCambiar,
}: {
  id: string
  icono: React.ElementType
  titulo: string
  precio: string
  activo: boolean
  onCambiar: (valor: boolean) => void
}) {
  return (
    <Label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-xl border p-3 font-normal transition-colors hover:bg-muted/50",
        activo && "border-primary/40 bg-muted/40"
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icono className="size-4" />
      </span>
      <span className="flex flex-1 flex-col">
        <span className="text-sm font-medium">{titulo}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          + {precio}
        </span>
      </span>
      <Switch
        id={id}
        checked={activo}
        onCheckedChange={(valor) => onCambiar(valor)}
      />
    </Label>
  )
}
