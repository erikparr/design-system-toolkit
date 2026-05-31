// Drift logic, separated from argv/printing so it's unit-testable. Reads a CSS
// file (code source) and one DTCG token file per theme, then diffs them with
// the core engine. Returns structured results; the CLI formats them.

import { readFileSync } from 'node:fs'
import { cssToTokenSets, dtcgToTokenSet, diffTokenSets, collapseSeparators } from '@design-system-toolkit/core'

function countByKind(findings) {
  var c = {}
  findings.forEach(function (f) { c[f.kind] = (c[f.kind] || 0) + 1 })
  return c
}

/**
 * @param {object} opts
 * @param {string} opts.cssPath                      Code source (token CSS).
 * @param {Array<{theme:string, path:string}>} opts.tokens  DTCG file per theme.
 * @param {string} [opts.primitivesPath]             DTCG primitives for alias resolution.
 * @param {string} [opts.idPrefix]                   Prepended to DTCG ids; default "color".
 * @param {'code'|'tokens'} [opts.authority]         Which source is truth; default "code".
 * @param {Object<string,string>} [opts.aliases]     candidate id → authority id, to suppress naming noise.
 * @param {boolean} [opts.normalizeSeparators]       Match hyphen vs dot (bg.card-hover ≡ bg.card.hover).
 * @returns {{ themes: Array, totals: object }}
 */
export function runDrift(opts) {
  var idPrefix = opts.idPrefix === undefined ? 'color' : opts.idPrefix
  var authority = opts.authority || 'code'
  var diffOpts = {
    aliases: opts.aliases,
    normalizeId: opts.normalizeSeparators ? collapseSeparators : undefined,
  }

  var codeSets = cssToTokenSets(readFileSync(opts.cssPath, 'utf8'))
  var primitives = opts.primitivesPath ? JSON.parse(readFileSync(opts.primitivesPath, 'utf8')) : undefined

  var themes = opts.tokens.map(function (t) {
    var code = codeSets.find(function (s) { return s.theme === t.theme })
    if (!code) {
      var found = codeSets.map(function (s) { return s.theme }).join(', ')
      throw new Error('CSS defines no theme "' + t.theme + '" (found: ' + found + ')')
    }
    var doc = JSON.parse(readFileSync(t.path, 'utf8'))
    var dtcg = dtcgToTokenSet(doc, { theme: t.theme, idPrefix: idPrefix, primitives: primitives })
    var findings = authority === 'tokens'
      ? diffTokenSets(dtcg, [code], diffOpts)
      : diffTokenSets(code, [dtcg], diffOpts)
    return { theme: t.theme, codeCount: code.tokens.length, tokenCount: dtcg.tokens.length, findings: findings }
  })

  var all = themes.reduce(function (acc, t) { return acc.concat(t.findings) }, [])
  return { themes: themes, totals: countByKind(all), authority: authority }
}
