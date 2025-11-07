'use client'

import { CardAtom } from "@/components/atoms/card-atom"
import { IconAtom } from "@/components/atoms/icon-atom"
import { TextAtom } from "@/components/atoms/text-atom"
import type { LucideIcon } from "lucide-react"

interface FeatureCardMoleculeProps {
  icon: LucideIcon
  title: string
  description: string
  className?: string
}

export function FeatureCardMolecule({ icon, title, description, className = "" }: FeatureCardMoleculeProps) {
  return (
    <CardAtom className={`p-6 hover:shadow-lg transition-shadow ${className}`}>
      <div className="flex flex-col items-start gap-4">
        <div className="rounded-lg bg-primary/10 p-3">
          <IconAtom icon={icon} size="lg" color="#4F46E5" />
        </div>
        <div className="space-y-2">
          <TextAtom variant="heading-md" as="h3">
            {title}
          </TextAtom>
          <TextAtom variant="body-sm" className="text-muted-foreground">
            {description}
          </TextAtom>
        </div>
      </div>
    </CardAtom>
  )
}

export default FeatureCardMolecule
