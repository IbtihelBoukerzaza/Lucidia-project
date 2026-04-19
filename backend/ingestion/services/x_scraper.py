import logging

logger = logging.getLogger(__name__)

try:
    import snscrape.modules.twitter as sntwitter
except ImportError:
    sntwitter = None


def fetch_x_comments(keywords: list[str], max_per_keyword: int = 20):
    """
    Fetch tweets (as comments proxy) using snscrape (no API).
    Safe fallback when Twitter API is not available.
    """

    if not sntwitter:
        logger.warning("snscrape not installed, skipping X scraping")
        return []

    results = []

    for kw in keywords:
        query = f"{kw} lang:ar OR lang:fr OR lang:en"

        try:
            for i, tweet in enumerate(
                sntwitter.TwitterSearchScraper(query).get_items()
            ):
                if i >= max_per_keyword:
                    break

                results.append({
                    "text": tweet.content,
                    "external_id": f"x:{tweet.id}",
                    "url": tweet.url,
                    "source": "x",
                    "platform": "social",
                    "author": tweet.user.username if tweet.user else None,
                })

        except Exception as e:
            logger.error(f"X scraping failed for '{kw}': {e}")

    return results