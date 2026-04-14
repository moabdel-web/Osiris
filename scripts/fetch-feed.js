/**
 * Fetch Instagram Feed
 *
 * Usage:
 *   node scripts/fetch-feed.js bloodyosiris
 *   node scripts/fetch-feed.js bloodyosiris 20    (fetch 20 images)
 *
 * Downloads the latest public posts from an Instagram profile
 * and saves them as numbered JPGs in /public/feed/
 *
 * Also updates REAL_IMAGE_COUNT in FeedGrid.tsx automatically.
 */

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

const username = process.argv[2] || "bloodyosiris";
const maxImages = parseInt(process.argv[3]) || 12;
const feedDir = path.join(__dirname, "..", "public", "feed");
const feedGridPath = path.join(__dirname, "..", "src", "components", "FeedGrid.tsx");

// Ensure feed directory exists
if (!fs.existsSync(feedDir)) fs.mkdirSync(feedDir, { recursive: true });

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function main() {
  console.log(`Fetching @${username} feed (up to ${maxImages} images)...\n`);

  // Method 1: Try the public profile JSON endpoint
  let imageUrls = [];

  try {
    const profileUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
    const data = await fetchUrl(profileUrl);
    const json = JSON.parse(data.toString());
    const edges = json?.data?.user?.edge_owner_to_timeline_media?.edges || [];
    imageUrls = edges.slice(0, maxImages).map((e) => e.node.display_url || e.node.thumbnail_src);
    console.log(`Found ${imageUrls.length} posts via API`);
  } catch (e) {
    console.log("API method failed, trying page scrape...");
  }

  // Method 2: Try scraping the public page for _sharedData
  if (imageUrls.length === 0) {
    try {
      const pageData = await fetchUrl(`https://www.instagram.com/${username}/`);
      const html = pageData.toString();

      // Try to find image URLs in the page source
      const imgRegex = /https:\/\/[^"'\s]*?instagram[^"'\s]*?\.jpg[^"'\s]*/g;
      const matches = [...new Set(html.match(imgRegex) || [])];
      // Filter to likely post images (contain scontent)
      imageUrls = matches
        .filter((u) => u.includes("scontent") && !u.includes("150x150"))
        .slice(0, maxImages);
      console.log(`Found ${imageUrls.length} images via page scrape`);
    } catch (e) {
      console.log("Page scrape also failed:", e.message);
    }
  }

  // Method 3: If nothing works, check if user provided a URLs file
  if (imageUrls.length === 0) {
    const urlsFile = path.join(__dirname, "urls.txt");
    if (fs.existsSync(urlsFile)) {
      imageUrls = fs.readFileSync(urlsFile, "utf-8")
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("#"));
      console.log(`Loaded ${imageUrls.length} URLs from scripts/urls.txt`);
    } else {
      console.log(`\nCouldn't auto-fetch. Create scripts/urls.txt with image URLs (one per line).`);
      console.log(`You can get these by:`);
      console.log(`  1. Go to instagram.com/${username}`);
      console.log(`  2. Right-click each image → "Copy image address"`);
      console.log(`  3. Paste into scripts/urls.txt\n`);
      console.log(`Or paste direct image/photo URLs from anywhere.\n`);

      // Write template
      fs.writeFileSync(urlsFile, `# Paste image URLs here, one per line\n# Then run: node scripts/fetch-feed.js\n`);
      console.log(`Created scripts/urls.txt — fill it in and re-run.`);
      return;
    }
  }

  if (imageUrls.length === 0) {
    console.log("No images found. Exiting.");
    return;
  }

  // Clear old feed images
  const existing = fs.readdirSync(feedDir).filter((f) => f.match(/^\d{3}\.(jpg|png)$/));
  existing.forEach((f) => fs.unlinkSync(path.join(feedDir, f)));
  console.log(`Cleared ${existing.length} old images`);

  // Download all
  let downloaded = 0;
  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    const num = String(i + 1).padStart(3, "0");
    const ext = url.includes(".png") ? "png" : "jpg";
    const outPath = path.join(feedDir, `${num}.${ext}`);

    try {
      const data = await fetchUrl(url);
      fs.writeFileSync(outPath, data);
      downloaded++;
      console.log(`  ✓ ${num}.${ext} (${(data.length / 1024).toFixed(0)} KB)`);
    } catch (e) {
      console.log(`  ✗ ${num} failed: ${e.message}`);
    }
  }

  console.log(`\nDownloaded ${downloaded} images to public/feed/`);

  // Update REAL_IMAGE_COUNT in FeedGrid.tsx
  if (fs.existsSync(feedGridPath)) {
    let code = fs.readFileSync(feedGridPath, "utf-8");
    const updated = code.replace(
      /const REAL_IMAGE_COUNT = \d+;/,
      `const REAL_IMAGE_COUNT = ${downloaded};`
    );
    if (updated !== code) {
      fs.writeFileSync(feedGridPath, updated);
      console.log(`Updated REAL_IMAGE_COUNT to ${downloaded} in FeedGrid.tsx`);
    }
  }

  console.log("\nDone! Restart the dev server to see changes.");
}

main().catch(console.error);
