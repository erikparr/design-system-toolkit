import { test } from 'node:test'
import assert from 'node:assert/strict'

import { parseColor } from '../src/color.js'
import { dtcgToTokenSet } from '../src/adapters/dtcg.js'
import { cssToTokenSets } from '../src/adapters/cssStatic.js'
import { diffTokenSets } from '../src/diff.js'

test('parseColor handles 4- and 8-digit hex (alpha)', () => {
  assert.equal(parseColor('#000000cc').a, 204 / 255)
  assert.deepEqual(parseColor('#0000'), { r: 0, g: 0, b: 0, a: 0 })
  // #000000cc (8-hex) and rgba(0,0,0,0.8) are the same color
  var a = parseColor('#000000cc')
  var b = parseColor('rgba(0,0,0,0.8)')
  assert.ok(Math.abs(a.a - b.a) <= 0.01 && a.r === b.r)
})

test('dtcg adapter: $type inheritance + dotted ids + idPrefix', () => {
  var doc = {
    bg: { $type: 'color', base: { $value: '#000000' }, card: { $value: '#1a1a1a' } },
    text: { $type: 'color', primary: { $value: '#ffffff' } },
  }
  var set = dtcgToTokenSet(doc, { theme: 'dark', idPrefix: 'color' })
  var ids = set.tokens.map((t) => t.id).sort()
  assert.deepEqual(ids, ['color.bg.base', 'color.bg.card', 'color.text.primary'])
  var card = set.tokens.find((t) => t.id === 'color.bg.card')
  assert.equal(card.type, 'color')
  assert.deepEqual(card.value, parseColor('#1a1a1a'))
  assert.equal(set.source, 'style-dictionary')
})

test('dtcg adapter: resolves {alias} references against primitives', () => {
  var primitives = { color: { $type: 'color', accent: { $value: '#3300ff' } } }
  var doc = { accent: { $type: 'color', default: { $value: '{color.accent}' } } }
  var set = dtcgToTokenSet(doc, { theme: 'dark', primitives: primitives })
  var tok = set.tokens.find((t) => t.id === 'accent.default')
  assert.equal(tok.raw, '#3300ff')
  assert.deepEqual(tok.value, parseColor('#3300ff'))
})

test('dtcg adapter: dangling alias kept literal, not crashed', () => {
  var doc = { x: { $type: 'color', y: { $value: '{nope.missing}' } } }
  var set = dtcgToTokenSet(doc, {})
  assert.equal(set.tokens[0].raw, '{nope.missing}')
})

test('cssStatic adapter: parses custom props per theme from @layer', () => {
  var css = `
    @layer base {
      :root, .dark { --color-bg-base: #000000; --space-4: 1rem; }
      .light { --color-bg-base: #ffffff; }
    }`
  var sets = cssToTokenSets(css)
  var dark = sets.find((s) => s.theme === 'dark')
  var light = sets.find((s) => s.theme === 'light')
  assert.equal(dark.tokens.find((t) => t.id === 'color.bg.base').raw, '#000000')
  assert.equal(light.tokens.find((t) => t.id === 'color.bg.base').raw, '#ffffff')
  // type inference + light only redeclares the color, not the space token
  assert.equal(dark.tokens.find((t) => t.id === 'space.4').type, 'dimension')
})

test('drift: code (CSS) vs DTCG surfaces missing tokens + naming differences', () => {
  var css = `:root, .dark {
    --color-bg-base: #000000;
    --color-accent: #3300ff;
    --space-4: 1rem;
  }`
  var code = cssToTokenSets(css).find((s) => s.theme === 'dark')

  var dtcgDoc = {
    bg: { $type: 'color', base: { $value: '#000000' } },
    accent: { $type: 'color', default: { $value: '#3300ff' } }, // .default vs code's bare "accent"
  }
  var dtcg = dtcgToTokenSet(dtcgDoc, { theme: 'dark', idPrefix: 'color' })

  var findings = diffTokenSets(code, [dtcg])
  var byKind = {}
  findings.forEach((f) => { (byKind[f.kind] = byKind[f.kind] || []).push(f.refId) })

  // bg.base matches (same value) -> no finding.
  assert.ok(!findings.some((f) => f.refId === 'color.bg.base'))
  // code has color.accent + space.4 that DTCG lacks -> missing.
  assert.deepEqual(byKind.missing.sort(), ['color.accent', 'space.4'])
  // DTCG has color.accent.default that code lacks -> extra.
  assert.deepEqual(byKind.extra, ['color.accent.default'])
})
