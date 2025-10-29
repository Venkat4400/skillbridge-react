import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/SkillBridge-App/',  // 👈 Add this line (use your repo name)
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
