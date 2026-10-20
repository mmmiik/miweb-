import { Info } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatearEuros, type RespuestaTarifas } from "@/lib/api"

const ORDEN: (keyof RespuestaTarifas["tarifas"])[] = [
  "landing",
  "corporativa",
  "paginaAdicional",
  "formulario",
  "segundoIdioma",
]

export function TarifasView({ tarifas }: { tarifas: RespuestaTarifas | null }) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tarifas del servidor</CardTitle>
          <CardDescription>
            Respuesta de GET /api/tarifas. Son las únicas que usa el servidor
            para calcular.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tarifas ? (
            <ul className="divide-y rounded-lg border">
              {ORDEN.map((clave) => (
                <li
                  key={clave}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">
                      {tarifas.tarifas[clave].concepto}
                    </span>
                    <code className="font-mono text-xs text-muted-foreground">
                      {clave}
                    </code>
                  </span>
                  <span className="text-lg font-semibold tabular-nums">
                    {formatearEuros(
                      tarifas.tarifas[clave].precio,
                      tarifas.moneda
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
              No se han podido cargar las tarifas. Comprueba que la API está
              arrancada.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Cómo calcula el servidor
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <p className="rounded-lg bg-muted/60 px-3 py-2 font-mono text-xs leading-relaxed">
              total = precio base
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ (páginas − 1) × página
              adicional
              <br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ extras seleccionados
            </p>
            <ol className="flex list-decimal flex-col gap-2 pl-5 text-muted-foreground">
              <li>
                <span className="text-foreground">Valida</span> que llegan los
                cuatro campos con el tipo correcto.
              </li>
              <li>
                <span className="text-foreground">Calcula</span> con sus propias
                tarifas, en una función aparte de la ruta.
              </li>
              <li>
                <span className="text-foreground">Responde</span> 200 con el
                desglose, o 400 si algo no es válido.
              </li>
            </ol>
          </CardContent>
        </Card>

        <div className="flex gap-3 rounded-xl border bg-card p-4 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>
            El cliente nunca envía precios ni totales. Si llega una propiedad
            extra como <code className="font-mono">total</code>, el servidor la
            ignora.
          </p>
        </div>
      </div>
    </div>
  )
}
