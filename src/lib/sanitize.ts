/**
 * Sanitize HTML content to prevent XSS attacks.
 * Strips dangerous tags and attributes while preserving safe formatting.
 */

// Tags that are allowed in sanitized output
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'a', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'code', 'pre',
  'span', 'div',
]

// Attributes that are allowed
const ALLOWED_ATTRS: Record<string, string[]> = {
  a: ['href', 'target', 'rel'],
  span: ['class'],
  div: ['class'],
  code: ['class'],
  pre: ['class'],
}

// Dangerous URL schemes
const DANGEROUS_URL_SCHEMES = ['javascript:', 'data:', 'vbscript:', 'file:']

/**
 * Sanitize HTML string by removing dangerous tags, attributes, and scripts.
 * Preserves basic formatting tags safe for rendering.
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return ''

  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // Remove event handler attributes (onclick, onload, onerror, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')

  // Remove style tags (can be used for CSS attacks)
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')

  // Remove iframe, object, embed, form tags
  sanitized = sanitized.replace(/<(iframe|object|embed|form|input|textarea|button|meta|link)\b[^>]*>/gi, '')
  sanitized = sanitized.replace(/<\/(iframe|object|embed|form|input|textarea|button|meta|link)>/gi, '')

  // Sanitize href attributes - remove dangerous URL schemes
  sanitized = sanitized.replace(
    /href\s*=\s*["']([^"']*)["']/gi,
    (match, url) => {
      const trimmedUrl = url.trim().toLowerCase()
      const isDangerous = DANGEROUS_URL_SCHEMES.some(scheme => trimmedUrl.startsWith(scheme))
      return isDangerous ? '' : match
    }
  )

  return sanitized
}

/**
 * Strip ALL HTML tags, returning only plain text.
 * Use this for user-generated content that should never contain HTML.
 */
export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') return ''
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()
}

/**
 * Sanitize a plain text string for safe display.
 * Escapes HTML entities.
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
