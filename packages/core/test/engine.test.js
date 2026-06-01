import { test } from 'node:test'
import assert from 'node:assert/strict'

import { parseColor, toHex } from '../src/color.js'
import { contrastRatio, gradeContrast } from '../src/contrast.js'
import { normalizeValue, valuesEqual, parseDimension } from '../src/normalize.js'
import { makeTokenSet, makeToken } from '../src/model.js'
import { diffTokenSets, auditContrast, collapseSeparators } from '../src/diff.js'

test('parseColor handles hex, rgb, rgba', () => {
  assert.deepEqual(parseColor('#1a1a1a'), { r: 26, g: 26, b: 26, a: 1 })
  assert.deepEqual(parseColor('#abc'), { r: 170, g: 187, b: 204, a: 1 })
  assert.deepEqual(parseColor('rgb(51, 0, 255)'), { r: 51, g: 0, b: 255, a: 1 })
  assert.equal(parseColor('rgba(0,0,0,0.8)').a, 0.8)
  assert.equal(parseColor('not-a-color'), null)
})

test('contrast: black on white is 21, white on white is 1', () => {
  assert.equal(Math.round(contrastRatio('#000', '#fff')), 21)
  assert.equal(Math.round(contrastRatio('#fff', '#fff')), 1)
})

test('gradeContrast thresholds', () => {
  assert.equal(gradeContrast(21).label, 'AAA')
  assert.equal(gradeContrast(4.6).label, 'AA')
  assert.equal(gradeContrast(3.2).label, 'AA Large')
  assert.equal(gradeContrast(2).label, 'Fail')
  assert.equal(gradeContrast(4.6).pass, true)
  assert.equal(gradeContrast(3.2).pass, false)
})

test('translucent foreground is flattened over background before grading', () => {
  // 50% black over white ≈ mid grey; ratio must be between the opaque extremes.
  var r = contrastRatio('rgba(0,0,0,0.5)', '#ffffff')
  assert.ok(r > 1 && r < 21)
})

test('normalizeValue + valuesEqual treat equivalent formats as equal', () => {
  assert.ok(valuesEqual('color', normalizeValue('color', '#1a1a1a'), normalizeValue('color', 'rgb(26,26,26)')))
  assert.equal(parseDimension('1rem'), 16)
  assert.ok(valuesEqual('dimension', normalizeValue('dimension', '16px'), normalizeValue('dimension', '1rem')))
  assert.ok(!valuesEqual('color', normalizeValue('color', '#000'), normalizeValue('color', '#fff')))
})

test('diffTokenSets reports missing, extra, and value-mismatch', () => {
  var code = makeTokenSet('code', 'dark', [
    makeToken({ id: 'color.bg.card', type: 'color', raw: '#1a1a1a', value: parseColor('#1a1a1a'), source: 'code', theme: 'dark' }),
    makeToken({ id: 'color.accent', type: 'color', raw: '#3300ff', value: parseColor('#3300ff'), source: 'code', theme: 'dark' }),
  ])
  var figma = makeTokenSet('figma', 'dark', [
    // mismatch on bg.card (well beyond the ±1 rounding tolerance), accent missing, extra brand token present
    makeToken({ id: 'color.bg.card', type: 'color', raw: '#202020', value: parseColor('#202020'), source: 'figma', theme: 'dark' }),
    makeToken({ id: 'color.brand', type: 'color', raw: '#dfff80', value: parseColor('#dfff80'), source: 'figma', theme: 'dark' }),
  ])

  var findings = diffTokenSets(code, [figma])
  var kinds = findings.map((f) => f.kind + ':' + f.refId).sort()
  assert.deepEqual(kinds, [
    'extra:color.brand',
    'missing:color.accent',
    'value-mismatch:color.bg.card',
  ])
})

test('diff aliases + normalizeId suppress naming noise, keep real drift', () => {
  var auth = makeTokenSet('code', 'dark', [
    makeToken({ id: 'color.accent', type: 'color', raw: '#3300ff', value: parseColor('#3300ff'), source: 'code', theme: 'dark' }),
    makeToken({ id: 'color.bg.card.hover', type: 'color', raw: '#222222', value: parseColor('#222222'), source: 'code', theme: 'dark' }),
  ])
  var cand = makeTokenSet('figma', 'dark', [
    makeToken({ id: 'color.accent.default', type: 'color', raw: '#3300ff', value: parseColor('#3300ff'), source: 'figma', theme: 'dark' }),
    makeToken({ id: 'color.bg.card-hover', type: 'color', raw: '#222222', value: parseColor('#222222'), source: 'figma', theme: 'dark' }),
  ])

  // Raw: naming differences read as missing + extra.
  assert.ok(diffTokenSets(auth, [cand]).length >= 4)

  // Alias (accent.default→accent) + separator-normalize (card-hover≡card.hover) → no findings.
  var clean = diffTokenSets(auth, [cand], {
    aliases: { 'color.accent.default': 'color.accent' },
    normalizeId: collapseSeparators,
  })
  assert.equal(clean.length, 0)

  // A genuine value change still surfaces despite the alias.
  cand.tokens[0].raw = '#4400ff'
  cand.tokens[0].value = parseColor('#4400ff')
  var realDrift = diffTokenSets(auth, [cand], {
    aliases: { 'color.accent.default': 'color.accent' },
    normalizeId: collapseSeparators,
  })
  assert.equal(realDrift.length, 1)
  assert.equal(realDrift[0].kind, 'value-mismatch')
  assert.equal(realDrift[0].refId, 'color.accent')
})

test('auditContrast flags failing pairs only', () => {
  var set = makeTokenSet('code', 'dark', [
    makeToken({ id: 'text.primary', type: 'color', raw: '#fff', value: parseColor('#fff'), source: 'code', theme: 'dark' }),
    makeToken({ id: 'text.muted', type: 'color', raw: '#444', value: parseColor('#444'), source: 'code', theme: 'dark' }),
    makeToken({ id: 'bg.base', type: 'color', raw: '#000', value: parseColor('#000'), source: 'code', theme: 'dark' }),
  ])
  var findings = auditContrast(set, [
    { text: 'text.primary', surface: 'bg.base' }, // 21:1 — passes, no finding
    { text: 'text.muted', surface: 'bg.base' },   // ~5? actually #444 on #000 fails AA
  ])
  assert.equal(findings.length, 1)
  assert.equal(findings[0].kind, 'contrast-fail')
  assert.equal(findings[0].refId, 'text.muted on bg.base')
})

test('toHex round-trips a parsed color', () => {
  assert.equal(toHex(parseColor('rgb(51,0,255)')), '#3300ff')
})
