'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Briefcase, Search, MapPin, IndianRupee, Clock,
  Building2, ChevronRight, SearchX,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/glass-card'
import { useAppStore } from '@/lib/store'
import { useAuth } from '@/lib/auth-context'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type JobType = 'Government' | 'Private' | 'Part-time' | 'Freelance' | 'Internship'

interface JobEntry {
  id: string
  title: string
  company: string
  location: string
  salaryMin: number
  salaryMax: number
  jobType: JobType
  postedDaysAgo: number
  description: string
}

/* ------------------------------------------------------------------ */
/*  Mock data — Choutuppal / Bhongir / Yadadri context                 */
/* ------------------------------------------------------------------ */

const MOCK_JOBS: JobEntry[] = [
  {
    id: 'j1',
    title: 'Village Administrative Officer',
    company: 'Telangana Govt',
    location: 'Yadadri Bhuvanagiri Dist.',
    salaryMin: 25000,
    salaryMax: 35000,
    jobType: 'Government',
    postedDaysAgo: 2,
    description: 'Administrative support role for village-level governance under Yadadri district administration.',
  },
  {
    id: 'j2',
    title: 'Pharmacy Assistant',
    company: 'Sri Lakshmi Medicals',
    location: 'Choutuppal',
    salaryMin: 10000,
    salaryMax: 15000,
    jobType: 'Private',
    postedDaysAgo: 1,
    description: 'Assist pharmacist with dispensing, inventory management and customer service.',
  },
  {
    id: 'j3',
    title: 'Tutor — Mathematics & Science',
    company: 'Narayana Coaching Centre',
    location: 'Bhongir',
    salaryMin: 12000,
    salaryMax: 20000,
    jobType: 'Part-time',
    postedDaysAgo: 5,
    description: 'Part-time teaching for class 8-10 students. Evening batches.',
  },
  {
    id: 'j4',
    title: 'Digital Marketing Intern',
    company: 'Mana Digital Solutions',
    location: 'Choutuppal',
    salaryMin: 8000,
    salaryMax: 12000,
    jobType: 'Internship',
    postedDaysAgo: 3,
    description: 'Learn SEO, social media management and Google Ads while working on real client projects.',
  },
  {
    id: 'j5',
    title: 'Tractor & Equipment Mechanic',
    company: 'Rayudu Agri Services',
    location: 'Choutuppal Mandal',
    salaryMin: 15000,
    salaryMax: 22000,
    jobType: 'Private',
    postedDaysAgo: 7,
    description: 'Repair and maintenance of tractors, pump sets and agricultural equipment.',
  },
  {
    id: 'j6',
    title: 'Freelance Graphic Designer',
    company: 'Multiple Clients',
    location: 'Remote / Choutuppal',
    salaryMin: 5000,
    salaryMax: 25000,
    jobType: 'Freelance',
    postedDaysAgo: 4,
    description: 'Design logos, pamphlets and social media creatives for local businesses.',
  },
  {
    id: 'j7',
    title: 'Panchayat Secretary',
    company: 'Government of Telangana',
    location: 'Yadadri Dist.',
    salaryMin: 30000,
    salaryMax: 45000,
    jobType: 'Government',
    postedDaysAgo: 10,
    description: 'Coordinate development programs, maintain records and assist Panchayat meetings.',
  },
  {
    id: 'j8',
    title: 'Showroom Sales Executive',
    company: 'Sri Venkateswara Textiles',
    location: 'Bhongir',
    salaryMin: 10000,
    salaryMax: 14000,
    jobType: 'Private',
    postedDaysAgo: 1,
    description: 'Customer handling, billing and stock management at textile showroom.',
  },
]

const JOB_FILTERS: ('All' | JobType)[] = [
  'All', 'Government', 'Private', 'Part-time', 'Freelance', 'Internship',
]

