'use client'
import { Section, SubHeading, ThemeBox, Badge, NEUTRAL } from '../lib.jsx'

// Component samples are project-specific class names, so they come from
// optional `config.components`. Each item renders as the given tag with the
// given className, live and interactive, in both theme scopes. `config.legacy`
// renders a deprecation panel for superseded palettes.
export function ComponentsSection(props) {
  var config = props.config
  var components = config.components || []
  var legacy = config.legacy || []
  if (!components.length && !legacy.length) return null

  return (
    <Section id="components" title="Components">
      {components.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {config.themeScopes.map(function (scope) {
            return (
              <ThemeBox key={scope.name} scope={scope}>
                {components.map(function (group) {
                  return (
                    <div key={group.label} style={{ marginBottom: '16px' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '11px', opacity: 0.6, marginBottom: '8px' }}>{group.label}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
                        {group.items.map(function (item, i) {
                          var Tag = item.tag || 'button'
                          return <Tag key={i} className={item.className}>{item.label}</Tag>
                        })}
                      </div>
                    </div>
                  )
                })}
              </ThemeBox>
            )
          })}
        </div>
      ) : null}

      {legacy.length ? (
        <div style={{ marginTop: components.length ? '28px' : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <SubHeading>Legacy Palette</SubHeading>
            <Badge tone="warn">flagged for removal</Badge>
          </div>
          <p style={{ fontSize: '13px', opacity: 0.7, maxWidth: '60ch', margin: '0 0 14px' }}>
            Superseded colors kept for backward compatibility. Migrate remaining usages to semantic tokens, then delete.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
            {legacy.map(function (c) {
              return (
                <div key={c.className} style={{ border: '1px solid ' + NEUTRAL.border, borderRadius: '8px', padding: '8px' }}>
                  <div style={{ height: '44px', borderRadius: '4px', backgroundColor: c.value, border: '1px solid ' + NEUTRAL.border }} />
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', marginTop: '6px' }}>{c.className}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', opacity: 0.55 }}>{c.value}</div>
                  {c.note ? <div style={{ fontSize: '10px', lineHeight: 1.35, opacity: 0.7, marginTop: '4px' }}>{c.note}</div> : null}
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </Section>
  )
}
