/**
 * Image Optimization Script
 * Converts key images to WebP and compresses them.
 * Run: node scripts/optimize-images.mjs
 */
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const publicDir = resolve(root, 'public');

// Images that are actively used on the homepage and need optimization
const images = [
  // Logo (261KB PNG → WebP ~15-20KB)
  {
    src: 'images/mbbswala/logo-master.png',
    outputs: [
      { dest: 'images/mbbswala/logo-master.webp', width: 480, quality: 85, format: 'webp' },
      { dest: 'images/mbbswala/logo-master-sm.webp', width: 280, quality: 85, format: 'webp' },
    ],
  },
  // logo.png used as OG/footer logo
  {
    src: 'images/mbbswala/logo.png',
    outputs: [
      { dest: 'images/mbbswala/logo.webp', width: 540, quality: 85, format: 'webp' },
    ],
  },
  // Hero background (91KB jpg)
  {
    src: 'images/mbbswala/hero-warm.jpg',
    outputs: [
      { dest: 'images/mbbswala/hero-warm.webp', width: 1200, quality: 75, format: 'webp' },
      { dest: 'images/mbbswala/hero-warm-mobile.webp', width: 720, quality: 70, format: 'webp' },
    ],
  },
  // Support section images
  {
    src: 'images/india/doctors-group.jpg',
    outputs: [
      { dest: 'images/india/doctors-group.webp', width: 640, quality: 80, format: 'webp' },
    ],
  },
  {
    src: 'images/india/family-consult.jpg',
    outputs: [
      { dest: 'images/india/family-consult.webp', width: 640, quality: 80, format: 'webp' },
    ],
  },
  {
    src: 'images/india/counsel-meet.jpg',
    outputs: [
      { dest: 'images/india/counsel-meet.webp', width: 640, quality: 80, format: 'webp' },
    ],
  },
  // College images
  {
    src: 'images/india/college-1.jpg',
    outputs: [
      { dest: 'images/india/college-1.webp', width: 800, quality: 80, format: 'webp' },
    ],
  },
  {
    src: 'images/india/gmc.jpg',
    outputs: [
      { dest: 'images/india/gmc.webp', width: 800, quality: 80, format: 'webp' },
    ],
  },
];

let totalSaved = 0;

for (const image of images) {
  const srcPath = resolve(publicDir, image.src);
  if (!existsSync(srcPath)) {
    console.warn(`⚠ Source not found: ${image.src}`);
    continue;
  }

  for (const out of image.outputs) {
    const destPath = resolve(publicDir, out.dest);
    const destDir = dirname(destPath);
    if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });

    try {
      const pipeline = sharp(srcPath).resize({ width: out.width, withoutEnlargement: true });
      
      if (out.format === 'webp') {
        await pipeline.webp({ quality: out.quality, effort: 6 }).toFile(destPath);
      } else if (out.format === 'avif') {
        await pipeline.avif({ quality: out.quality, effort: 6 }).toFile(destPath);
      }

      // Get sizes for comparison
      const srcStat = (await import('fs')).statSync(srcPath);
      const destStat = (await import('fs')).statSync(destPath);
      const saved = srcStat.size - destStat.size;
      totalSaved += saved;
      
      console.log(
        `✅ ${image.src} → ${out.dest}` +
        `  (${(srcStat.size / 1024).toFixed(0)}KB → ${(destStat.size / 1024).toFixed(0)}KB, saved ${(saved / 1024).toFixed(0)}KB)`
      );
    } catch (err) {
      console.error(`✗ Failed ${image.src} → ${out.dest}:`, err.message);
    }
  }
}

console.log(`\n🎉 Total saved: ${(totalSaved / 1024).toFixed(0)} KB`);
