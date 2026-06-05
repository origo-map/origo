import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

/** Rewrite paths in example HTML files for the dist layout */
function transformExampleHtml(content) {
  return content
    .replace('</head>', '  <link href="../css/style.css" rel="stylesheet">\n</head>')
    .replace(/import Origo from "\.\.\/src\/index\.js"/, 'import Origo from "../js/origo.esm.js"');
}
/** Force a full browser reload (not HMR) when index.json changes */
function fullReloadOnIndexJsonChange() {
  return {
    name: 'full-reload-on-index-json-change',
    handleHotUpdate({ file, server }) {
      if (file.endsWith('/index.json')) {
        server.ws.send({ type: 'full-reload' });
        return [];
      }
    }
  };
}

export default defineConfig(({ command }) => ({
  server: {
    port: 9966
  },
  plugins: [
    fullReloadOnIndexJsonChange(),
    ...(command === 'build'
      ? [
        viteStaticCopy({
          targets: [
            { src: 'index.json', dest: '.' },
            {
              src: 'index.html',
              dest: '.',
              transform: (content) => content
                .replace('</head>', '  <link href="css/style.css" rel="stylesheet">\n</head>')
                .replace(/import Origo from "\.\/src\/index\.js"/, 'import Origo from "./js/origo.esm.js"')
            },
            {
              src: 'examples/*',
              dest: '.',
              transform: (content, filename) => (filename.endsWith('.html') ? transformExampleHtml(content) : content)
            }
          ]
        })
      ]
      : [])
  ],
  build: {
    lib: {
      entry: resolve(dirname(fileURLToPath(import.meta.url)), 'src', 'index.js'),
      name: 'Origo',
      cssFileName: 'css/style'
    },
    rollupOptions: {
      output: [
        {
          format: 'es',
          entryFileNames: 'js/origo.esm.js',
          chunkFileNames: 'js/[name]-[hash].js'
        },
        {
          // Self-contained UMD bundle, kept as origo.js for backwards compatibility
          // with consumers who use a plain <script src="js/origo.js"> tag.
          format: 'umd',
          name: 'Origo',
          entryFileNames: 'js/origo.js',
          chunkFileNames: 'js/[name]-[hash].js'
        },
        {
          // Same UMD bundle, duplicated under the .cjs extension so Node's
          // require() resolves it as CommonJS even though "type": "module" is set.
          format: 'umd',
          name: 'Origo',
          entryFileNames: 'js/origo.umd.cjs',
          chunkFileNames: 'js/[name]-[hash].js'
        }
      ]
    },
    sourcemap: true
  }
}));
