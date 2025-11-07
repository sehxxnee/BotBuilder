'use client'

import Link from "next/link"
import { ButtonAtom } from "@/components/atoms/button-atom"
import { TextAtom } from "@/components/atoms/text-atom"
import { useRouter } from "next/navigation"

export function NavbarOrganism() {
  const router = useRouter()

  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <TextAtom variant="heading-md" as="span" className="hidden sm:inline">
              RAG Bot
            </TextAtom>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Demo
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <ButtonAtom variant="ghost" onClick={() => router.push("/auth/login")} className="hidden sm:inline-flex">
              Sign In
            </ButtonAtom>
            <ButtonAtom onClick={() => router.push("/auth/signup")}>Get Started</ButtonAtom>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default NavbarOrganism
