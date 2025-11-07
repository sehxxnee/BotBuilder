'use client'

import { Button } from "@/components/ui/button"
import type { ButtonHTMLAttributes, ReactNode } from "react"

interface ButtonAtomProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "destructive" | "ghost" | "outline"
  size?: "default" | "sm" | "lg" | "icon"
  children: ReactNode
  isLoading?: boolean
}

export function ButtonAtom({
  variant = "default",
  size = "default",
  children,
  className,
  isLoading,
  disabled,
  ...rest
}: ButtonAtomProps) {
  return (
    <Button
      variant={variant}
      size={size}
      disabled={disabled || isLoading}
      className={className}
      {...rest}
    >
      {isLoading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        children
      )}
    </Button>
  )
}

export default ButtonAtom
