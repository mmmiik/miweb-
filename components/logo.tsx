import { cn } from "@/lib/utils"

/**
 * Marca: tres barras que suben en escalera (un presupuesto que crece, y el recorrido en tres
 * pasos de la web) y una chispa de IA sobre la más alta. Mismo dibujo que app/icon.svg.
 */
export function Marca({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden
      className={cn("size-8 shrink-0", className)}
    >
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <rect x="6" y="17" width="5" height="8" rx="2.5" fill="white" fillOpacity="0.62" />
      <rect x="12" y="12" width="5" height="13" rx="2.5" fill="white" fillOpacity="0.82" />
      <rect x="18" y="7" width="5" height="18" rx="2.5" fill="white" />
      {/* Chispa de cuatro puntas */}
      <path
        d="M26.2 4.4c.3 1.9.9 2.5 2.8 2.8-1.9.3-2.5.9-2.8 2.8-.3-1.9-.9-2.5-2.8-2.8 1.9-.3 2.5-.9 2.8-2.8Z"
        fill="white"
      />
    </svg>
  )
}

/** Marca + nombre. «Presupuesta» en negrita y «mi web» en fino y azul: dos pesos de Geist. */
export function Logo({ className, conTexto = true }: { className?: string; conTexto?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Marca />
      {conTexto && (
        <span className="text-[0.9375rem] leading-none tracking-tight">
          <span className="font-extrabold">Presupuesta</span>
          <span className="ml-1 font-light text-primary">mi web</span>
        </span>
      )}
    </span>
  )
}
