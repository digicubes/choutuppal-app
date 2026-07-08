'use client'

import React from 'react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  /** Optional: component name for debugging */
  name?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * React Error Boundary — Catches JavaScript errors anywhere in its child component tree.
 * Prevents a single broken component from crashing the entire page.
 *
 * IMPORTANT: Shows a VISIBLE fallback (not null) so crashes are obvious.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const componentName = this.props.name || 'UnknownComponent'
    console.error(`[ErrorBoundary] ${componentName} crashed:`, error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }
      // VISIBLE fallback — always show something so crashes are obvious
      const componentName = this.props.name || 'UnknownComponent'
      const errorMsg = this.state.error?.message || 'Unknown error'
      return (
        <div className="p-4 m-2 rounded-lg border border-yellow-200 bg-yellow-50 text-yellow-800 text-sm">
          <p className="font-semibold">⚠ {componentName} failed to load</p>
          <p className="text-xs mt-1 opacity-70">{errorMsg}</p>
        </div>
      )
    }
    return this.props.children
  }
}
