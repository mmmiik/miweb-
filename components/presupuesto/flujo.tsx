"use client"

import * as React from "react"

import { PasoPresupuesto } from "@/components/presupuesto/paso-presupuesto"
import { PasoPropuesta } from "@/components/presupuesto/paso-propuesta"
import { PasoSolicitud } from "@/components/presupuesto/paso-solicitud"
import { Stepper } from "@/components/presupuesto/stepper"
import type {
  CatalogoPorId,
  EstadoCalculo,
  EstadoPropuesta,
  ItemServicio,
  Paso,
} from "@/components/presupuesto/tipos"
import {
  confirmarServicios,
  obtenerCatalogo,
  pedirPdf,
  pedirPropuesta,
  type Catalogo,
  type ErrorApi,
} from "@/lib/api"
import { cn } from "@/lib/utils"

const textoError = (e: ErrorApi) =>
  e.detalles && e.detalles.length > 0 ? `${e.error}: ${e.detalles.join(" ")}` : e.error

/**
 * Flujo en 3 pasos: solicitud → propuesta de la IA (editable) → presupuesto + PDF.
 *
 * Regla de oro: aquí no se calcula ningún importe. La IA solo propone ids; el usuario
 * los acepta o quita; y los importes, el total y el PDF los devuelve siempre el servidor.
 * Cualquier cambio en los servicios invalida el cálculo y la vista previa.
 */
