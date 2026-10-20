import { dirname, resolve, basename } from 'node:path';
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
            .replace(
              '<script type="module" src="plugins/main.js"></script>',
              '<!-- plugins -->'
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
      formats: ['iife'],
      fileName: (format, entryName) => 'js/origo.min.js',
      cssFileName: 'css/style'
    },
    sourcemap: true
  }
});