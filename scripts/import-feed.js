/**
 * Import Feed Images
 *
 * Drop any images into /public/feed/drop/ then run:
 *   node scripts/import-feed.js
 *
 * It will:
 *   1. Find all images in the drop folder (jpg, jpeg, png, webp)
 *   2. Clear old numbered feed images
 *   3. Rename and move them to /public/feed/ as 001.jpg, 002.jpg, etc.
 *   4. Update REAL_IMAGE_COUNT in FeedGrid.tsx
 *   5. Empty the drop folder
 */

const fs = require("fs");
const path = require("path");

const dropDir = path.join(__dirname, "..", "public", "feed", "drop");
const feedDir = path.join(__dirname, "..", "public", "feed");
const feedGridPath = path.join(__dirname, "..", "src", "components", "FeedGrid.tsx");

// Supported image extensions
const IMG_EXTS = [".jpg", ".jpeg", ".png", ".webp"];

function main() {
  // Ensure drop dir exists
  if (!fs.existsSync(dropDir)) {
    fs.mkdirSync(dropDir, { recursive: true });
    console.log("Created /public/feed/drop/ — drop your images there and re-run.");
    return;
  }

  // Find all images in drop folder
  const files = fs.readdirSync(dropDir)
    .filter(f => IMG_EXTS.includes(path.extname(f).toLowerCase()))
    .sort();

  if (files.length === 0) {
    console.log("No images found in /public/feed/drop/");
    console.log("Drop your images there and re-run this script.");
    return;
  }

  console.log(`Found ${files.length} images in drop folder\n`);

  // Clear old numbered feed images (but not the drop folder)
  const oldFiles = fs.readdirSync(feedDir)
    .filter(f => f.match(/^\d{3}\.(jpg|jpeg|png|webp)$/i));
  oldFiles.forEach(f => fs.unlinkSync(path.join(feedDir, f)));
  console.log(`Cleared ${oldFiles.length} old feed images`);

  // Move and rename
  let count = 0;
  for (const file of files) {
    count++;
    const num = String(count).padStart(3, "0");
    const ext = path.extname(file).toLowerCase() === ".jpeg" ? ".jpg" : path.extname(file).toLowerCase();
    const dest = path.join(feedDir, `${num}${ext}`);

    fs.copyFileSync(path.join(dropDir, file), dest);
    const sizeKb = Math.round(fs.statSync(dest).size / 1024);
    console.log(`  ${file} → ${num}${ext} (${sizeKb} KB)`);
  }

  // Clean drop folder
  files.forEach(f => fs.unlinkSync(path.join(dropDir, f)));
  console.log(`\nCleared drop folder`);

  // Update REAL_IMAGE_COUNT in FeedGrid.tsx
  if (fs.existsSync(feedGridPath)) {
    let code = fs.readFileSync(feedGridPath, "utf-8");
    const updated = code.replace(
      /const REAL_IMAGE_COUNT = \d+;/,
      `const REAL_IMAGE_COUNT = ${count};`
    );
    if (updated !== code) {
      fs.writeFileSync(feedGridPath, updated);
      console.log(`Updated REAL_IMAGE_COUNT to ${count}`);
    }
  }

  console.log(`\n✅ ${count} images imported. Refresh the site to see them.`);
}

main();
