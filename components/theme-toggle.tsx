"use client"

import { MoonIcon, SunIcon } from "@phosphor-icons/react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Cambiar entre modo claro y oscuro"
      title="Modo claro / oscuro (tecla D)"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      {/* Ambos iconos van en el HTML y el CSS elige cuál se ve: sin parpadeo al cargar. */}
      <SunIcon weight="bold" aria-hidden className="size-4 dark:hidden" />
      <MoonIcon weight="bold" aria-hidden className="hidden size-4 dark:block" />
    </Button>
  )
}
