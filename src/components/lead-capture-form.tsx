'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Phone, User, MessageSquare, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

export function LeadCaptureForm() {
  // Use individual selectors to prevent re-rendering on unrelated store changes
  const showLeadForm = useAppStore((s) => s.showLeadForm)
  const setShowLeadForm = useAppStore((s) => s.setShowLeadForm)
  const leadFormListingId = useAppStore((s) => s.leadFormListingId)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [requirement, setRequirement] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !phone) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          requirement,
          listingId: leadFormListingId,
        }),
      })

      if (res.ok) {
        setIsSuccess(true)
        toast.success('Your enquiry has been submitted successfully!')
        setTimeout(() => {
          setName('')
          setPhone('')
          setRequirement('')
          setIsSuccess(false)
          setShowLeadForm(false)
        }, 2000)
      }
    } catch {
      toast.error('Failed to submit enquiry. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={showLeadForm} onOpenChange={setShowLeadForm}>
      <DialogContent className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#4169E1]">
            <MessageSquare className="size-5 text-[#D4AF37]" />
            Get Connected
          </DialogTitle>
          <DialogDescription>
            Share your details and we&apos;ll connect you right away
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="py-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="w-16 h-16 rounded-full bg-green-100 mx-auto mb-4 flex items-center justify-center"
            >
              <Send className="size-7 text-green-600" />
            </motion.div>
            <p className="font-semibold text-green-700">Enquiry Submitted!</p>
            <p className="text-sm text-gray-500 mt-1">
              We&apos;ll connect you shortly
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="lead-name" className="text-sm font-medium">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  id="lead-name"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="pl-10 bg-white/50 border-white/40 focus:border-[#D4AF37]/50 focus:ring-[#D4AF37]/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-phone" className="text-sm font-medium">
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  id="lead-phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="pl-10 bg-white/50 border-white/40 focus:border-[#D4AF37]/50 focus:ring-[#D4AF37]/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-requirement" className="text-sm font-medium">
                Your Requirement
              </Label>
              <Textarea
                id="lead-requirement"
                placeholder="Briefly describe what you need..."
                value={requirement}
                onChange={(e) => setRequirement(e.target.value)}
                rows={3}
                className="bg-white/50 border-white/40 focus:border-[#D4AF37]/50 focus:ring-[#D4AF37]/20 resize-none"
              />
            </div>

            <motion.div whileTap={{ scale: 0.97 }}>
              <Button
                type="submit"
                disabled={isSubmitting || !name || !phone}
                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#B8962E] hover:from-[#C5A233] hover:to-[#A8882A] text-white font-semibold shadow-md"
              >
                {isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="size-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    <Send className="size-4 mr-2" />
                    Connect via App
                  </>
                )}
              </Button>
            </motion.div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
