import {
  CircleCheck,
  CircleX,
  LoaderCircle,
  Play,
  RotateCcw,
} from "lucide-react"

import type { EstadoConexion } from "@/components/dashboard/tipos"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatearEuros, type RespuestaTarifas } from "@/lib/api"
import { CASOS, type Caso, type Obtenido } from "@/lib/casos"
import { cn } from "@/lib/utils"

interface Props {
  estado: EstadoConexion
  ms: number | null
  tarifas: RespuestaTarifas | null
  resultados: Record<number, Obtenido>
  ejecutando: boolean
  casoEnCurso: number | null
  onEjecutar: () => void
  onProbarCaso: (caso: Caso) => void
}

type EstadoCaso = "pendiente" | "en-curso" | "correcto" | "fallo"

const VALIDOS = CASOS.filter((c) => c.status === 200)
const INVALIDOS = CASOS.filter((c) => c.status !== 200)

export function PruebasView({
  estado,
  ms,
  tarifas,
  resultados,
  ejecutando,
  casoEnCurso,
  onEjecutar,
  onProbarCaso,
}: Props) {
  const ocupado = ejecutando || casoEnCurso !== null

  const estadoDe = (c: Caso): EstadoCaso =>
    casoEnCurso === c.caso
      ? "en-curso"
      : !resultados[c.caso]
        ? "pendiente"
        : resultados[c.caso].correcto
          ? "correcto"
          : "fallo"

  return (
    <div className="flex flex-col gap-6">
      <Marcador
        estados={CASOS.map(estadoDe)}
        ejecutando={ejecutando}
        casoEnCurso={casoEnCurso}
        onEjecutar={onEjecutar}
        rutas={[
          {
            ruta: "GET /api/estado",
            ok: estado === "conectada",
            texto:
              estado === "conectada"
                ? `200 · status ok${ms !== null ? ` · ${ms} ms` : ""}`
                : "sin respuesta",
          },
          {
            ruta: "GET /api/tarifas",
            ok: tarifas !== null,
            texto: tarifas ? "200 · 5 tarifas" : "sin respuesta",
          },
        ]}
      />

      <Grupo
        titulo="Solicitudes válidas"
        descripcion="Deben devolver 200 con el total correcto."
        className="sm:grid-cols-2 xl:grid-cols-4"
      >
        {VALIDOS.map((c) => (
          <TarjetaCaso
            key={c.caso}
            caso={c}
            estado={estadoDe(c)}
            obtenido={resultados[c.caso]}
            bloqueado={ocupado}
            onProbar={() => onProbarCaso(c)}
          />
        ))}
      </Grupo>

      <Grupo
        titulo="Solicitudes inválidas"
        descripcion="Solo cambia el campo resaltado. Deben devolver 400 sin calcular nada."
        className="sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5"
      >
        {INVALIDOS.map((c) => (
          <TarjetaCaso
            key={c.caso}
            caso={c}
            estado={estadoDe(c)}
            obtenido={resultados[c.caso]}
            bloqueado={ocupado}
            onProbar={() => onProbarCaso(c)}
          />
        ))}
      </Grupo>
    </div>
  )
}

/* ---------- Marcador superior ---------- */

