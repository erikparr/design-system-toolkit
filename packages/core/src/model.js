// The normalized model. Every adapter maps its source into these shapes; the
// diff engine and renderers read only these — never a raw source. This module
// is the seam that keeps new sources (Style Dictionary, Figma, Storybook)
// additive.

/**
 * @typedef {'color'|'dimension'|'shadow'|'duration'|'fontFamily'|'fontWeight'|'other'} TokenType
 * DTCG-aligned token types. Drives how `raw` is normalized into `value`.
 */

/**
 * @typedef {'code'|'style-dictionary'|'figma'|'storybook'} SourceName
 */

/**
 * @typedef {Object} Token
 * @property {string} id        Canonical path key, e.g. "color.bg.card".
 * @property {TokenType} type
 * @property {*} value          Normalized value: color→{r,g,b,a}; dimension→px number; else raw.
 * @property {string} raw       Original string as found in the source.
 * @property {SourceName} source
 * @property {string|null} theme  "light" | "dark" | null.
 * @property {string} [location]  Where it was found (CSS var, file:line, Figma id…).
 */

/**
 * @typedef {Object} TokenSet
 * @property {SourceName} source
 * @property {string|null} theme
 * @property {Token[]} tokens
 */

/**
 * @typedef {Object} Component
 * @property {string} id
 * @property {SourceName} source
 * @property {Array<{prop:string,values:string[]}>} [variants]
 * @property {string[]} [states]
 * @property {string[]} [tokenRefs]
 * @property {string} [location]
 */

/**
 * @typedef {'missing'|'extra'|'value-mismatch'|'contrast-fail'|'unmapped-component'} FindingKind
 */

/**
 * @typedef {Object} Finding
 * @property {FindingKind} kind
 * @property {string} refId             Token id or component id.
 * @property {string|null} theme
 * @property {Object<string,*>} sources Value seen per source, e.g. {code:'#1a1a1a', figma:'#191919'}.
 * @property {SourceName|null} authority Source treated as truth for this finding.
 * @property {'error'|'warn'|'info'} severity
 * @property {string} detail
 */

/** Build a Token, validating required fields. */
export function makeToken(t) {
  if (!t || typeof t.id !== 'string' || !t.id) {
    throw new Error('makeToken: `id` is required')
  }
  return {
    id: t.id,
    type: t.type || 'other',
    value: t.value,
    raw: t.raw != null ? String(t.raw) : '',
    source: t.source,
    theme: t.theme != null ? t.theme : null,
    location: t.location,
  }
}

/** Build a TokenSet. */
export function makeTokenSet(source, theme, tokens) {
  return { source, theme: theme != null ? theme : null, tokens: tokens || [] }
}

/** Index a TokenSet's tokens by id for O(1) lookup during diff. */
export function indexById(tokenSet) {
  var map = new Map()
  tokenSet.tokens.forEach(function (tok) { map.set(tok.id, tok) })
  return map
}
