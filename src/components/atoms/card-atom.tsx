'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ReactNode } from "react"

interface CardAtomProps {
  title?: string
  description?: string
  children: ReactNode
  className?: string
  header?: ReactNode
}

export function CardAtom({ title, description, children, className = "", header }: CardAtomProps) {
  return (
    <Card className={className}>
      {header && <CardHeader>{header}</CardHeader>}
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export default CardAtom
