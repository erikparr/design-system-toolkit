#!/usr/bin/env node
// Extract a design-audit config from a CSS file's custom properties.
//
// Usage:
//   node extract-tokens.mjs path/to/globals.css > design-audit.config.json
//
// Parses theme-root rules (:root / .dark / [data-theme="dark"] / .light /
// [data-theme="light"]) and emits { themeScopes, tokenDefs, contrast }. This is
// the deterministic half of the audit: token discovery should be reproducible,
// not regenerated prose. Legacy-palette flags (e.g. Tailwind studio-* colors)
// are intentionally NOT parsed here — they live in a JS config and are added by
// the skill workflow when present.

import { readFile } from 'node:fs/promises'

var file = process.argv[2]
if (!file) {
  console.error('Usage: node extract-tokens.mjs <path-to-css> > config.json')
  process.exit(2)
}

var css = stripComments(await readFile(file, 'utf8'))
var rules = collectRules(css)

var darkVars = {}
var lightVars = {}
var sawClassDark = false
var sawClassLight = false
var sawAttrDark = false
var sawAttrLight = false

for (var rule of rules) {
  var selectors = rule.selector.split(',').map(function (s) { return s.trim() })
  var isDark = selectors.some(function (s) { return s === ':root' || s === '.dark' || s === '[data-theme="dark"]' })
  var isLight = selectors.some(function (s) { return s === '.light' || s === '[data-theme="light"]' })
  if (!isDark && !isLight) continue

  selectors.forEach(function (s) {
    if (s === '.dark') sawClassDark = true
    if (s === '.light') sawClassLight = true
    if (s === '[data-theme="dark"]') sawAttrDark = true
    if (s === '[data-theme="light"]') sawAttrLight = true
  })

  var decls = parseDeclarations(rule.body)
  Object.assign(isLight ? lightVars : darkVars, decls)
}

// Union of variable names; dark is the canonical catalog, light fills any gaps.
var names = Array.from(new Set(Object.keys(darkVars).concat(Object.keys(lightVars))))
names.sort()

var tokenDefs = names.map(function (cssVar) {
  var type = inferType(cssVar)
  return { id: toId(cssVar), cssVar: cssVar, type: type, group: toGroup(cssVar) }
})

var config = {
  themeScopes: buildThemeScopes(),
  tokenDefs: tokenDefs,
  contrast: buildContrast(tokenDefs),
}

var warnings = []
if (!sawClassDark && !sawAttrDark) {
  warnings.push('No explicit .dark / [data-theme="dark"] rule found; dark scope assumes className "dark". If the project forces dark only via :root, add a .dark scope (see SKILL.md).')
}
if (warnings.length) config._warnings = warnings

process.stdout.write(JSON.stringify(config, null, 2) + '\n')

// --- helpers ---------------------------------------------------------------

function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, '')
}

// Brace-aware top-level rule splitter. Descends into at-rules (@layer, @media)
// so nested theme roots are found.
function parseRules(s) {
  var rules = []
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
      rules.push({ selector: selector, body: s.slice(i + 1, j) })
      i = j + 1
    } else {
      buf += ch
      i++
    }
  }
  return rules
}

function collectRules(s) {
  var out = []
  parseRules(s).forEach(function (r) {
    if (r.selector.startsWith('@')) out.push.apply(out, collectRules(r.body))
    else out.push(r)
  })
  return out
}

function parseDeclarations(body) {
  var decls = {}
  var re = /(--[\w-]+)\s*:\s*([^;]+);/g
  var m
  while ((m = re.exec(body))) {
    decls[m[1]] = m[2].trim()
  }
  return decls
}

// --color-bg-card -> color.bg.card ; --space-4 -> space.4
function toId(cssVar) {
  return cssVar.replace(/^--/, '').replace(/-/g, '.')
}

function toGroup(cssVar) {
  var id = toId(cssVar)
  var parts = id.split('.')
  // Group color tokens by their second segment (bg/text/border/...); others by first.
  if (parts[0] === 'color' && parts.length > 1) return 'color.' + parts[1]
  return parts[0]
}

function inferType(cssVar) {
  var n = cssVar.toLowerCase()
  if (n.startsWith('--color')) return 'color'
  if (n.startsWith('--space') || n.startsWith('--radius')) return 'dimension'
  if (n.startsWith('--shadow')) return 'shadow'
  if (n.startsWith('--transition')) return 'duration'
  if (n.startsWith('--font')) return 'fontFamily'
  return 'other'
}

function buildThemeScopes() {
  var dark = { name: 'dark' }
  if (sawClassDark) dark.className = 'dark'
  else if (sawAttrDark) dark.attributes = { 'data-theme': 'dark' }
  else dark.className = 'dark' // best-effort; see _warnings

  var light = { name: 'light' }
  if (sawClassLight) light.className = 'light'
  else if (sawAttrLight) light.attributes = { 'data-theme': 'light' }
  else light.className = 'light'

  return [light, dark]
}

function buildContrast(defs) {
  var text = defs.filter(function (d) { return d.id.startsWith('color.text') }).map(function (d) { return d.id })
  var surfaces = defs
    .filter(function (d) { return d.id.startsWith('color.bg') && !d.id.includes('overlay') })
    .map(function (d) { return d.id })
  return { text: text, surfaces: surfaces }
}
