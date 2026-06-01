// The drift engine. Two independent checks, both emitting Findings:
//   - diffTokenSets: cross-source drift against a chosen authority.
//   - auditContrast: within-source WCAG contrast on text/surface pairs.
// Adding a new source never touches this file — it just supplies more
// TokenSets in the same shape.

import { indexById } from './model.js'
import { valuesEqual, normalizeValue } from './normalize.js'
import { toHex } from './color.js'
import { contrastRatio, gradeContrast } from './contrast.js'

function displayValue(token) {
  if (!token) return undefined
  if (token.type === 'color' && token.value) return toHex(token.value)
  return token.raw
}

function identity(id) { return id }

// Pick one type to compare two tokens under, preferring a specific type over
// 'other' when adapters disagree (e.g. the CSS adapter guessed 'other' from a
// non-"--color-" var name while DTCG/Figma declared 'color').
function reconcileType(a, b) {
  if (a === b) return a
  if (a === 'other') return b
  if (b === 'other') return a
  return a
}

// Compare two tokens' VALUES robustly, even when their adapters inferred
// different types. Re-normalizes both raw strings under one reconciled type, so
// a color stored as {r,g,b,a} on one side and "#050709" on the other still
// matches; falls back to an exact raw comparison when a value can't be parsed
// (e.g. oklch(), which the color parser doesn't model). Guarantees the engine
// never reports drift for two identical values.
function tokensValueEqual(a, b) {
  var type = reconcileType(a.type, b.type)
  var na = normalizeValue(type, a.raw)
  var nb = normalizeValue(type, b.raw)
  if (na == null || nb == null) return String(a.raw).trim() === String(b.raw).trim()
  return valuesEqual(type, na, nb)
}

/**
 * Compare candidate TokenSets against an authority TokenSet of the same theme.
 *
 * Tokens are matched by a normalized key, not raw id, so that representation
 * differences between sources don't read as drift:
 *   - `aliases` maps a candidate id to its authority equivalent (e.g.
 *     "accent.default" → "accent", "radius.ring" → "color.focus.ring").
 *   - `normalizeId` is applied to both sides' ids before matching (e.g. collapse
 *     hyphen vs dot). Original ids are preserved in the findings.
 * Only genuine value disagreements and truly absent tokens survive.
 *
 * @param {import('./model.js').TokenSet} authority
 * @param {import('./model.js').TokenSet[]} candidates
 * @param {object} [opts]
 * @param {Object<string,string>} [opts.aliases]    candidate id → authority id.
 * @param {(id:string)=>string} [opts.normalizeId]  applied to both sides for matching.
 * @returns {import('./model.js').Finding[]}
 */
export function diffTokenSets(authority, candidates, opts) {
  opts = opts || {}
  var aliases = opts.aliases || {}
  var norm = opts.normalizeId || identity
  var authKey = function (tok) { return norm(tok.id) }
  var candKey = function (tok) { return norm(aliases[tok.id] || tok.id) }

  var findings = []
  var authByKey = new Map()
  authority.tokens.forEach(function (tok) { authByKey.set(authKey(tok), tok) })

  candidates.forEach(function (candidate) {
    var candByKey = new Map()
    candidate.tokens.forEach(function (tok) { candByKey.set(candKey(tok), tok) })

    // Tokens the authority defines: check presence + value.
    authority.tokens.forEach(function (authTok) {
      var candTok = candByKey.get(authKey(authTok))
      if (!candTok) {
        findings.push({
          kind: 'missing',
          refId: authTok.id,
          theme: authority.theme,
          sources: makeSources(authority.source, displayValue(authTok), candidate.source, undefined),
          authority: authority.source,
          severity: 'error',
          detail: authTok.id + ' is defined in ' + authority.source + ' but missing in ' + candidate.source,
        })
        return
      }
      if (!tokensValueEqual(authTok, candTok)) {
        findings.push({
          kind: 'value-mismatch',
          refId: authTok.id,
          theme: authority.theme,
          sources: makeSources(authority.source, displayValue(authTok), candidate.source, displayValue(candTok)),
          authority: authority.source,
          severity: 'warn',
          detail: authTok.id + ' differs: ' + authority.source + '=' + displayValue(authTok) +
            ', ' + candidate.source + '=' + displayValue(candTok),
        })
      }
    })

    // Tokens the candidate has that the authority doesn't.
    candidate.tokens.forEach(function (candTok) {
      if (!authByKey.has(candKey(candTok))) {
        findings.push({
          kind: 'extra',
          refId: candTok.id,
          theme: candidate.theme,
          sources: makeSources(authority.source, undefined, candidate.source, displayValue(candTok)),
          authority: authority.source,
          severity: 'info',
          detail: candTok.id + ' exists in ' + candidate.source + ' but not in authority ' + authority.source,
        })
      }
    })
  })

  return findings
}

// Collapses hyphen and dot to a single separator so "bg.card-hover" and
// "bg.card.hover" match. A ready-made normalizeId for the common CSS-vs-token
// naming split.
export function collapseSeparators(id) {
  return String(id).replace(/[-.]+/g, '.')
}

function makeSources(authSrc, authVal, candSrc, candVal) {
  var s = {}
  s[authSrc] = authVal
  s[candSrc] = candVal
  return s
}

/**
 * WCAG contrast audit for a single TokenSet.
 * @param {import('./model.js').TokenSet} tokenSet
 * @param {Array<{text:string,surface:string}>} pairs  token ids to test.
 * @returns {import('./model.js').Finding[]}
 */
export function auditContrast(tokenSet, pairs) {
  var index = indexById(tokenSet)
  var findings = []

  pairs.forEach(function (pair) {
    var text = index.get(pair.text)
    var surface = index.get(pair.surface)
    if (!text || !surface) return

    var ratio = contrastRatio(text.value, surface.value)
    var grade = gradeContrast(ratio)
    if (grade.pass) return

    findings.push({
      kind: 'contrast-fail',
      refId: pair.text + ' on ' + pair.surface,
      theme: tokenSet.theme,
      sources: { text: toHex(text.value), surface: toHex(surface.value) },
      authority: null,
      severity: grade.label === 'Fail' ? 'error' : 'warn',
      detail: pair.text + ' on ' + pair.surface + ' = ' +
        (grade.ratio != null ? grade.ratio.toFixed(2) : 'n/a') + ':1 (' + grade.label + ')',
    })
  })

  return findings
}
