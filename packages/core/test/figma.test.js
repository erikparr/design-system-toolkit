import { test } from 'node:test'
import assert from 'node:assert/strict'

import { parseColor } from '../src/color.js'
import { figmaVariablesToTokenSet } from '../src/adapters/figmaVariables.js'
import { cssToTokenSets } from '../src/adapters/cssStatic.js'
import { diffTokenSets } from '../src/diff.js'

test('figma adapter: slash names → dotted ids, type inference, normalization', () => {
  var vars = {
    'color/bg/card': '#1a1a1a',
    'color/accent': 'rgb(51, 0, 255)',
    'spacing/4': '16px',
    'radius/lg': 8,
  }
  var set = figmaVariablesToTokenSet(vars, { theme: 'dark' })
  var byId = {}
  set.tokens.forEach((t) => { byId[t.id] = t })

  assert.equal(set.source, 'figma')
  assert.equal(byId['color.bg.card'].type, 'color')
  assert.deepEqual(byId['color.bg.card'].value, parseColor('#1a1a1a'))
  assert.deepEqual(byId['color.accent'].value, parseColor('rgb(51,0,255)'))
  assert.equal(byId['spacing.4'].type, 'dimension')
  assert.equal(byId['spacing.4'].value, 16)
  // numeric value with a dimension-y name
  assert.equal(byId['radius.lg'].type, 'dimension')
  assert.equal(byId['radius.lg'].value, 8)
})

test('figma adapter feeds the same diff engine (parity vs code)', () => {
  var css = `:root, .dark {
    --color-bg-card: #1a1a1a;
    --color-accent: #3300ff;
  }`
  var code = cssToTokenSets(css).find((s) => s.theme === 'dark')

  // Figma says accent is a different blue → value-mismatch; bg/card matches.
  var figma = figmaVariablesToTokenSet({
    'color/bg/card': '#1a1a1a',
    'color/accent': '#4400ff',
  }, { theme: 'dark' })

  var findings = diffTokenSets(code, [figma])
  var mismatch = findings.filter((f) => f.kind === 'value-mismatch')
  assert.equal(mismatch.length, 1)
  assert.equal(mismatch[0].refId, 'color.accent')
})
