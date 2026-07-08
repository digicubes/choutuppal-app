'use client'
import { useState, useCallback } from 'react'

export function useVoiceSearch() {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice search is not supported in this browser')
      return
    }
    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.lang = 'te-IN' // Telugu
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onstart = () => setIsListening(true)
      recognition.onresult = (event: any) => {
        const result = event.results[0][0].transcript
        setTranscript(result)
        setIsListening(false)
      }
      recognition.onerror = () => setIsListening(false)
      recognition.onend = () => setIsListening(false)
      recognition.start()
    } catch {
      // Speech recognition not available
    }
  }, [])

  const startListeningEnglish = useCallback(() => {
    if (typeof window === 'undefined') return
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice search is not supported in this browser')
      return
    }
    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.lang = 'en-IN' // English (India)
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onstart = () => setIsListening(true)
      recognition.onresult = (event: any) => {
        const result = event.results[0][0].transcript
        setTranscript(result)
        setIsListening(false)
      }
      recognition.onerror = () => setIsListening(false)
      recognition.onend = () => setIsListening(false)
      recognition.start()
    } catch {
      // Speech recognition not available
    }
  }, [])

  return { isListening, transcript, startListening, startListeningEnglish, setTranscript }
}
