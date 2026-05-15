"use client"

import { useState, useEffect, useCallback } from "react"

const STORAGE_KEY = "sidebar:collapsed"

export function useSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored !== null) setCollapsed(stored === "true")
    } catch {
      // localStorage unavailable (SSR or private mode)
    }
  }, [])

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {}
      return next
    })
  }, [])

  const collapse = useCallback(() => {
    setCollapsed(true)
    try {
      localStorage.setItem(STORAGE_KEY, "true")
    } catch {}
  }, [])

  const expand = useCallback(() => {
    setCollapsed(false)
    try {
      localStorage.setItem(STORAGE_KEY, "false")
    } catch {}
  }, [])

  return { collapsed, mounted, toggle, collapse, expand }
}
