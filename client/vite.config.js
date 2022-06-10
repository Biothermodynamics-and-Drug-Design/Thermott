import { defineConfig } from 'vite'
import { createVuePlugin as vue } from "vite-plugin-vue2";
import path from 'path';
import Components from 'unplugin-vue-components/vite'
import analyze from 'rollup-plugin-analyzer'
import {VuetifyResolver} from 'unplugin-vue-components/resolvers'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), Components({
    resolvers: [
      VuetifyResolver(),
    ]
  })],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    port: 8080,
    proxy:{
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/documentation": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/documentation/, '')
      },
      "/plbd": {
        target: "https://plbd.ibt.lt/db-trunk/",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/plbd/, '')
      },
    }
  },

  output:{
    useStrict: false
  }

  

  
  // optimizeDeps: {
  //   include: ['plotly.js', 'has-hover'],
  // },
  
})