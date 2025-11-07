'use client'

import { NavbarOrganism } from '@/components/organisms/navbar-organism'
import { FooterOrganism } from '@/components/organisms/footer-organism'
import { HeroSectionOrganism } from '@/components/organisms/hero-section-organism'
import { FeaturesSectionOrganism } from '@/components/organisms/features-section-organism'
import { StatsSectionOrganism } from '@/components/organisms/stats-section-organism'
import { TestimonialsSectionOrganism } from '@/components/organisms/testimonials-section-organism'
import { CTASectionOrganism } from '@/components/organisms/cta-section-organism'
import { CardAtom } from '@/components/atoms/card-atom'
import { TextAtom } from '@/components/atoms/text-atom'

export default function LandingPage() {
  const stats = [
    { metric: '10K+', label: 'Teams building smarter' },
    { metric: '2.5M+', label: 'Documents processed' },
    { metric: '99.9%', label: 'Uptime guarantee' },
  ]

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Product Manager',
      company: 'TechCorp',
      text: 'Reduced customer support time by 60% in the first week. Absolutely game-changing.',
    },
    {
      name: 'Marcus Johnson',
      role: 'Operations Lead',
      company: 'Global Logistics',
      text: 'Finally, a tool that actually understands our documentation. No more digging through PDFs.',
    },
    {
      name: 'Elena Rodriguez',
      role: 'HR Director',
      company: 'Scale Ventures',
      text: 'Our onboarding chatbot is now handling 80% of initial questions. Incredible ROI.',
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <NavbarOrganism />
      <HeroSectionOrganism />
      <StatsSectionOrganism stats={stats} />
      <FeaturesSectionOrganism />

      <section className="px-6 md:px-8 py-24 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 space-y-4">
            <div className="accent-line" />
            <h2 className="text-5xl font-bold">From documents to chatbot</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: '01', title: 'Upload', desc: 'Drop your PDFs, documents, or text files. We handle the rest.' },
              { num: '02', title: 'Customize', desc: 'Set system prompts, personality, and behavior rules.' },
              { num: '03', title: 'Deploy', desc: 'Get a live chatbot with a shareable link instantly.' },
            ].map((step, i) => (
              <div key={i} className="relative">
                <CardAtom className="p-8">
                  <div className="text-5xl font-bold text-primary/10 mb-4">{step.num}</div>
                  <TextAtom variant="heading-md" as="h3" className="mb-3">
                    {step.title}
                  </TextAtom>
                  <TextAtom variant="body-sm" as="p" className="leading-relaxed text-muted-foreground">
                    {step.desc}
                  </TextAtom>
                </CardAtom>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-border via-primary/50 to-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <TestimonialsSectionOrganism testimonials={testimonials} />
      <CTASectionOrganism />
      <FooterOrganism />
    </div>
  )
}