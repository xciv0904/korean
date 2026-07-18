import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // 用相對路徑(而不是絕對路徑 "/"),部署到 GitHub Pages 這種子路徑
  // (例如 username.github.io/repo-name/)才不會找不到 JS/CSS/圖示。
  // 部署到根網域(自訂網域、Vercel/Netlify)也完全相容,不用另外調整。
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: '韓文情境口說練習',
        short_name: '韓文口說練習',
        description: '飯店櫃檯與日常約會情境句庫,錄音跟讀 + 間隔複習(SRS)',
        lang: 'zh-Hant',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#f4f6f9',
        theme_color: '#5c7a97',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // 只快取 app shell(HTML/JS/CSS/圖示),IndexedDB 裡的練習資料本來
        // 就不經過 fetch,不需要額外快取規則。
        globPatterns: ['**/*.{js,css,html,svg,png}'],
      },
    }),
  ],
})
