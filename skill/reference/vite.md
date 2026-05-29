# Mounting in Vite / CRA / React Router

These are SPAs with no file-based routing or server metadata, so mounting is just a route + a `<meta name="robots">` tag.

## With React Router

```jsx
// src/routes/StyleGuide.jsx
import { useEffect } from 'react'
import { DesignAudit } from '@design-audit/react'
import config from '../design-audit.config.json'

export default function StyleGuide() {
  useEffect(() => {
    const m = document.createElement('meta')
    m.name = 'robots'; m.content = 'noindex'
    document.head.appendChild(m)
    return () => { document.head.removeChild(m) }
  }, [])
  return <DesignAudit config={config} title="Style Guide" />
}
```

Register it:
```jsx
<Route path="/style-guide" element={<StyleGuide />} />
```

## Without a router

Gate on the pathname in `main.jsx`:
```jsx
if (window.location.pathname === '/style-guide') {
  root.render(<DesignAudit config={config} title="Style Guide" />)
} else {
  root.render(<App />)
}
```

## Requirements

- The token-source CSS must be imported by the app (commonly `import './index.css'` in `main.jsx`) so the custom properties are present at runtime — the audit reads them live.
- Tailwind's class scanner must include the audit route's files in `content` if the page uses Tailwind utility classes. `<DesignAudit>` itself styles via inline styles + CSS variables, so this matters only for surrounding chrome.
