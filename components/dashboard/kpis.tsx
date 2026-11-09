import * as React from "react"
import { Activity, FlaskConical, Send, Wallet } from "lucide-react"

import type { Entrada, EstadoConexion } from "@/components/dashboard/tipos"
import { Card } from "@/components/ui/card"
import { formatearEuros } from "@/lib/api"
import { CASOS, type Obtenido } from "@/lib/casos"
import { cn } from "@/lib/utils"

interface Props {
  estado: EstadoConexion
  ms: number | null
  historial: Entrada[]
  pruebas: Record<number, Obtenido>
}

export function Kpis({ estado, ms, historial, pruebas }: Props) {
  const ultimo = historial.find((e) => e.resultado.ok)
  const correctas = historial.filter((e) => e.resultado.ok).length
  const rechazadas = historial.length - correctas

  const hechas = Object.values(pruebas)
  const aciertos = hechas.filter((o) => o.correcto).length

  return (
    <section
      aria-label="Indicadores"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <Kpi
        icono={Activity}
        titulo="Estado de la API"
        valor={
          estado === "conectada"
            ? "Conectada"
            : estado === "desconectada"
              ? "Desconectada"
              : "Comprobando…"
        }
        detalle={
          estado === "conectada" && ms !== null
            ? `Responde en ${ms} ms`
            : "GET /api/estado"
        }
        tono={
          estado === "conectada"
            ? "ok"
            : estado === "desconectada"
              ? "error"
              : "neutro"
        }
      />
      <Kpi
        icono={Wallet}
        titulo="Último presupuesto"
        valor={
          ultimo && ultimo.resultado.ok
            ? formatearEuros(
                ultimo.resultado.datos.total,
                ultimo.resultado.datos.moneda
              )
            : "—"
        }
        detalle={
          ultimo
            ? `${ultimo.solicitud.tipo === "landing" ? "Landing" : "Corporativa"} · ${ultimo.solicitud.paginas} pág.`
            : "Aún sin calcular"
        }
      />
      <Kpi
        icono={Send}
        titulo="Solicitudes"
        valor={String(historial.length)}
        detalle={`${correctas} correctas · ${rechazadas} rechazadas`}
      />
      <Kpi
        icono={FlaskConical}
        titulo="Casos del enunciado"
        valor={hechas.length > 0 ? `${aciertos}/${CASOS.length}` : "—"}
        detalle={
          hechas.length === 0
            ? "Sin ejecutar"
            : aciertos === CASOS.length && hechas.length === CASOS.length
              ? "Todos correctos"
              : "Revisa la sección Pruebas"
        }
        tono={
          hechas.length === CASOS.length
            ? aciertos === CASOS.length
              ? "ok"
              : "error"
            : "neutro"
        }
      />
    </section>
  )
}

function Kpi({
  icono: Icono,
  titulo,
  valor,
  detalle,
  tono = "neutro",
}: {
  icono: React.ElementType
  titulo: string
  valor: string
  detalle: string
  tono?: "neutro" | "ok" | "error"
}) {
  return (
    <Card size="sm" className="gap-3">
      <div className="flex items-center justify-between px-(--card-spacing)">
        <span className="text-sm text-muted-foreground">{titulo}</span>
        <Icono className="size-4 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-1 px-(--card-spacing)">
        <span
          className={cn(
            "text-2xl font-semibold tracking-tight tabular-nums",
            tono === "ok" && "text-emerald-600 dark:text-emerald-400",
            tono === "error" && "text-destructive"
          )}
        >
          {valor}
        </span>
        <span className="text-xs text-muted-foreground">{detalle}</span>
      </div>
    </Card>
  )
}
