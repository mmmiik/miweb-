import { CircleCheck, CircleX, LoaderCircle, Play } from "lucide-react"

import type { EstadoConexion } from "@/components/dashboard/tipos"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatearEuros, type RespuestaTarifas } from "@/lib/api"
import { CASOS, type Obtenido } from "@/lib/casos"
import { cn } from "@/lib/utils"

interface Props {
  estado: EstadoConexion
  ms: number | null
  tarifas: RespuestaTarifas | null
  resultados: Record<number, Obtenido>
  ejecutando: boolean
  onEjecutar: () => void
}

export function PruebasView({
  estado,
  ms,
  tarifas,
  resultados,
  ejecutando,
  onEjecutar,
}: Props) {
  const hechos = Object.values(resultados)
  const aciertos = hechos.filter((o) => o.correcto).length

  return (
    <div className="flex flex-col gap-6">
      {/* Las dos rutas GET */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rutas GET</CardTitle>
          <CardDescription>Se comprueban al abrir el panel.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y rounded-lg border text-sm">
            <FilaRuta
              ruta="GET /api/estado"
              correcta={estado === "conectada"}
              texto={
                estado === "conectada"
                  ? `200 · {"status":"ok"}${ms !== null ? ` · ${ms} ms` : ""}`
                  : "Sin respuesta"
              }
            />
            <FilaRuta
              ruta="GET /api/tarifas"
              correcta={tarifas !== null}
              texto={
                tarifas
                  ? `200 · 5 tarifas · landing ${formatearEuros(tarifas.tarifas.landing.precio)}, corporativa ${formatearEuros(tarifas.tarifas.corporativa.precio)}`
                  : "Sin respuesta"
              }
            />
          </ul>
        </CardContent>
      </Card>

      {/* Los nueve casos del POST */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">POST /api/presupuesto</CardTitle>
          <CardDescription>
            Los nueve casos obligatorios del enunciado, enviados tal cual.
          </CardDescription>
          <CardAction className="flex items-center gap-3">
            {hechos.length > 0 && !ejecutando && (
              <Badge
                variant={
                  aciertos === CASOS.length ? "secondary" : "destructive"
                }
              >
                {aciertos}/{CASOS.length} correctos
              </Badge>
            )}
            <Button onClick={onEjecutar} disabled={ejecutando}>
              {ejecutando ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Play />
              )}
              Ejecutar casos
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Caso</th>
                  <th className="px-3 py-2 font-medium">Solicitud</th>
                  <th className="px-3 py-2 font-medium">Esperado</th>
                  <th className="px-3 py-2 font-medium">Obtenido</th>
                </tr>
              </thead>
              <tbody>
                {CASOS.map((c) => {
                  const o = resultados[c.caso]
                  return (
                    <tr key={c.caso} className="border-t align-top">
                      <td className="px-3 py-2.5 font-medium tabular-nums">
                        {c.caso}
                      </td>
                      <td className="px-3 py-2.5">
                        <div>{c.descripcion}</div>
                        <code className="font-mono text-xs text-muted-foreground">
                          {JSON.stringify(c.solicitud)}
                        </code>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap tabular-nums">
                        {c.status}
                        {c.total !== undefined &&
                          ` · ${formatearEuros(c.total)}`}
                      </td>
                      <td className="px-3 py-2.5">
                        {o ? (
                          <span className="flex items-start gap-2">
                            {o.correcto ? (
                              <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <CircleX className="mt-0.5 size-4 shrink-0 text-destructive" />
                            )}
                            <span
                              className={cn(!o.correcto && "text-destructive")}
                            >
                              <span className="font-medium tabular-nums">
                                {o.status}
                              </span>{" "}
                              · {o.texto}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function FilaRuta({
  ruta,
  correcta,
  texto,
}: {
  ruta: string
  correcta: boolean
  texto: string
}) {
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      {correcta ? (
        <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <CircleX className="mt-0.5 size-4 shrink-0 text-destructive" />
      )}
      <code className="font-mono text-xs font-medium whitespace-nowrap">
        {ruta}
      </code>
      <span className="text-xs text-muted-foreground">{texto}</span>
    </li>
  )
}
