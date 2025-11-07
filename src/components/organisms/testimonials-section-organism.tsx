'use client'

import { TextAtom } from "@/components/atoms/text-atom"
import { CardAtom } from "@/components/atoms/card-atom"

interface Testimonial {
  name: string
  role: string
  company: string
  text: string
}

interface TestimonialsSectionOrganismProps {
  testimonials: Testimonial[]
}

export function TestimonialsSectionOrganism({ testimonials }: TestimonialsSectionOrganismProps) {
  return (
    <section className="px-6 md:px-8 py-24">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16 space-y-4">
          <div className="accent-line" />
          <h2 className="text-5xl font-bold">Loved by teams worldwide</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <CardAtom key={i} variant="muted" className="p-8">
              <p className="text-foreground/80 mb-6 leading-relaxed italic">"{testimonial.text}"</p>
              <div>
                <TextAtom as="p" size="sm" weight="semibold">
                  {testimonial.name}
                </TextAtom>
                <TextAtom as="p" size="xs" color="muted">
                  {testimonial.role} at {testimonial.company}
                </TextAtom>
              </div>
            </CardAtom>
          ))}
        </div>
      </div>
    </section>
  )
}

export default TestimonialsSectionOrganism
