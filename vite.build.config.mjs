import { resolve, basename } from 'node:path';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

function transformExampleHtml(content, filename) {
  const reg = /<script\b[^>]*>([\s\S]*?)<\/script>/gm;
  const configFile = basename(filename).replace(/\.html$/, '.json')
  content = content
    .replace('</head>', '\t<link href="../css/style.css" rel="stylesheet">\n</head>')
    .replace(
      reg,
      `<script src="../js/origo.min.js"></script>\n<script>const origo = new Origo("examples/${configFile}", {baseUrl: "../"})</script>`
    );
  return content;
}

export default defineConfig({
  define: {
    '__APP_VERSION__': JSON.stringify(process.env.npm_package_version)
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'index.json', dest: '.'
        },
        {
          src: 'index.html',
          dest: '.',
          transform: (content) => content
            .replace('</head>', '\t<link href="css/style.css" rel="stylesheet">\n</head>')
            .replace(
              '<script type="module" src="main.js"></script>',
              '<script src="./js/origo.min.js"></script>\r\n\t<script>const origo = new Origo("index.json")</script>'
            )
        },
        {
          src: 'examples/*',
          dest: '.',
          transform: (content, filename) => (filename.endsWith('.html') ? transformExampleHtml(content, filename) : content)
        }
      ]
    })
  ],
  build: {
    outDir: 'dist',
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.js'),
      name: 'Origo',
      fileName: (format, entryName) => 'js/origo.min.js',
      cssFileName: 'css/style'
    },
    rollupOptions: {
      output: [
        {
          format: 'iife',
          name: 'Origo',
          entryFileNames: 'js/origo.min.js',
          plugins: [],
        },
        {
          format: 'iife',
          name: 'Origo',
          entryFileNames: 'js/origo.js',
          minify: false,
          plugins: [
            {
              name: 'disable-minification-for-this-output',
              renderChunk(code) {
                return {
                  code,
                  map: null
                }
              }
            }
          ]
        }
      ],
    },
    sourcemap: true
  }
});