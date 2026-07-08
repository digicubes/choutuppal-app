'use client'

import { GlassCard } from '@/components/glass-card'
import { Quote, Star } from 'lucide-react'

const TESTIMONIALS = [
  {
    id: '1',
    quote: 'ఈ యాప్ ద్వారా నా బిజినెస్ కు కొత్త కస్టమర్లు వస్తున్నారు. సూపర్ యాప్!',
    name: 'రమేష్',
    role: 'Business Owner',
    rating: 5,
  },
  {
    id: '2',
    quote: 'రియల్ ఎస్టేట్ ప్రాపర్టీల కోసం నేను రోజూ వాడుతున్నాను.',
    name: 'సురేష్',
    role: 'Real Estate Agent',
    rating: 5,
  },
  {
    id: '3',
    quote: 'ఊరిలో అన్ని షాపులు, సర్వీసెస్ ఒకేచోట దొరుకుతున్నాయి. చాలా ఉపయోగం!',
    name: 'లక్ష్మి',
    role: 'Homemaker',
    rating: 4,
  },
  {
    id: '4',
    quote: 'నా క్లినిక్ కి రోజూ 5-6 కొత్త పేషంట్లు ఈ యాప్ ద్వారా వస్తున్నారు.',
    name: 'డాక్టర్ రాజు',
    role: 'Doctor',
    rating: 5,
  },
  {
    id: '5',
    quote: 'టైలరింగ్ ఆర్డర్లు పెరిగాయి. ధన్యవాదాలు చౌటుప్పల్ 2.0!',
    name: 'అనుష',
    role: 'Tailor',
    rating: 4,
  },
]

export function TestimonialsSection() {
  return (
    <section className="px-4 py-4">
      <h2
        className="text-lg font-bold text-gray-800 mb-3"
      >
        💬 What People Say
      </h2>

      <div
        className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {TESTIMONIALS.map((testimonial, index) => (
          <div
            key={testimonial.id}
            className="flex-shrink-0 w-64 sm:w-72 snap-start transition-all duration-300"
          >
            <GlassCard className="!p-4 h-full flex flex-col justify-between">
              {/* Quote icon */}
              <div className="mb-3">
                <Quote className="size-6 text-[#D4AF37]/40" />
              </div>

              {/* Quote text */}
              <p className="text-sm text-gray-700 leading-relaxed mb-4 flex-1">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              {/* Rating */}
              <div className="flex items-center gap-0.5 mb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`size-3.5 ${
                      i < testimonial.rating
                        ? 'text-[#D4AF37] fill-[#D4AF37]'
                        : 'text-gray-200'
                    }`}
                  />
                ))}
              </div>

              {/* Author */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#4169E1] flex items-center justify-center text-white text-xs font-bold">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{testimonial.name}</p>
                  <p className="text-[11px] text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </GlassCard>
          </div>
        ))}
      </div>
    </section>
  )
}
