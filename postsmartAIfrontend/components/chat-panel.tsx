"use client"

import { useState, useRef, useEffect } from "react"
import {
  MessageSquare, X, Send, Bot, User, BookOpen, ArrowRight, Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { api, type ChatResponse } from "@/lib/api"

interface Message {
  role: "user" | "assistant"
  content: string
  sources?: string[]
}

interface ChatPanelProps {
  onInjectText?: (text: string) => void
}

export function ChatPanel({ onInjectText }: ChatPanelProps) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: "user", content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }))
      const data = await api.post<ChatResponse>("/ai/chat", {
        message: text,
        history,
      })
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, sources: data.sources },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200",
          open
            ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
        aria-label="Assistant IA"
      >
        {open ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>

      {/* Chat drawer */}
      <div
        className={cn(
          "fixed bottom-24 right-6 z-40 flex flex-col w-[360px] max-h-[560px] rounded-2xl border border-border bg-background shadow-2xl transition-all duration-300 origin-bottom-right",
          open ? "scale-100 opacity-100 pointer-events-auto" : "scale-95 opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30 rounded-t-2xl">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Assistant PostSmartAI</p>
            <p className="text-xs text-muted-foreground truncate">Procédures · Délais · Formulations</p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 min-h-0 p-4">
          {messages.length === 0 && (
            <div className="text-center space-y-2 py-8">
              <Bot className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium text-foreground">Bonjour, comment puis-je vous aider ?</p>
              <p className="text-xs text-muted-foreground">
                Posez vos questions sur les procédures, délais ou formulations.
              </p>
              <div className="grid gap-1.5 mt-3 text-left">
                {[
                  "Quelle est la procédure de réclamation ?",
                  "Délai de remboursement colis perdu ?",
                  "Formulation pour client en situation de handicap ?",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="text-xs text-left rounded-lg border border-border px-3 py-2 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                <div className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  {msg.role === "user"
                    ? <User className="h-3.5 w-3.5" />
                    : <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                  }
                </div>
                <div className={cn(
                  "max-w-[80%] space-y-1.5",
                  msg.role === "user" ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "rounded-2xl px-3 py-2 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted text-foreground rounded-tl-sm"
                  )}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {msg.sources.slice(0, 3).map((src, j) => (
                        <Badge key={j} variant="outline" className="text-[10px] gap-1 py-0">
                          <BookOpen className="h-2.5 w-2.5" />
                          {src}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {/* Inject button */}
                  {msg.role === "assistant" && onInjectText && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] text-muted-foreground gap-1 px-2"
                      onClick={() => onInjectText(msg.content)}
                    >
                      <ArrowRight className="h-3 w-3" />
                      Injecter dans le mail
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2 flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />
                  <span className="text-xs text-muted-foreground">Réflexion…</span>
                </div>
              </div>
            )}
          </div>
          <div ref={bottomRef} />
        </ScrollArea>

        {/* Input */}
        <div className="p-3 border-t border-border">
          <div className="flex gap-2 items-end">
            <Textarea
              placeholder="Posez votre question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[40px] max-h-[120px] resize-none text-sm leading-snug py-2"
              rows={1}
            />
            <Button
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={handleSend}
              disabled={!input.trim() || loading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            Entrée pour envoyer · Maj+Entrée pour saut de ligne
          </p>
        </div>
      </div>
    </>
  )
}
