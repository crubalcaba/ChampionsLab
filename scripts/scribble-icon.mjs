// One-off script: scribbles "Not exactly" graffiti on the top of each icon.
// Run with: node scripts/scribble-icon.mjs
//
// Uses `sharp` (already a transitive dep via Next) + an inline SVG overlay.
// Style: bold italic Impact / Arial Black, thick black stroke, hot-pink fill,
// slight rotation, drop shadow. Positioned in the upper 25% so the existing
// glyphs on the lower half of the logo remain untouched.

import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");

const TARGETS = [
  "public/logo.png",
  "public/icon-512.png",
  "public/icon-192.png",
  "public/apple-touch-icon.png",
];

const TEXT = "Not exactly";

function buildSvg(width, height) {
  // Sizing relative to width so it scales across the four resolutions.
  const fontSize = Math.round(width * 0.12);
  const stroke = Math.max(2, Math.round(fontSize * 0.10));
  const y = Math.round(height * 0.18);
  const cx = width / 2;
  const rotation = -6; // slight tilt, handwritten vibe
  const blur = Math.max(1, Math.round(fontSize * 0.05));
  const dx = Math.max(1, Math.round(fontSize * 0.05));
  const dy = Math.max(1, Math.round(fontSize * 0.07));

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="${blur}"/>
      <feOffset dx="${dx}" dy="${dy}" result="off"/>
      <feFlood flood-color="#000" flood-opacity="0.55"/>
      <feComposite in2="off" operator="in" result="shadow"/>
      <feMerge>
        <feMergeNode in="shadow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <g transform="rotate(${rotation} ${cx} ${y})" filter="url(#shadow)">
    <text x="${cx}" y="${y}" text-anchor="middle"
          font-family="'Segoe Print', cursive"
          font-style="italic" font-weight="700"
          font-size="${fontSize}"
          fill="#ff2dd1"
          stroke="#000" stroke-width="${stroke}" stroke-linejoin="round"
          paint-order="stroke fill"
          style="letter-spacing:0">${TEXT}</text>
  </g>
</svg>`.trim();
}

for (const rel of TARGETS) {
  const abs = join(PROJECT_ROOT, rel);
  const img = sharp(abs);
  const meta = await img.metadata();
  const W = meta.width;
  const H = meta.height;

  const svg = buildSvg(W, H);

  const out = await sharp(abs)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();

  await writeFile(abs, out);
  console.log(`✓ ${rel}: ${W}x${H} (${(out.length / 1024).toFixed(0)} KB)`);
}



