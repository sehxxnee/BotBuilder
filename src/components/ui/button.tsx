"use client"

import type { ButtonHTMLAttributes, ReactNode } from "react"

type Variant = "default" | "secondary" | "destructive" | "ghost" | "outline"
type Size = "default" | "sm" | "lg" | "icon"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

const variantMap: Record<Variant, string> = {
  default: "bg-primary text-primary-foreground hover:opacity-90",
  secondary: "bg-secondary text-secondary-foreground hover:opacity-90",
  destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
  ghost: "bg-transparent hover:bg-muted",
  outline: "border border-border hover:bg-muted",
}

const sizeMap: Record<Size, string> = {
  default: "h-10 px-4 py-2 text-sm rounded-md",
  sm: "h-9 px-3 text-sm rounded-md",
  lg: "h-11 px-6 text-base rounded-md",
  icon: "h-10 w-10 inline-flex items-center justify-center rounded-md",
}

export function Button({ variant = "default", size = "default", className = "", children, ...props }: ButtonProps) {
  const classes = `${variantMap[variant]} ${sizeMap[size]} inline-flex items-center justify-center transition-colors ${className}`
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}



