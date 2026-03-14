import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  base: '/',
  resolve: {
    alias: {
      'three/addons': path.resolve(__dirname, 'node_modules/three/examples/jsm')
    }
  }
})
