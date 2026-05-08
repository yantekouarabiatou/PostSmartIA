"use client"

import { useState, useEffect, useRef } from "react"
import { Mic } from "lucide-react"
import { Button } from "@/components/ui/button"

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance
    webkitSpeechRecognition: new () => SpeechRecognitionInstance
  }
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event & { error: string }) => void) | null
  onend: (() => void) | null
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  [index: number]: { transcript: string }
}

interface VoiceRecorderProps {
  onTranscript: (text: string, field: string) => void
  targetField?: string
}

export default function VoiceRecorder({ onTranscript, targetField = "resume" }: VoiceRecorderProps) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [interimText, setInterimText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const onTranscriptRef = useRef(onTranscript)

  useEffect(() => { onTranscriptRef.current = onTranscript }, [onTranscript])

  useEffect(() => {
    const SpeechAPI = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SpeechAPI) return
    setIsSupported(true)

    const recognition = new SpeechAPI()
    recognition.lang = "fr-FR"
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ""
      let final = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcript + " "
        } else {
          interim += transcript
        }
      }
      if (final) onTranscriptRef.current(final, targetField)
      setInterimText(interim)
    }

    recognition.onerror = (event: Event & { error: string }) => {
      setError("Erreur microphone : " + event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimText("")
    }

    recognitionRef.current = recognition
    return () => { recognitionRef.current?.stop() }
  }, [targetField])

  function toggle() {
    if (!recognitionRef.current) return
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      setError(null)
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  if (!isSupported) {
    return (
      <span className="text-xs text-muted-foreground">
        ⚠️ Dictée vocale non supportée (utiliser Chrome)
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={isListening ? "destructive" : "outline"}
        size="sm"
        className="h-7 gap-1.5 text-xs"
        onClick={toggle}
        title={isListening ? "Arrêter la dictée" : "Démarrer la dictée vocale"}
      >
        {isListening ? (
          <>
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            Arrêter
          </>
        ) : (
          <>
            <Mic className="h-3.5 w-3.5" />
            Dicter
          </>
        )}
      </Button>

      {isListening && (
        <span className="text-xs text-destructive italic">
          {interimText || "En écoute..."}
        </span>
      )}

      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}
