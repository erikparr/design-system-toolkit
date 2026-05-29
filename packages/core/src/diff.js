// The drift engine. Two independent checks, both emitting Findings:
//   - diffTokenSets: cross-source drift against a chosen authority.
//   - auditContrast: within-source WCAG contrast on text/surface pairs.
// Adding a new source never touches this file — it just supplies more
// TokenSets in the same shape.

import { indexById } from './model.js'
import { valuesEqual } from './normalize.js'
import { toHex } from './color.js'
import { contrastRatio, gradeContrast } from './contrast.js'

function displayValue(token) {
  if (!token) return undefined
  if (token.type === 'color' && token.value) return toHex(token.value)
  return token.raw
}

/**
 * Compare candidate TokenSets against an authority TokenSet of the same theme.
 * @param {import('./model.js').TokenSet} authority
 * @param {import('./model.js').TokenSet[]} candidates
 * @returns {import('./model.js').Finding[]}
 */
export function diffTokenSets(authority, candidates) {
  var findings = []
  var authIndex = indexById(authority)

  candidates.forEach(function (candidate) {
    var candIndex = indexById(candidate)

    // Tokens the authority defines: check presence + value.
    authority.tokens.forEach(function (authTok) {
      var candTok = candIndex.get(authTok.id)
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
      if (!valuesEqual(authTok.type, authTok.value, candTok.value)) {
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
      if (!authIndex.has(candTok.id)) {
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
