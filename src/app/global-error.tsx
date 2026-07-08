'use client'

import { useEffect } from 'react'

/**
 * Next.js Global Error Boundary — Catches errors in the root layout.
 * This file MUST be a Client Component.
 * It MUST define its own <html> and <body> tags because it replaces the root layout when active.
 *
 * https://nextjs.org/docs/app/api-reference/file-conventions/error#global-errorjs
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError] Root layout error:', error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backgroundColor: '#fef2f2',
          color: '#991b1b',
        }}>
          <div style={{
            padding: '2rem',
            borderRadius: '1rem',
            border: '2px solid #fca5a5',
            backgroundColor: '#fee2e2',
            maxWidth: '600px',
            width: '100%',
            textAlign: 'center',
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              🚨 Critical Error
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
      </body>
    </html>
  )
}
