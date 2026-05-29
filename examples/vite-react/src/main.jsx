import React from 'react'
import { createRoot } from 'react-dom/client'
import { DesignAudit } from '@agentic-design-audit/react'
import generated from './design-audit.config.json'
import { enrichments } from './enrichments.js'
import './index.css'

// Generated token config + hand-added optional sections.
const config = { ...generated, ...enrichments }

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DesignAudit config={config} title="Example Style Guide" />
  </React.StrictMode>
)
