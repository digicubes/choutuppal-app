'use client'

import { useEffect, useState } from 'react'

/**
 * GlobalErrorHandler — Catches unhandled errors and promise rejections
 * that React Error Boundaries cannot catch (e.g., errors in async callbacks,
 * event handlers, and setTimeout/setInterval callbacks).
 *
 * Place this in the root layout, OUTSIDE of any ErrorBoundary,
 * so it can catch errors from the entire app.
 */
export function GlobalErrorHandler() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[GlobalErrorHandler] Unhandled promise rejection:', event.reason)
      // Don't set error state for non-critical rejections
      // (e.g., network errors, aborted requests)
      const reason = event.reason
      if (reason?.name === 'AbortError') return
      if (reason?.message?.includes('Failed to fetch')) return
      // For critical errors, show the error UI
      setError(`Unhandled rejection: ${reason?.message || String(reason)}`)
    }

    const handleError = (event: ErrorEvent) => {
      console.error('[GlobalErrorHandler] Unhandled error:', event.error)
      // Don't set error state for non-critical errors
      if (event.message?.includes('ResizeObserver')) return
      if (event.message?.includes('Non-Error promise rejection')) return
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    window.addEventListener('error', handleError)

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      window.removeEventListener('error', handleError)
    }
  }, [])

  if (error) {
    return (
      <div className="fixed bottom-4 right-4 z-[9999] max-w-md p-4 rounded-xl border-2 border-red-300 bg-red-50 text-red-800 shadow-2xl">
        <p className="font-bold text-sm">⚠ Runtime Error Detected</p>
        <p className="text-xs mt-1 opacity-80">{error}</p>
        <button
          onClick={() => setError(null)}
          className="mt-2 px-3 py-1 text-xs bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
        >
          Dismiss
        </button>
      </div>
    )
  }

  return null
}
