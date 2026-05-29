'use client'
import { useState, useEffect } from 'react'
import { readTokens } from '@design-audit/core'

/**
 * Read live token values (both themes) after mount via the core code adapter.
 * Returns null until mounted, then a { [themeName]: Map<id, Token> } lookup.
 *
 * `config` should be stable (module-level or memoized) — the read runs once on
 * mount, matching the lifetime of the rendered CSS it measures.
 *
 * @param {{themeScopes: any[], tokenDefs: any[]}} config
 */
export function useTokens(config) {
  var [byTheme, setByTheme] = useState(null)

  useEffect(function () {
    var sets = readTokens(config)
    var lookup = {}
    sets.forEach(function (set) {
      var map = new Map()
      set.tokens.forEach(function (t) { map.set(t.id, t) })
      lookup[set.theme] = map
    })
    setByTheme(lookup)
    // config is expected to be stable; intentionally run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return byTheme
}
