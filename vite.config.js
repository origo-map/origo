import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

/** Rewrite paths in example HTML files for the dist layout */
function transformExampleHtml(content) {
  return content
    .replace('</head>', '  <link href="../css/origo.css" rel="stylesheet">\n</head>')
    .replace(/import Origo from "\.\.\/origo\.js"/, 'import Origo from "../js/origo.js"');
}
export default defineConfig({
  server: {
    port: 9966
  },
  plugins: [
    viteStaticCopy({
      targets: [
        { src: 'index.json', dest: '.' },
        {
          src: 'index.html',
          dest: '.',
          transform: (content) => content
            .replace('</head>', '  <link href="css/origo.css" rel="stylesheet">\n</head>')
            .replace(/import Origo from "\.\/origo\.js"/, 'import Origo from "./js/origo.js"')
        },
        {
          src: 'examples/*',
          dest: '.',
          transform: (content, filename) => (filename.endsWith('.html') ? transformExampleHtml(content) : content)
        }
      ]
    })
  ],
  build: {
    lib: {
      entry: resolve(dirname(fileURLToPath(import.meta.url)), 'src', 'index.js'),
      name: 'Origo',
      formats: ['es', 'umd'],
      cssFileName: 'css/origo'
    },
    rollupOptions: {
      output: [
        {
          format: 'es',
          entryFileNames: 'js/origo.js',
          chunkFileNames: 'js/[name]-[hash].js'
        },
        {
          format: 'umd',
          name: 'Origo',
          entryFileNames: 'js/origo.umd.cjs',
          chunkFileNames: 'js/[name]-[hash].js'
        }
      ]
    },
    sourcemap: true
  }
});
