# Mounting in Next.js

## App Router (`src/app/` or `app/`)

The audit reads live CSS, so the page is a client component. A client component cannot export `metadata`, so add a sibling server `layout.js` for `noindex`.

```
app/style-guide/
├── layout.js   # server: metadata (noindex)
└── page.js     # 'use client': renders <DesignAudit>
```

`layout.js`:
```js
export const metadata = {
  title: 'Design System Audit',
  robots: { index: false, follow: false },
}
export default function Layout({ children }) { return children }
```

`page.js`:
```jsx
'use client'
import { DesignAudit } from '@design-system-toolkit/react'
import config from './design-audit.config.json'
export default function Page() { return <DesignAudit config={config} title="Style Guide" /> }
```

- Keep `design-audit.config.json` alongside the page (or anywhere importable).
- Do **not** add the route to nav — it's internal/unlisted.
- The route inherits global CSS automatically since it's inside the app tree; no extra CSS import needed.

## Pages Router (`src/pages/`)

```jsx
// pages/style-guide.jsx
import Head from 'next/head'
import { DesignAudit } from '@design-system-toolkit/react'
import config from '../design-audit.config.json'

export default function StyleGuide() {
  return (
    <>
      <Head><meta name="robots" content="noindex" /></Head>
      <DesignAudit config={config} title="Style Guide" />
    </>
  )
}
```

`<DesignAudit>` is `'use client'`-marked and uses `useEffect`; in Pages Router it runs client-side normally. Ensure global CSS (the token source) is imported in `pages/_app.js`.
