import { defineConfig } from 'vite';
import { copyFileSync, cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function copyPwaFiles() {
  return {
    name: 'copy-pwa-runtime-files',
    apply: 'build',
    closeBundle() {
      const output = path.join(projectRoot, 'js', 'dist');
      mkdirSync(path.join(output, 'js'), { recursive: true });
      copyFileSync(path.join(projectRoot, 'sw.js'), path.join(output, 'sw.js'));
      copyFileSync(path.join(projectRoot, 'js', 'manifest.json'), path.join(output, 'manifest.json'));
      copyFileSync(path.join(projectRoot, 'js', 'categories.json'), path.join(output, 'js', 'categories.json'));
      cpSync(path.join(projectRoot, 'css'), path.join(output, 'css'), { recursive: true });
      copyFileSync(path.join(projectRoot, 'js', 'pwa-store.js'), path.join(output, 'js', 'pwa-store.js'));
      cpSync(path.join(projectRoot, 'js', 'icons'), path.join(output, 'icons'), { recursive: true });
      cpSync(path.join(projectRoot, 'js', 'icons'), path.join(output, 'js', 'icons'), { recursive: true });
      copyFileSync(path.join(projectRoot, 'js', 'manifest.json'), path.join(output, 'js', 'manifest.json'));

      // El bundle IIFE se carga como script clásico para permitir doble clic/file://, tras jQuery y con el DOM completo.
      const htmlPath = path.join(output, 'index.html');
      let builtHtml = readFileSync(htmlPath, 'utf8');
      const styleLinks = '<link rel="stylesheet" href="./css/style.css?v=10">\n<link rel="stylesheet" href="./css/responsive.css?v=11">\n<link rel="stylesheet" href="./css/animations.css">';
      builtHtml = builtHtml.replace('</head>', styleLinks + '\n</head>');
      const moduleScript = builtHtml.match(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/);
      if (moduleScript) {
        builtHtml = builtHtml.replace(moduleScript[0], '');
        builtHtml = builtHtml.replace(
          "document.documentElement.classList.add('file-preview');",
          "document.documentElement.classList.add('file-app');"
        );
        const categoryJson = JSON.stringify(JSON.parse(readFileSync(path.join(projectRoot, 'js', 'categories.json'), 'utf8'))).replace(/</g, '\\u003c');
        const fallback = '<script id="categoryDataFallback" type="application/json">' + categoryJson + '</script>\n';
        builtHtml = builtHtml.replace('</body>', fallback + '<script src="' + moduleScript[1] + '"></script>\n</body>');
        writeFileSync(htmlPath, builtHtml, 'utf8');
      }

      // Vite coloca el manifiesto enlazado dentro de assets/; corrige allí las rutas relativas.
      const assetManifestPath = path.join(output, 'assets', 'manifest.json');
      const assetManifest = JSON.parse(readFileSync(assetManifestPath, 'utf8'));
      assetManifest.id = '../index.html';
      assetManifest.start_url = '../index.html';
      assetManifest.scope = '../';
      assetManifest.icons = assetManifest.icons.map(function (icon) {
        return Object.assign({}, icon, { src: icon.src.replace(/^\.\/icons\//, '../icons/') });
      });
      writeFileSync(assetManifestPath, JSON.stringify(assetManifest, null, 2));
    }
  };
}

export default defineConfig({
  base: './',
  build: {
    outDir: path.join(projectRoot, 'js', 'dist'),
    emptyOutDir: true,
    target: 'es2020',
    cssMinify: true,
    modulePreload: false,
    rollupOptions: {
      input: path.join(projectRoot, 'index.html'),
      output: {
        format: 'iife',
        name: 'AlejandraSpace',
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        // Nombre versionado para que los navegadores y el Service Worker descarten el CSS anterior tras cambios visuales.
        assetFileNames: function (assetInfo) {
          return assetInfo.name && assetInfo.name.endsWith('.css')
            ? 'assets/[name]-v16[extname]'
            : 'assets/[name][extname]';
        }
      }
    }
  },
  plugins: [copyPwaFiles()]
});
