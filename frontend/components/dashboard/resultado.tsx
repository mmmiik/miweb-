import * as React from "react"
import { Calculator, CircleAlert, Receipt, WifiOff } from "lucide-react"

import type { Entrada } from "@/components/dashboard/tipos"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatearEuros, type RespuestaTarifas } from "@/lib/api"
import { cn } from "@/lib/utils"

interface Props {
  entrada: Entrada | null
  errorRed: boolean
  calculando: boolean
  tarifas: RespuestaTarifas | null
}

// Entrada animada. La key de cada resultado es el id de la entrada, así que
// la animación se repite con cada cálculo nuevo.
const ENTRADA =
  "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-3 duration-500 motion-reduce:animate-none"

export function Resultado({ entrada, errorRed, calculando, tarifas }: Props) {
  if (calculando) {
    return (
      <Card className="h-full min-h-64">
        <CardContent
          role="status"
          aria-live="polite"
          className="flex h-full min-h-64 flex-col items-center justify-center gap-5 text-center"
        >
          <span className="relative flex size-14 items-center justify-center">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/30 motion-reduce:animate-none" />
            <span className="relative flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Calculator className="size-6" />
            </span>
          </span>
          <div className="flex flex-col gap-1">
            <p className="font-medium">Calculando presupuesto…</p>
            <p className="text-sm text-muted-foreground">
              El servidor está validando la solicitud
            </p>
          </div>
          <div className="relative h-1.5 w-48 overflow-hidden rounded-full bg-muted">
            <div className="absolute inset-y-0 left-0 w-1/3 animate-indeterminado rounded-full bg-primary motion-reduce:animate-none" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (errorRed) {
    return (
      <Alert variant="destructive">
        <WifiOff />
        <AlertTitle>Sin conexión con la API</AlertTitle>
        <AlertDescription>
          No se pudo contactar con el servidor. Comprueba que está arrancado en
          http://localhost:3000.
        </AlertDescription>
      </Alert>
    )
  }

  if (!entrada) {
    return (
      <Card className="h-full border-dashed">
        <CardContent className="flex h-full min-h-64 flex-col items-center justify-center gap-3 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Receipt className="size-5 text-muted-foreground" />
          </span>
          <p className="font-medium">Aún no hay presupuesto</p>
          <p className="max-w-60 text-sm text-muted-foreground">
            Configura la web y pulsa <strong>Calcular presupuesto</strong>.
          </p>
        </CardContent>
      </Card>
    )
  }

  const { resultado, solicitud } = entrada

  if (!resultado.ok) {
    return (
      <div key={entrada.id} className={cn("flex flex-col gap-3", ENTRADA)}>
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
        <p className="text-xs text-muted-foreground">
          El servidor no calcula nada si la solicitud no es válida.
        </p>
        <RespuestaJson datos={resultado.datos} status={resultado.status} />
      </div>
    )
  }

  const p = resultado.datos
  const adicionales = (solicitud.paginas ?? 1) - 1

  // Cada concepto lleva un color; la barra y la leyenda comparten el mismo.
  const conceptos = [
    {
      nombre: `Base · ${solicitud.tipo === "landing" ? "Landing" : "Web corporativa"}`,
      detalle: "Incluye la primera página",
      importe: p.base,
      color: "bg-chart-1",
    },
    {
      nombre: "Páginas adicionales",
      detalle: tarifas
        ? `${adicionales} × ${formatearEuros(tarifas.tarifas.paginaAdicional.precio, p.moneda)}`
        : undefined,
      importe: p.paginasAdicionales,
      color: "bg-chart-2",
    },
    {
      nombre: "Formulario de contacto",
      importe: p.formulario,
      color: "bg-chart-3",
    },
    {
      nombre: "Segundo idioma",
      importe: p.segundoIdioma,
      color: "bg-chart-4",
    },
  ]

  return (
    <div key={entrada.id} className={cn("flex flex-col gap-3", ENTRADA)}>
      <Card className="ring-2 ring-primary/40">
        <CardHeader>
          <CardDescription className="flex items-center justify-between">
            <span>Presupuesto calculado por el servidor</span>
            <Badge variant="secondary">{resultado.status} OK</Badge>
          </CardDescription>
          <CardTitle className="text-4xl font-semibold tracking-tight tabular-nums">
            {formatearEuros(p.total, p.moneda)}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {/* Barra de desglose */}
          <div
            role="img"
            aria-label="Reparto del total por concepto"
            className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-muted"
          >
            {conceptos
              .filter((c) => c.importe > 0)
              .map((c) => (
                <div
                  key={c.nombre}
                  className={cn(
                    "h-full first:rounded-l-full last:rounded-r-full",
                    c.color
                  )}
                  style={{ width: `${(c.importe / p.total) * 100}%` }}
                />
              ))}
          </div>

          <ul className="flex flex-col gap-3">
            {conceptos.map((c) => (
              <li key={c.nombre} className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-1.5 size-2.5 shrink-0 rounded-full",
                    c.importe > 0 ? c.color : "bg-muted"
                  )}
                />
                <span className="flex flex-1 flex-col text-sm">
                  <span
                    className={cn(c.importe === 0 && "text-muted-foreground")}
                  >
                    {c.nombre}
                  </span>
                  {c.detalle && (
                    <span className="text-xs text-muted-foreground">
                      {c.detalle}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium tabular-nums",
                    c.importe === 0 && "text-muted-foreground"
                  )}
                >
                  {formatearEuros(c.importe, p.moneda)}
                </span>
              </li>
            ))}
          </ul>

          <p className="border-t pt-3 text-xs text-muted-foreground">
            Sin impuestos ni descuentos · {p.moneda}
          </p>
        </CardContent>
      </Card>
      <RespuestaJson datos={p} status={resultado.status} />
    </div>
  )
}

function RespuestaJson({ datos, status }: { datos: unknown; status: number }) {
  return (
    <details className="rounded-xl border bg-card text-xs">
      <summary className="cursor-pointer px-4 py-3 text-muted-foreground select-none hover:text-foreground">
        Ver respuesta JSON ({status})
      </summary>
      <pre className="overflow-x-auto border-t px-4 py-3 font-mono leading-relaxed">
        {JSON.stringify(datos, null, 2)}
      </pre>
    </details>
  )
}