export function Flujo() {
  const [paso, setPaso] = React.useState<Paso>(1)
  const [maximo, setMaximo] = React.useState<Paso>(1)

  // Paso 1
  const [cliente, setCliente] = React.useState("")
  const [descripcion, setDescripcion] = React.useState("")
  const [erroresSolicitud, setErroresSolicitud] = React.useState<string[] | null>(null)

  // Paso 2
  const [propuesta, setPropuesta] = React.useState<EstadoPropuesta | null>(null)
  const [firmaPropuesta, setFirmaPropuesta] = React.useState("")
  const [items, setItems] = React.useState<ItemServicio[]>([])
  const [activos, setActivos] = React.useState<Record<string, boolean>>({})
  const [paginas, setPaginas] = React.useState("")
  const [catalogo, setCatalogo] = React.useState<Catalogo | null>(null)

  // Paso 3
  const [calculo, setCalculo] = React.useState<EstadoCalculo | null>(null)

  const abortPropuesta = React.useRef<AbortController | null>(null)
  const abortCalculo = React.useRef<AbortController | null>(null)
  const urlPdf = React.useRef<string | null>(null)

  const catalogoPorId = React.useMemo<CatalogoPorId>(
    () => Object.fromEntries((catalogo?.servicios ?? []).map((s) => [s.id, s])),
    [catalogo]
  )

  // Carga inicial del catálogo (sistema externo: la API).
  React.useEffect(() => {
    let vivo = true
    obtenerCatalogo().then((r) => {
      if (vivo && r.ok) setCatalogo(r.datos)
    })
    return () => {
      vivo = false
      abortPropuesta.current?.abort()
      abortCalculo.current?.abort()
      if (urlPdf.current) URL.revokeObjectURL(urlPdf.current)
    }
  }, [])

  /* ---------- Derivados (solo guían la interfaz; el servidor valida) ---------- */

  const idsActivos = items.filter((i) => activos[i.id]).map((i) => i.id)
  const usaPaginas = idsActivos.includes("paginasAdicionales")
  const paginasNum = Number(paginas)
  const paginasValidas =
    paginas.trim() !== "" && Number.isInteger(paginasNum) && paginasNum >= 1 && paginasNum <= 20

  const bloqueos: string[] = []
  if (!catalogo) {
    bloqueos.push("No se ha podido cargar el catálogo de servicios.")
  } else if (!idsActivos.some((id) => catalogoPorId[id]?.clase === "base")) {
    bloqueos.push("Elige un servicio base: landing o corporativa.")
  }
  if (usaPaginas && !paginasValidas) {
    bloqueos.push("Indica el número total de páginas (entre 1 y 20).")
  }

  /* ---------- Utilidades ---------- */

  function irA(nuevo: Paso) {
    setPaso(nuevo)
    setMaximo((m) => (nuevo > m ? nuevo : m))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  /** Cualquier cambio de servicios invalida el cálculo y la vista previa. */
  function invalidarCalculo() {
    abortCalculo.current?.abort()
    abortCalculo.current = null
    if (urlPdf.current) {
      URL.revokeObjectURL(urlPdf.current)
      urlPdf.current = null
    }
    setCalculo(null)
  }

  const firmaActual = `${cliente.trim()}\n${descripcion.trim()}`

  /* ---------- Paso 1 → 2 ---------- */

  async function proponer() {
    setErroresSolicitud(null)

    // Si nada ha cambiado y ya hay propuesta, se conserva (y con ella las ediciones del usuario).
    if (propuesta?.fase === "lista" && firmaActual === firmaPropuesta) {
      irA(2)
      return
    }

    abortPropuesta.current?.abort()
    const ctrl = new AbortController()
    abortPropuesta.current = ctrl
    invalidarCalculo()
    setPropuesta({ fase: "cargando" })
    irA(2)

    if (!catalogo) {
      const c = await obtenerCatalogo()
      if (c.ok) setCatalogo(c.datos)
    }

    try {
      const r = await pedirPropuesta({ cliente, descripcion }, ctrl.signal)
      if (ctrl.signal.aborted) return
      if (r.ok) {
        setItems(
          r.datos.servicios.map((s) => ({
            id: s.id,
            justificacion: s.justificacion,
            propuesto: true,
          }))
        )
        setActivos(Object.fromEntries(r.datos.servicios.map((s) => [s.id, true])))
        setPaginas("")
        setFirmaPropuesta(firmaActual)
        setPropuesta({ fase: "lista", datos: r.datos })
      } else if (r.status === 400) {
        // Entrada inválida: se vuelve al formulario con lo que dice el servidor.
        setErroresSolicitud(r.datos.detalles ?? [r.datos.error])
        setPropuesta(null)
        irA(1)
      } else {
        setPropuesta({ fase: "error", mensaje: textoError(r.datos) })
      }
    } catch {
      /* petición cancelada: no hay nada que mostrar */
    }
  }

  /* ---------- Edición de servicios (paso 2) ---------- */

  function alternar(id: string, activo: boolean) {
    invalidarCalculo()
    setActivos((prev) => {
      const siguiente = { ...prev, [id]: activo }
      // Los servicios base son excluyentes: al activar uno, se apagan los demás.
      if (activo && catalogoPorId[id]?.clase === "base") {
        for (const otro of items) {
          if (otro.id !== id && catalogoPorId[otro.id]?.clase === "base") siguiente[otro.id] = false
        }
      }
      return siguiente
    })
  }

  function anadir(id: string) {
    invalidarCalculo()
    setItems((prev) => (prev.some((i) => i.id === id) ? prev : [...prev, { id, propuesto: false }]))
    alternar(id, true)
  }

  function cambiarPaginas(valor: string) {
    invalidarCalculo()
    setPaginas(valor)
  }

  /* ---------- Paso 2 → 3: el servidor calcula importes y PDF ---------- */

  async function calcular() {
    if (propuesta?.fase !== "lista" || bloqueos.length > 0) return
    const datos = propuesta.datos

    abortCalculo.current?.abort()
    const ctrl = new AbortController()
    abortCalculo.current = ctrl
    setCalculo({ fase: "cargando" })

    const servicios = idsActivos.map((id) => ({ id }))
    const paginasEnviadas = usaPaginas ? paginasNum : undefined

    try {
      const [conf, pdf] = await Promise.all([
        confirmarServicios({ servicios, paginas: paginasEnviadas }, ctrl.signal),
        pedirPdf(
          {
            cliente: datos.cliente,
            resumen: datos.resumen,
            servicios,
            paginas: paginasEnviadas,
            pendientes: datos.pendientes,
          },
          ctrl.signal
        ),
      ])
      if (ctrl.signal.aborted) return
      if (!conf.ok) return setCalculo({ fase: "error", mensaje: textoError(conf.datos) })
      if (!pdf.ok) return setCalculo({ fase: "error", mensaje: textoError(pdf.datos) })
      const url = URL.createObjectURL(pdf.blob)
      urlPdf.current = url
      setCalculo({ fase: "lista", confirmacion: conf.datos, pdfUrl: url, numero: pdf.numero })
    } catch {
      /* cancelado por un cambio de servicios */
    }
  }

  function continuar() {
    if (bloqueos.length > 0) return
    irA(3)
    if (!calculo || calculo.fase === "error") void calcular()
  }

  function ir(destino: Paso) {
    if (destino === paso) return
    // Si en el paso 1 se ha cambiado el texto, hay que volver a pedir la propuesta.
    if (paso === 1 && destino >= 2 && firmaActual !== firmaPropuesta) return void proponer()
    if (destino === 3) return continuar()
    irA(destino)
  }

  /* ---------- Render ---------- */

  const ancho = paso === 3 ? "max-w-6xl" : "max-w-2xl"
  const datosPropuesta = propuesta?.fase === "lista" ? propuesta.datos : null

  return (
    <div className={cn("mx-auto w-full space-y-6 transition-[max-width]", ancho)}>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Presupuesta mi web</h1>
        <p className="text-sm text-muted-foreground">
          Cuéntanos tu proyecto, revisa los servicios propuestos y descarga tu presupuesto en PDF.
        </p>
      </div>

      <Stepper paso={paso} maximo={maximo} onIr={ir} />

      {paso === 1 && (
        <PasoSolicitud
          cliente={cliente}
          descripcion={descripcion}
          errores={erroresSolicitud}
          enviando={propuesta?.fase === "cargando"}
          onCliente={setCliente}
          onDescripcion={setDescripcion}
          onEnviar={proponer}
        />
      )}

      {paso === 2 && propuesta && (
        <PasoPropuesta
          estado={propuesta}
          catalogo={catalogo}
          catalogoPorId={catalogoPorId}
          items={items}
          activos={activos}
          paginas={paginas}
          onAlternar={alternar}
          onAnadir={anadir}
          onPaginas={cambiarPaginas}
          onReintentar={proponer}
          onVolver={() => irA(1)}
          onContinuar={continuar}
          bloqueos={bloqueos}
          resumen={datosPropuesta?.resumen}
          pendientes={datosPropuesta?.pendientes}
          avisos={datosPropuesta?.avisos}
        />
      )}

      {paso === 3 && (
        <PasoPresupuesto
          estado={calculo}
          onVolver={() => irA(2)}
          onReintentar={calcular}
        />
      )}
    </div>
  )
}
