"use client"

import * as React from "react"

import { PruebasView } from "@/components/pruebas-view"
import {
  obtenerTarifas,
  type RespuestaTarifas,
} from "@/lib/api"
import { CASOS, ejecutarCaso, type Caso, type Obtenido } from "@/lib/casos"

// Pausa entre casos al ejecutar las pruebas, para que se vea el progreso.
const PAUSA_CASO_MS = 350

/** Contenedor con el estado de la vista Pruebas (los nueve casos de POST /api/presupuesto). */
export function PruebasPanel({
  conexion,
  ms,
}: {
  conexion: "comprobando" | "conectada" | "desconectada"
  ms: number | null
}) {
  const [tarifas, setTarifas] = React.useState<RespuestaTarifas | null>(null)
  const [resultados, setResultados] = React.useState<Record<number, Obtenido>>({})
  const [ejecutando, setEjecutando] = React.useState(false)
  const [casoEnCurso, setCasoEnCurso] = React.useState<number | null>(null)

  React.useEffect(() => {
    let vivo = true
    obtenerTarifas()
      .then((t) => vivo && setTarifas(t))
      .catch(() => vivo && setTarifas(null))
    return () => {
      vivo = false
    }
  }, [])

  async function probarCaso(caso: Caso) {
    setCasoEnCurso(caso.caso)
    const [obtenido] = await Promise.all([
      ejecutarCaso(caso),
      new Promise((resolver) => setTimeout(resolver, PAUSA_CASO_MS)),
    ])
    setResultados((previos) => ({ ...previos, [caso.caso]: obtenido }))
    setCasoEnCurso(null)
  }

  async function ejecutarTodos() {
    setEjecutando(true)
    setResultados({})
    for (const caso of CASOS) await probarCaso(caso)
    setEjecutando(false)
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Pruebas de la API</h1>
        <p className="text-sm text-muted-foreground">
          Las rutas y los nueve casos del enunciado sobre POST /api/presupuesto, que sigue
          funcionando igual.
        </p>
      </div>
      <PruebasView
        estado={conexion}
        ms={ms}
        tarifas={tarifas}
        resultados={resultados}
        ejecutando={ejecutando}
        casoEnCurso={casoEnCurso}
        onEjecutar={ejecutarTodos}
        onProbarCaso={probarCaso}
      />
    </div>
  )
}
