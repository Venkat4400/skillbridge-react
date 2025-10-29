import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/skillbridge-react/', // 👈 must match your GitHub repo name EXACTLY (case-sensitive)
})
