"""
Instagram Feed Sync — downloads latest posts from a public profile.

Usage:
  python scripts/sync-instagram.py                    # default: bloodyosiris, 12 posts
  python scripts/sync-instagram.py bloodyosiris 20    # custom count
"""

import sys
import os
import shutil
import glob
import instaloader

USERNAME = sys.argv[1] if len(sys.argv) > 1 else "bloodyosiris"
MAX_POSTS = int(sys.argv[2]) if len(sys.argv) > 2 else 12

FEED_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "feed")
FEEDGRID_PATH = os.path.join(os.path.dirname(__file__), "..", "src", "components", "FeedGrid.tsx")
TEMP_DIR = os.path.join(os.path.dirname(__file__), "..", ".insta-temp")

def main():
    print(f"Syncing @{USERNAME} — fetching up to {MAX_POSTS} posts...\n")

    # Setup instaloader — no login needed for public profiles
    L = instaloader.Instaloader(
        download_videos=False,
        download_video_thumbnails=False,
        download_geotags=False,
        download_comments=False,
        save_metadata=False,
        compress_json=False,
        post_metadata_txt_pattern="",
    )

    # Clean temp dir
    if os.path.exists(TEMP_DIR):
        shutil.rmtree(TEMP_DIR)
    os.makedirs(TEMP_DIR, exist_ok=True)

    # Fetch profile
    try:
        profile = instaloader.Profile.from_username(L.context, USERNAME)
    except Exception as e:
        print(f"Error fetching profile: {e}")
        sys.exit(1)

    print(f"Found @{profile.username} — {profile.mediacount} posts, {profile.followers} followers\n")

    # Download posts
    downloaded = []
    for i, post in enumerate(profile.get_posts()):
        if i >= MAX_POSTS:
            break

        # Download to temp dir
        try:
            L.download_post(post, target=TEMP_DIR)
            # Find the downloaded image (largest jpg/png)
            images = glob.glob(os.path.join(TEMP_DIR, "*.jpg")) + glob.glob(os.path.join(TEMP_DIR, "*.png"))
            if images:
                # Sort by modification time, newest first
                images.sort(key=os.path.getmtime, reverse=True)
                downloaded.append(images[0])
                print(f"  ✓ Post {i+1}/{MAX_POSTS} — {os.path.basename(images[0])}")
        except Exception as e:
            print(f"  ✗ Post {i+1} failed: {e}")

    if not downloaded:
        print("\nNo images downloaded. The profile may be private.")
        shutil.rmtree(TEMP_DIR, ignore_errors=True)
        sys.exit(1)

    # Clear old feed images
    os.makedirs(FEED_DIR, exist_ok=True)
    for f in glob.glob(os.path.join(FEED_DIR, "[0-9][0-9][0-9].*")):
        os.remove(f)
    print(f"\nCleared old feed images")

    # Move and rename
    count = 0
    for i, src in enumerate(downloaded):
        ext = os.path.splitext(src)[1]
        dst = os.path.join(FEED_DIR, f"{i+1:03d}{ext}")
        shutil.copy2(src, dst)
        size_kb = os.path.getsize(dst) // 1024
        print(f"  → {i+1:03d}{ext} ({size_kb} KB)")
        count += 1

    # Cleanup temp
    shutil.rmtree(TEMP_DIR, ignore_errors=True)

    # Update REAL_IMAGE_COUNT in FeedGrid.tsx
    if os.path.exists(FEEDGRID_PATH):
        with open(FEEDGRID_PATH, "r") as f:
            code = f.read()
        import re
        updated = re.sub(
            r"const REAL_IMAGE_COUNT = \d+;",
            f"const REAL_IMAGE_COUNT = {count};",
            code,
        )
        if updated != code:
            with open(FEEDGRID_PATH, "w") as f:
                f.write(updated)
            print(f"\nUpdated REAL_IMAGE_COUNT to {count} in FeedGrid.tsx")

    print(f"\n✅ Done! {count} images synced to public/feed/")
    print("Restart the dev server to see changes.")

if __name__ == "__main__":
    main()
