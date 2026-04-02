/**
 * generate-images.js
 * Procedural image generator for MURD333R.FM / Bloody Osiris
 * Dark Y2K archive aesthetic — noise, geometry, red accents on black
 *
 * Uses sharp (bundled with Next.js) to compose raw pixel buffers + SVG overlays.
 */

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

// ── helpers ──────────────────────────────────────────────────────────────────

/** Seed-able PRNG (xorshift32) so runs are reproducible */
function prng(seed) {
  let s = seed | 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >> 17;
    s ^= s << 5;
    return ((s >>> 0) / 4294967296);
  };
}

/** Generate a raw RGBA noise buffer with dark tones + optional colour tint */
function noiseBuffer(w, h, rand, tintR = 0, tintG = 0, tintB = 0, brightness = 30) {
  const buf = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const v = Math.floor(rand() * brightness);
    const off = i * 4;
    buf[off] = Math.min(255, v + Math.floor(rand() * tintR));
    buf[off + 1] = Math.min(255, v + Math.floor(rand() * tintG));
    buf[off + 2] = Math.min(255, v + Math.floor(rand() * tintB));
    buf[off + 3] = 255;
  }
  return buf;
}

/** Build an SVG string (sharp composites support SVG as overlay) */
function svg(w, h, body) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`
  );
}

// ── avatar generation (400x400 PNG) ─────────────────────────────────────────

async function generateAvatar(outPath) {
  const W = 400, H = 400;
  const rand = prng(333);

  // dark noise base with subtle red
  const base = noiseBuffer(W, H, rand, 25, 0, 0, 18);

  // radial vignette
  const vignette = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = (x - W / 2) / (W / 2);
      const dy = (y - H / 2) / (H / 2);
      const d = Math.sqrt(dx * dx + dy * dy);
      const alpha = Math.min(255, Math.floor(d * 200));
      const off = (y * W + x) * 4;
      vignette[off] = 0;
      vignette[off + 1] = 0;
      vignette[off + 2] = 0;
      vignette[off + 3] = alpha;
    }
  }

  // geometric crest SVG overlay
  const crestSvg = svg(W, H, `
    <defs>
      <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ff1a1a" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="#4a0000" stop-opacity="0.8"/>
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="4" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>

    <!-- outer diamond -->
    <polygon points="200,40 360,200 200,360 40,200" fill="none" stroke="#ff2222" stroke-width="2" opacity="0.6" filter="url(#glow)"/>
    <!-- inner diamond -->
    <polygon points="200,80 320,200 200,320 80,200" fill="none" stroke="#ff2222" stroke-width="1.5" opacity="0.4"/>
    <!-- cross lines -->
    <line x1="200" y1="60" x2="200" y2="340" stroke="#ff0a0a" stroke-width="1" opacity="0.3"/>
    <line x1="60" y1="200" x2="340" y2="200" stroke="#ff0a0a" stroke-width="1" opacity="0.3"/>

    <!-- inner circle -->
    <circle cx="200" cy="200" r="90" fill="none" stroke="url(#rg)" stroke-width="2.5" opacity="0.7" filter="url(#glow)"/>
    <circle cx="200" cy="200" r="70" fill="none" stroke="#ff2222" stroke-width="1" opacity="0.35"/>

    <!-- 333 text -->
    <text x="200" y="195" text-anchor="middle" font-family="'Courier New',monospace" font-size="64" font-weight="bold" fill="#ff1a1a" filter="url(#glow)" opacity="0.95">333</text>

    <!-- MURD333R.FM arc text approximation -->
    <text x="200" y="148" text-anchor="middle" font-family="'Arial Black',sans-serif" font-size="13" letter-spacing="6" fill="#ff3333" opacity="0.65">MURD333R</text>
    <text x="200" y="272" text-anchor="middle" font-family="'Arial Black',sans-serif" font-size="11" letter-spacing="8" fill="#ff3333" opacity="0.55">.FM</text>

    <!-- decorative corner ticks -->
    <line x1="50" y1="50" x2="80" y2="50" stroke="#ff2222" stroke-width="1" opacity="0.4"/>
    <line x1="50" y1="50" x2="50" y2="80" stroke="#ff2222" stroke-width="1" opacity="0.4"/>
    <line x1="350" y1="50" x2="320" y2="50" stroke="#ff2222" stroke-width="1" opacity="0.4"/>
    <line x1="350" y1="50" x2="350" y2="80" stroke="#ff2222" stroke-width="1" opacity="0.4"/>
    <line x1="50" y1="350" x2="80" y2="350" stroke="#ff2222" stroke-width="1" opacity="0.4"/>
    <line x1="50" y1="350" x2="50" y2="320" stroke="#ff2222" stroke-width="1" opacity="0.4"/>
    <line x1="350" y1="350" x2="320" y2="350" stroke="#ff2222" stroke-width="1" opacity="0.4"/>
    <line x1="350" y1="350" x2="350" y2="320" stroke="#ff2222" stroke-width="1" opacity="0.4"/>

    <!-- small decorative triangles -->
    <polygon points="200,55 205,65 195,65" fill="#ff2222" opacity="0.5"/>
    <polygon points="200,345 205,335 195,335" fill="#ff2222" opacity="0.5"/>
    <polygon points="55,200 65,195 65,205" fill="#ff2222" opacity="0.5"/>
    <polygon points="345,200 335,195 335,205" fill="#ff2222" opacity="0.5"/>
  `);

  // scanline overlay
  let scanlines = "";
  for (let y = 0; y < H; y += 4) {
    scanlines += `<rect x="0" y="${y}" width="${W}" height="1" fill="black" opacity="0.25"/>`;
  }
  const scanSvg = svg(W, H, scanlines);

  await sharp(base, { raw: { width: W, height: H, channels: 4 } })
    .composite([
      { input: vignette, raw: { width: W, height: H, channels: 4 }, blend: "over" },
      { input: crestSvg, blend: "over" },
      { input: scanSvg, blend: "over" },
    ])
    .png()
    .toFile(outPath);

  console.log(`  -> ${outPath}`);
}

// ── feed image generation (200x200 JPG) ─────────────────────────────────────

const FEED_THEMES = [
  { label: "ARCH1VE",   tint: [40, 0, 0],   br: 20, geo: "diag" },
  { label: "DRIP",      tint: [15, 5, 5],    br: 25, geo: "grid" },
  { label: "333",       tint: [50, 0, 5],    br: 15, geo: "circle" },
  { label: "BLOODY",    tint: [60, 0, 0],    br: 12, geo: "cross" },
  { label: "OSIRIS",    tint: [10, 10, 20],  br: 22, geo: "diamond" },
  { label: "RAGE",      tint: [45, 5, 0],    br: 18, geo: "bars" },
  { label: "VAULT",     tint: [5, 5, 15],    br: 28, geo: "triangle" },
  { label: "MURD333R",  tint: [35, 0, 0],    br: 16, geo: "frame" },
  { label: "FM.LIVE",   tint: [20, 0, 10],   br: 24, geo: "zigzag" },
  { label: "DEADSTOCK", tint: [8, 8, 8],     br: 30, geo: "dots" },
  { label: "HEAT",      tint: [55, 10, 0],   br: 14, geo: "slash" },
  { label: "GRAIL",     tint: [30, 0, 15],   br: 20, geo: "hex" },
];

function geoSvg(type, W, H, rand) {
  let body = "";
  const cr = 150 + Math.floor(rand() * 105);
  const cg = Math.floor(rand() * 40);
  const cb = Math.floor(rand() * 40);
  function rgba(opacity) {
    return "rgba(" + cr + "," + cg + "," + cb + "," + opacity.toFixed(3) + ")";
  }
  switch (type) {
    case "diag":
      for (let i = -H; i < W + H; i += 12) {
        body += '<line x1="' + i + '" y1="0" x2="' + (i + H) + '" y2="' + H + '" stroke="' + rgba(0.15) + '" stroke-width="1"/>';
      }
      break;
    case "grid":
      for (let i = 0; i < W; i += 20) {
        body += '<line x1="' + i + '" y1="0" x2="' + i + '" y2="' + H + '" stroke="' + rgba(0.12) + '" stroke-width="0.5"/>';
        body += '<line x1="0" y1="' + i + '" x2="' + W + '" y2="' + i + '" stroke="' + rgba(0.12) + '" stroke-width="0.5"/>';
      }
      break;
    case "circle":
      for (let r = 15; r < 100; r += 15) {
        body += '<circle cx="100" cy="100" r="' + r + '" fill="none" stroke="' + rgba(0.08 + rand() * 0.12) + '" stroke-width="1"/>';
      }
      break;
    case "cross":
      body += '<line x1="0" y1="0" x2="' + W + '" y2="' + H + '" stroke="' + rgba(0.25) + '" stroke-width="2"/>';
      body += '<line x1="' + W + '" y1="0" x2="0" y2="' + H + '" stroke="' + rgba(0.25) + '" stroke-width="2"/>';
      body += '<line x1="' + (W / 2) + '" y1="0" x2="' + (W / 2) + '" y2="' + H + '" stroke="' + rgba(0.15) + '" stroke-width="1"/>';
      body += '<line x1="0" y1="' + (H / 2) + '" x2="' + W + '" y2="' + (H / 2) + '" stroke="' + rgba(0.15) + '" stroke-width="1"/>';
      break;
    case "diamond":
      body += '<polygon points="100,15 185,100 100,185 15,100" fill="none" stroke="' + rgba(0.3) + '" stroke-width="1.5"/>';
      body += '<polygon points="100,40 160,100 100,160 40,100" fill="none" stroke="' + rgba(0.2) + '" stroke-width="1"/>';
      break;
    case "bars":
      for (let y = 0; y < H; y += 8) {
        var w = 40 + rand() * 160;
        body += '<rect x="' + (rand() * (W - w)) + '" y="' + y + '" width="' + w + '" height="3" fill="' + rgba(0.08 + rand() * 0.15) + '" rx="1"/>';
      }
      break;
    case "triangle":
      body += '<polygon points="100,20 180,170 20,170" fill="none" stroke="' + rgba(0.3) + '" stroke-width="1.5"/>';
      body += '<polygon points="100,50 155,150 45,150" fill="none" stroke="' + rgba(0.2) + '" stroke-width="1"/>';
      break;
    case "frame":
      body += '<rect x="10" y="10" width="180" height="180" fill="none" stroke="' + rgba(0.25) + '" stroke-width="1.5"/>';
      body += '<rect x="25" y="25" width="150" height="150" fill="none" stroke="' + rgba(0.15) + '" stroke-width="1"/>';
      body += '<rect x="40" y="40" width="120" height="120" fill="none" stroke="' + rgba(0.1) + '" stroke-width="0.5"/>';
      break;
    case "zigzag": {
      let d = "M 0 100";
      for (let x = 0; x < W; x += 15) {
        var zy = 80 + (x % 30 === 0 ? -30 : 30) + rand() * 20;
        d += " L " + x + " " + zy;
      }
      body += '<path d="' + d + '" fill="none" stroke="' + rgba(0.2) + '" stroke-width="1.5"/>';
      let d2 = "M 0 140";
      for (let x = 0; x < W; x += 15) {
        var zy2 = 130 + (x % 30 === 0 ? 20 : -20) + rand() * 15;
        d2 += " L " + x + " " + zy2;
      }
      body += '<path d="' + d2 + '" fill="none" stroke="' + rgba(0.15) + '" stroke-width="1"/>';
      break;
    }
    case "dots":
      for (let i = 0; i < 60; i++) {
        var dx = rand() * W, dy = rand() * H, dr = 1 + rand() * 3;
        body += '<circle cx="' + dx + '" cy="' + dy + '" r="' + dr + '" fill="' + rgba(0.1 + rand() * 0.2) + '"/>';
      }
      break;
    case "slash":
      for (let i = 0; i < 8; i++) {
        var sx1 = rand() * W, sy1 = rand() * H;
        body += '<line x1="' + sx1 + '" y1="' + sy1 + '" x2="' + (sx1 + 40 + rand() * 60) + '" y2="' + (sy1 - 30 - rand() * 40) + '" stroke="' + rgba(0.15 + rand() * 0.15) + '" stroke-width="' + (1 + rand() * 2) + '"/>';
      }
      break;
    case "hex": {
      var hcx = 100, hcy = 100;
      for (let r = 25; r < 95; r += 22) {
        let pts = [];
        for (let a = 0; a < 6; a++) {
          var angle = (Math.PI / 3) * a - Math.PI / 2;
          pts.push((hcx + r * Math.cos(angle)) + "," + (hcy + r * Math.sin(angle)));
        }
        body += '<polygon points="' + pts.join(" ") + '" fill="none" stroke="' + rgba(0.1 + rand() * 0.15) + '" stroke-width="1"/>';
      }
      break;
    }
  }
  return body;
}

async function generateFeedImage(index, outPath) {
  const W = 200, H = 200;
  const theme = FEED_THEMES[index];
  const rand = prng(index * 7919 + 42);

  // noise base
  const base = noiseBuffer(W, H, rand, theme.tint[0], theme.tint[1], theme.tint[2], theme.br);

  // gradient overlay (vertical dark-to-transparent or vice versa)
  const gradDir = rand() > 0.5 ? "0%" : "100%";
  const gradSvg = svg(W, H, `
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="black" stop-opacity="${gradDir === "0%" ? 0.7 : 0.1}"/>
        <stop offset="100%" stop-color="black" stop-opacity="${gradDir === "0%" ? 0.1 : 0.7}"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
  `);

  // geometry
  const geoBody = geoSvg(theme.geo, W, H, rand);
  const geoOverlay = svg(W, H, geoBody);

  // text label
  const fontSize = theme.label.length > 7 ? 16 : 22;
  const textY = H / 2 + (rand() * 40 - 20);
  const textSvg = svg(W, H, `
    <defs>
      <filter id="tg">
        <feGaussianBlur stdDeviation="2" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>
    <text x="${W / 2}" y="${textY}" text-anchor="middle"
      font-family="'Courier New',monospace" font-size="${fontSize}" font-weight="bold"
      fill="#ff1a1a" opacity="0.7" filter="url(#tg)"
      letter-spacing="3">${theme.label}</text>
    <text x="${W / 2}" y="${textY + 20}" text-anchor="middle"
      font-family="'Courier New',monospace" font-size="9"
      fill="#ff3333" opacity="0.4"
      letter-spacing="2">${String(index + 1).padStart(3, "0")} / 012</text>
  `);

  // scanlines
  let scanBody = "";
  for (let y = 0; y < H; y += 3) {
    scanBody += `<rect x="0" y="${y}" width="${W}" height="1" fill="black" opacity="0.2"/>`;
  }
  const scanSvg = svg(W, H, scanBody);

  // corner marks
  const cornerSvg = svg(W, H, `
    <line x1="5" y1="5" x2="20" y2="5" stroke="#ff2222" stroke-width="0.8" opacity="0.4"/>
    <line x1="5" y1="5" x2="5" y2="20" stroke="#ff2222" stroke-width="0.8" opacity="0.4"/>
    <line x1="${W - 5}" y1="${H - 5}" x2="${W - 20}" y2="${H - 5}" stroke="#ff2222" stroke-width="0.8" opacity="0.4"/>
    <line x1="${W - 5}" y1="${H - 5}" x2="${W - 5}" y2="${H - 20}" stroke="#ff2222" stroke-width="0.8" opacity="0.4"/>
  `);

  await sharp(base, { raw: { width: W, height: H, channels: 4 } })
    .composite([
      { input: gradSvg, blend: "over" },
      { input: geoOverlay, blend: "over" },
      { input: textSvg, blend: "over" },
      { input: scanSvg, blend: "over" },
      { input: cornerSvg, blend: "over" },
    ])
    .jpeg({ quality: 88 })
    .toFile(outPath);

  console.log(`  -> ${outPath}`);
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const publicDir = path.resolve(__dirname, "..", "public");
  const feedDir = path.join(publicDir, "feed");

  fs.mkdirSync(feedDir, { recursive: true });

  console.log("Generating avatar...");
  await generateAvatar(path.join(publicDir, "avatar.png"));

  console.log("Generating feed images...");
  for (let i = 0; i < 12; i++) {
    const name = String(i + 1).padStart(3, "0") + ".jpg";
    await generateFeedImage(i, path.join(feedDir, name));
  }

  console.log("\nDone — 13 images generated.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
