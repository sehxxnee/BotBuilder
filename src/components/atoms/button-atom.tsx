'use client'

import { Button } from "@/components/ui/button"
import type { ReactNode } from "react"

interface ButtonAtomProps {
  variant?: "default" | "secondary" | "destructive" | "ghost" | "outline"
  size?: "default" | "sm" | "lg" | "icon"
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
  isLoading?: boolean
}

export function ButtonAtom({
  variant = "default",
  size = "default",
  children,
  onClick,
  disabled,
  className,
  isLoading,
}: ButtonAtomProps) {
  return (
    <Button variant={variant} size={size} onClick={onClick} disabled={disabled || isLoading} className={className}>
      {isLoading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        children
      )}
    </Button>
  )
}

export default ButtonAtom
