'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PasswordFieldProps {
  value: string
  onChange: (value: string) => void
  required?: boolean
  minLength?: number
  autoComplete?: string
}

/**
 * Password input with a control to show or hide the typed value.
 * @param value - Current password text
 * @param onChange - Called with the updated text
 * @param required - Whether the field must be filled
 * @param minLength - Minimum character count
 * @param autoComplete - Browser autofill hint
 */
export const PasswordField = ({
  value,
  onChange,
  required = false,
  minLength,
  autoComplete = 'current-password',
}: PasswordFieldProps) => {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        required={required}
        type={visible ? 'text' : 'password'}
        minLength={minLength}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-teal-900/15 px-3 py-2.5 pr-11"
      />
      <button
        type="button"
        aria-label={visible ? 'Hide password' : 'Show password'}
        onClick={() => setVisible((current) => !current)}
        className={cn(
          'absolute right-3 top-1/2 -translate-y-1/2 text-teal-900/55',
          'hover:text-teal-900'
        )}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}
