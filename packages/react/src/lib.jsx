'use client'
import { toHex } from '@design-system-toolkit/core'

// Shared primitives for audit sections.
//
// IMPORTANT: the tool's own chrome (box backgrounds, label text, borders) must
// NOT reference the audited project's tokens — token names vary per project, so
// `var(--color-text-primary)` etc. resolve to the wrong value (or none) and make
// the audit UI itself unreadable. Chrome colors are derived from each column's
// tone instead; only the swatches and contrast cells use the real tokens.

// Neutral chrome that stays legible on ANY page background (semi-transparent,
// so it works whether the host page is light or dark).
export var NEUTRAL = {
  border: 'rgba(128,128,128,0.32)',
  surface: 'rgba(128,128,128,0.14)',
  accent: '#6366f1',
}

function isDarkScope(scope) {
  if (scope && scope.tone) return scope.tone === 'dark'
  return /dark|night|black/i.test((scope && scope.name) || '')
}

// Legible box chrome for a theme column, by tone.
export function chromeFor(scope) {
  return isDarkScope(scope)
    ? { bg: '#101114', surface: '#1b1d22', text: '#f4f4f5', muted: '#a1a1aa', border: 'rgba(255,255,255,0.14)' }
    : { bg: '#ffffff', surface: '#f4f4f5', text: '#18181b', muted: '#6b7280', border: 'rgba(0,0,0,0.12)' }
}

export function scopeProps(scope) {
  var props = {}
  if (scope.className) props.className = scope.className
  if (scope.attributes) Object.keys(scope.attributes).forEach(function (k) { props[k] = scope.attributes[k] })
  return props
}

export function ThemeBox(props) {
  var c = chromeFor(props.scope)
  // scopeProps applies the project's theme class/attrs so the swatch/cell tokens
  // inside resolve to this column's theme; the box's own colors come from `c`.
  return (
    <div
      {...scopeProps(props.scope)}
      style={Object.assign(
        {
          backgroundColor: c.bg,
          color: c.text,
          border: '1px solid ' + c.border,
          borderRadius: '8px',
          padding: '12px',
        },
        props.style
      )}
    >
      {props.label !== false ? (
        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: c.muted, marginBottom: '8px' }}>
          {props.scope.name}
        </div>
      ) : null}
      {props.children}
    </div>
  )
}

export function Section(props) {
  return (
    <section style={{ marginBottom: '40px' }} id={props.id}>
      <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid ' + NEUTRAL.border, paddingBottom: '8px' }}>
        {props.title}
      </h2>
      {props.children}
    </section>
  )
}

export function SubHeading(props) {
  // Inherits the page's text color (opacity-dimmed) so it reads on any host theme.
  return (
    <h3 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.7, margin: '0 0 8px' }}>
      {props.children}
    </h3>
  )
}

export function Badge(props) {
  var tones = {
    pass: { bg: 'rgba(34,197,94,0.15)', fg: '#16a34a', border: 'rgba(34,197,94,0.4)' },
    warn: { bg: 'rgba(234,179,8,0.15)', fg: '#a16207', border: 'rgba(234,179,8,0.4)' },
    fail: { bg: 'rgba(239,68,68,0.15)', fg: '#dc2626', border: 'rgba(239,68,68,0.45)' },
    neutral: { bg: 'rgba(120,120,120,0.15)', fg: '#737373', border: 'rgba(120,120,120,0.4)' },
  }
  var tone = tones[props.tone] || tones.neutral
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', borderRadius: '4px', padding: '1px 6px', fontSize: '11px', fontWeight: 600, backgroundColor: tone.bg, color: tone.fg, border: '1px solid ' + tone.border }}>
      {props.children}
    </span>
  )
}

// Resolved display value for a token id in a theme, or '—' if unmeasured.
export function liveValue(byTheme, theme, id) {
  var tok = byTheme && byTheme[theme] && byTheme[theme].get(id)
  if (!tok) return '—'
  if (tok.type === 'color' && tok.value) return toHex(tok.value)
  return tok.raw || '—'
}

export function cssVarOf(config, id) {
  var def = config.tokenDefs.find(function (d) { return d.id === id })
  return def ? def.cssVar : '--unknown'
}

export function shortId(id) {
  var parts = String(id).split('.')
  return parts.slice(1).join('.') || id
}

export function tokensOfType(config, type) {
  return config.tokenDefs.filter(function (d) { return d.type === type })
}
