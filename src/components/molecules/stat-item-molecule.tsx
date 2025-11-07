'use client'

import { TextAtom } from "@/components/atoms/text-atom"

interface StatItemMoleculeProps {
  value: string | number
  label: string
  subLabel?: string
}

export function StatItemMolecule({ value, label, subLabel }: StatItemMoleculeProps) {
  return (
    <div className="text-center">
      <TextAtom variant="heading-lg" className="text-primary">
        {value}
      </TextAtom>
      <TextAtom variant="body-sm" className="text-muted-foreground mt-1">
        {label}
      </TextAtom>
      {subLabel && <TextAtom variant="caption">{subLabel}</TextAtom>}
    </div>
  )
}

export default StatItemMolecule