const JOB_TYPE_COLORS: Record<JobType, string> = {
  Government: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
  Private: 'bg-[#4169E1]/10 text-[#4169E1] border-[#4169E1]/20',
  'Part-time': 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  Freelance: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  Internship: 'bg-pink-500/10 text-pink-700 border-pink-500/20',
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function JobsView() {
  // Use individual selectors to prevent re-rendering on unrelated store changes
  const selectedCityName = useAppStore((s) => s.selectedCityName)
  const { isAuthenticated, setShowLoginModal } = useAuth()

  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<'All' | JobType>('All')

  /* ---------- Filtering ---------- */
  const filtered = MOCK_JOBS.filter((job) => {
    const matchesFilter = activeFilter === 'All' || job.jobType === activeFilter
    const matchesSearch =
      !search ||
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.company.toLowerCase().includes(search.toLowerCase()) ||
      job.location.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  /* ---------- Helpers ---------- */
  const formatSalary = (min: number, max: number) => {
    const fmt = (n: number) =>
      n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n)
    return `₹${fmt(min)} – ₹${fmt(max)}/mo`
  }

  /* ---------- Render ---------- */
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* ---- Header ---- */}
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          ఉద్యోగాలు{' '}
          <span className="text-[#4169E1]">/ Jobs</span>
        </h1>
        <p className="text-sm text-gray-500">
          Local opportunities in {selectedCityName} &amp; nearby areas
        </p>
      </div>

      {/* ---- Search & Filter Bar ---- */}
      <GlassCard className="!p-4 space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input
            placeholder="Search jobs, companies, locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/50 border-white/40 focus:border-[#4169E1]/50 focus:ring-[#4169E1]/20"
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {JOB_FILTERS.map((filter) => (
            <motion.button
              key={filter}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activeFilter === filter
                  ? 'bg-gradient-to-r from-[#4169E1] to-[#3155c7] text-white shadow-md'
                  : 'bg-white/50 text-gray-600 border border-white/40 hover:bg-white/70'
              }`}
            >
              {filter}
            </motion.button>
          ))}
        </div>
      </GlassCard>

      {/* ---- Results count ---- */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {filtered.length} job{filtered.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* ---- Job Cards Grid ---- */}
      {filtered.length === 0 ? (
        <GlassCard className="text-center py-16">
          <SearchX className="size-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No jobs match your filters</p>
          <p className="text-sm text-gray-400 mt-1">
            Try adjusting your search or filter criteria
          </p>
          <Button
            variant="outline"
            className="mt-4 border-[#4169E1]/30 text-[#4169E1] hover:bg-[#4169E1]/5"
            onClick={() => {
              setSearch('')
              setActiveFilter('All')
            }}
          >
            Clear Filters
          </Button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((job, idx) => (
              <motion.div
                key={job.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.04, duration: 0.3 }}
              >
                <GlassCard className="!p-0 overflow-hidden hover:shadow-xl transition-shadow h-full flex flex-col">
                  {/* Top accent bar */}
                  <div className="h-1 bg-gradient-to-r from-[#4169E1] to-[#D4AF37]" />

                  <div className="p-4 flex flex-col flex-1 space-y-3">
                    {/* Job type badge */}
                    <Badge
                      variant="secondary"
                      className={`w-fit text-xs ${JOB_TYPE_COLORS[job.jobType]}`}
                    >
                      {job.jobType}
                    </Badge>

                    {/* Title */}
                    <h3 className="font-semibold text-gray-900 line-clamp-2 leading-snug">
                      {job.title}
                    </h3>

                    {/* Company */}
                    <p className="text-sm text-gray-600 flex items-center gap-1.5">
                      <Building2 className="size-3.5 shrink-0 text-gray-400" />
                      {job.company}
                    </p>

                    {/* Location */}
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <MapPin className="size-3 shrink-0" />
                      {job.location}
                    </p>

                    {/* Description */}
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {job.description}
                    </p>

                    {/* Bottom: Salary & Time */}
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                      <span className="text-sm font-semibold text-[#4169E1] flex items-center gap-0.5">
                        <IndianRupee className="size-3.5" />
                        {formatSalary(job.salaryMin, job.salaryMax)}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="size-3" />
                        {job.postedDaysAgo === 0 ? 'Today' : `${job.postedDaysAgo}d ago`}
                      </span>
                    </div>

                    {/* Apply button */}
                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-[#4169E1] to-[#3155c7] text-white text-xs h-9"
                        onClick={() => {
                          if (!isAuthenticated) {
                            setShowLoginModal(true)
                          }
                        }}
                      >
                        Apply Now
                        <ChevronRight className="size-3.5 ml-1" />
                      </Button>
                    </motion.div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
