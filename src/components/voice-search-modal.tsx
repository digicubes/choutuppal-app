'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, X, Languages } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { useVoiceSearch } from '@/hooks/use-voice-search'
import { Button } from '@/components/ui/button'

export function VoiceSearchModal() {
  // Use individual selectors to prevent re-rendering on unrelated store changes
  const isSearchOpen = useAppStore((s) => s.isSearchOpen)
  const setSearchOpen = useAppStore((s) => s.setSearchOpen)
  const setSearchQuery = useAppStore((s) => s.setSearchQuery)
  const { isListening, transcript, startListening, startListeningEnglish, setTranscript } =
    useVoiceSearch()
  const [lang, setLang] = useState<'te' | 'en'>('te')

  // Start listening when modal opens
  useEffect(() => {
    if (isSearchOpen && !isListening && !transcript) {
      // Auto-start with Telugu
      const timer = setTimeout(() => {
        if (lang === 'te') startListening()
        else startListeningEnglish()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isSearchOpen, lang, isListening, transcript, startListening, startListeningEnglish])

  // When transcript is received, set search query and close
  useEffect(() => {
    if (transcript && isSearchOpen) {
      setSearchQuery(transcript)
      const timer = setTimeout(() => {
        setSearchOpen(false)
        setTranscript('')
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [transcript, isSearchOpen, setSearchQuery, setSearchOpen, setTranscript])

  const handleClose = () => {
    setSearchOpen(false)
    setTranscript('')
  }

  const handleRetry = () => {
    setTranscript('')
    if (lang === 'te') startListening()
    else startListeningEnglish()
  }

  const toggleLang = () => {
    setTranscript('')
    setLang((l) => (l === 'te' ? 'en' : 'te'))
  }

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-3xl p-8 w-full max-w-sm text-center"
          >
            {/* Close button */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/60 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="size-4" />
            </motion.button>

            {/* Language Toggle */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleLang}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#4169E1]/10 text-[#4169E1] text-xs font-medium mb-6"
            >
              <Languages className="size-3.5" />
              {lang === 'te' ? 'తెలుగు' : 'English'}
            </motion.button>

            {/* Microphone Animation */}
            <div className="relative mx-auto w-24 h-24 mb-6">
              {isListening && (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-full bg-[#D4AF37]/20"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute inset-2 rounded-full bg-[#D4AF37]/30"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                </>
              )}
              <motion.div
                animate={isListening ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                transition={{ duration: 0.8, repeat: isListening ? Infinity : 0 }}
                className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8962E] flex items-center justify-center shadow-xl"
              >
                <Mic className="size-10 text-white" />
              </motion.div>
            </div>

            {/* Status text */}
            <p className="text-gray-600 text-sm mb-4">
              {isListening
                ? lang === 'te'
                  ? 'వింటోంది...'
                  : 'Listening...'
                : transcript
                ? lang === 'te'
                  ? 'గుర్తించబడింది!'
                  : 'Recognized!'
                : lang === 'te'
                ? 'మాట్లాడండి...'
                : 'Speak now...'}
            </p>

            {/* Transcript */}
            {transcript && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/60 rounded-xl px-4 py-3 border border-white/40 mb-4"
              >
                <p className="text-gray-800 font-medium">&ldquo;{transcript}&rdquo;</p>
              </motion.div>
            )}

            {/* Retry / Manual Search */}
            <div className="flex gap-2 justify-center">
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="border-white/40 bg-white/30"
                >
                  {isListening ? 'Stop' : 'Retry'}
                </Button>
              </motion.div>
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  size="sm"
                  onClick={handleClose}
                  className="bg-gradient-to-r from-[#4169E1] to-[#3155C1] text-white"
                >
                  Type Instead
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
