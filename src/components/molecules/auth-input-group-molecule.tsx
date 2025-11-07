"use client"

import type React from "react"
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react"

import { InputAtom } from "@/components/atoms/input-atom"

const iconMap = {
  mail: Mail,
  lock: Lock,
  user: User,
  eye: Eye,
  eyeOff: EyeOff,
} as const

type IconName = keyof typeof iconMap

interface AuthInputGroupMoleculeProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  iconName?: IconName
  error?: string
}

export function AuthInputGroupMolecule({ label, iconName, error, type = "text", ...rest }: AuthInputGroupMoleculeProps) {
  const Icon = iconName ? iconMap[iconName] : undefined

  return (
    <InputAtom
      label={label}
      type={type}
      icon={Icon}
      error={error}
      required
      {...rest}
    />
  )
}
