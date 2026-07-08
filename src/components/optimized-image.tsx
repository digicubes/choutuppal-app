'use client'

import { useState } from 'react'
import Image, { type ImageProps } from 'next/image'

// Base64 placeholder SVG for broken/missing images
const FALLBACK_SVG = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGM0Y0RjYiLz48dGV4dCB4PSIxMDAiIHk9IjEwNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI0Q0QUYzNyIgZm9udC1zaXplPSIyMCI+8J+RgDwvdGV4dD48L3N2Zz4='

// Avatar placeholder SVG
const AVATAR_SVG = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSIzMiIgZmlsbD0iI0YzRjRGNiIvPjx0ZXh0IHg9IjMyIiB5PSIzNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI0Q0QUYzNyIgZm9udC1zaXplPSIyMCI+8J+OpzwvdGV4dD48L3N2Zz4='

interface OptimizedImageProps extends Omit<ImageProps, 'onError'> {
  fallbackType?: 'default' | 'avatar'
}

/**
 * Checks if a URL is a data: URL (which Next.js Image doesn't support well)
 */
function isDataUrl(src: unknown): boolean {
  return typeof src === 'string' && src.startsWith('data:')
}

/**
 * ─── OptimizedImage ───────────────────────────────────────────
 *
 * Next.js Image wrapper with:
 * - Graceful fallback for broken images
 * - Handles data: URLs by falling back to <img> tag
 *
 * ⚠️  CRITICAL RULE: When `fill` prop is used, this component
 *     NEVER sets height on the <Image>. The parent <div> MUST have:
 *       - position: relative
 *       - A defined size (width, height, or aspect-ratio)
 *       - overflow: hidden (optional, for clipping)
 *
 *     Correct usage:
 *       <div className="relative aspect-video w-full overflow-hidden">
 *         <OptimizedImage fill style={{ objectFit: 'cover' }} src="..." alt="..." />
 *       </div>
 *
 *     WRONG (will cause console errors + broken layout):
 *       <OptimizedImage fill height={200} src="..." alt="..." />
 *       <OptimizedImage fill style={{ height: '200px' }} src="..." alt="..." />
 */
export function OptimizedImage({
  src,
  alt,
  fallbackType = 'default',
  className = '',
  fill,
  style,
  ...props
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false)

  const fallbackSrc = fallbackType === 'avatar' ? AVATAR_SVG : FALLBACK_SVG

  // Handle empty/missing src
  if (!src || (typeof src === 'string' && !src.trim())) {
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        className={className}
        style={fill ? { position: 'absolute', inset: 0, objectFit: 'cover' } : undefined}
      />
    )
  }

  // Handle data: URLs — Next.js Image doesn't support these
  if (isDataUrl(src)) {
    return (
      <img
        src={hasError ? fallbackSrc : String(src)}
        alt={alt}
        className={className}
        onError={() => setHasError(true)}
        style={fill ? { position: 'absolute', inset: 0, objectFit: 'cover' } : undefined}
        loading="lazy"
      />
    )
  }

  // Handle error state — use plain <img> for fallback data: URLs
  if (hasError) {
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        className={className}
        style={fill ? { position: 'absolute', inset: 0, objectFit: 'cover' } : undefined}
      />
    )
  }

  // Normal Next.js Image for valid HTTP(S) URLs
  // CRITICAL: When fill=true, we strip any height from style to prevent
  // the "Image with fill always uses height 100%" console error.
  const safeStyle = fill
    ? { ...style, objectFit: style?.objectFit || 'cover' }
    : style

  // Remove height property from style when fill is used
  if (fill && safeStyle && 'height' in safeStyle) {
    const { height, ...rest } = safeStyle as React.CSSProperties & { height?: unknown }
    void height // suppress unused warning
    return (
      <Image
        src={src}
        alt={alt}
        className={className}
        fill={fill}
        style={rest as React.CSSProperties}
        onError={() => setHasError(true)}
        {...props}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      fill={fill}
      style={safeStyle}
      onError={() => setHasError(true)}
      {...props}
    />
  )
}

/**
 * SimpleImg — For images that need to use <img> (e.g., cross-origin or data: URLs).
 */
export function SimpleImg({
  src,
  alt,
  className = '',
  fallbackType = 'default',
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement> & { fallbackType?: 'default' | 'avatar' }) {
  const [imgSrc, setImgSrc] = useState(src || (fallbackType === 'avatar' ? AVATAR_SVG : FALLBACK_SVG))

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => {
        setImgSrc(fallbackType === 'avatar' ? AVATAR_SVG : FALLBACK_SVG)
      }}
      {...props}
    />
  )
}
