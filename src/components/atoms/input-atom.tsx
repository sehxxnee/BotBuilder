"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { LucideIcon } from "lucide-react"

interface InputAtomProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon
  error?: string
  label?: string
}

export function InputAtom({
  type = "text",
  placeholder,
  value,
  onChange,
  disabled,
  icon: Icon,
  error,
  label,
  className = "",
  required,
  ...rest
}: InputAtomProps) {
  return (
    <div className="w-full space-y-2">
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </Label>
      )}
      <div className="relative flex items-center">
        {Icon && <Icon className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />}
        <Input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`${Icon ? "pl-10" : ""} ${error ? "border-red-500" : ""} ${className}`.trim()}
          required={required}
          {...rest}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
