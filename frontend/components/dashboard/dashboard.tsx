"use client"

import * as React from "react"

import { Calculadora } from "@/components/dashboard/calculadora"
import { Historial } from "@/components/dashboard/historial"
import { Kpis } from "@/components/dashboard/kpis"
import {
  BarraLateral,
  NavegacionMovil,
  PuntoEstado,
  VISTAS,
} from "@/components/dashboard/navegacion"
import { PruebasView } from "@/components/dashboard/pruebas-view"
import { Resultado } from "@/components/dashboard/resultado"
import { TarifasView } from "@/components/dashboard/tarifas-view"
import type {
  Entrada,
  EstadoConexion,
  Solicitud,
  Vista,
} from "@/components/dashboard/tipos"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  obtenerEstado,
  obtenerTarifas,
  pedirPresupuesto,
  type RespuestaTarifas,
  type ResultadoPresupuesto,
} from "@/lib/api"
import { CASOS, ejecutarCaso, type Obtenido } from "@/lib/casos"

const URL_API = "localhost:3000"

// Tiempo mínimo que se ve el estado "Calculando…", aunque la API responda antes.
const DURACION_MINIMA_MS = 900

export function Dashboard() {
  const [vista, setVista] = React.useState<Vista>("resumen")

  const [estado, setEstado] = React.useState<EstadoConexion>("comprobando")
  const [ms, setMs] = React.useState<number | null>(null)
  const [tarifas, setTarifas] = React.useState<RespuestaTarifas | null>(null)

  const [historial, setHistorial] = React.useState<Entrada[]>([])
  const [errorRed, setErrorRed] = React.useState(false)
  const [calculando, setCalculando] = React.useState(false)

  const [pruebas, setPruebas] = React.useState<Record<number, Obtenido>>({})
  const [ejecutando, setEjecutando] = React.useState(false)

  const siguienteId = React.useRef(1)

  const conectar = React.useCallback(async () => {
    setEstado("comprobando")
    const { ok, ms } = await obtenerEstado()
    setMs(ms)
    setEstado(ok ? "conectada" : "desconectada")
    if (ok) {
      try {
        setTarifas(await obtenerTarifas())
      } catch {
        setTarifas(null)
      }
    }
  }, [])

  React.useEffect(() => {
    // Comprobación inicial al montar: sincroniza con un sistema externo (la API).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    conectar()
  }, [conectar])

  async function calcular(solicitud: Solicitud) {
    setCalculando(true)

    // La API responde en milisegundos y el aviso pasaría desapercibido, así que
    // se espera a la respuesta Y a un tiempo mínimo, lo que tarde más. Sin
    // conexión, pedirPresupuesto falla y resultado queda en null.
    const [resultado] = await Promise.all([
      pedirPresupuesto(solicitud).catch(
        (): ResultadoPresupuesto | null => null
      ),
      new Promise((resolver) => setTimeout(resolver, DURACION_MINIMA_MS)),
    ])

    if (resultado) registrar({ solicitud, resultado })
    else sinConexion()
    setCalculando(false)
  }

  function registrar(entrada: Omit<Entrada, "id" | "hora">) {
    setErrorRed(false)
    setEstado("conectada")
    setHistorial((anteriores) => [
      {
        ...entrada,
        id: siguienteId.current++,
        hora: new Date().toLocaleTimeString("es-ES"),
      },
      ...anteriores,
    ])
  }

  function sinConexion() {
    setErrorRed(true)
    setEstado("desconectada")
  }

  async function ejecutarPruebas() {
    setEjecutando(true)
    setPruebas({})
    for (const caso of CASOS) {
      const obtenido = await ejecutarCaso(caso)
      setPruebas((previas) => ({ ...previas, [caso.caso]: obtenido }))
    }
    setEjecutando(false)
  }

  const actual = VISTAS.find((v) => v.id === vista) ?? VISTAS[0]
  // Lo último que respondió el servidor (el historial guarda lo más reciente primero).
  const ultimaEntrada = historial[0] ?? null

  return (
    <div className="min-h-svh md:grid md:grid-cols-[15rem_minmax(0,1fr)]">
      <BarraLateral
        vista={vista}
        onCambiar={setVista}
        estado={estado}
        ms={ms}
        urlApi={URL_API}
      />

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b bg-background/80 px-4 py-3 backdrop-blur sm:px-6">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight">
              {actual.titulo}
            </h1>
            <p className="truncate text-sm text-muted-foreground">
              {actual.descripcion}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* En móvil no hay barra lateral: el estado va en la cabecera. */}
            <button
              type="button"
              onClick={conectar}
              title="Volver a comprobar la API"
              className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs md:hidden"
            >
              <PuntoEstado estado={estado} />
              API
            </button>
            <ThemeToggle />
          </div>
        </header>

        <NavegacionMovil vista={vista} onCambiar={setVista} />

        <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
          {vista === "resumen" && (
            <>
              <Kpis
                estado={estado}
                ms={ms}
                historial={historial}
                pruebas={pruebas}
              />
              <div className="grid items-start gap-6 lg:grid-cols-2">
                <Calculadora
                  tarifas={tarifas}
                  calculando={calculando}
                  onCalcular={calcular}
                />
                <Resultado
                  entrada={ultimaEntrada}
                  errorRed={errorRed}
                  calculando={calculando}
                  tarifas={tarifas}
                />
              </div>
              <Historial
                historial={historial}
                onVaciar={() => setHistorial([])}
              />
            </>
          )}

          {vista === "tarifas" && <TarifasView tarifas={tarifas} />}

          {vista === "pruebas" && (
            <PruebasView
              estado={estado}
              ms={ms}
              tarifas={tarifas}
              resultados={pruebas}
              ejecutando={ejecutando}
              onEjecutar={ejecutarPruebas}
            />
          )}
        </main>
      </div>
    </div>
  )
}
