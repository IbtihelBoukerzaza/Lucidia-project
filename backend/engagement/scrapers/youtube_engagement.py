"""
engagement/scrapers/youtube_engagement.py

Scrapes engagement stats for a YouTube channel's recent videos
using the YouTube Data API v3 (no Playwright needed).

Flow:
    Channel URL → channel ID →
    channels.list(part="contentDetails") → uploads playlist ID →
    playlistItems.list(part="contentDetails") → video IDs →
    videos.list(part="statistics,snippet") → stats per video

Returns:
    list of dicts, one per video:
    {
        "url":           str,        # https://www.youtube.com/watch?v=<id>
        "title":         str,
        "like_count":    int | None,
        "comment_count": int | None,
        "view_count":    int | None,
        "share_count":   None,       # not available in YouTube Data API
    }
"""

from __future__ import annotations

import logging
import re
from typing import Any
from urllib.parse import urlparse, urlencode

import requests

logger = logging.getLogger(__name__)

BASE = "https://www.googleapis.com/youtube/v3"


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get(session: requests.Session, endpoint: str, params: dict, timeout: int = 30) -> dict:
    """GET a YouTube Data API endpoint, raise on HTTP error."""
    url = f"{BASE}/{endpoint}?{urlencode(params)}"
    r = session.get(url, timeout=timeout)
    r.raise_for_status()
    return r.json()


def _extract_channel_id(channel_url: str, api_key: str, session: requests.Session) -> str | None:
    """
    Derive a channel ID from various YouTube channel URL formats:

    - https://www.youtube.com/channel/UCxxxxxx          → direct ID
    - https://www.youtube.com/c/ChannelName             → resolve via API
    - https://www.youtube.com/@handle                   → resolve via API
    - https://www.youtube.com/user/Username             → resolve via API
    """
    path = urlparse(channel_url).path.rstrip("/")
    parts = path.split("/")  # ['', 'channel', 'UCxxxxxx']

    # Direct channel ID — starts with UC and is 24 chars
    if len(parts) >= 3 and parts[1] == "channel":
        candidate = parts[2]
        if re.match(r"^UC[\w-]{22}$", candidate):
            return candidate

    # Handle-based URL (@handle) or /c/ or /user/ — use search to resolve
    # Try the forHandle parameter first (new API, handles @handle)
    handle = None
    if len(parts) >= 2:
        segment = parts[-1]
        if segment.startswith("@"):
            handle = segment  # e.g. "@MobilisOfficielle"
        elif parts[1] in ("c", "user"):
            handle = segment  # e.g. "MobilisOfficielle"

    if handle:
        # forHandle works for @handle format; strip @ if needed for forUsername
        clean = handle.lstrip("@")
        # Try forHandle (works for @handles registered after 2022)
        try:
            data = _get(session, "channels", {
                "part": "id",
                "forHandle": handle if handle.startswith("@") else f"@{clean}",
                "key": api_key,
            })
            items = data.get("items") or []
            if items:
                return items[0]["id"]
        except Exception as exc:
            logger.debug("forHandle lookup failed for %s: %s", handle, exc)

        # Fallback: forUsername (legacy usernames)
        try:
            data = _get(session, "channels", {
                "part": "id",
                "forUsername": clean,
                "key": api_key,
            })
            items = data.get("items") or []
            if items:
                return items[0]["id"]
        except Exception as exc:
            logger.debug("forUsername lookup failed for %s: %s", clean, exc)

    logger.warning("youtube_engagement: could not resolve channel ID from URL %s", channel_url)
    return None


def _get_uploads_playlist_id(channel_id: str, api_key: str, session: requests.Session) -> str | None:
    """Return the uploads playlist ID for a channel."""
    try:
        data = _get(session, "channels", {
            "part": "contentDetails",
            "id": channel_id,
            "key": api_key,
        })
        items = data.get("items") or []
        if not items:
            logger.warning("youtube_engagement: no channel found for id=%s", channel_id)
            return None
        playlists = items[0].get("contentDetails", {}).get("relatedPlaylists", {})
        return playlists.get("uploads")
    except Exception as exc:
        logger.error("youtube_engagement: channels.list failed: %s", exc)
        return None


