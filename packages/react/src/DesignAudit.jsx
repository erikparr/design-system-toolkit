'use client'
import { useTokens } from './useTokens.js'
import { ColorsSection } from './sections/Colors.jsx'
import { TypographySection } from './sections/Typography.jsx'
import { ScalesSection } from './sections/Scales.jsx'
import { ComponentsSection } from './sections/Components.jsx'

// Config-driven design-system audit. Sections render only when the config has
// data for them, so the same component serves a tokens-only config and a fully
// enriched one.
//
// config = {
//   themeScopes:  [{ name, className? , attributes? }],
//   tokenDefs:    [{ id, cssVar, type, group }],          // from extract-tokens.mjs
//   contrast:     { text: [id...], surfaces: [id...] },
//   typography?:  { scale, weights, letterSpacing },      // optional (not in CSS vars)
//   components?:  [{ label, items: [{ label, className, tag? }] }],
//   legacy?:      [{ className, value, note }],
// }
export function DesignAudit(props) {
  var config = props.config
  var byTheme = useTokens({ themeScopes: config.themeScopes, tokenDefs: config.tokenDefs })

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
      <header style={{ marginBottom: '32px' }}>
        <p style={{ fontFamily: 'monospace', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.6 }}>
          Internal · Design System Audit
        </p>
        <h1 style={{ fontSize: '32px', fontWeight: 700, margin: '4px 0' }}>{props.title || 'Style Guide'}</h1>
        <p style={{ opacity: 0.75, maxWidth: '60ch' }}>
          Every value below is read live from the rendered CSS in both themes, so this audit can
          never drift from the running app.
        </p>
        {!byTheme ? <p style={{ fontSize: '13px', opacity: 0.6, marginTop: '8px' }}>Measuring live token values…</p> : null}
      </header>

      <ColorsSection config={config} byTheme={byTheme} />
      <TypographySection config={config} byTheme={byTheme} />
      <ScalesSection config={config} byTheme={byTheme} />
      <ComponentsSection config={config} byTheme={byTheme} />
    </div>
  )
}
