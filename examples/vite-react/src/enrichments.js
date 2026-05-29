// Optional audit sections that can't be derived from CSS custom properties.
// In a real project the skill adds these by hand; main.jsx merges them over the
// generated config. (Type scale/weights live in a Tailwind config; component
// samples and legacy palette are project knowledge.)
export var enrichments = {
  typography: {
    scale: [
      { label: 'sm', value: '0.875rem' },
      { label: 'base', value: '1rem' },
      { label: 'lg', value: '1.25rem' },
      { label: 'xl', value: '1.5rem' },
      { label: '2xl', value: '2rem' },
      { label: '3xl', value: '3rem' },
    ],
    weights: [
      { label: 'normal', weight: 400 },
      { label: 'medium', weight: 500 },
      { label: 'semibold', weight: 600 },
      { label: 'bold', weight: 700 },
    ],
    letterSpacing: [
      { label: 'tight', value: '-0.01em' },
      { label: 'normal', value: '0' },
      { label: 'wide', value: '0.05em' },
    ],
  },
  components: [
    {
      label: '.btn / .btn-outline',
      items: [
        { label: 'Primary', className: 'btn' },
        { label: 'Outline', className: 'btn-outline' },
      ],
    },
    {
      label: '.card',
      items: [
        { label: 'Card body', className: 'card', tag: 'div' },
      ],
    },
  ],
  legacy: [
    { className: 'brand-green', value: '#ccff33', note: 'Old lime accent; superseded by --color-accent.' },
    { className: 'gray-legacy', value: '#888888', note: 'Ambiguous mid-grey; map to a semantic text/border token.' },
  ],
}
