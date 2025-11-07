"use client"

import type { HTMLAttributes } from "react"

type SeparatorProps = {
  orientation?: "horizontal" | "vertical"
} & HTMLAttributes<HTMLDivElement>

export function Separator({ orientation = "horizontal", className = "", ...props }: SeparatorProps) {
  const base = orientation === "horizontal" ? "h-px w-full" : "w-px h-full"
  return <div role="separator" aria-orientation={orientation} className={`${base} bg-border ${className}`} {...props} />
}



