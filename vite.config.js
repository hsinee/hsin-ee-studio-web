import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // 支援較舊的 iPhone（iOS 14 起）與 LINE 內建瀏覽器
    target: ['es2020', 'safari14', 'chrome87'],
  },
});
