'use client'

import { useAppStore } from '@/lib/store'
import { GlassCard } from '@/components/glass-card'
import {
  Utensils,
  Pill,
  Scissors,
  Wrench,
  Building2,
  Smartphone,
  Car,
  GraduationCap,
  Shirt,
  Hammer,
  Headphones,
  MoreHorizontal,
} from 'lucide-react'

const CATEGORIES = [
  { name: 'Tiffin', icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-50' },
  { name: 'Medicals', icon: Pill, color: 'text-red-500', bg: 'bg-red-50' },
  { name: 'Salons', icon: Scissors, color: 'text-purple-500', bg: 'bg-purple-50' },
  { name: 'Plumbers', icon: Wrench, color: 'text-blue-500', bg: 'bg-blue-50' },
  { name: 'Real Estate', icon: Building2, color: 'text-[#D4AF37]', bg: 'bg-yellow-50' },
  { name: 'Electronics', icon: Smartphone, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { name: 'Automobiles', icon: Car, color: 'text-gray-600', bg: 'bg-gray-100' },
  { name: 'Education', icon: GraduationCap, color: 'text-teal-500', bg: 'bg-teal-50' },
  { name: 'Tailors', icon: Shirt, color: 'text-pink-500', bg: 'bg-pink-50' },
  { name: 'Hardware', icon: Hammer, color: 'text-amber-600', bg: 'bg-amber-50' },
  { name: 'Services', icon: Headphones, color: 'text-[#4169E1]', bg: 'bg-blue-50' },
  { name: 'More', icon: MoreHorizontal, color: 'text-gray-500', bg: 'bg-gray-50' },
]

export function CategoriesSection() {
  const setSearchQuery = useAppStore((s) => s.setSearchQuery)
  const navigateTo = useAppStore((s) => s.navigateTo)

  const handleCategoryClick = (categoryName: string) => {
    setSearchQuery(categoryName)
    navigateTo('explore')
  }

  return (
    <section className="px-4 py-4">
      <h2 className="text-lg font-bold text-gray-800 mb-3">
        🏪 Browse Categories
      </h2>

      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
        {CATEGORIES.map((category) => (
          <div
            key={category.name}
            onClick={() => handleCategoryClick(category.name)}
            className="cursor-pointer"
          >
            <GlassCard className="!p-3 flex flex-col items-center gap-2 hover:bg-white/60 transition-all group active:scale-95">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${category.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
              >
                <category.icon className={`size-5 sm:size-6 ${category.color}`} />
              </div>
              <span className="text-[11px] sm:text-xs font-medium text-gray-700 text-center leading-tight">
                {category.name}
              </span>
            </GlassCard>
          </div>
        ))}
      </div>
    </section>
  )
}
