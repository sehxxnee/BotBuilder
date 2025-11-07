'use client'

import type { ReactNode } from "react"

interface TextAtomProps {
  variant?: "heading-xl" | "heading-lg" | "heading-md" | "body-lg" | "body-md" | "body-sm" | "caption"
  children: ReactNode
  className?: string
  as?: "h1" | "h2" | "h3" | "p" | "span"
}

const variantStyles = {
  "heading-xl": "text-4xl font-bold leading-tight",
  "heading-lg": "text-3xl font-bold leading-tight",
  "heading-md": "text-2xl font-bold leading-tight",
  "body-lg": "text-lg leading-relaxed",
  "body-md": "text-base leading-relaxed",
  "body-sm": "text-sm leading-relaxed",
  caption: "text-xs text-muted-foreground",
}

export function TextAtom({ variant = "body-md", children, className = "", as: Component = "p" }: TextAtomProps) {
  return <Component className={`${variantStyles[variant]} ${className}`.trim()}>{children}</Component>
}

export default TextAtom
