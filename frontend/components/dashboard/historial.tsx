import { History, Trash2 } from "lucide-react"

import type { Entrada } from "@/components/dashboard/tipos"
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
import { formatearEuros } from "@/lib/api"

interface Props {
  historial: Entrada[]
  onVaciar: () => void
}

const MAX_FILAS = 8

export function Historial({ historial, onVaciar }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Actividad reciente</CardTitle>
        <CardDescription>
          Solicitudes de esta sesión. No se guardan en ninguna base de datos.
        </CardDescription>
        {historial.length > 0 && (
          <CardAction>
            <Button variant="ghost" size="sm" onClick={onVaciar}>
              <Trash2 /> Vaciar
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {historial.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
            <History className="size-5" />
            Aquí aparecerán los presupuestos que calcules.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Hora</th>
                  <th className="px-3 py-2 font-medium">Solicitud</th>
                  <th className="px-3 py-2 font-medium">Respuesta</th>
                  <th className="px-3 py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {historial.slice(0, MAX_FILAS).map((e) => (
                  <tr key={e.id} className="border-t">
                    <td className="px-3 py-2.5 text-muted-foreground tabular-nums">
                      {e.hora}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-medium">
                        {e.solicitud.tipo === "landing"
                          ? "Landing"
                          : "Corporativa"}
                      </span>
                      <span className="text-muted-foreground">
                        {" "}
                        · {String(e.solicitud.paginas)} pág.
                      </span>
                      <span className="ml-2 inline-flex gap-1 align-middle">
                        {e.solicitud.formulario === true && (
                          <Badge variant="outline">Formulario</Badge>
                        )}
                        {e.solicitud.segundoIdioma === true && (
                          <Badge variant="outline">2.º idioma</Badge>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {e.resultado.ok ? (
                        <Badge variant="secondary">
                          {e.resultado.status} OK
                        </Badge>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Badge variant="destructive">
                            {e.resultado.status}
                          </Badge>
                          <span className="max-w-64 truncate text-xs text-muted-foreground">
                            {e.resultado.datos.detalles?.[0] ??
                              e.resultado.datos.error}
                          </span>
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium tabular-nums">
                      {e.resultado.ok
                        ? formatearEuros(
                            e.resultado.datos.total,
                            e.resultado.datos.moneda
                          )
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
