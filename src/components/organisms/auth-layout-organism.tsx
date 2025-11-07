"use client"

import Link from "next/link"
import type React from "react"

import { TextAtom } from "@/components/atoms/text-atom"
import { CardAtom } from "@/components/atoms/card-atom"

interface AuthLayoutOrganismProps {
  children: React.ReactNode
  title: string
  subtitle: string
  linkText?: string
  linkHref?: string
}

export function AuthLayoutOrganism({ children, title, subtitle, linkText, linkHref }: AuthLayoutOrganismProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-3 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <TextAtom as="span" size="lg" weight="bold" className="text-white">
                RAG
              </TextAtom>
            </div>
          </div>
          <TextAtom as="h1" size="3xl" weight="bold">
            {title}
          </TextAtom>
          <TextAtom as="p" size="sm" color="muted">
            {subtitle}
          </TextAtom>
        </div>

        <CardAtom className="p-8 shadow-md-refined">{children}</CardAtom>

        {linkText && linkHref && (
          <div className="text-center">
            <TextAtom as="p" size="sm" color="muted">
              <Link href={linkHref} className="text-primary hover:text-primary/80 font-semibold transition-colors">
                {linkText}
              </Link>
            </TextAtom>
          </div>
        )}
      </div>
    </div>
  )
}
