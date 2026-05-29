import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // The renderer ships as untranspiled .jsx source; let esbuild transform it
  // even though it lives under node_modules (workspace symlink).
  optimizeDeps: { include: ['@agentic-design-audit/react', '@agentic-design-audit/core'] },
})
