// Figma Variables adapter (source = Figma, the design source of truth).
//
// Consumes the `name -> value` map returned by the Figma MCP `get_variable_defs`
// tool, e.g. { "color/bg/card": "#1a1a1a", "spacing/4": "16px" }. Figma variable
// names are slash-delimited groups, which map cleanly onto our dotted ids
// (color/bg/card -> color.bg.card) — usually aligning with the code namespace
// without a prefix. Pure data transform; the agent/skill fetches the map.

import { makeToken, makeTokenSet } from '../model.js'
import { normalizeValue } from '../normalize.js'

function looksLikeColor(value) {
  if (typeof value !== 'string') return false
  var v = value.trim().toLowerCase()
  return v.charAt(0) === '#' || v.indexOf('rgb') === 0 || v.indexOf('hsl') === 0
}

function inferType(name, value) {
  if (looksLikeColor(value)) return 'color'
  if (typeof value === 'number') return 'dimension'
  if (typeof value === 'string' && /^-?[\d.]+(px|rem|em)?$/.test(value.trim())) return 'dimension'
  var n = String(name).toLowerCase()
  if (n.indexOf('color') !== -1 || n.indexOf('colour') !== -1) return 'color'
  if (n.indexOf('spac') !== -1 || n.indexOf('size') !== -1 || n.indexOf('radius') !== -1 ||
      n.indexOf('width') !== -1 || n.indexOf('gap') !== -1) return 'dimension'
  if (n.indexOf('font') !== -1) return 'fontFamily'
  return 'other'
}

// "color/bg/card" -> "color.bg.card"
function defaultIdFromName(name) {
  return String(name).replace(/\//g, '.')
}

/**
 * @param {Object<string,(string|number)>} vars  name → value map from get_variable_defs.
 * @param {object} [options]
 * @param {string|null} [options.theme]
 * @param {string} [options.source]              Defaults to "figma".
 * @param {string} [options.idPrefix]            Prepended to every id, if needed.
 * @param {(name:string)=>string} [options.idFromName]
 * @returns {import('../model.js').TokenSet}
 */
export function figmaVariablesToTokenSet(vars, options) {
  options = options || {}
  var theme = options.theme != null ? options.theme : null
  var source = options.source || 'figma'
  var prefix = options.idPrefix ? options.idPrefix + '.' : ''
  var idFromName = options.idFromName || defaultIdFromName

  var tokens = Object.keys(vars || {}).map(function (name) {
    var value = vars[name]
    var type = inferType(name, value)
    var raw = typeof value === 'number' ? String(value) : String(value)
    return makeToken({
      id: prefix + idFromName(name),
      type: type,
      raw: raw,
      value: normalizeValue(type, raw),
      source: source,
      theme: theme,
      location: 'figma:' + name,
    })
  })

  return makeTokenSet(source, theme, tokens)
}
