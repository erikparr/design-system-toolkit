import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { runDrift } from '../src/drift.js'

var here = dirname(fileURLToPath(import.meta.url))
var fx = (f) => join(here, 'fixtures', f)

test('runDrift surfaces value-mismatch, missing, and extra against fixtures', () => {
  var result = runDrift({
    cssPath: fx('tokens.css'),
    tokens: [{ theme: 'dark', path: fx('dark.tokens.json') }],
    idPrefix: 'color',
  })

  assert.equal(result.themes.length, 1)
  var t = result.themes[0]
  var by = {}
  t.findings.forEach((f) => { (by[f.kind] = by[f.kind] || []).push(f.refId) })

  // text.primary differs (#ffffff vs #ff0000)
  assert.deepEqual(by['value-mismatch'], ['color.text.primary'])
  // code has color.accent + space.4 that the tokens file lacks
  assert.deepEqual(by['missing'].sort(), ['color.accent', 'space.4'])
  // tokens file has accent.default that code lacks
  assert.deepEqual(by['extra'], ['color.accent.default'])
  // bg.base matches → produces no finding
  assert.ok(!t.findings.some((f) => f.refId === 'color.bg.base'))
})

test('authority flip swaps missing/extra direction', () => {
  var asCode = runDrift({ cssPath: fx('tokens.css'), tokens: [{ theme: 'dark', path: fx('dark.tokens.json') }], idPrefix: 'color', authority: 'code' })
  var asTokens = runDrift({ cssPath: fx('tokens.css'), tokens: [{ theme: 'dark', path: fx('dark.tokens.json') }], idPrefix: 'color', authority: 'tokens' })
  // space.4 is missing-from-tokens when code is authority; becomes extra-in-code when tokens is authority
  assert.ok(asCode.themes[0].findings.some((f) => f.kind === 'missing' && f.refId === 'space.4'))
  assert.ok(asTokens.themes[0].findings.some((f) => f.kind === 'extra' && f.refId === 'space.4'))
})
