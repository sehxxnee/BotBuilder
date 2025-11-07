'use client'

import type { LucideIcon } from "lucide-react"

interface IconAtomProps {
  icon: LucideIcon
  size?: "sm" | "md" | "lg" | "xl"
  color?: string
  className?: string
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
}

export function IconAtom({ icon: Icon, size = "md", color = "currentColor", className = "" }: IconAtomProps) {
  return <Icon className={`${sizeMap[size]} ${className}`.trim()} color={color} />
}

export default IconAtom
