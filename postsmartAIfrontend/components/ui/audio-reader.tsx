"use client"

import { useState, useEffect, useRef } from "react"

interface Props {
  text: string
  autoPlay?: boolean
}

const SPEEDS = [0.75, 1, 1.25, 1.5]

export default function AudioReader({ text, autoPlay = false }: Props) {
  const [supported, setSupported] = useState(false)
  const [playing,   setPlaying]   = useState(false)
  const [paused,    setPaused]    = useState(false)
  const [speed,     setSpeed]     = useState(1)
  const [progress,  setProgress]  = useState(0)
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)
  const totalChars = text?.length || 1

  useEffect(() => {
    const ok = typeof window !== "undefined" && "speechSynthesis" in window
    setSupported(ok)
    return () => {
      window.speechSynthesis?.cancel()
    }
  }, [])

  // Auto-play when text arrives
  useEffect(() => {
    if (autoPlay && text && supported) {
      const timer = setTimeout(() => speak(speed), 700)
      return () => clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, supported])

  function getFrenchVoice() {
    const voices = window.speechSynthesis.getVoices()
    return (
      voices.find(v => v.lang === "fr-FR" && v.name.includes("Google")) ||
      voices.find(v => v.lang === "fr-FR") ||
      voices.find(v => v.lang.startsWith("fr")) ||
      voices[0] ||
      null
    )
  }

  function speak(rate = speed) {
    if (!text || !supported) return
    window.speechSynthesis.cancel()
    setProgress(0)

    const utter = new SpeechSynthesisUtterance(text)
    utter.lang   = "fr-FR"
    utter.rate   = rate
    utter.pitch  = 1
    utter.volume = 1
    const voice = getFrenchVoice()
    if (voice) utter.voice = voice

    utter.onboundary = (e: SpeechSynthesisEvent) => {
      if (e.name === "word") setProgress(Math.round((e.charIndex / totalChars) * 100))
    }
    utter.onstart = () => { setPlaying(true); setPaused(false) }
    utter.onend   = () => { setPlaying(false); setPaused(false); setProgress(100) }
    utter.onerror = () => { setPlaying(false); setPaused(false) }

    utterRef.current = utter
    window.speechSynthesis.speak(utter)
  }

  function pause() {
    window.speechSynthesis.pause()
    setPlaying(false)
    setPaused(true)
  }

  function resume() {
    window.speechSynthesis.resume()
    setPlaying(true)
    setPaused(false)
  }

  function stop() {
    window.speechSynthesis.cancel()
    setPlaying(false)
    setPaused(false)
    setProgress(0)
  }

  function changeSpeed(s: number) {
    setSpeed(s)
    if (playing || paused) {
      stop()
      setTimeout(() => speak(s), 80)
    }
  }

  if (!supported) return null

  const canStop = playing || paused

  return (
    <>
      <style>{`
        @keyframes ar-wave {
          from { transform: scaleY(0.35); opacity: 0.55; }
          to   { transform: scaleY(1.2);  opacity: 1; }
        }
      `}</style>
      <div style={{
        background: "linear-gradient(135deg, #00205B 0%, #0066CC 100%)",
        borderRadius: 14, padding: "14px 16px", marginTop: 16,
        boxShadow: "0 4px 18px rgba(0,32,91,0.22)",
        fontFamily: "Inter, sans-serif",
      }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "#FFCC00",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
            }}>🔊</div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#fff" }}>Lecture audio</p>
              <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
                {playing ? "▶ Lecture en cours…" : paused ? "⏸ En pause" : "⏹ Prêt"}
              </p>
            </div>
          </div>
          {/* Speed buttons */}
          <div style={{ display: "flex", gap: 4 }}>
            {SPEEDS.map(s => (
              <button key={s} onClick={() => changeSpeed(s)} style={{
                padding: "3px 8px", borderRadius: 6, border: "none",
                fontSize: 11, cursor: "pointer", fontWeight: 600,
                background: speed === s ? "#FFCC00" : "rgba(255,255,255,0.15)",
                color: speed === s ? "#00205B" : "#fff",
                transition: "all 150ms",
              }}>{s}×</button>
            ))}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: "rgba(255,255,255,0.18)", borderRadius: 2, marginBottom: 12, overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 2, background: "#FFCC00", width: `${progress}%`, transition: "width 300ms linear" }} />
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
          {/* Stop */}
          <button onClick={stop} disabled={!canStop} title="Arrêter" style={{
            width: 36, height: 36, borderRadius: "50%", border: "none",
            cursor: canStop ? "pointer" : "not-allowed",
            background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 15,
            display: "flex", alignItems: "center", justifyContent: "center",
            opacity: canStop ? 1 : 0.4, transition: "all 150ms",
          }}>⏹</button>

          {/* Play / Pause / Resume */}
          {!playing ? (
            <button onClick={paused ? resume : () => speak(speed)} title={paused ? "Reprendre" : "Lire"} style={{
              width: 48, height: 48, borderRadius: "50%", border: "none", cursor: "pointer",
              background: "#FFCC00", color: "#00205B", fontSize: 22,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 14px rgba(255,204,0,0.45)", transition: "transform 150ms",
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.06)")}
            onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
            >▶</button>
          ) : (
            <button onClick={pause} title="Pause" style={{
              width: 48, height: 48, borderRadius: "50%", border: "none", cursor: "pointer",
              background: "#FFCC00", color: "#00205B", fontSize: 20,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 14px rgba(255,204,0,0.45)",
            }}>⏸</button>
          )}

          {/* Relire depuis le début */}
          <button onClick={() => speak(speed)} title="Relire depuis le début" style={{
            width: 36, height: 36, borderRadius: "50%", border: "none", cursor: "pointer",
            background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 15,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 150ms",
          }}>🔄</button>
        </div>

        {/* Sound wave animation */}
        {playing && (
          <div style={{ display: "flex", gap: 3, justifyContent: "center", alignItems: "center", marginTop: 10, height: 20 }}>
            {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
              <div key={i} style={{
                width: 3, height: `${h * 4}px`,
                background: "#FFCC00", borderRadius: 2,
                animation: `ar-wave ${0.7 + i * 0.09}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.07}s`,
              }} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
