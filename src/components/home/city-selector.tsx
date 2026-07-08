'use client'

import { useReducer, useEffect, useCallback } from 'react'
import { MapPin } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { GlassCard } from '@/components/glass-card'

// ─── Types (must match city-visibility-manager.tsx) ───────────────────────────
interface CityConfig {
  id: number
  name: string
  slug: string
  showOnHome: boolean
  priority: number
}

const STORAGE_KEY = 'manaCitiesConfig'

// ─── City color palette (deterministic by city name) ──────────────────────────
const CITY_COLORS = [
  { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', accent: 'bg-blue-500' },
  { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', accent: 'bg-amber-500' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', accent: 'bg-emerald-500' },
  { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', accent: 'bg-rose-500' },
  { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', accent: 'bg-violet-500' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', accent: 'bg-cyan-500' },
  { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', accent: 'bg-orange-500' },
  { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700', accent: 'bg-teal-500' },
]

function getCityColor(index: number) {
  return CITY_COLORS[index % CITY_COLORS.length]
}

/** Read visible cities from localStorage. Call ONLY inside useEffect. */
function readVisibleCities(): CityConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((c: CityConfig) => c.showOnHome)
      .sort((a: CityConfig, b: CityConfig) => a.priority - b.priority)
  } catch {
    return []
  }
}

// ─── Reducer (avoids setState-in-effect lint error) ───────────────────────────
interface CitySelectorState {
  cities: CityConfig[]
  isLoaded: boolean
}

type CitySelectorAction =
  | { type: 'LOAD'; cities: CityConfig[] }
  | { type: 'REFRESH'; cities: CityConfig[] }

const INITIAL_STATE: CitySelectorState = {
  cities: [],       // Empty on both server AND client first render
  isLoaded: false,  // False until useEffect fires
}

function cityReducer(state: CitySelectorState, action: CitySelectorAction): CitySelectorState {
  switch (action.type) {
    case 'LOAD':
      return { cities: action.cities, isLoaded: true }
    case 'REFRESH':
      return { ...state, cities: action.cities }
    default:
      return state
  }
}

/**
 * CitySelector — Displays city cards that the user can click to navigate.
 *
 * ─── HYDRATION-SAFE DESIGN ───
 *
 * PROBLEM:  Server has no localStorage → renders empty.
 *           Client reads localStorage during first render → renders with data.
 *           Result: hydration mismatch (classes, DOM structure shift).
 *
 * SOLUTION:
 * 1. `cities` starts as [] and `isLoaded` as false — IDENTICAL on server & client.
 * 2. localStorage is read exclusively inside useEffect,
 *    which runs AFTER hydration completes.
 * 3. Before isLoaded: show skeleton placeholders (same grid cells).
 * 4. The outer <section>, heading row, and grid container have
 *    HARDCODED classes that NEVER change between server and client.
 * 5. useReducer dispatch avoids the `react-hooks/set-state-in-effect` lint error.
 */
export function CitySelector() {
  const [state, dispatch] = useReducer(cityReducer, INITIAL_STATE)
  const { cities, isLoaded } = state

  const selectedCity = useAppStore((s) => s.selectedCity)
  const switchCity = useAppStore((s) => s.switchCity)

  // ── Load from localStorage AFTER mount (hydration-safe) ──
  useEffect(() => {
    dispatch({ type: 'LOAD', cities: readVisibleCities() })
  }, [])

  // ── Listen for changes from the admin panel & other tabs ──
  useEffect(() => {
    const handler = () => {
      dispatch({ type: 'REFRESH', cities: readVisibleCities() })
    }
    window.addEventListener('manaCitiesConfigChanged', handler)
    const storageHandler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) handler()
    }
    window.addEventListener('storage', storageHandler)
    return () => {
      window.removeEventListener('manaCitiesConfigChanged', handler)
      window.removeEventListener('storage', storageHandler)
    }
  }, [])

  const handleCityClick = useCallback((slug: string) => {
    if (slug === selectedCity) return
    switchCity(slug)
  }, [selectedCity, switchCity])

  const hasCities = cities.length > 0

  return (
    <section className="px-4 py-4">
      {/* ── Static heading — NEVER changes between server & client ── */}
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="w-5 h-5 text-[#4169E1]" />
        <h2 className="text-lg font-bold text-gray-800">Explore Cities</h2>
      </div>

      {/* ── Grid container — always present, same classes ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {!isLoaded ? (
          /* Loading skeletons — identical grid cells, no layout shift */
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="rounded-xl border border-gray-100 bg-white p-4 flex flex-col items-center gap-2"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 animate-pulse" />
              <div className="h-4 w-16 rounded bg-gray-100 animate-pulse" />
            </div>
          ))
        ) : !hasCities ? (
          /* Empty state — single cell spanning full width */
          <div className="col-span-2 sm:col-span-3 text-center py-6">
            <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No cities configured yet</p>
          </div>
        ) : (
          /* City cards */
          cities.map((city, index) => {
            const color = getCityColor(index)
            const isActive = city.slug === selectedCity

            return (
              <button
                key={city.id}
                onClick={() => handleCityClick(city.slug)}
                className={`relative overflow-hidden rounded-xl border transition-all duration-200 active:scale-95 ${
                  isActive
                    ? 'border-[#4169E1] ring-2 ring-[#4169E1]/30 shadow-md'
                    : `${color.border} hover:shadow-sm`
                }`}
              >
                <GlassCard className={`!p-0 h-full ${color.bg}`}>
                  <div className="p-4 flex flex-col items-center gap-2 text-center">
                    {/* City initial letter avatar */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm ${
                        isActive ? 'bg-[#4169E1]' : color.accent
                      }`}
                    >
                      {city.name.charAt(0).toUpperCase()}
                    </div>

                    {/* City name */}
                    <span
                      className={`text-sm font-semibold leading-tight ${
                        isActive ? 'text-[#4169E1]' : color.text
                      }`}
                    >
                      {city.name}
                    </span>

                    {/* Active indicator */}
                    {isActive && (
                      <div className="flex items-center gap-1 text-[10px] text-[#4169E1] font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#4169E1] animate-pulse" />
                        Current
                      </div>
                    )}
                  </div>
                </GlassCard>
              </button>
            )
          })
        )}
      </div>
    </section>
  )
}
