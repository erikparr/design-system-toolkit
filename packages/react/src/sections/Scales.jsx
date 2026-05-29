'use client'
import { useState } from 'react'
import { Section, SubHeading, ThemeBox, liveValue, tokensOfType } from '../lib.jsx'

function splitDimensions(defs) {
  var radii = []
  var spacing = []
  defs.forEach(function (d) {
    if (d.id.indexOf('radius') !== -1) radii.push(d)
    else spacing.push(d)
  })
  return { radii: radii, spacing: spacing }
}

export function ScalesSection(props) {
  var config = props.config
  var byTheme = props.byTheme
  var firstTheme = config.themeScopes[0].name

  var dims = splitDimensions(tokensOfType(config, 'dimension'))
  var shadows = tokensOfType(config, 'shadow')
  var durations = tokensOfType(config, 'duration')

  if (!dims.spacing.length && !dims.radii.length && !shadows.length && !durations.length) return null

  return (
    <Section id="scales" title="Spacing, Radii, Shadows & Transitions">
      {dims.spacing.length ? (
        <div style={{ marginBottom: '28px' }}>
          <SubHeading>Spacing</SubHeading>
          <div style={{ display: 'grid', gap: '8px' }}>
            {dims.spacing.map(function (d) {
              return (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ width: '120px', fontFamily: 'monospace', fontSize: '12px', opacity: 0.6, flexShrink: 0 }}>{d.id}</span>
                  <span style={{ width: '64px', fontFamily: 'monospace', fontSize: '11px', opacity: 0.6, flexShrink: 0 }}>{liveValue(byTheme, firstTheme, d.id)}</span>
                  <div style={{ height: '16px', width: 'var(' + d.cssVar + ')', backgroundColor: 'var(--color-accent, #888)', borderRadius: '2px' }} />
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      {dims.radii.length ? (
        <div style={{ marginBottom: '28px' }}>
          <SubHeading>Border Radii</SubHeading>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            {dims.radii.map(function (d) {
              return (
                <div key={d.id} style={{ textAlign: 'center' }}>
                  <div style={{ width: '72px', height: '72px', border: '1px solid var(--color-border-subtle, #ddd)', backgroundColor: 'var(--color-bg-card, #eee)', borderRadius: 'var(' + d.cssVar + ')' }} />
                  <div style={{ fontFamily: 'monospace', fontSize: '12px', marginTop: '8px' }}>{d.id}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', opacity: 0.6 }}>{liveValue(byTheme, firstTheme, d.id)}</div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      {shadows.length ? (
        <div style={{ marginBottom: '28px' }}>
          <SubHeading>Shadows</SubHeading>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {config.themeScopes.map(function (scope) {
              return (
                <ThemeBox key={scope.name} scope={scope} style={{ backgroundColor: 'var(--color-bg-elevated, #fafafa)' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                    {shadows.map(function (d) {
                      return (
                        <div key={d.id} style={{ textAlign: 'center' }}>
                          <div style={{ width: '64px', height: '64px', backgroundColor: 'var(--color-bg-card, #fff)', borderRadius: '6px', boxShadow: 'var(' + d.cssVar + ')' }} />
                          <div style={{ fontFamily: 'monospace', fontSize: '11px', marginTop: '10px' }}>{d.id}</div>
                        </div>
                      )
                    })}
                  </div>
                </ThemeBox>
              )
            })}
          </div>
        </div>
      ) : null}

      {durations.length ? <Transitions config={config} byTheme={byTheme} firstTheme={firstTheme} /> : null}
    </Section>
  )
}

function Transitions(props) {
  var [hovered, setHovered] = useState(false)
  var durations = tokensOfType(props.config, 'duration')
  return (
    <div>
      <SubHeading>Transitions</SubHeading>
      <p style={{ fontSize: '13px', opacity: 0.65, margin: '0 0 12px' }}>Hover the bars to preview each timing.</p>
      <div style={{ display: 'grid', gap: '12px' }} onMouseEnter={function () { setHovered(true) }} onMouseLeave={function () { setHovered(false) }}>
        {durations.map(function (d) {
          return (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ width: '140px', fontFamily: 'monospace', fontSize: '12px', opacity: 0.6, flexShrink: 0 }}>{d.id}</span>
              <span style={{ width: '64px', fontFamily: 'monospace', fontSize: '11px', opacity: 0.6, flexShrink: 0 }}>{liveValue(props.byTheme, props.firstTheme, d.id)}</span>
              <div style={{ height: '16px', flex: 1, overflow: 'hidden', borderRadius: '4px', backgroundColor: 'var(--color-bg-card, #eee)' }}>
                <div style={{ height: '100%', width: hovered ? '100%' : '8%', backgroundColor: 'var(--color-accent, #888)', transition: 'width var(' + d.cssVar + ')' }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
