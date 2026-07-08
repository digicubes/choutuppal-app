'use client'

import { motion } from 'framer-motion'
import { Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <motion.div
        initial={false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-md"
      >
        <div className="text-8xl font-bold bg-gradient-to-r from-[#D4AF37] to-[#4169E1] bg-clip-text text-transparent mb-4">
          404
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
        <p className="text-gray-500 mb-6 font-medium">
          అయ్యో! మీరు వెతుకుతున్న పేజీ ఇక్కడ లేదు<br/>
          <span className="text-sm">(The page you are looking for is not here)</span>
        </p>
        <div className="flex justify-center">
          <Button
            onClick={() => window.location.href = '/'}
            className="bg-gradient-to-r from-[#4169E1] to-[#D4AF37] hover:opacity-90 text-white font-bold py-6 px-8 rounded-full shadow-lg transition-transform hover:scale-105"
          >
            <Home className="size-5 mr-2" />
            Go to Home Page
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
