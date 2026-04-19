'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from './input'
import { cn } from '@/lib/utils'

interface ComboboxOption {
  value: string
  label: string
  sublabel?: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onValueChange: (value: string) => void
  onSearch?: (query: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function Combobox({
  options,
  value,
  onValueChange,
  onSearch,
  placeholder = 'Search...',
  className,
  disabled,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedOption = options.find(o => o.value === value)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (onSearch) {
      const timer = setTimeout(() => onSearch(query), 200)
      return () => clearTimeout(timer)
    }
  }, [query, onSearch])

  const filtered = query
    ? options.filter(o =>
        o.label.toLowerCase().includes(query.toLowerCase()) ||
        (o.sublabel ?? '').toLowerCase().includes(query.toLowerCase())
      )
    : options

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <Input
        ref={inputRef}
        placeholder={selectedOption ? selectedOption.label : placeholder}
        value={open ? query : (selectedOption?.label ?? '')}
        onChange={e => {
          setQuery(e.target.value)
          if (!open) setOpen(true)
        }}
        onFocus={() => {
          setOpen(true)
          setQuery('')
        }}
        disabled={disabled}
        className="text-sm"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border bg-popover shadow-md">
          {filtered.slice(0, 30).map(option => (
            <button
              key={option.value}
              type="button"
              className={cn(
                'w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer',
                value === option.value && 'bg-accent/10 font-medium'
              )}
              onClick={() => {
                onValueChange(option.value)
                setQuery('')
                setOpen(false)
              }}
            >
              <span className="font-mono text-xs text-muted-foreground">{option.label.split(' — ')[0]}</span>
              {option.label.includes(' — ') && (
                <span className="ml-1">{option.label.split(' — ').slice(1).join(' — ')}</span>
              )}
              {option.sublabel && (
                <span className="block text-xs text-muted-foreground truncate">{option.sublabel}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
