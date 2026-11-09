"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { useTheme } from "next-themes"

// WebGL: solo se carga en el navegador.
const RippleGrid = dynamic(() => import("@/components/RippleGrid"), { ssr: false })

const subscribe = () => () => {}

/**
 * Fondo de TODA la página: la rejilla de React Bits (en el azul de acento) sobre unas manchas
 * difuminadas muy tenues. Va fija detrás del contenido y es ESTÁTICA: no reacciona al ratón ni
 * al clic, no lanza ondas y, una vez dibujada, no gasta GPU (solo se redibuja al cambiar el
 * tamaño de la ventana o el tema). Da al vidrio algo que desenfocar.
 */
export function FondoPagina() {
  const { resolvedTheme } = useTheme()
  // El tema solo se conoce en el navegador: hasta entonces no se pinta la rejilla (evita parpadeos).
  const cliente = React.useSyncExternalStore(subscribe, () => true, () => false)
  const claro = resolvedTheme !== "dark"

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute -top-40 -left-32 size-[34rem] rounded-full bg-primary/15 blur-3xl dark:bg-primary/20" />
      <div className="absolute top-1/3 -right-40 size-[30rem] rounded-full bg-sky-400/10 blur-3xl dark:bg-sky-400/10" />
      <div className="absolute -bottom-48 left-1/4 size-[32rem] rounded-full bg-zinc-400/15 blur-3xl dark:bg-zinc-500/10" />

      {cliente && (
        // Aparece con un fundido suave para que no «salte» al cargar.
        <div className="absolute inset-0 animate-in fade-in-0 duration-1000">
          <RippleGrid
            key={claro ? "claro" : "oscuro"}
            color="#3b82f6"
            lightMode={claro}
            variant="lines"
            cellSize={56}
            lineWidth={1}
            glow={claro ? 0.35 : 0.55}
            fade={0.3}
            opacity={claro ? 0.5 : 0.7}
            // Fija: sin interacción, sin ondas automáticas, sin animación de entrada y en pausa.
            mouseInteraction={false}
            clickRipple={false}
            autoRipple="none"
            intro={false}
            paused
          />
        </div>
      )}
    </div>
  )
}
