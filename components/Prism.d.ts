import type { ComponentType, HTMLAttributes } from "react"

/** Tipos de Prism (React Bits), que se distribuye en JavaScript. */
export interface PrismProps extends HTMLAttributes<HTMLDivElement> {
  height?: number
  baseWidth?: number
  animationType?: "rotate" | "hover" | "3drotate" | "rotate3d"
  glow?: number
  offset?: { x?: number; y?: number }
  noise?: number
  scale?: number
  hueShift?: number
  colorFrequency?: number
  colors?: string[]
  saturation?: number
  timeScale?: number
  interactive?: boolean
  hoverStrength?: number
  inertia?: number
  intro?: boolean
  resolution?: number
  lightMode?: boolean
  dpr?: number
}

declare const Prism: ComponentType<PrismProps>
export default Prism
