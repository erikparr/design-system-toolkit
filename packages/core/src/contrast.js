// WCAG contrast. Accepts either normalized color objects ({r,g,b,a}) or raw
// CSS strings for convenience.

import { parseColor, flatten } from './color.js'

function asColor(c) {
  return c && typeof c === 'object' ? c : parseColor(c)
}

function channelLuminance(c) {
  var s = c / 255
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

/** WCAG relative luminance of an opaque color. */
export function relativeLuminance(color) {
  return (
    0.2126 * channelLuminance(color.r) +
    0.7152 * channelLuminance(color.g) +
    0.0722 * channelLuminance(color.b)
  )
}

/**
 * Contrast ratio (1–21) of foreground text over a background.
 * @returns {number|null} null if either color can't be resolved.
 */
export function contrastRatio(fg, bg) {
  var fgC = asColor(fg)
  var bgC = asColor(bg)
  if (!fgC || !bgC) return null

  var flat = flatten(fgC, bgC)
  var l1 = relativeLuminance(flat)
  var l2 = relativeLuminance(bgC)
  var lighter = Math.max(l1, l2)
  var darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

// WCAG 2.x thresholds for normal-size text. AA Large (3:1) is surfaced as a
// distinct grade because it passes only for large/bold text, not body copy.
var AAA = 7
var AA = 4.5
var AA_LARGE = 3

/**
 * Grade a ratio against WCAG thresholds for normal-size text.
 * @returns {{ratio:number|null,label:'AAA'|'AA'|'AA Large'|'Fail'|'n/a',pass:boolean}}
 */
export function gradeContrast(ratio) {
  if (ratio == null) return { ratio: null, label: 'n/a', pass: false }
  var rounded = Math.round(ratio * 100) / 100
  if (ratio >= AAA) return { ratio: rounded, label: 'AAA', pass: true }
  if (ratio >= AA) return { ratio: rounded, label: 'AA', pass: true }
  if (ratio >= AA_LARGE) return { ratio: rounded, label: 'AA Large', pass: false }
  return { ratio: rounded, label: 'Fail', pass: false }
}
