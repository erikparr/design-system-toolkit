// Normalize raw source strings into comparable values, keyed by token type.
// Comparability is the whole point: "#1a1a1a", "rgb(26,26,26)" and Figma's
// {r:0.1,g:0.1,b:0.1} must all reduce to the same value so drift is detected
// on meaning, not formatting.

import { parseColor } from './color.js'

// rem/em are resolved against the CSS default root font size. Repos that
// override :root font-size would need this passed in; 16 covers the default.
var ROOT_FONT_PX = 16

/** Parse a CSS length to a pixel number, or null. */
export function parseDimension(raw) {
  if (raw == null || raw === '') return null
  var str = String(raw).trim()
  var m = str.match(/^(-?[\d.]+)(px|rem|em)?$/)
  if (!m) return null
  var n = parseFloat(m[1])
  if (Number.isNaN(n)) return null
  if (m[2] === 'rem' || m[2] === 'em') return n * ROOT_FONT_PX
  return n
}

/**
 * Normalize a raw value for a given token type.
 * @param {import('./model.js').TokenType} type
 * @param {string} raw
 */
export function normalizeValue(type, raw) {
  if (raw == null || raw === '') return null
  if (type === 'color') return parseColor(raw)
  if (type === 'dimension') return parseDimension(raw)
  return String(raw).trim()
}

/** Whether two normalized values of the same type are equivalent. */
export function valuesEqual(type, a, b) {
  if (a == null || b == null) return a === b
  if (type === 'color') {
    // Allow 1/255 rounding slack per channel; alpha within 1%.
    return (
      Math.abs(a.r - b.r) <= 1 &&
      Math.abs(a.g - b.g) <= 1 &&
      Math.abs(a.b - b.b) <= 1 &&
      Math.abs((a.a == null ? 1 : a.a) - (b.a == null ? 1 : b.a)) <= 0.01
    )
  }
  if (type === 'dimension') return Math.abs(a - b) <= 0.5
  return String(a) === String(b)
}
