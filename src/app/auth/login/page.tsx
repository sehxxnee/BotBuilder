'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Loader2, Sparkles } from 'lucide-react'

import { api } from '@/app/trpc/client'
import { ButtonAtom } from '@/components/atoms/button-atom'
import { TextAtom } from '@/components/atoms/text-atom'
import { AuthInputGroupMolecule } from '@/components/molecules/auth-input-group-molecule'
import { AuthLayoutOrganism } from '@/components/organisms/auth-layout-organism'
import { saveToken } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const signInMutation = api.auth.signIn.useMutation()

  const isLoading = signInMutation.isPending

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    try {
      const result = await signInMutation.mutateAsync({
        email,
        password,
      })

      saveToken(result.token)
      router.push('/app')
      router.refresh()
    } catch (err) {
      const message = (err as { message?: string })?.message ?? '이메일 또는 비밀번호가 올바르지 않습니다.'
      setError(message)
    }
  }

  const handleDemoLogin = () => {
    setEmail('demo@example.com')
    setPassword('password123')

    window.setTimeout(() => {
      formRef.current?.requestSubmit()
    }, 100)
  }

  return (
    <AuthLayoutOrganism title="Sign in" subtitle="Welcome back. Let's build something great.">
      <form ref={formRef} onSubmit={handleLogin} className="space-y-5">
        <AuthInputGroupMolecule
          label="Email address"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          iconName="mail"
          autoComplete="email"
        />

        <AuthInputGroupMolecule
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          iconName="lock"
          autoComplete="current-password"
        />

        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
            {error}
          </div>
        )}

        <ButtonAtom
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </ButtonAtom>
      </form>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-px bg-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-2 bg-background text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Or explore demo
          </span>
        </div>
      </div>

      <ButtonAtom
        variant="outline"
        type="button"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-transparent"
        onClick={handleDemoLogin}
      >
        <Sparkles className="w-4 h-4" />
        Try Demo Account
      </ButtonAtom>

      <div className="mt-8 pt-8 border-t border-border space-y-3 text-sm text-center">
        <TextAtom as="p" size="sm" color="muted">
          Don't have an account?{' '}
          <Link href="/auth/signup" className="text-primary font-semibold hover:underline">
            Create one free
          </Link>
        </TextAtom>
        <Link href="/" className="block text-muted-foreground hover:text-foreground transition-colors">
          ← Back to home
        </Link>
      </div>
    </AuthLayoutOrganism>
  )
}

