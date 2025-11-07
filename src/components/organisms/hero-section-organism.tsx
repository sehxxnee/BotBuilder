'use client'

import { ButtonAtom } from "@/components/atoms/button-atom"
import { TextAtom } from "@/components/atoms/text-atom"
import { useRouter } from "next/navigation"

export function HeroSectionOrganism() {
  const router = useRouter()

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Decorative gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-accent/20 rounded-full blur-3xl opacity-20" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <div className="space-y-4">
          <TextAtom variant="heading-xl" as="h1" className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            AI Chatbots,{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Built Your Way
            </span>
          </TextAtom>
          <TextAtom variant="body-lg" className="text-muted-foreground max-w-2xl mx-auto text-lg sm:text-xl">
            Create powerful RAG chatbots without writing a single line of code. Upload your files, customize your bot,
            and deploy in minutes.
          </TextAtom>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <ButtonAtom
            size="lg"
            onClick={() => router.push("/auth/login")}
            className="w-full sm:w-auto px-8 py-6 text-base"
          >
            Get Started Free
          </ButtonAtom>
          <ButtonAtom
            variant="outline"
            size="lg"
            onClick={() => router.push("/demo")}
            className="w-full sm:w-auto px-8 py-6 text-base"
          >
            Watch Demo
          </ButtonAtom>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-border/40">
          <div>
            <TextAtom variant="heading-lg" className="text-primary">
              10K+
            </TextAtom>
            <TextAtom variant="body-sm" className="text-muted-foreground">
              Users
            </TextAtom>
          </div>
          <div>
            <TextAtom variant="heading-lg" className="text-primary">
              99.9%
            </TextAtom>
            <TextAtom variant="body-sm" className="text-muted-foreground">
              Uptime
            </TextAtom>
          </div>
          <div>
            <TextAtom variant="heading-lg" className="text-primary">
              {"<3"}
            </TextAtom>
            <TextAtom variant="body-sm" className="text-muted-foreground">
              Minutes to Deploy
            </TextAtom>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSectionOrganism
