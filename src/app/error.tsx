'use client'

import { useEffect } from 'react'

/**
 * Next.js Route Error Boundary — Catches errors in the page.tsx route.
 * This file MUST be a Client Component.
 * It does NOT define <html> and <body> because it wraps page content, not the root layout.
 *
 * https://nextjs.org/docs/app/api-reference/file-conventions/error
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[ErrorBoundary] Route error:', error)
  }, [error])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '50vh',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#fefce8',
      color: '#854d0e',
    }}>
      <div style={{
        padding: '2rem',
        borderRadius: '1rem',
        border: '2px solid #fde047',
        backgroundColor: '#fef9c3',
        maxWidth: '600px',
        width: '100%',
        textAlign: 'center',
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          ⚠ Something went wrong
        </h2>
        <p style={{ marginBottom: '0.5rem', fontSize: '0.875rem', opacity: 0.8 }}>
          {error?.message || 'An unexpected error occurred'}
        </p>
        {error?.digest && (
          <p style={{ marginBottom: '0.5rem', fontSize: '0.75rem', opacity: 0.6 }}>
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            marginTop: '1.5rem',
            padding: '0.75rem 2rem',
            borderRadius: '0.75rem',
            border: 'none',
            backgroundColor: '#D4AF37',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