def _get_recent_video_ids(playlist_id: str, api_key: str, session: requests.Session, limit: int = 10) -> list[str]:
    """Return up to `limit` most recent video IDs from an uploads playlist."""
    try:
        data = _get(session, "playlistItems", {
            "part": "contentDetails",
            "playlistId": playlist_id,
            "maxResults": min(limit, 50),
            "key": api_key,
        })
        items = data.get("items") or []
        return [
            item["contentDetails"]["videoId"]
            for item in items
            if item.get("contentDetails", {}).get("videoId")
        ]
    except Exception as exc:
        logger.error("youtube_engagement: playlistItems.list failed: %s", exc)
        return []


def _get_video_stats(video_ids: list[str], api_key: str, session: requests.Session) -> list[dict[str, Any]]:
    """
    Fetch statistics + snippet for a list of video IDs.
    YouTube allows up to 50 IDs per request.
    Returns a list of dicts with url, title, like_count, comment_count, view_count.
    """
    results = []
    # Process in batches of 50 (YouTube API limit)
    for i in range(0, len(video_ids), 50):
        batch = video_ids[i:i + 50]
        try:
            data = _get(session, "videos", {
                "part": "statistics,snippet",
                "id": ",".join(batch),
                "key": api_key,
            })
            for item in data.get("items") or []:
                vid_id = item.get("id", "")
                snippet = item.get("snippet", {})
                stats = item.get("statistics", {})

                def to_int(val: Any) -> int | None:
                    try:
                        return int(val) if val is not None else None
                    except (ValueError, TypeError):
                        return None

                results.append({
                    "url":           f"https://www.youtube.com/watch?v={vid_id}",
                    "title":         snippet.get("title", ""),
                    "like_count":    to_int(stats.get("likeCount")),
                    "comment_count": to_int(stats.get("commentCount")),
                    "view_count":    to_int(stats.get("viewCount")),
                    "share_count":   None,  # not available in YouTube Data API
                })
        except Exception as exc:
            logger.error("youtube_engagement: videos.list failed for batch %s: %s", batch, exc)

    return results


# ── Main entry point ──────────────────────────────────────────────────────────

def scrape_youtube_engagement(
    channel_url: str,
    api_key: str,
    video_limit: int = 10,
) -> list[dict[str, Any]]:
    """
    Main entry point.

    Args:
        channel_url:  YouTube channel URL stored in CompanySocialProfile.
        api_key:      YouTube Data API v3 key from settings.YOUTUBE_API_KEY.
        video_limit:  Max number of recent videos to fetch stats for (default 10).

    Returns:
        List of dicts, one per video. Empty list on failure.
    """
    if not api_key:
        logger.error("youtube_engagement: YOUTUBE_API_KEY is not set — skipping.")
        return []

    session = requests.Session()

    # Step 1: resolve channel URL → channel ID
    channel_id = _extract_channel_id(channel_url, api_key, session)
    if not channel_id:
        return []

    # Step 2: channel ID → uploads playlist ID
    playlist_id = _get_uploads_playlist_id(channel_id, api_key, session)
    if not playlist_id:
        return []

    # Step 3: uploads playlist → recent video IDs
    video_ids = _get_recent_video_ids(playlist_id, api_key, session, limit=video_limit)
    if not video_ids:
        logger.warning("youtube_engagement: no videos found in uploads playlist for %s", channel_url)
        return []

    # Step 4: video IDs → statistics + titles
    results = _get_video_stats(video_ids, api_key, session)

    logger.info(
        "youtube_engagement %s → %d videos scraped",
        channel_url,
        len(results),
    )
    return results