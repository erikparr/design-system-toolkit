// Code adapter (source = the running app). Reads the live, rendered value of
// each token in each theme by mounting an off-screen probe carrying that
// theme's scope and calling getComputedStyle. Because values come straight
// from the browser's resolution of the app's CSS, this output cannot drift
// from what users actually see.
//
// Browser-only. For headless/CI, a static CSS-parsing adapter is a separate
// future adapter — it produces the same TokenSet shape.

import { makeToken, makeTokenSet } from '../model.js'
import { normalizeValue } from '../normalize.js'

/**
 * @typedef {Object} ThemeScope
 * @property {string} name                 "light" | "dark".
 * @property {string} [className]          Class applied to the probe (e.g. "light").
 * @property {Object<string,string>} [attributes]  Attributes set on the probe (e.g. {"data-theme":"dark"}).
 */

/**
 * @typedef {Object} TokenDef
 * @property {string} id        Canonical id, e.g. "color.bg.card".
 * @property {string} cssVar    Custom property to read, e.g. "--color-bg-card".
 * @property {import('../model.js').TokenType} [type]
 */

/**
 * @param {{themeScopes: ThemeScope[], tokenDefs: TokenDef[]}} config
 * @param {Document} [doc]  Defaults to the global document.
 * @returns {import('../model.js').TokenSet[]} one TokenSet per theme scope.
 */
export function readTokens(config, doc) {
  var d = doc || (typeof document !== 'undefined' ? document : null)
  if (!d) throw new Error('readTokens requires a DOM document (browser environment)')
  var view = d.defaultView || (typeof window !== 'undefined' ? window : null)
  if (!view) throw new Error('readTokens requires a window to call getComputedStyle')

  return config.themeScopes.map(function (scope) {
    var probe = d.createElement('div')
    if (scope.className) probe.className = scope.className
    if (scope.attributes) {
      Object.keys(scope.attributes).forEach(function (k) {
        probe.setAttribute(k, scope.attributes[k])
      })
    }
    probe.style.position = 'absolute'
    probe.style.left = '-99999px'
    probe.style.top = '0'
    probe.style.pointerEvents = 'none'
    d.body.appendChild(probe)

    var cs = view.getComputedStyle(probe)
    var tokens = config.tokenDefs.map(function (def) {
      var type = def.type || 'other'
      var raw = cs.getPropertyValue(def.cssVar).trim()
      return makeToken({
        id: def.id,
        type: type,
        raw: raw,
        value: normalizeValue(type, raw),
        source: 'code',
        theme: scope.name,
        location: def.cssVar,
      })
    })

    d.body.removeChild(probe)
    return makeTokenSet('code', scope.name, tokens)
  })
}
