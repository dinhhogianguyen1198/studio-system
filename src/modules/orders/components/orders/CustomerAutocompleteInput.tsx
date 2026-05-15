"use client"

import { useState, useRef, useEffect } from "react"
import { Search, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CustomerOption {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
}

interface Props {
  id?: string
  customers: CustomerOption[]
  value: string
  linkedCustomerId: string
  onChangeName: (value: string) => void
  onSelect: (customer: CustomerOption) => void
  onUnlink: () => void
  inputClass: string
}

export function CustomerAutocompleteInput({
  id,
  customers,
  value,
  linkedCustomerId,
  onChangeName,
  onSelect,
  onUnlink,
  inputClass,
}: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered =
    value.trim().length > 0
      ? customers
          .filter(
            (c) =>
              c.name.toLowerCase().includes(value.toLowerCase()) ||
              (c.phone && c.phone.includes(value)),
          )
          .slice(0, 8)
      : []

  const linked = linkedCustomerId ? customers.find((c) => c.id === linkedCustomerId) : null

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      {/* Search input */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          id={id}
          name="contactName"
          placeholder="Nhập tên khách hàng..."
          required
          autoComplete="off"
          value={value}
          onChange={(e) => {
            onChangeName(e.target.value)
            setOpen(true)
          }}
          onFocus={() => {
            if (value.trim()) setOpen(true)
          }}
          className={cn(inputClass, "pl-9")}
        />
      </div>

      {/* Linked customer chip */}
      {linked && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs">
            <span className="font-bold text-primary">KH</span>
            <span className="text-muted-foreground">•</span>
            <span className="font-medium text-foreground">{linked.name}</span>
            {linked.phone && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-foreground">{linked.phone}</span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onUnlink}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Xóa
          </button>
        </div>
      )}

      {/* Dropdown */}
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="max-h-56 overflow-y-auto p-1">
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onSelect(c)
                  setOpen(false)
                }}
                className="flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{c.name}</p>
                  {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                </div>
                {c.id === linkedCustomerId && (
                  <Check className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
