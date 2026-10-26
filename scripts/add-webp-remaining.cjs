const fs = require('fs');

const fixes = [
  'src/components/AppPromo.tsx',
  'src/components/Explainer.tsx',
  'src/components/FinalCTA.tsx',
  'src/pages/About.tsx',
];

const IMPORT = "import { WebPImg } from '../lib/webp';";

for (const file of fixes) {
  if (!fs.existsSync(file)) { console.log('Not found:', file); continue; }
  let c = fs.readFileSync(file, 'utf8');
  if (c.includes('WebPImg')) { console.log('Already done:', file); continue; }

  // Add import after the last import line
  const lastImportEnd = (() => {
    let last = -1;
    let pos = 0;
    while (true) {
      const idx = c.indexOf('\nimport ', pos);
      if (idx === -1) break;
      last = idx;
      pos = idx + 1;
    }
    return last === -1 ? -1 : c.indexOf('\n', last + 1);
  })();

  if (lastImportEnd > 0) {
    c = c.slice(0, lastImportEnd + 1) + IMPORT + '\n' + c.slice(lastImportEnd + 1);
  }

  // Replace every <img ... src="/images/... /> with <WebPImg ... />
  // Handle both single-line and multi-line img tags
  c = c.replace(/<img(\s)/g, (match, ws, offset) => {
    // Look ahead to find the src attribute
    const slice = c.slice(offset);
    if (/src=["'][/]images[/]/.test(slice.slice(0, 500))) {
      return '<WebPImg' + ws;
    }
    return match;
  });

  fs.writeFileSync(file, c, 'utf8');
  console.log('Patched:', file);
}
console.log('Done.');
