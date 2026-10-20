import { build } from 'vite';
import { resolve } from 'path';
import { rimraf } from 'rimraf';
import { readdir, readFile, writeFile } from 'node:fs/promises';

await rimraf('./dist/plugins');

const content = await readdir(resolve(process.cwd(), 'plugins'), {
  withFileTypes: true
});

let entries = [];

for (const item of content) {

  if (!item.isDirectory()) {
    continue;
  }

  const files = await readdir(resolve(process.cwd(), `plugins/${item.name}`), {
    withFileTypes: true
  });

  files.forEach(file => {
    if (file.name === `${item.name}.js` || file.name === 'main.js' || file.name === 'index.js') {
      entries.push({
        name: item.name.replace('-', '_'),
        entry: resolve(process.cwd(), `plugins/${item.name}/${file.name}`),
        outJsFileName: `${item.name}.min.js`,
        outCssFileName: `${item.name}`
      });
    }
  });
}

function buildPlugin(item) {
  return build({
    build: {
      emptyOutDir: false,
      copyPublicDir: false,
      outDir: `dist/plugins/${item.name}`,
      sourcemap: true,
      lib: {
        entry: item.entry,
        name: item.name,
        formats: ['iife'],
        fileName: () => item.outJsFileName,
        cssFileName: item.outCssFileName,
      }
    }
  });
}

async function autoConfigurePlugins() {

  const indexHtml = resolve(process.cwd(), "dist/index.html");
  const pluginsMain = resolve(process.cwd(), "plugins/main.js");

  const indexHtmlText = await readFile(indexHtml, 'utf8');
  const pluginsMainText = await readFile(pluginsMain, 'utf8');

  const plugins = [];

  entries.forEach(entry => {

    const str = pluginsMainText.replace(/[\r\n\t]/g, '');
    const reg = new RegExp(`new ${entry.name}\\(([^)]*)`);
    let settings = "{}";

    const result = reg.exec(str);
    if (result && result[1]) {
      settings = result[1];
    }

    plugins.push(`<script src="plugins/${entry.name}/${entry.outJsFileName}"></script>`);
    plugins.push(`<script>new ${entry.name}(${settings})</script>`);
    plugins.push(`<link rel='stylesheet' href="plugins/${entry.name}/${entry.outCssFileName}.css"></script>`);
  });

  const html = indexHtmlText.replace('<!-- plugins -->', plugins.join('\r\n\t'));
  const result = await writeFile(indexHtml, html, 'utf8');
}

if (entries.length > 0) {
  for (const entry of entries) {
    await buildPlugin(entry);
  }
  await autoConfigurePlugins();
}