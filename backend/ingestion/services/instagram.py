"""
ingestion/services/instagram.py

Normalizes raw Instagram scraper output into pipeline-compatible rows.
Also extracts engagement data per post for upsert_engaged_post().
"""

from typing import List, Dict, Tuple


def normalize_instagram_data(
    raw_rows: List[Dict],
) -> Tuple[List[Dict], List[Dict]]:
    """
    Returns:
        comment_rows  — list of post rows for upsert_post()
        engaged_posts — list of engagement rows for upsert_engaged_post()

    Input rows come from fetch_instagram_comments() and each may contain
    a '_engagement' key with {url, platform, like_count, comment_count, ...}.
    We deduplicate engaged_posts by URL since multiple comments share one post.
    """
    comment_rows: List[Dict] = []
    engaged_posts: List[Dict] = []
    seen_urls: set = set()

    for row in raw_rows:
        text = (row.get("text") or "").strip()
        if not text or len(text) < 3:
            continue

        external_id = row.get("external_id")
        if not external_id:
            continue

        comment_rows.append({
            "text": text,
            "source": "instagram",
            "platform": "social",
            "external_id": external_id,
            "url": row.get("url", ""),
            "author": row.get("author") or "",
        })

        # Collect engagement — one row per unique post URL
        eng = row.get("_engagement")
        if eng:
            url = eng.get("url")
            if url and url not in seen_urls:
                seen_urls.add(url)
                engaged_posts.append({
                    "url": url,
                    "platform": "instagram",
                    "title": eng.get("title", ""),
                    "like_count": eng.get("like_count"),
                    "share_count": None,
                    "comment_count": eng.get("comment_count"),
                    "view_count": None,
                })

    return comment_rows, engaged_posts