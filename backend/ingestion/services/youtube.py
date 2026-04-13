"""YouTube Data API v3 — video search + comment threads (official API only)."""

from __future__ import annotations

import logging
from typing import Any
from urllib.parse import urlencode

import requests

from posts.models import Post

logger = logging.getLogger(__name__)

SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
COMMENTS_URL = "https://www.googleapis.com/youtube/v3/commentThreads"


def fetch_youtube_comments(
    *,
    api_key: str,
    keywords: list[str],
    max_videos_per_keyword: int = 5,
    max_comments_per_video: int = 50,
    timeout: int = 30,
) -> list[dict[str, Any]]:
    if not api_key or not keywords:
        return []

    rows: list[dict[str, Any]] = []
    session = requests.Session()

    for keyword in keywords:
        kw = keyword.strip()
        if not kw:
            continue

        search_params = urlencode(
            {
                "part": "snippet",
                "type": "video",
                "q": kw,
                "maxResults": min(max_videos_per_keyword, 50),
                "key": api_key,
            }
        )
        try:
            r = session.get(f"{SEARCH_URL}?{search_params}", timeout=timeout)
            r.raise_for_status()
            search_data = r.json()
        except (requests.RequestException, ValueError) as exc:
            logger.warning("YouTube search failed for %r: %s", kw, exc)
            continue

        items = search_data.get("items") or []
        video_ids: list[str] = []
        for it in items:
            vid = (it.get("id") or {}).get("videoId")
            if vid:
                video_ids.append(vid)

        for video_id in video_ids:
            next_token = None
            fetched = 0
            while fetched < max_comments_per_video:
                page_size = min(100, max_comments_per_video - fetched)
                params = {
                    "part": "snippet",
                    "videoId": video_id,
                    "maxResults": page_size,
                    "textFormat": "plainText",
                    "key": api_key,
                }
                if next_token:
                    params["pageToken"] = next_token
                q = urlencode(params)
                try:
                    cr = session.get(f"{COMMENTS_URL}?{q}", timeout=timeout)
                    cr.raise_for_status()
                    cdata = cr.json()
                except (requests.RequestException, ValueError) as exc:
                    logger.warning(
                        "YouTube comments failed video=%s: %s", video_id, exc
                    )
                    break

                for thread in cdata.get("items") or []:
                    top = (thread.get("snippet") or {}).get("topLevelComment") or {}
                    tid = top.get("id")
                    sn = top.get("snippet") or {}
                    text = (sn.get("textDisplay") or sn.get("textOriginal") or "").strip()
                    author = (sn.get("authorDisplayName") or "").strip() or None
                    if not tid or not text:
                        continue
                    video_url = f"https://www.youtube.com/watch?v={video_id}"
                    rows.append(
                        {
                            "text": text[:100000],
                            "source": Post.Source.YOUTUBE,
                            "platform": Post.Platform.SOCIAL,
                            "external_id": f"youtube:{tid}"[:512],
                            "url": video_url,
                            "author": author,
                        }
                    )
                    fetched += 1
                    if fetched >= max_comments_per_video:
                        break

                next_token = cdata.get("nextPageToken")
                if not next_token:
                    break

    return rows
