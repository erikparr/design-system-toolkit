import React from 'react'
import { createRoot } from 'react-dom/client'
import { DesignAudit } from '@design-audit/react'
import config from './design-audit.config.json'
import './index.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DesignAudit config={config} title="Example Style Guide" />
  </React.StrictMode>
)
