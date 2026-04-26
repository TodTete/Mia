"use client"

import * as React from "react"
import { MoonIcon as MoonSolid, SunIcon as SunSolid } from "@heroicons/react/24/solid"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { flushSync } from "react-dom"

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()

  const toggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
    const isDark = resolvedTheme === "dark"
    const nextTheme = isDark ? "light" : "dark"

    // Set the click coordinates as CSS variables on the document
    const x = event.clientX
    const y = event.clientY
    document.documentElement.style.setProperty("--x", `${x}px`)
    document.documentElement.style.setProperty("--y", `${y}px`)

    // Fallback for browsers that don't support View Transitions
    if (!document.startViewTransition) {
      setTheme(nextTheme)
      return
    }

    // Start the transition
    document.startViewTransition(() => {
      flushSync(() => {
        setTheme(nextTheme)
      })
    })
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="w-10 h-10 rounded-full bg-on-surface/5 hover:bg-primary/10 transition-all duration-300 shadow-none border-none"
      onClick={toggleTheme}
    >
      <SunSolid className="h-[1.4rem] w-[1.4rem] rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
      <MoonSolid className="absolute h-[1.4rem] w-[1.4rem] rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100 text-indigo-400 drop-shadow-[0_0_10px_rgba(129,140,248,0.5)]" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
