'use client'
import { Section, SubHeading, NEUTRAL, liveValue, tokensOfType } from '../lib.jsx'

var SAMPLE = 'The quick brown fox — 0123456789'

// Font families come from CSS-variable tokens (live). The type scale, weights
// and letter-spacing usually live outside CSS variables (e.g. a Tailwind
// config), so they are read from optional `config.typography` and skipped when
// not provided.
export function TypographySection(props) {
  var config = props.config
  var families = tokensOfType(config, 'fontFamily')
  var typo = config.typography || {}
  if (!families.length && !typo.scale && !typo.weights && !typo.letterSpacing) return null

  return (
    <Section id="typography" title="Typography">
      {families.length ? (
        <div style={{ marginBottom: '28px' }}>
          <SubHeading>Font Families</SubHeading>
          <div style={{ display: 'grid', gap: '12px' }}>
            {families.map(function (def) {
              return (
                <div key={def.id} style={{ border: '1px solid ' + NEUTRAL.border, borderRadius: '8px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{def.id}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px', opacity: 0.6 }}>{liveValue(props.byTheme, config.themeScopes[0].name, def.id)}</span>
                  </div>
                  <div style={{ fontSize: '24px', fontFamily: 'var(' + def.cssVar + ')' }}>{SAMPLE}</div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      {typo.scale ? (
        <div style={{ marginBottom: '28px' }}>
          <SubHeading>Type Scale</SubHeading>
          <div style={{ display: 'grid', gap: '10px' }}>
            {typo.scale.map(function (step) {
              return (
                <div key={step.label} style={{ display: 'flex', alignItems: 'baseline', gap: '16px', borderBottom: '1px solid ' + NEUTRAL.border, paddingBottom: '8px' }}>
                  <span style={{ width: '48px', fontFamily: 'monospace', fontSize: '12px', opacity: 0.6, flexShrink: 0 }}>{step.label}</span>
                  <span style={{ width: '80px', fontFamily: 'monospace', fontSize: '11px', opacity: 0.6, flexShrink: 0 }}>{step.value}</span>
                  <span style={{ fontSize: step.value, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{SAMPLE}</span>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      {typo.weights ? (
        <div style={{ marginBottom: '28px' }}>
          <SubHeading>Weights</SubHeading>
          <div style={{ display: 'grid', gap: '6px' }}>
            {typo.weights.map(function (w) {
              return (
                <div key={w.label} style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
                  <span style={{ width: '88px', fontFamily: 'monospace', fontSize: '12px', opacity: 0.6, flexShrink: 0 }}>{w.label}</span>
                  <span style={{ width: '40px', fontFamily: 'monospace', fontSize: '11px', opacity: 0.6, flexShrink: 0 }}>{w.weight}</span>
                  <span style={{ fontSize: '18px', fontWeight: w.weight }}>{SAMPLE}</span>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      {typo.letterSpacing ? (
        <div>
          <SubHeading>Letter Spacing</SubHeading>
          <div style={{ display: 'grid', gap: '6px' }}>
            {typo.letterSpacing.map(function (ls) {
              return (
                <div key={ls.label} style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
                  <span style={{ width: '88px', fontFamily: 'monospace', fontSize: '12px', opacity: 0.6, flexShrink: 0 }}>{ls.label}</span>
                  <span style={{ width: '64px', fontFamily: 'monospace', fontSize: '11px', opacity: 0.6, flexShrink: 0 }}>{ls.value}</span>
                  <span style={{ fontSize: '18px', letterSpacing: ls.value }}>{SAMPLE}</span>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </Section>
  )
}
