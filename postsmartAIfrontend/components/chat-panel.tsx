"use client"

import { useState, useRef, useEffect } from "react"
import { X, Send, Bot, User } from "lucide-react"
import { api, type ChatResponse } from "@/lib/api"

interface Message {
  role: "user" | "assistant"
  content: string
  sources?: string[]
}

const QUICK = [
  "Procédure colis perdu",
  "Pièces justificatives entreprise",
  "Comment escalader vers médiateur ?",
  "Délai de remboursement",
]

export function ChatPanel() {
  const [open, setOpen]         = useState(false)
  const [input, setInput]       = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading]   = useState(false)
  const bottomRef               = useRef<HTMLDivElement>(null)
  const textareaRef             = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  async function handleSend(text?: string) {
    const content = (text ?? input).trim()
    if (!content || loading) return

    setMessages(prev => [...prev, { role: "user", content }])
    setInput("")
    setLoading(true)

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const data = await api.post<ChatResponse>("/chat/assistant", {
        messages: [...history, { role: "user", content }],
      })
      setMessages(prev => [...prev, { role: "assistant", content: data.reply, sources: data.sources }])
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer.",
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          width: 56, height: 56, borderRadius: "50%", border: "none", cursor: "pointer",
          background: open ? "#DC2626" : "#FFCC00",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
          transition: "background .2s",
        }}
        aria-label="Assistant IA"
      >
        {open
          ? <X size={24} color="#fff" />
          : <span style={{ fontSize: 24 }}>🤖</span>
        }
      </button>

      {/* Panel */}
      <div style={{
        position: "fixed", bottom: 90, right: 24, zIndex: 9998,
        width: 380, maxHeight: 560,
        display: "flex", flexDirection: "column",
        borderRadius: 16, border: "1px solid #E5E7EB",
        background: "#fff", boxShadow: "0 12px 48px rgba(0,0,0,0.18)",
        transformOrigin: "bottom right",
        transform: open ? "scale(1)" : "scale(0.92)",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
        transition: "transform .25s ease, opacity .25s ease",
      }}>
        {/* Header */}
        <div style={{
          padding: "12px 16px", borderBottom: "1px solid #F0F0F0",
          borderRadius: "16px 16px 0 0", background: "#00205B",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#FFCC00", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#00205B" }}>IA</div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#fff" }}>PostSmart IA</p>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Procédures · Délais · Formulations</p>
          </div>
          <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", padding: 2 }}>
            <X size={16} />
          </button>
        </div>

        {/* Search badge */}
        <div style={{ padding: "6px 16px", background: "#F0FDF4", borderBottom: "1px solid #D1FAE5", fontSize: 11, color: "#065F46", display: "flex", alignItems: "center", gap: 5 }}>
          🔍 <span>Recherche web activée (Google Grounding)</span>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: 14, minHeight: 0 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <Bot size={40} color="#D1D5DB" style={{ margin: "0 auto 8px" }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", margin: "0 0 4px" }}>Bonjour, comment puis-je vous aider ?</p>
              <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>Posez vos questions sur les procédures, délais ou formulations.</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 12, flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: msg.role === "user" ? "#0066CC" : "#FFCC00",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {msg.role === "user"
                  ? <User size={14} color="#fff" />
                  : <span style={{ fontSize: 11, fontWeight: 700, color: "#00205B" }}>IA</span>
                }
              </div>
              <div style={{ maxWidth: "80%" }}>
                <div style={{
                  borderRadius: msg.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                  padding: "9px 13px", fontSize: 13, lineHeight: 1.5,
                  background: msg.role === "user" ? "#0066CC" : "#F0F4FF",
                  color: msg.role === "user" ? "#fff" : "#1A1A2E",
                }}>
                  <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg.content}</p>
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {msg.sources.slice(0, 3).map((s, j) => (
                      <span key={j} style={{ fontSize: 10, padding: "1px 6px", borderRadius: 20, border: "1px solid #E5E7EB", color: "#6B7280" }}>{s}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#FFCC00", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#00205B" }}>IA</span>
              </div>
              <div style={{ borderRadius: "4px 16px 16px 16px", padding: "10px 14px", background: "#F0F4FF", display: "flex", gap: 4, alignItems: "center" }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: "50%", background: "#0066CC",
                    animation: "bounce 1.2s ease infinite",
                    animationDelay: `${i * 0.2}s`,
                  }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick suggestions */}
        {messages.length === 0 && !loading && (
          <div style={{ padding: "0 12px 8px", display: "flex", gap: 6, flexWrap: "wrap" }}>
            {QUICK.map(q => (
              <button key={q} onClick={() => handleSend(q)} style={{
                fontSize: 11, padding: "4px 10px", borderRadius: 20,
                border: "1px solid #E5E7EB", background: "#F5F7FA",
                cursor: "pointer", color: "#374151", whiteSpace: "nowrap",
              }}>{q}</button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ padding: 12, borderTop: "1px solid #F0F0F0" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Posez votre question…"
              rows={1}
              style={{
                flex: 1, padding: "9px 12px", borderRadius: 10,
                border: "1px solid #E5E7EB", fontSize: 13, resize: "none",
                maxHeight: 120, outline: "none", fontFamily: "inherit", lineHeight: 1.4,
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              style={{
                width: 38, height: 38, borderRadius: 10, border: "none", cursor: "pointer",
                background: input.trim() && !loading ? "#0066CC" : "#E5E7EB",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background .15s", flexShrink: 0,
              }}
            >
              <Send size={16} color={input.trim() && !loading ? "#fff" : "#9CA3AF"} />
            </button>
          </div>
          <p style={{ margin: "5px 0 0", fontSize: 10, color: "#9CA3AF", textAlign: "center" }}>
            Entrée pour envoyer · Maj+Entrée pour saut de ligne
          </p>
        </div>
      </div>

      {/* Bounce animation */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  )
}
