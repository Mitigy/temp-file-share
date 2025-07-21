import { defineConfig } from 'vite'
import { viteAwesomeSvgLoader } from 'vite-awesome-svg-loader'

export default defineConfig({
  base: '/temp-file-share/',
  plugins: [
    viteAwesomeSvgLoader()
  ]
})
