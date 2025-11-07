'use client'

import Link from "next/link"
import { TextAtom } from "@/components/atoms/text-atom"
import { Separator } from "@/components/ui/separator"

export function FooterOrganism() {
  return (
    <footer className="border-t border-border/40 bg-background/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <TextAtom variant="body-sm" className="font-semibold mb-4">
              Product
            </TextAtom>
            <div className="space-y-2">
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
            </div>
          </div>
          <div>
            <TextAtom variant="body-sm" className="font-semibold mb-4">
              Company
            </TextAtom>
            <div className="space-y-2">
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                About
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Blog
              </Link>
            </div>
          </div>
          <div>
            <TextAtom variant="body-sm" className="font-semibold mb-4">
              Legal
            </TextAtom>
            <div className="space-y-2">
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </Link>
            </div>
          </div>
          <div>
            <TextAtom variant="body-sm" className="font-semibold mb-4">
              Social
            </TextAtom>
            <div className="space-y-2">
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Twitter
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                GitHub
              </Link>
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-primary to-accent" />
            <TextAtom variant="body-sm" className="font-semibold">
              RAG Bot
            </TextAtom>
          </div>
          <TextAtom variant="caption">© 2025 RAG Bot. All rights reserved.</TextAtom>
        </div>
      </div>
    </footer>
  )
}

export default FooterOrganism
