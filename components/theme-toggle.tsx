"use client"

import * as React from "react"
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { flushSync } from "react-dom"

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full">
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

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
      className="w-10 h-10 rounded-full bg-on-surface/5 hover:bg-on-surface/10 backdrop-blur-md border border-on-surface/10"
      onClick={toggleTheme}
    >
      <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-primary" />
      <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-primary" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
