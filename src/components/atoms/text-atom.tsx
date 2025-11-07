'use client'

import type { ReactNode } from "react"

type TextVariant = "heading-xl" | "heading-lg" | "heading-md" | "body-lg" | "body-md" | "body-sm" | "caption"
type TextSize = "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl"
type TextWeight = "normal" | "medium" | "semibold" | "bold"
type TextColor = "default" | "muted" | "primary" | "secondary" | "destructive"

interface TextAtomProps {
  variant?: TextVariant
  size?: TextSize
  weight?: TextWeight
  color?: TextColor
  children: ReactNode
  className?: string
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span" | "div"
}

const variantStyles: Record<TextVariant, string> = {
  "heading-xl": "text-4xl font-bold leading-tight",
  "heading-lg": "text-3xl font-bold leading-tight",
  "heading-md": "text-2xl font-semibold leading-tight",
  "body-lg": "text-lg leading-relaxed",
  "body-md": "text-base leading-relaxed",
  "body-sm": "text-sm leading-relaxed",
  caption: "text-xs text-muted-foreground",
}

const sizeStyles: Partial<Record<TextSize, string>> = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
  "4xl": "text-4xl",
  "5xl": "text-5xl",
}

const weightStyles: Record<TextWeight, string> = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
}

const colorStyles: Record<TextColor, string> = {
  default: "text-foreground",
  muted: "text-muted-foreground",
  primary: "text-primary",
  secondary: "text-secondary",
  destructive: "text-destructive",
}

export function TextAtom({
  variant = "body-md",
  size,
  weight,
  color,
  children,
  className = "",
  as: Component = "p",
}: TextAtomProps) {
  const classes = [
    variantStyles[variant],
    size ? sizeStyles[size] : "",
    weight ? weightStyles[weight] : "",
    color ? colorStyles[color] : "",
    className,
  ]
    .filter(Boolean)
    .join(" ")
    .trim()

  return <Component className={classes || variantStyles["body-md"]}>{children}</Component>
}

export default TextAtom
