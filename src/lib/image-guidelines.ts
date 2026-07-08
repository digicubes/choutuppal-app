// ─── Image Size Guidelines & Validation ────────────────────────────────────────
// Ensures the Royal Glassmorphism UI doesn't break with wrong-sized images

export interface ImageGuideline {
  label: string
  aspectRatio: string
  recommendedWidth: number
  recommendedHeight: number
  description: string
  minWidth: number
}

export const IMAGE_GUIDELINES: Record<string, ImageGuideline> = {
  story: {
    label: 'Story',
    aspectRatio: '9:16',
    recommendedWidth: 1080,
    recommendedHeight: 1920,
    description: 'Best for vertical screen view',
    minWidth: 400,
  },
  banner: {
    label: 'Banner Ad',
    aspectRatio: '16:9',
    recommendedWidth: 1920,
    recommendedHeight: 1080,
    description: 'Wide format for promotions',
    minWidth: 400,
  },
  listing: {
    label: 'Listing Gallery',
    aspectRatio: '4:3 or 1:1',
    recommendedWidth: 800,
    recommendedHeight: 600,
    description: 'Square or standard photo',
    minWidth: 400,
  },
  hero: {
    label: 'Hero Background',
    aspectRatio: '21:9',
    recommendedWidth: 2100,
    recommendedHeight: 900,
    description: 'Ultra-wide desktop background',
    minWidth: 600,
  },
  news: {
    label: 'News Thumbnail',
    aspectRatio: '16:9',
    recommendedWidth: 1200,
    recommendedHeight: 675,
    description: 'Standard article thumbnail',
    minWidth: 400,
  },
  logo: {
    label: 'App Logo',
    aspectRatio: '1:1',
    recommendedWidth: 512,
    recommendedHeight: 512,
    description: 'Square logo for app icon & header',
    minWidth: 200,
  },
  og: {
    label: 'OG Preview Image',
    aspectRatio: '1.91:1',
    recommendedWidth: 1200,
    recommendedHeight: 630,
    description: 'Link preview for WhatsApp/Facebook',
    minWidth: 400,
  },
}

/**
 * Validate an image file against guidelines.
 * Returns warnings array (empty if all good).
 */
export function validateImage(
  file: File,
  guidelineKey: string
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = []
  const guideline = IMAGE_GUIDELINES[guidelineKey]

  if (!guideline) {
    return { valid: true, warnings: [] }
  }

  // Check file type
  const validImageTypes = ['image/jpeg', 'image/png', 'image/webp']
  const validVideoTypes = ['video/mp4', 'video/webm']
  const isVideo = validVideoTypes.includes(file.type)

  if (!isVideo && !validImageTypes.includes(file.type)) {
    warnings.push(`Unsupported file type: ${file.type}. Use JPG, PNG, or WebP.`)
  }

  // Check file size (50MB max for video, 10MB for images)
  const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024
  if (file.size > maxSize) {
    warnings.push(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max ${isVideo ? '50MB' : '10MB'}.`)
  }

  return { valid: warnings.length === 0, warnings }
}

/**
 * Validate image dimensions after loading.
 * Call this with the actual width/height from an Image element.
 */
export function validateImageDimensions(
  width: number,
  height: number,
  guidelineKey: string
): { warnings: string[] } {
  const warnings: string[] = []
  const guideline = IMAGE_GUIDELINES[guidelineKey]

  if (!guideline) return { warnings: [] }

  if (width < guideline.minWidth) {
    warnings.push(
      `Image resolution is too low (${width}×${height}px), UI may look blurry. Recommended: ${guideline.recommendedWidth}×${guideline.recommendedHeight}px (${guideline.aspectRatio})`
    )
  }

  return { warnings }
}

/**
 * Get helper text for a guideline
 */
export function getGuidelineHelperText(guidelineKey: string): string {
  const g = IMAGE_GUIDELINES[guidelineKey]
  if (!g) return ''
  return `${g.aspectRatio} (${g.recommendedWidth}×${g.recommendedHeight}px) — ${g.description}`
}
