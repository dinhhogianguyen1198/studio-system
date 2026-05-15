"use client"

import { useState, useRef, useEffect } from "react"
import { Search, UserPlus, Check, ChevronDown, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface CustomerOption {
  id: string
  name: string
  phone: string | null
}

interface Props {
  customers: CustomerOption[]
  value: string
  onChange: (id: string) => void
  onQuickCreate: () => void
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ")
  return parts
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

export function CustomerSelector({ customers, value, onChange, onQuickCreate }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = customers.find((c) => c.id === value)
  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search)),
  )

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  function handleSelect(id: string) {
    onChange(id)
    setOpen(false)
    setSearch("")
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-lg border bg-card px-3.5 text-sm transition-all",
          "border-border hover:border-ring/50",
          open && "border-ring ring-2 ring-ring/20",
        )}
      >
        {selected ? (
          <div className="flex flex-1 items-center gap-2.5 min-w-0">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
              {getInitials(selected.name)}
            </div>
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-semibold text-foreground">{selected.name}</p>
              {selected.phone && (
                <p className="text-xs text-muted-foreground">{selected.phone}</p>
              )}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">Tìm kiếm khách hàng...</span>
        )}
        <div className="ml-2 flex flex-shrink-0 items-center gap-1">
          {selected && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                onChange("")
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation()
                  onChange("")
                }
              }}
              className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </div>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="border-b border-border p-2">
            <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
              <Search className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc SĐT..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Không tìm thấy khách hàng</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelect(c.id)}
                  className="flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                      {getInitials(c.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{c.name}</p>
                      {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                    </div>
                  </div>
                  {c.id === value && <Check className="h-3.5 w-3.5 flex-shrink-0 text-primary" />}
                </button>
              ))
            )}
          </div>

          <div className="border-t border-border p-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onQuickCreate()
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Tạo khách hàng mới
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
