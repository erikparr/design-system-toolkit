'use client'
import { useTokens } from './useTokens.js'
import { contrastRatio, gradeContrast, toHex } from '@design-audit/core'

// Config-driven audit renderer. v1 covers the two highest-value sections —
// color swatches (both themes) and the WCAG contrast matrix. Typography,
// spacing/scales and component sections are the next port from the reference
// implementation; the config and data flow already accommodate them.
//
// config = {
//   themeScopes: [{ name, className? , attributes? }],
//   tokenDefs:   [{ id, cssVar, type, group }],
//   contrast:    { text: [id...], surfaces: [id...] },
//   legacy?:     [{ className, value, note }],
// }

function scopeProps(scope) {
  var props = {}
  if (scope.className) props.className = scope.className
  if (scope.attributes) Object.assign(props, attrsToProps(scope.attributes))
  return props
}
function attrsToProps(attrs) {
  var out = {}
  Object.keys(attrs).forEach(function (k) { out[k] = attrs[k] })
  return out
}

function ThemeBox(props) {
  return (
    <div
      {...scopeProps(props.scope)}
      style={Object.assign(
        {
          backgroundColor: 'var(--color-bg-base, #fff)',
          border: '1px solid var(--color-border-subtle, #ddd)',
          borderRadius: '8px',
          padding: '12px',
        },
        props.style
      )}
    >
      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.6, marginBottom: '8px' }}>
        {props.scope.name}
      </div>
      {props.children}
    </div>
  )
}

function groupTokens(tokenDefs) {
  var groups = []
  var byName = {}
  tokenDefs.forEach(function (def) {
    var name = def.group || 'Tokens'
    if (!byName[name]) { byName[name] = { name: name, tokens: [] }; groups.push(byName[name]) }
    byName[name].tokens.push(def)
  })
  return groups
}

function Swatches(props) {
  var groups = groupTokens(props.config.tokenDefs)
  return (
    <div>
      {groups.map(function (group) {
        return (
          <div key={group.name} style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.7, marginBottom: '8px' }}>
              {group.name}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              {group.tokens.map(function (def) {
                return (
                  <div key={def.id} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr', gap: '12px', alignItems: 'center' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>{def.id}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '10px', opacity: 0.5 }}>{def.cssVar}</div>
                    </div>
                    {props.config.themeScopes.map(function (scope) {
                      var tok = props.byTheme ? props.byTheme[scope.name] && props.byTheme[scope.name].get(def.id) : null
                      return (
                        <ThemeBox key={scope.name} scope={scope} style={{ padding: '8px' }}>
                          <div style={{ height: '36px', borderRadius: '4px', backgroundColor: 'var(' + def.cssVar + ')', border: '1px solid var(--color-border-subtle, #ddd)' }} />
                          <div style={{ fontFamily: 'monospace', fontSize: '11px', opacity: 0.7, marginTop: '6px' }}>
                            {tok ? (tok.type === 'color' && tok.value ? toHex(tok.value) : tok.raw) : '—'}
                          </div>
                        </ThemeBox>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ContrastMatrix(props) {
  var lookup = props.byTheme && props.byTheme[props.scope.name]
  var text = props.config.contrast.text
  var surfaces = props.config.contrast.surfaces
  return (
    <ThemeBox scope={props.scope}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '4px', opacity: 0.6, fontWeight: 500 }}>text \ bg</th>
            {surfaces.map(function (s) {
              return <th key={s} style={{ padding: '4px', fontFamily: 'monospace', fontWeight: 400, opacity: 0.6 }}>{shortId(s)}</th>
            })}
          </tr>
        </thead>
        <tbody>
          {text.map(function (t) {
            return (
              <tr key={t}>
                <td style={{ padding: '4px', fontFamily: 'monospace', opacity: 0.6, whiteSpace: 'nowrap' }}>{shortId(t)}</td>
                {surfaces.map(function (s) {
                  var tt = lookup && lookup.get(t)
                  var ss = lookup && lookup.get(s)
                  var ratio = tt && ss ? contrastRatio(tt.value, ss.value) : null
                  var grade = gradeContrast(ratio)
                  return (
                    <td key={s} style={{ padding: '2px' }}>
                      <div style={{ borderRadius: '4px', padding: '6px', textAlign: 'center', backgroundColor: 'var(' + cssVarOf(props.config, s) + ')', color: 'var(' + cssVarOf(props.config, t) + ')', border: '1px solid var(--color-border-subtle, #ddd)' }}>
                        <div style={{ fontWeight: 600 }}>Aa</div>
                        <div style={{ fontSize: '10px', opacity: 0.9, marginTop: '3px' }}>{grade.ratio != null ? grade.ratio.toFixed(2) : '—'}</div>
                        <div style={{ fontSize: '10px', marginTop: '2px', fontWeight: 700 }}>{grade.label}</div>
                      </div>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </ThemeBox>
  )
}

function cssVarOf(config, id) {
  var def = config.tokenDefs.find(function (d) { return d.id === id })
  return def ? def.cssVar : '--unknown'
}
function shortId(id) {
  var parts = id.split('.')
  return parts.slice(1).join('.') || id
}

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

      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid var(--color-border-subtle, #ddd)', paddingBottom: '8px' }}>
          Colors
        </h2>
        <Swatches config={config} byTheme={byTheme} />
      </section>

      {config.contrast ? (
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '16px', borderBottom: '1px solid var(--color-border-subtle, #ddd)', paddingBottom: '8px' }}>
            Contrast Matrix
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {config.themeScopes.map(function (scope) {
              return <ContrastMatrix key={scope.name} scope={scope} config={config} byTheme={byTheme} />
            })}
          </div>
        </section>
      ) : null}
    </div>
  )
}
