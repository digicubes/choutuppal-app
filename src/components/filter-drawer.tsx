'use client';

import React, { useState, useEffect } from 'react';
import { Filter, X, Star, Store, Building2, SlidersHorizontal } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  type?: 'business' | 'real_estate'; // To conditionally show Real Estate fields
  onApplyFilters: (filters: Record<string, any>) => void;
  currentFilters: Record<string, any>;
}

export default function FilterDrawer({ isOpen, onClose, type = 'business', onApplyFilters, currentFilters }: FilterDrawerProps) {
  const [filters, setFilters] = useState<Record<string, any>>(currentFilters);
  const selectedCity = useAppStore((s) => s.selectedCity);
  const [villages, setVillages] = useState<any[]>([]);

  useEffect(() => {
    if (selectedCity) {
      fetch('/api/cities')
        .then(r => r.json())
        .then(data => {
          const city = (Array.isArray(data) ? data : data.cities || []).find((c: any) => c.slug === selectedCity);
          if (city) {
            fetch(`/api/villages?cityId=${city.id}`)
              .then(r => r.json())
              .then(v => setVillages(Array.isArray(v) ? v : []))
              .catch(() => {});
          }
        })
        .catch(() => {});
    }
  }, [selectedCity]);

  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters, isOpen]);

  const updateFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
    onApplyFilters({});
    onClose();
  };

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl h-[85vh] flex flex-col md:w-[400px] md:right-0 md:left-auto md:h-screen md:rounded-l-3xl md:rounded-tr-none md:bottom-auto md:top-0"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-gray-700" />
                <h3 className="font-bold text-lg text-gray-900">Filters & Sort</h3>
              </div>
              <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
                <X className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Sort Section */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Sort By</h4>
                <div className="flex flex-wrap gap-2">
                  {['popular', 'newest'].map(sort => (
                    <button
                      key={sort}
                      onClick={() => updateFilter('sort', sort)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                        filters.sort === sort
                          ? 'bg-[#4169E1] text-white border-[#4169E1] shadow-md shadow-[#4169E1]/20'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-[#4169E1]'
                      }`}
                    >
                      {sort.charAt(0).toUpperCase() + sort.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Section */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Status</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                    <input
                      type="checkbox"
                      checked={!!filters.isPremium}
                      onChange={(e) => updateFilter('isPremium', e.target.checked || undefined)}
                      className="w-5 h-5 rounded text-[#D4AF37] focus:ring-[#D4AF37] border-gray-300"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">Premium Only</p>
                      <p className="text-xs text-gray-500">Show only premium listings</p>
                    </div>
                  </label>
                  
                  {type === 'business' && (
                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                      <input
                        type="checkbox"
                        checked={!!filters.openNow}
                        onChange={(e) => updateFilter('openNow', e.target.checked || undefined)}
                        className="w-5 h-5 rounded text-[#4169E1] focus:ring-[#4169E1] border-gray-300"
                      />
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">Open Now</p>
                        <p className="text-xs text-gray-500">Show currently open businesses</p>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* Rating Section */}
              {type === 'business' && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Minimum Rating</h4>
                  <div className="flex gap-2">
                    {[3, 4, 4.5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => updateFilter('minRating', filters.minRating === rating ? undefined : rating)}
                        className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                          filters.minRating === rating
                            ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#D4AF37]/50'
                        }`}
                      >
                        {rating}+ <Star className={`w-4 h-4 ${filters.minRating === rating ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Village Filter */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Village / Area</h4>
                <div className="flex flex-col gap-2">
                  <select 
                    value={filters.villageId || ''}
                    onChange={(e) => updateFilter('villageId', e.target.value || undefined)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl h-11 px-4 focus:ring-2 focus:ring-[#4169E1] focus:outline-none appearance-none"
                  >
                    <option value="">All Villages</option>
                    {villages.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Real Estate Specific */}
              {type === 'real_estate' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Property Type</h4>
                    <div className="flex gap-2">
                      {['Sale', 'Rent'].map(ptype => (
                        <button
                          key={ptype}
                          onClick={() => updateFilter('propertyType', filters.propertyType === ptype ? undefined : ptype)}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                            filters.propertyType === ptype
                              ? 'bg-[#4169E1] text-white border-[#4169E1]'
                              : 'bg-white text-gray-600 border-gray-200'
                          }`}
                        >
                          {ptype}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">BHK (Bedrooms)</h4>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5].map(bhk => (
                        <button
                          key={bhk}
                          onClick={() => updateFilter('bhk', filters.bhk === bhk ? undefined : bhk)}
                          className={`w-12 h-12 rounded-xl text-sm font-bold transition-all border flex items-center justify-center ${
                            filters.bhk === bhk
                              ? 'bg-[#4169E1] text-white border-[#4169E1]'
                              : 'bg-white text-gray-600 border-gray-200'
                          }`}
                        >
                          {bhk}{bhk === 5 ? '+' : ''}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-100 flex gap-3 bg-white">
              <Button
                variant="outline"
                className="flex-1 rounded-xl h-12 font-bold"
                onClick={clearFilters}
              >
                Clear All
              </Button>
              <Button
                className="flex-1 rounded-xl h-12 font-bold bg-[#4169E1] hover:bg-blue-700"
                onClick={handleApply}
              >
                Apply Filters
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
