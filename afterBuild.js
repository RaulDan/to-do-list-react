
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const buildDir = path.join(__dirname, 'build');
const html = fs.readFileSync(
    path.join(buildDir, 'index.html'),
    'utf8'
);

// Extract HTML attributes regardless of their order
function attribute(tag, name) {
    const pattern = new RegExp(
        `(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
        'i'
    );

    const match = tag.match(pattern);
    return match ? (match[1] ?? match[2] ?? match[3]) : null;
}

// Extract CSS files from stylesheet links
const cssFiles = [...html.matchAll(/<link\b[^>]*>/gi)]
    .map(([tag]) => tag)
    .filter(tag =>
        /\bstylesheet\b/i.test(attribute(tag, 'rel') || '')
    )
    .map(tag => attribute(tag, 'href'))
    .filter(Boolean);

// Extract JS entry-point files
const jsFiles = [...html.matchAll(/<script\b[^>]*>/gi)]
    .map(([tag]) => attribute(tag, 'src'))
    .filter(Boolean);

if (jsFiles.length === 0) {
    throw new Error(
        'No JavaScript files found in build/index.html'
    );
}

// Generate the JavaScript loader
const indexJS = `(function () {
  'use strict';

  var loaderScript = document.currentScript;

  if (!loaderScript || !loaderScript.src) {
    console.error('Unable to determine React loader URL.');
    return;
  }

  var baseUrl = new URL('.', loaderScript.src);
  var cssFiles = ${JSON.stringify(cssFiles)};
  var jsFiles = ${JSON.stringify(jsFiles)};

  function assetUrl(file) {
    // Resolve assets relative to index.js
    var staticIndex = file.indexOf('/static/');

    var relativePath = staticIndex >= 0
      ? file.slice(staticIndex + 1)
      : file.replace(/^\\/+/, '');

    return new URL(relativePath, baseUrl).href;
  }

  function loadScript(index) {
    if (index >= jsFiles.length) return;

    var script = document.createElement('script');

    script.src = assetUrl(jsFiles[index]);
    script.async = false;

    script.onload = function () {
      loadScript(index + 1);
    };

    script.onerror = function () {
      console.error('Failed to load React script:', script.src);
    };

    document.head.appendChild(script);
  }

  function startReact() {
    // React requires a root element
    if (!document.getElementById('root')) {
      var root = document.createElement('div');
      root.id = 'root';
      document.body.appendChild(root);
    }

    // Inject stylesheet links
    cssFiles.forEach(function (file) {
      var link = document.createElement('link');

      link.rel = 'stylesheet';
      link.href = assetUrl(file);

      document.head.appendChild(link);
    });

    // Inject the entry-point JS files
    loadScript(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      startReact,
      { once: true }
    );
  } else {
    startReact();
  }
})();`;

fs.writeFileSync(
    path.join(buildDir, 'index.js'),
    indexJS,
    'utf8'
);

// Gzip generated CSS and JavaScript files recursively
function gzipAssets(dir) {
    for (const entry of fs.readdirSync(dir, {
        withFileTypes: true
    })) {
        const filePath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            gzipAssets(filePath);
        } else if (
            entry.isFile() &&
            /\.(?:css|js)$/i.test(entry.name)
        ) {
            const buffer = zlib.gzipSync(
                fs.readFileSync(filePath)
            );

            fs.writeFileSync(`${filePath}.gz`, buffer);
        }
    }
}

gzipAssets(buildDir);

console.log(
    'Generated build/index.js and compressed CSS/JS files.'
);
