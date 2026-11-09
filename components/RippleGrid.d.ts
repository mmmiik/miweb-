import type { ComponentType, HTMLAttributes } from "react"

/** Tipos de RippleGrid (React Bits), que se distribuye en JavaScript. */
export interface RippleGridProps extends HTMLAttributes<HTMLDivElement> {
  color?: string
  variant?: "lines" | "dots" | "cross"
  cellSize?: number
  lineWidth?: number
  glow?: number
  rippleStrength?: number
  rippleSpeed?: number
  rippleSize?: number
  autoRipple?: "center" | "random" | "none"
  rippleInterval?: number
  tilt?: number
  rotation?: number
  mouseInteraction?: boolean
  clickRipple?: boolean
  intro?: boolean
  fade?: number
  opacity?: number
  lightMode?: boolean
  paused?: boolean
  dpr?: number
}

export declare const RippleGrid: ComponentType<RippleGridProps>
export default RippleGrid
