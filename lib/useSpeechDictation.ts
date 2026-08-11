'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export function useSpeechDictation() {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<any>(null)
  const baseTranscriptRef = useRef('')

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setSupported(!!SpeechRecognition)
  }, [])

  const start = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    baseTranscriptRef.current = transcript ? transcript + ' ' : ''

    const recognition = new SpeechRecognition()
    recognition.lang = 'fr-FR'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: any) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          baseTranscriptRef.current += text + ' '
        } else {
          interim += text
        }
      }
      setTranscript((baseTranscriptRef.current + interim).trim())
    }

    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }, [transcript])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  const reset = useCallback(() => {
    baseTranscriptRef.current = ''
    setTranscript('')
  }, [])

  return { supported, listening, transcript, setTranscript, start, stop, reset }
}
