"use client"

import * as React from "react"
import {
  CircleCheck,
  CircleX,
  FlaskConical,
  LoaderCircle,
  Play,
} from "lucide-react"

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
import { formatearEuros, pedirPresupuesto } from "@/lib/api"
import { cn } from "@/lib/utils"

// Los nueve casos obligatorios del enunciado. Se envían tal cual, incluidos los
// inválidos, para comprobar que es el servidor quien los rechaza.
const VALIDA = {
  tipo: "landing",
  paginas: 1,
  formulario: false,
  segundoIdioma: false,
}

const CASOS: {
  caso: number
  descripcion: string
  solicitud: object
  status: number
  total?: number
}[] = [
  {
    caso: 1,
    descripcion: "Landing, 1 página, sin extras",
    solicitud: VALIDA,
    status: 200,
    total: 300,
  },
  {
    caso: 2,
    descripcion: "Corporativa, 4 páginas, formulario y sin segundo idioma",
    solicitud: {
      tipo: "corporativa",
      paginas: 4,
      formulario: true,
      segundoIdioma: false,
    },
    status: 200,
    total: 830,
  },
  {
    caso: 3,
    descripcion: "Landing, 2 páginas, ambos extras",
    solicitud: {
      tipo: "landing",
      paginas: 2,
      formulario: true,
      segundoIdioma: true,
    },
    status: 200,
    total: 580,
  },
  {
    caso: 4,
    descripcion: "Landing, 20 páginas, sin extras",
    solicitud: { ...VALIDA, paginas: 20 },
    status: 200,
    total: 1250,
  },
  {
    caso: 5,
    descripcion: "paginas: 0",
    solicitud: { ...VALIDA, paginas: 0 },
    status: 400,
  },
  {
    caso: 6,
    descripcion: "paginas: 21",
    solicitud: { ...VALIDA, paginas: 21 },
    status: 400,
  },
  {
    caso: 7,
    descripcion: "paginas: 2.5",
    solicitud: { ...VALIDA, paginas: 2.5 },
    status: 400,
  },
  {
    caso: 8,
    descripcion: 'tipo: "tienda"',
    solicitud: { ...VALIDA, tipo: "tienda" },
    status: 400,
  },
  {
    caso: 9,
    descripcion: 'formulario: "false"',
    solicitud: { ...VALIDA, formulario: "false" },
    status: 400,
  },
]

interface Obtenido {
  status: number
  texto: string
  correcto: boolean
}

export function BancoPruebas() {
  const [obtenidos, setObtenidos] = React.useState<Record<number, Obtenido>>({})
  const [ejecutando, setEjecutando] = React.useState(false)

  async function ejecutar() {
    setEjecutando(true)
    setObtenidos({})
    for (const c of CASOS) {
      let obtenido: Obtenido
      try {
        const r = await pedirPresupuesto(c.solicitud)
        const texto = r.ok
          ? `Total: ${formatearEuros(r.datos.total, r.datos.moneda)}`
          : (r.datos.detalles?.join(" ") ?? r.datos.error)
        const correcto =
          r.status === c.status && (!r.ok || r.datos.total === c.total)
        obtenido = { status: r.status, texto, correcto }
      } catch {
        obtenido = {
          status: 0,
          texto: "Sin conexión con la API",
          correcto: false,
        }
      }
      setObtenidos((prev) => ({ ...prev, [c.caso]: obtenido }))
    }
    setEjecutando(false)
  }

  const hechos = Object.values(obtenidos)
  const aciertos = hechos.filter((o) => o.correcto).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FlaskConical className="size-5 text-muted-foreground" /> Banco de
          pruebas
        </CardTitle>
        <CardDescription>
          Los nueve casos obligatorios del enunciado enviados directamente a
          POST /api/presupuesto.
        </CardDescription>
        <CardAction className="flex items-center gap-3">
          {hechos.length > 0 && !ejecutando && (
            <Badge
              variant={aciertos === CASOS.length ? "secondary" : "destructive"}
            >
              {aciertos}/{CASOS.length} correctos
            </Badge>
          )}
          <Button onClick={ejecutar} disabled={ejecutando} variant="outline">
            {ejecutando ? <LoaderCircle className="animate-spin" /> : <Play />}
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
                const o = obtenidos[c.caso]
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
                      {c.total !== undefined && ` · ${formatearEuros(c.total)}`}
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
  )
}