function Marcador({
  estados,
  ejecutando,
  casoEnCurso,
  onEjecutar,
  rutas,
}: {
  estados: EstadoCaso[]
  ejecutando: boolean
  casoEnCurso: number | null
  onEjecutar: () => void
  rutas: { ruta: string; ok: boolean; texto: string }[]
}) {
  const correctos = estados.filter((e) => e === "correcto").length
  const fallos = estados.filter((e) => e === "fallo").length
  const hechos = correctos + fallos
  const todosBien = correctos === CASOS.length

  const mensaje = ejecutando
    ? `Ejecutando caso ${casoEnCurso ?? hechos + 1} de ${CASOS.length}…`
    : hechos === 0
      ? "Aún no se han ejecutado"
      : todosBien
        ? "Todos los casos dan lo esperado"
        : fallos > 0
          ? `${fallos} ${fallos === 1 ? "caso no da" : "casos no dan"} lo esperado`
          : `${hechos} de ${CASOS.length} ejecutados`

  return (
    <Card className="gap-0 py-0">
      <div className="grid gap-6 p-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
        {/* Contador grande */}
        <div className="flex items-baseline gap-1">
          <span
            className={cn(
              "text-6xl font-semibold tracking-tighter tabular-nums",
              todosBien && "text-emerald-600 dark:text-emerald-400",
              fallos > 0 && !ejecutando && "text-destructive"
            )}
          >
            {correctos}
          </span>
          <span className="text-2xl font-medium text-muted-foreground tabular-nums">
            /{CASOS.length}
          </span>
        </div>

        {/* Barra de 9 segmentos + estado */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium" aria-live="polite">
            {mensaje}
          </p>
          <div className="flex gap-1.5" aria-hidden>
            {estados.map((e, i) => (
              <span
                key={i}
                className={cn(
                  "h-2.5 flex-1 rounded-full transition-colors duration-300",
                  e === "pendiente" && "bg-muted",
                  e === "en-curso" &&
                    "animate-pulse bg-primary motion-reduce:animate-none",
                  e === "correcto" && "bg-emerald-500",
                  e === "fallo" && "bg-destructive"
                )}
              />
            ))}
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
            {rutas.map((r) => (
              <li key={r.ruta} className="flex items-center gap-1.5">
                {r.ok ? (
                  <CircleCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <CircleX className="size-3.5 text-destructive" />
                )}
                <code className="font-mono font-medium text-foreground">
                  {r.ruta}
                </code>
                {r.texto}
              </li>
            ))}
          </ul>
        </div>

        <Button
          size="lg"
          onClick={onEjecutar}
          disabled={ejecutando}
          className="h-10 px-4"
        >
          {ejecutando ? (
            <LoaderCircle className="animate-spin" />
          ) : hechos > 0 ? (
            <RotateCcw />
          ) : (
            <Play />
          )}
          {ejecutando
            ? "Ejecutando…"
            : hechos > 0
              ? "Repetir los 9 casos"
              : "Ejecutar los 9 casos"}
        </Button>
      </div>
    </Card>
  )
}

/* ---------- Grupos y tarjetas ---------- */

function Grupo({
  titulo,
  descripcion,
  className,
  children,
}: {
  titulo: string
  descripcion: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold">{titulo}</h2>
        <p className="text-sm text-muted-foreground">{descripcion}</p>
      </div>
      <div className={cn("grid gap-4", className)}>{children}</div>
    </section>
  )
}

function TarjetaCaso({
  caso,
  estado,
  obtenido,
  bloqueado,
  onProbar,
}: {
  caso: Caso
  estado: EstadoCaso
  obtenido: Obtenido | undefined
  bloqueado: boolean
  onProbar: () => void
}) {
  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-xl border bg-card p-4 transition-all duration-300",
        estado === "en-curso" && "border-primary ring-3 ring-primary/25",
        estado === "correcto" && "border-emerald-500/50 bg-emerald-500/5",
        estado === "fallo" && "border-destructive/60 bg-destructive/5"
      )}
    >
      {/* Cabecera: número, título y botón */}
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold tabular-nums transition-colors",
              estado === "en-curso" && "bg-primary text-primary-foreground",
              estado === "correcto" && "bg-emerald-500 text-white",
              estado === "fallo" && "bg-destructive text-white"
            )}
          >
            {caso.caso}
          </span>
          <h3 className="pt-1.5 text-sm leading-snug font-medium">
            {caso.descripcion}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onProbar}
          disabled={bloqueado}
          aria-label={`Probar el caso ${caso.caso}`}
          title={`Probar solo el caso ${caso.caso}`}
        >
          {estado === "en-curso" ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <Play />
          )}
        </Button>
      </header>

      {/* Solicitud: un chip por campo; el campo erróneo, resaltado */}
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(caso.solicitud).map(([clave, valor]) => (
          <span
            key={clave}
            className={cn(
              "rounded-md bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground",
              clave === caso.campo &&
                "bg-destructive/15 font-semibold text-destructive ring-1 ring-destructive/40"
            )}
          >
            {clave}: {JSON.stringify(valor)}
          </span>
        ))}
      </div>

      {/* Esperado frente a obtenido */}
      <div className="mt-auto grid grid-cols-2 gap-3 border-t pt-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Esperado</span>
          <span className="text-lg font-semibold tabular-nums">
            {caso.status}
            {caso.total !== undefined && (
              <span className="ml-1.5 text-sm font-medium text-muted-foreground">
                {formatearEuros(caso.total)}
              </span>
            )}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Obtenido</span>
          {obtenido && estado !== "en-curso" ? (
            <span
              key={obtenido.status}
              className={cn(
                "flex items-center gap-1.5 text-lg font-semibold tabular-nums",
                "animate-in duration-300 fade-in-0 zoom-in-90 motion-reduce:animate-none",
                obtenido.correcto
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-destructive"
              )}
            >
              {obtenido.correcto ? (
                <CircleCheck className="size-4" />
              ) : (
                <CircleX className="size-4" />
              )}
              {obtenido.status || "—"}
              {obtenido.total !== undefined && (
                <span className="text-sm font-medium">
                  {formatearEuros(obtenido.total)}
                </span>
              )}
            </span>
          ) : (
            <span className="text-lg font-semibold text-muted-foreground/50">
              {estado === "en-curso" ? "…" : "—"}
            </span>
          )}
        </div>
      </div>

      {/* Mensaje del servidor en los 400 (o si no hay conexión) */}
      {obtenido && obtenido.total === undefined && estado !== "en-curso" && (
        <p className="animate-in rounded-lg bg-muted/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground duration-300 fade-in-0 motion-reduce:animate-none">
          {obtenido.texto}
        </p>
      )}
    </article>
  )
}
