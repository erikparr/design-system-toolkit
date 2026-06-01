// Static CSS adapter (source = code, headless). Parses CSS custom-property
// declarations out of theme-root rules into TokenSets — the Node/CI counterpart
// to the browser `readTokens` code adapter, which needs a live DOM. Same output
// shape, so either can be diffed against DTCG/Figma sources.
//
// It reads declared values, not computed ones: it won't resolve var()-of-var()
// chains or cascade the way the browser does. For literal token definitions
// (the usual case for a token layer) that's exactly right.

import { makeToken, makeTokenSet } from '../model.js'
import { normalizeValue } from '../normalize.js'

// Default theme→selectors mapping, matching the common class/attribute patterns.
var DEFAULT_THEMES = [
  { name: 'dark', selectors: [':root', '.dark', '[data-theme="dark"]'] },
  { name: 'light', selectors: ['.light', '[data-theme="light"]'] },
]

function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, '')
}

// Brace-aware rule splitter that descends into at-rules (@layer/@media).
function collectRules(s) {
  var out = []
  var buf = ''
  var i = 0
  while (i < s.length) {
    var ch = s[i]
    if (ch === '{') {
      var selector = buf.trim()
      buf = ''
      var depth = 1
      var j = i + 1
      while (j < s.length && depth > 0) {
        if (s[j] === '{') depth++
        else if (s[j] === '}') depth--
        if (depth > 0) j++
      }
      var body = s.slice(i + 1, j)
      if (selector.charAt(0) === '@') out.push.apply(out, collectRules(body))
      else out.push({ selector: selector, body: body })
      i = j + 1
    } else {
      buf += ch
      i++
    }
  }
  return out
}

function parseDeclarations(body) {
  var decls = {}
  var re = /(--[\w-]+)\s*:\s*([^;]+);/g
  var m
  while ((m = re.exec(body))) decls[m[1]] = m[2].trim()
  return decls
}

// --color-bg-card → color.bg.card
function defaultIdFromVar(cssVar) {
  return cssVar.replace(/^--/, '').replace(/-/g, '.')
}

// Colors named without a "--color-" prefix (e.g. --bg-primary) are common, so
// fall back to sniffing the value when the name doesn't reveal the type. Only
// claim 'color' for forms the parser understands (hex / rgb), so a parseable
// value is compared structurally; anything else stays 'other' (exact-string
// compared by the diff engine).
function looksLikeParseableColor(value) {
  if (typeof value !== 'string') return false
  var v = value.trim().toLowerCase()
  return v.charAt(0) === '#' || v.indexOf('rgb') === 0
}

function inferType(cssVar, value) {
  var n = cssVar.toLowerCase()
  if (n.startsWith('--color')) return 'color'
  if (n.startsWith('--space') || n.startsWith('--radius')) return 'dimension'
  if (n.startsWith('--shadow')) return 'shadow'
  if (n.startsWith('--transition')) return 'duration'
  if (n.startsWith('--font')) return 'fontFamily'
  if (looksLikeParseableColor(value)) return 'color'
  if (typeof value === 'string' && /^-?[\d.]+(px|rem|em)$/.test(value.trim())) return 'dimension'
  return 'other'
}

/**
 * @param {string} cssText
 * @param {object} [options]
 * @param {Array<{name:string, selectors:string[]}>} [options.themes]
 * @param {(cssVar:string)=>string} [options.idFromVar]
 * @param {string} [options.source]  Defaults to "code".
 * @returns {import('../model.js').TokenSet[]} one TokenSet per theme.
 */
export function cssToTokenSets(cssText, options) {
  options = options || {}
  var themes = options.themes || DEFAULT_THEMES
  var idFromVar = options.idFromVar || defaultIdFromVar
  var source = options.source || 'code'

  var rules = collectRules(stripComments(cssText))
  // Accumulate declarations per theme (later rules override earlier ones).
  var perTheme = {}
  themes.forEach(function (t) { perTheme[t.name] = {} })

  rules.forEach(function (rule) {
    var selectors = rule.selector.split(',').map(function (s) { return s.trim() })
    var decls = null
    themes.forEach(function (t) {
      var match = selectors.some(function (s) { return t.selectors.indexOf(s) !== -1 })
      if (!match) return
      if (!decls) decls = parseDeclarations(rule.body)
      Object.assign(perTheme[t.name], decls)
    })
  })

  return themes.map(function (t) {
    var decls = perTheme[t.name]
    var tokens = Object.keys(decls).map(function (cssVar) {
      var raw = decls[cssVar]
      var type = inferType(cssVar, raw)
      return makeToken({
        id: idFromVar(cssVar),
        type: type,
        raw: raw,
        value: normalizeValue(type, raw),
        source: source,
        theme: t.name,
        location: cssVar,
      })
    })
    return makeTokenSet(source, t.name, tokens)
  })
}
