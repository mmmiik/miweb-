/**
 * Fondo de página: unas manchas azul/neutro difuminadas a muy baja opacidad.
 * Sin él, el blur del vidrio no tendría nada que desenfocar.
 */
export function FondoPagina() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute -top-40 -left-32 size-[34rem] rounded-full bg-primary/15 blur-3xl dark:bg-primary/20" />
      <div className="absolute top-1/3 -right-40 size-[30rem] rounded-full bg-sky-400/10 blur-3xl dark:bg-sky-400/10" />
      <div className="absolute -bottom-48 left-1/4 size-[32rem] rounded-full bg-zinc-400/15 blur-3xl dark:bg-zinc-500/10" />
    </div>
  )
}
