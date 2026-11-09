"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "cn"

/** Interruptor estilo iOS (51×31). El área táctil se amplía hasta ≥44 px de alto. */
function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer relative inline-flex h-[31px] w-[51px] shrink-0 items-center rounded-full border border-transparent transition-colors outline-none after:absolute after:-inset-x-1 after:-inset-y-2 focus-visible:ring-3 focus-visible:ring-ring/50 data-checked:bg-primary data-unchecked:bg-black/15 data-disabled:cursor-not-allowed data-disabled:opacity-50 dark:data-unchecked:bg-white/20",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block size-[27px] rounded-full bg-white shadow-md ring-0 transition-transform data-checked:translate-x-[22px] data-unchecked:translate-x-[2px]"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
