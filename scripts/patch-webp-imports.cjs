/**
 * Patches all TSX/JSX files to use <WebPImg> instead of raw <img>
 * for local /images/ paths. Adds the import automatically.
 *
 * Run: node scripts/patch-webp-imports.cjs
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const srcDir = path.resolve(__dirname, '..', 'src');
const IMPORT_LINE = "import { WebPImg } from '../lib/webp';";
const IMPORT_LINE_DEEP = "import { WebPImg } from '../../lib/webp';";

// Files to patch and their relative depth from src/
const files = [
  { file: 'components/Features.tsx',           depth: 1 },
  { file: 'components/Testimonials.tsx',       depth: 1 },
  { file: 'components/PackagesGrid.tsx',       depth: 1 },
  { file: 'components/MbbsWalaTools.tsx',      depth: 1 },
  { file: 'components/HorizontalStory.tsx',    depth: 1 },
  { file: 'components/FinalCTA.tsx',           depth: 1 },
  { file: 'components/Explainer.tsx',          depth: 1 },
  { file: 'components/PremiumLoader.tsx',      depth: 1 },
  { file: 'components/StoryScroll.tsx',        depth: 1 },
  { file: 'components/AppPromo.tsx',           depth: 1 },
  { file: 'pages/Login.tsx',                   depth: 1 },
  { file: 'pages/About.tsx',                   depth: 1 },
];

let totalPatched = 0;
let totalSkipped = 0;

for (const { file, depth } of files) {
  const fullPath = path.join(srcDir, file);
  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠ Not found: ${file}`);
    continue;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // Check if there are any local image refs we'd need to change
  const hasLocalImages = /src=\{?['"`]\/images\/[^'">`]+\.(jpg|jpeg|png)/i.test(content) ||
                         /image:\s*['"]\/images\/[^'"]+\.(jpg|jpeg|png)/i.test(content);

  if (!hasLocalImages) {
    console.log(`  ⏭ Skip (no local images): ${file}`);
    totalSkipped++;
    continue;
  }

  // Already patched
  if (content.includes('WebPImg') || content.includes("from '../lib/webp'") || content.includes("from '../../lib/webp'")) {
    console.log(`  ⏭ Skip (already patched): ${file}`);
    totalSkipped++;
    continue;
  }

  const importLine = depth === 1 ? IMPORT_LINE : IMPORT_LINE_DEEP;

  // Replace <img ... src="..." /> with <WebPImg ... src="..." />
  // Only for local /images/ paths — be conservative
  let patched = content;

  // Pattern: <img followed eventually by src="/images/... and closing />
  // We replace the opening tag <img with <WebPImg and the closing /> remains
  // Use a multi-pass approach for safety

  // Replace direct <img src="/images/... patterns
  patched = patched.replace(
    /(<)img(\s[^>]*?src=(?:["'])?\/images\/[^>]*?>)/gs,
    '$1WebPImg$2'
  );

  if (patched === content) {
    console.log(`  ⏭ Skip (pattern not matched): ${file}`);
    totalSkipped++;
    continue;
  }

  // Add import after the last existing import line
  const lastImportIdx = patched.lastIndexOf('\nimport ');
  const insertAfter = patched.indexOf('\n', lastImportIdx + 1);
  if (insertAfter > 0) {
    patched = patched.slice(0, insertAfter + 1) + importLine + '\n' + patched.slice(insertAfter + 1);
  }

  fs.writeFileSync(fullPath, patched, 'utf8');
  console.log(`  ✅ Patched: ${file}`);
  totalPatched++;
}

console.log(`\nDone! Patched: ${totalPatched}, Skipped: ${totalSkipped}`);
