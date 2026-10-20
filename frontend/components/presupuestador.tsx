"use client"

import * as React from "react"
import {
  Building2,
  Calculator,
  CircleAlert,
  FileText,
  Languages,
  LoaderCircle,
  Mail,
  Receipt,
  RefreshCw,
  Rocket,
  Server,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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
import { BancoPruebas } from "@/components/banco-pruebas"
import {
  formatearEuros,
  obtenerEstado,
  obtenerTarifas,
  pedirPresupuesto,
  type RespuestaTarifas,
  type ResultadoPresupuesto,
  type Tipo,
} from "@/lib/api"
import { cn } from "@/lib/utils"

type EstadoApi = "comprobando" | "conectada" | "desconectada"

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

export function Presupuestador() {
  const [estadoApi, setEstadoApi] = React.useState<EstadoApi>("comprobando")
  const [tarifas, setTarifas] = React.useState<RespuestaTarifas | null>(null)

  const [tipo, setTipo] = React.useState<Tipo>("corporativa")
  // Se guarda como texto para poder enviar también valores incorrectos (0, 21, 2.5…)
  // y que sea el servidor quien los rechace.
  const [paginasTexto, setPaginasTexto] = React.useState("4")
  const [formulario, setFormulario] = React.useState(true)
  const [segundoIdioma, setSegundoIdioma] = React.useState(false)

  const [enviando, setEnviando] = React.useState(false)
  const [resultado, setResultado] = React.useState<ResultadoPresupuesto | null>(
    null
  )
  const [errorRed, setErrorRed] = React.useState<string | null>(null)
  const [ultimaSolicitud, setUltimaSolicitud] = React.useState<string | null>(
    null
  )

  const conectar = React.useCallback(async () => {
    setEstadoApi("comprobando")
    const ok = await obtenerEstado()
    setEstadoApi(ok ? "conectada" : "desconectada")
    if (ok) {
      try {
        setTarifas(await obtenerTarifas())
      } catch {
        setTarifas(null)
      }
    }
  }, [])

  React.useEffect(() => {
    // Comprobación inicial al montar el componente: sincroniza con un sistema externo (la API).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    conectar()
  }, [conectar])

  const paginasNumero = paginasTexto.trim() === "" ? null : Number(paginasTexto)
  const solicitud = { tipo, paginas: paginasNumero, formulario, segundoIdioma }
  const solicitudJson = JSON.stringify(solicitud)
  const hayCambiosSinCalcular =
    resultado !== null && ultimaSolicitud !== solicitudJson

  async function calcular(evento: React.FormEvent) {
    evento.preventDefault()
    setEnviando(true)
    setErrorRed(null)
    try {
      const respuesta = await pedirPresupuesto(solicitud)
      setResultado(respuesta)
      setUltimaSolicitud(solicitudJson)
      setEstadoApi("conectada")
    } catch {
      setResultado(null)
      setErrorRed(
        "No se pudo contactar con la API. Comprueba que está arrancada en http://localhost:3000."
      )
      setEstadoApi("desconectada")
    } finally {
      setEnviando(false)
    }
  }

  const precio = (clave: keyof RespuestaTarifas["tarifas"]) =>
    tarifas
      ? formatearEuros(tarifas.tarifas[clave].precio, tarifas.moneda)
      : "—"

  const sliderValor = Math.min(
    20,
    Math.max(1, Math.round(paginasNumero ?? 1) || 1)
  )

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:py-14">
      {/* Cabecera */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <Badge variant="outline" className="w-fit gap-1.5">
            <Receipt /> 0613 · Presupuestos web
          </Badge>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Presupuesta mi web
          </h1>
          <p className="max-w-xl text-muted-foreground">
            Configura tu proyecto y el servidor te devolverá un presupuesto
            desglosado con sus propias tarifas.
          </p>
        </div>
        <IndicadorApi estado={estadoApi} onReintentar={conectar} />
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_400px]">
        {/* Formulario */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tu proyecto</CardTitle>
            <CardDescription>
              Los precios que ves los publica la API en /api/tarifas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              id="form-presupuesto"
              onSubmit={calcular}
              className="flex flex-col gap-8"
            >
              {/* Tipo de web */}
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-3 text-sm font-medium">
                  Tipo de web
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {TIPOS.map(({ id, nombre, descripcion, icono: Icono }) => (
                    <label
                      key={id}
                      className={cn(
                        "group relative flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all hover:bg-muted/50",
                        "has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                        tipo === id &&
                          "border-primary bg-muted/60 ring-1 ring-primary"
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
                          "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors",
                          tipo === id && "bg-primary text-primary-foreground"
                        )}
                      >
                        <Icono className="size-5" />
                      </span>
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="font-medium">{nombre}</span>
                        <span className="text-xs text-muted-foreground">
                          {descripcion}
                        </span>
                        <span className="mt-1 text-sm font-semibold tabular-nums">
                          {precio(id)}
                          <span className="font-normal text-muted-foreground">
                            {" "}
                            · 1.ª página incluida
                          </span>
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Páginas */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="paginas" className="flex items-center gap-2">
                    <FileText className="size-4 text-muted-foreground" /> Número
                    de páginas
                  </Label>
                  <Input
                    id="paginas"
                    type="number"
                    inputMode="numeric"
                    step="any"
                    value={paginasTexto}
                    onChange={(e) => setPaginasTexto(e.target.value)}
                    className="w-24 text-right tabular-nums"
                    aria-describedby="paginas-ayuda"
                  />
                </div>
                <Slider
                  min={1}
                  max={20}
                  step={1}
                  value={[sliderValor]}
                  onValueChange={(valor) =>
                    setPaginasTexto(
                      String(Array.isArray(valor) ? valor[0] : valor)
                    )
                  }
                  aria-label="Número de páginas"
                />
                <p
                  id="paginas-ayuda"
                  className="flex justify-between text-xs text-muted-foreground"
                >
                  <span>
                    Entre 1 y 20 · cada página adicional{" "}
                    {precio("paginaAdicional")}
                  </span>
                  <span className="tabular-nums">1 — 20</span>
                </p>
              </div>

              <Separator />

              {/* Extras */}
              <fieldset className="flex flex-col gap-3">
                <legend className="mb-3 text-sm font-medium">Extras</legend>
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
          <CardFooter className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <code className="truncate rounded-md bg-background px-2 py-1 font-mono text-xs text-muted-foreground ring-1 ring-foreground/10">
              POST /api/presupuesto {solicitudJson}
            </code>
            <Button
              type="submit"
              form="form-presupuesto"
              size="lg"
              disabled={enviando}
              className="px-4"
            >
              {enviando ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Calculator />
              )}
              Calcular presupuesto
            </Button>
          </CardFooter>
        </Card>

        {/* Resultado */}
        <div className="lg:sticky lg:top-6">
          <PanelResultado
            resultado={resultado}
            errorRed={errorRed}
            enviando={enviando}
            desactualizado={hayCambiosSinCalcular}
            paginasEnviadas={
              ultimaSolicitud ? JSON.parse(ultimaSolicitud).paginas : null
            }
            tipoEnviado={
              ultimaSolicitud ? JSON.parse(ultimaSolicitud).tipo : null
            }
            tarifas={tarifas}
          />
        </div>
      </div>

      <BancoPruebas />
    </div>
  )
}

function IndicadorApi({
  estado,
  onReintentar,
}: {
  estado: EstadoApi
  onReintentar: () => void
}) {
  return (
    <div className="flex items-center gap-2 self-start rounded-full border bg-card px-3 py-1.5 text-xs sm:self-auto">
      <Server className="size-3.5 text-muted-foreground" />
      <span className="text-muted-foreground">API</span>
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
      <span className="font-medium">
        {estado === "conectada" && "Conectada"}
        {estado === "desconectada" && "Desconectada"}
        {estado === "comprobando" && "Comprobando…"}
      </span>
      {estado === "desconectada" && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onReintentar}
          aria-label="Reintentar conexión"
        >
          <RefreshCw />
        </Button>
      )}
    </div>
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
        "flex cursor-pointer items-center gap-3 rounded-xl border p-4 font-normal transition-colors hover:bg-muted/50",
        activo && "border-primary/40 bg-muted/40"
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icono className="size-4" />
      </span>
      <span className="flex flex-1 flex-col">
        <span className="font-medium">{titulo}</span>
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

function PanelResultado({
  resultado,
  errorRed,
  enviando,
  desactualizado,
  paginasEnviadas,
  tipoEnviado,
  tarifas,
}: {
  resultado: ResultadoPresupuesto | null
  errorRed: string | null
  enviando: boolean
  desactualizado: boolean
  paginasEnviadas: number | null
  tipoEnviado: Tipo | null
  tarifas: RespuestaTarifas | null
}) {
  if (errorRed) {
    return (
      <Alert variant="destructive">
        <CircleAlert />
        <AlertTitle>Sin conexión con la API</AlertTitle>
        <AlertDescription>{errorRed}</AlertDescription>
      </Alert>
    )
  }

  if (!resultado) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted">
            {enviando ? (
              <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
            ) : (
              <Receipt className="size-5 text-muted-foreground" />
            )}
          </span>
          <p className="font-medium">Aún no hay presupuesto</p>
          <p className="max-w-60 text-sm text-muted-foreground">
            Configura tu web y pulsa <strong>Calcular presupuesto</strong>.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!resultado.ok) {
    return (
      <div className="flex flex-col gap-3">
        <Alert variant="destructive">
          <CircleAlert />
          <AlertTitle>
            {resultado.status} · {resultado.datos.error}
          </AlertTitle>
          <AlertDescription>
            {resultado.datos.detalles?.length ? (
              <ul className="mt-1 list-disc space-y-1 pl-4">
                {resultado.datos.detalles.map((detalle) => (
                  <li key={detalle}>{detalle}</li>
                ))}
              </ul>
            ) : (
              "El servidor ha rechazado la solicitud."
            )}
          </AlertDescription>
        </Alert>
        {desactualizado && <AvisoDesactualizado />}
        <RespuestaJson datos={resultado.datos} status={resultado.status} />
      </div>
    )
  }

  const p = resultado.datos
  const adicionales = paginasEnviadas !== null ? paginasEnviadas - 1 : null
  const lineas = [
    {
      concepto: `Base · ${tipoEnviado === "landing" ? "Landing" : "Web corporativa"}`,
      detalle: "Incluye la primera página",
      importe: p.base,
    },
    {
      concepto: "Páginas adicionales",
      detalle:
        adicionales !== null && tarifas
          ? `${adicionales} × ${formatearEuros(tarifas.tarifas.paginaAdicional.precio, p.moneda)}`
          : undefined,
      importe: p.paginasAdicionales,
    },
    { concepto: "Formulario de contacto", importe: p.formulario },
    { concepto: "Segundo idioma", importe: p.segundoIdioma },
  ]

  return (
    <div className="flex flex-col gap-3">
      <Card
        className={cn("transition-opacity", desactualizado && "opacity-60")}
      >
        <CardHeader>
          <CardDescription className="flex items-center justify-between">
            <span>Presupuesto calculado por el servidor</span>
            <Badge variant="secondary">{resultado.status} OK</Badge>
          </CardDescription>
          <CardTitle className="text-4xl font-semibold tracking-tight tabular-nums">
            {formatearEuros(p.total, p.moneda)}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Separator />
          <ul className="flex flex-col gap-3">
            {lineas.map(({ concepto, detalle, importe }) => (
              <li
                key={concepto}
                className="flex items-baseline justify-between gap-4"
              >
                <span className="flex flex-col">
                  <span
                    className={cn(importe === 0 && "text-muted-foreground")}
                  >
                    {concepto}
                  </span>
                  {detalle && (
                    <span className="text-xs text-muted-foreground">
                      {detalle}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "font-medium tabular-nums",
                    importe === 0 && "text-muted-foreground"
                  )}
                >
                  {formatearEuros(importe, p.moneda)}
                </span>
              </li>
            ))}
          </ul>
          <Separator />
          <div className="flex items-baseline justify-between">
            <span className="font-medium">Total</span>
            <span className="text-lg font-semibold tabular-nums">
              {formatearEuros(p.total, p.moneda)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Sin impuestos ni descuentos · {p.moneda}
          </p>
        </CardContent>
      </Card>
      {desactualizado && <AvisoDesactualizado />}
      <RespuestaJson datos={p} status={resultado.status} />
    </div>
  )
}

function AvisoDesactualizado() {
  return (
    <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
      Has cambiado el formulario. Pulsa <strong>Calcular presupuesto</strong>{" "}
      para actualizarlo.
    </p>
  )
}

function RespuestaJson({ datos, status }: { datos: unknown; status: number }) {
  return (
    <details className="group rounded-xl border bg-card text-xs">
      <summary className="cursor-pointer px-4 py-3 text-muted-foreground select-none hover:text-foreground">
        Ver respuesta JSON ({status})
      </summary>
      <pre className="overflow-x-auto border-t px-4 py-3 font-mono leading-relaxed">
        {JSON.stringify(datos, null, 2)}
      </pre>
    </details>
  )
}
