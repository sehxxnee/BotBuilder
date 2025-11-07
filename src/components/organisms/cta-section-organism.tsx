'use client'

import Link from "next/link"
import { TextAtom } from "@/components/atoms/text-atom"
import { ButtonAtom } from "@/components/atoms/button-atom"
import { ArrowRight } from "lucide-react"

export function CTASectionOrganism() {
  return (
    <section className="px-6 md:px-8 py-24 bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h2 className="text-5xl font-bold">Ready to build smarter?</h2>
          <TextAtom as="p" size="lg" color="muted" className="max-w-2xl mx-auto">
            Join thousands of teams using RAG chatbots to save time and deliver better customer experiences.
          </TextAtom>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/signup">
            <ButtonAtom size="lg" className="group">
              Get started free <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </ButtonAtom>
          </Link>
          <Link href="/demo">
            <ButtonAtom variant="outline" size="lg">
              Watch demo
            </ButtonAtom>
          </Link>
        </div>

        <TextAtom as="p" size="xs" color="muted">
          No credit card required. 14-day free trial.
        </TextAtom>
      </div>
    </section>
  )
}

export default CTASectionOrganism