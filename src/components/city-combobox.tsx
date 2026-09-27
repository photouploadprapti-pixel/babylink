'use client'

import { useMemo, useState } from 'react'
import { suggestThailandCities } from '@/lib/thailand-cities'
import { cn } from '@/lib/utils'

interface CityComboboxProps {
  value: string
  onChange: (city: string) => void
  required?: boolean
  className?: string
  placeholder?: string
}

/**
 * City field that suggests Thai towns and provinces as the parent types.
 * @param value - Current city text
 * @param onChange - Called when the text or a suggestion changes
 * @param required - Whether the field must be filled
 * @param className - Extra classes for the text input
 * @param placeholder - Input placeholder
 */
export const CityCombobox = ({
  value,
  onChange,
  required = false,
  className,
  placeholder = 'Start typing a city in Thailand',
}: CityComboboxProps) => {
  const [open, setOpen] = useState(false)
  const suggestions = useMemo(
    () => suggestThailandCities(value),
    [value]
  )

  /**
   * Stores a chosen city and closes the suggestion list.
   * @param city - Selected Thai city name
   */
  const choose = (city: string) => {
    onChange(city)
    setOpen(false)
  }

  return (
    <div className="relative">
      <input
        required={required}
        value={value}
        autoComplete="off"
        placeholder={placeholder}
        className={cn(
          'w-full rounded-xl border border-teal-900/15 bg-white px-3 py-2.5 text-sm',
          className
        )}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          onChange(event.target.value)
          setOpen(true)
        }}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 150)
        }}
      />
      {open && suggestions.length ? (
        <ul
          className={cn(
            'absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl',
            'border border-teal-900/10 bg-white py-1 shadow-lg'
          )}
        >
          {suggestions.map((city) => (
            <li key={city}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm text-teal-950 hover:bg-teal-50"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(city)}
              >
                {city}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
