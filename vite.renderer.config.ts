import { defineConfig } from 'vite';

// NOTE: Electron Forge loads Vite config via require() in some setups.
// @vitejs/plugin-react is ESM-only, so we must use dynamic import.
export default defineConfig(async () => {
  const { default: react } = await import('@vitejs/plugin-react');
  const { default: tailwindcss } = await import('@tailwindcss/vite');

  return {
    plugins: [tailwindcss(), react()],
  };
});
