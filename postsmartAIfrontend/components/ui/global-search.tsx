"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"

interface SearchResult {
  id: number
  type: "email" | "call" | "knowledge"
  icon: string
  title: string
  subtitle: string
  status: string | null
  url: string
}

const TYPE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  email:     { bg: "#EBF4FF", color: "#0066CC", label: "Mail" },
  call:      { bg: "#ECFEFF", color: "#0891B2", label: "Appel" },
  knowledge: { bg: "#F5F3FF", color: "#7C3AED", label: "Base de connaissances" },
}

export default function GlobalSearch() {
  const [query,    setQuery]    = useState("")
  const [results,  setResults]  = useState<SearchResult[]>([])
  const [loading,  setLoading]  = useState(false)
  const [open,     setOpen]     = useState(false)
  const [selected, setSelected] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapRef  = useRef<HTMLDivElement>(null)
  const router   = useRouter()

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      if (e.key === "Escape") { setOpen(false); setQuery("") }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Debounced search
  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await api.get<SearchResult[]>(`/search?q=${encodeURIComponent(query)}`)
        setResults(data ?? [])
        setSelected(-1)
      } catch {}
      finally { setLoading(false) }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") setSelected(s => Math.min(s + 1, results.length - 1))
    else if (e.key === "ArrowUp") setSelected(s => Math.max(s - 1, -1))
    else if (e.key === "Enter" && selected >= 0) goTo(results[selected])
  }

  function goTo(result: SearchResult) {
    router.push(result.url)
    setOpen(false)
    setQuery("")
    setResults([])
  }

  return (
    <div ref={wrapRef} style={{ position: "relative", flex: 1, maxWidth: 360 }}>
      {/* Input */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        background: open ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.12)",
        border: open ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(255,255,255,0.2)",
        borderRadius: 10, padding: "0 12px", height: 38,
        transition: "all 200ms",
      }}>
        <span style={{ fontSize: 15, opacity: 0.6 }}>🔍</span>
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKey}
          placeholder="Rechercher…  (Ctrl+K)"
          style={{
            flex: 1, background: "none", border: "none", outline: "none",
            color: "#fff", fontSize: 13, fontFamily: "inherit",
          }}
        />
        {query ? (
          <button onClick={() => { setQuery(""); setResults([]) }} style={{
            background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 4,
            color: "#fff", fontSize: 11, padding: "1px 6px", cursor: "pointer",
          }}>✕</button>
        ) : (
          <span style={{
            fontSize: 10, color: "rgba(255,255,255,0.4)",
            background: "rgba(255,255,255,0.1)", borderRadius: 4, padding: "2px 6px",
          }}>⌘K</span>
        )}
      </div>

      {/* Dropdown */}
      {open && query.length >= 2 && (
        <div style={{
          position: "absolute", top: 46, left: 0, right: 0,
          background: "#fff", borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          border: "1px solid #E5E7EB", overflow: "hidden",
          zIndex: 9999, maxHeight: 400, overflowY: "auto",
        }}>
          {loading && (
            <div style={{ padding: 20, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
              Recherche en cours…
            </div>
          )}
          {!loading && results.length === 0 && (
            <div style={{ padding: 20, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
              Aucun résultat pour &quot;{query}&quot;
            </div>
          )}
          {!loading && results.length > 0 && (
            <>
              <div style={{ padding: "8px 14px 6px", fontSize: 11, fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                {results.length} résultat{results.length > 1 ? "s" : ""}
              </div>
              {results.map((r, i) => {
                const tc = TYPE_STYLE[r.type] ?? TYPE_STYLE.email
                return (
                  <div
                    key={`${r.type}-${r.id}`}
                    onClick={() => goTo(r)}
                    onMouseEnter={() => setSelected(i)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 14px", cursor: "pointer",
                      background: selected === i ? "#F0F7FF" : "#fff",
                      borderTop: "1px solid #F9F9F9", transition: "background 100ms",
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{r.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#1A1A2E", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {r.title}
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: "#6B7280" }}>{r.subtitle}</p>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 500, color: tc.color, background: tc.bg, borderRadius: 6, padding: "2px 8px", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {tc.label}
                    </span>
                  </div>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}
