'use client'

import { FeatureCardMolecule } from "@/components/molecules/feature-card-molecule"
import { TextAtom } from "@/components/atoms/text-atom"
import { Upload, Zap, Globe } from "lucide-react"

export function FeaturesSectionOrganism() {
  const features = [
    {
      icon: Upload,
      title: "Drag & Drop Upload",
      description: "Simply upload your documents, PDFs, and text files to train your bot instantly.",
    },
    {
      icon: Zap,
      title: "Smart Customization",
      description: "Choose from pre-built templates or create custom prompts to match your needs.",
    },
    {
      icon: Globe,
      title: "Deploy Everywhere",
      description: "Get embeddable chat widgets, API access, and integration with your favorite tools.",
    },
  ]

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <TextAtom variant="heading-lg" as="h2">
            Features Built for Everyone
          </TextAtom>
          <TextAtom variant="body-lg" className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to create and deploy intelligent chatbots without technical expertise.
          </TextAtom>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCardMolecule
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturesSectionOrganism
