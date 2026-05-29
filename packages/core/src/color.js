// Color parsing/normalization. Handles the forms getComputedStyle returns
// ("rgb(...)" / "rgba(...)") plus hex, normalizing to { r, g, b, a } with
// 0-255 channels and 0-1 alpha.

/**
 * Parse a CSS color string into { r, g, b, a }, or null if unparseable.
 * @param {string} input
 * @returns {{r:number,g:number,b:number,a:number}|null}
 */
export function parseColor(input) {
  if (!input) return null
  var str = String(input).trim().toLowerCase()

  var rgbMatch = str.match(/^rgba?\(([^)]+)\)$/)
  if (rgbMatch) {
    var parts = rgbMatch[1].split(/[,/\s]+/).filter(Boolean)
    if (parts.length < 3) return null
    return {
      r: parseFloat(parts[0]),
      g: parseFloat(parts[1]),
      b: parseFloat(parts[2]),
      a: parts[3] !== undefined ? parseFloat(parts[3]) : 1,
    }
  }

  var hex = str.replace('#', '')
  // #rgb / #rgba (shorthand — each nibble doubled)
  if (/^[0-9a-f]{3,4}$/.test(hex)) {
    return {
      r: parseInt(hex[0] + hex[0], 16),
      g: parseInt(hex[1] + hex[1], 16),
      b: parseInt(hex[2] + hex[2], 16),
      a: hex.length === 4 ? parseInt(hex[3] + hex[3], 16) / 255 : 1,
    }
  }
  // #rrggbb / #rrggbbaa
  if (/^[0-9a-f]{6}([0-9a-f]{2})?$/.test(hex)) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
    }
  }
  return null
}

/** Composite a (possibly translucent) foreground over an opaque background. */
export function flatten(fg, bg) {
  if (fg.a >= 1) return { r: fg.r, g: fg.g, b: fg.b, a: 1 }
  return {
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  }
}

/** Serialize back to a stable hex string for display/reporting. */
export function toHex(color) {
  if (!color) return null
  function ch(n) {
    var v = Math.max(0, Math.min(255, Math.round(n)))
    return v.toString(16).padStart(2, '0')
  }
  return '#' + ch(color.r) + ch(color.g) + ch(color.b)
}
