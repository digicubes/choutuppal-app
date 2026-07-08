'use client'

import { SWRConfig } from 'swr'
import { ReactNode } from 'react'

export function SwrProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig 
      value={{ 
        revalidateOnFocus: false,
        revalidateIfStale: false,
        dedupingInterval: 60000 // dedupe requests with same key in this span
      }}
    >
      {children}
    </SWRConfig>
  )
}
