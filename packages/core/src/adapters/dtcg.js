// DTCG / Style Dictionary adapter (source = design token files).
//
// Maps a DTCG token document (https://tr.designtokens.org) into a TokenSet so
// it can be diffed against the code TokenSet. Handles group-level $type
// inheritance, {alias.references}, and the usual color/dimension types via the
// shared normalizer. Pure data transform — no file IO, works in Node or browser.

import { makeToken, makeTokenSet } from '../model.js'
import { normalizeValue } from '../normalize.js'

// DTCG $type → our TokenType.
function mapType(dtcgType) {
  switch (dtcgType) {
    case 'color':
    case 'dimension':
    case 'shadow':
    case 'duration':
    case 'fontFamily':
    case 'fontWeight':
      return dtcgType
    default:
      return 'other'
  }
}

// Walk a DTCG node, calling cb(dottedId, rawValue, type) for each leaf that has
// a $value. $type inherits from the nearest ancestor group that declares it.
function walk(node, path, inheritedType, cb) {
  if (node == null || typeof node !== 'object') return
  var type = node.$type || inheritedType
  if (Object.prototype.hasOwnProperty.call(node, '$value')) {
    cb(path.join('.'), node.$value, type)
    return
  }
  Object.keys(node).forEach(function (key) {
    if (key.charAt(0) === '$') return // skip $type, $description, etc.
    walk(node[key], path.concat(key), type, cb)
  })
}

// Flat { id: rawValue } map across one or more docs, for alias resolution.
function buildValueMap(docs) {
  var map = {}
  docs.forEach(function (doc) {
    walk(doc, [], null, function (id, raw) { map[id] = raw })
  })
  return map
}

// Resolve a {group.token} alias (possibly chained) against the value map.
// Returns the literal string unchanged if it isn't an alias or can't resolve.
function resolveAlias(raw, valueMap, seen) {
  if (typeof raw !== 'string') return raw
  var m = raw.match(/^\{([^}]+)\}$/)
  if (!m) return raw
  var ref = m[1]
  var visited = seen || new Set()
  if (visited.has(ref)) return raw // cycle guard
  visited.add(ref)
  var target = valueMap[ref]
  if (target === undefined) return raw // dangling alias — keep literal for the report
  return resolveAlias(target, valueMap, visited)
}

/**
 * @param {object} doc                     The theme's DTCG document.
 * @param {object} [options]
 * @param {string|null} [options.theme]     "light" | "dark" | null.
 * @param {string} [options.source]         Defaults to "style-dictionary".
 * @param {string} [options.idPrefix]       Prepended to every id (e.g. "color")
 *                                           to align with the code id namespace.
 * @param {object} [options.primitives]     Extra DTCG doc used only to resolve aliases.
 * @returns {import('../model.js').TokenSet}
 */
export function dtcgToTokenSet(doc, options) {
  options = options || {}
  var theme = options.theme != null ? options.theme : null
  var source = options.source || 'style-dictionary'
  var prefix = options.idPrefix ? options.idPrefix + '.' : ''
  var valueMap = buildValueMap(options.primitives ? [doc, options.primitives] : [doc])

  var tokens = []
  walk(doc, [], null, function (rawId, rawValue, dtcgType) {
    var resolved = resolveAlias(rawValue, valueMap)
    var type = mapType(dtcgType)
    var rawStr = typeof resolved === 'string' ? resolved : JSON.stringify(resolved)
    tokens.push(makeToken({
      id: prefix + rawId,
      type: type,
      raw: rawStr,
      value: normalizeValue(type, typeof resolved === 'string' ? resolved : null),
      source: source,
      theme: theme,
      location: 'dtcg:' + rawId,
    }))
  })
  return makeTokenSet(source, theme, tokens)
}
