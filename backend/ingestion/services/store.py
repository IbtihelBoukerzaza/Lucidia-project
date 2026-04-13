"""Persist normalized rows into posts.Post with deduplication."""

from posts.models import Post


def upsert_post(*, company_id: int, row: dict) -> tuple[Post | None, bool]:
    """
    row keys: text, source, platform, external_id, url, author (optional).
    Returns (post, created). Skips rows without external_id or empty text.
    """
    external_id = row.get("external_id")
    if not external_id:
        return None, False

    text = (row.get("text") or "").strip()
    if not text:
        return None, False

    external_id = str(external_id)[:512]
    defaults = {
        "text": text[:100000],
        "source": row["source"],
        "platform": row["platform"],
        "url": row.get("url") or None,
        "author": ((row.get("author") or "")[:255] or None),
    }

    post, created = Post.objects.get_or_create(
        company_id=company_id,
        external_id=external_id,
        defaults=defaults,
    )
    return post, created
