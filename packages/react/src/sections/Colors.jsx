'use client'
import { contrastRatio, gradeContrast } from '@design-system-toolkit/core'
import { Section, SubHeading, ThemeBox, liveValue, cssVarOf, shortId, tokensOfType } from '../lib.jsx'

function groupColors(defs) {
  var groups = []
  var byName = {}
  defs.forEach(function (def) {
    var name = def.group || 'color'
    if (!byName[name]) { byName[name] = { name: name, tokens: [] }; groups.push(byName[name]) }
    byName[name].tokens.push(def)
  })
  return groups
}

export function ColorsSection(props) {
  var config = props.config
  var byTheme = props.byTheme
  var groups = groupColors(tokensOfType(config, 'color'))

  return (
    <Section id="colors" title="Colors">
      {groups.map(function (group) {
        return (
          <div key={group.name} style={{ marginBottom: '24px' }}>
            <SubHeading>{group.name}</SubHeading>
            <div style={{ display: 'grid', gap: '8px' }}>
              {group.tokens.map(function (def) {
                return (
                  <div key={def.id} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr', gap: '12px', alignItems: 'center' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>{def.id}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '10px', opacity: 0.5 }}>{def.cssVar}</div>
                    </div>
                    {config.themeScopes.map(function (scope) {
                      return (
                        <ThemeBox key={scope.name} scope={scope} style={{ padding: '8px' }} label={false}>
                          <div style={{ height: '36px', borderRadius: '4px', backgroundColor: 'var(' + def.cssVar + ')', border: '1px solid var(--color-border-strong, #888)' }} />
                          <div style={{ fontFamily: 'monospace', fontSize: '11px', opacity: 0.7, marginTop: '6px' }}>
                            {liveValue(byTheme, scope.name, def.id)}
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

      {config.contrast ? <ContrastMatrices config={config} byTheme={byTheme} /> : null}
    </Section>
  )
}

function ContrastMatrices(props) {
  return (
    <div style={{ marginTop: '8px' }}>
      <SubHeading>Contrast Matrix</SubHeading>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {props.config.themeScopes.map(function (scope) {
          return <Matrix key={scope.name} scope={scope} config={props.config} byTheme={props.byTheme} />
        })}
      </div>
    </div>
  )
}

function Matrix(props) {
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
                        <div style={{ fontSize: '10px', marginTop: '2px', fontWeight: 700, color: grade.pass ? undefined : '#dc2626' }}>{grade.label}</div>
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
