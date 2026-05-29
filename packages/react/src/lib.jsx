'use client'
import { toHex } from '@agentic-design-audit/core'

// Shared primitives for audit sections. Styling is inline + CSS-variable based
// so the renderer carries no Tailwind/styling-framework dependency; it resolves
// against whatever theme the surrounding scope provides.

export function scopeProps(scope) {
  var props = {}
  if (scope.className) props.className = scope.className
  if (scope.attributes) Object.keys(scope.attributes).forEach(function (k) { props[k] = scope.attributes[k] })
  return props
}

export function ThemeBox(props) {
  return (
    <div
      {...scopeProps(props.scope)}
      style={Object.assign(
        {
          // A themed surface MUST pair foreground with background from the same
          // theme — otherwise text inherits the outer page's color and the
          // off-theme column renders unreadable (e.g. dark text on dark bg).
          backgroundColor: 'var(--color-bg-base, #fff)',
          color: 'var(--color-text-primary, #111)',
          border: '1px solid var(--color-border-subtle, #ddd)',
          borderRadius: '8px',
          padding: '12px',
        },
        props.style
      )}
    >
      {props.label !== false ? (
        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.6, marginBottom: '8px' }}>
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
      <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid var(--color-border-subtle, #ddd)', paddingBottom: '8px' }}>
        {props.title}
      </h2>
      {props.children}
    </section>
  )
}

export function SubHeading(props) {
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
