from __future__ import annotations

from collections import Counter
from datetime import UTC, datetime
from typing import Any
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup


class CommunityService:
    BASE_URL = "https://www.tradingview.com"
    DEFAULT_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "BNBUSDT", "DOGEUSDT"]

    async def fetch_feed(self, symbols: list[str] | None = None, limit: int = 18) -> dict[str, Any]:
        target_symbols = symbols or self.DEFAULT_SYMBOLS
        ideas: list[dict[str, Any]] = []

        async with httpx.AsyncClient(
            timeout=20,
            follow_redirects=True,
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36"
                )
            },
        ) as client:
            for symbol in target_symbols:
                page_ideas = await self._fetch_symbol_ideas(client, symbol)
                ideas.extend(page_ideas)

        deduped: dict[str, dict[str, Any]] = {}
        for idea in ideas:
            deduped[idea["source_url"]] = idea

        ranked = sorted(
            deduped.values(),
            key=lambda item: (item["posted_at"], item["boosts"], item["comments"]),
            reverse=True,
        )[:limit]

        return {
            "ideas": ranked,
            "pulse": self._build_pulse(ranked),
        }

    async def _fetch_symbol_ideas(self, client: httpx.AsyncClient, symbol: str) -> list[dict[str, Any]]:
        url = f"{self.BASE_URL}/symbols/{symbol}/ideas/"
        response = await client.get(url)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        parsed: list[dict[str, Any]] = []
        for article in soup.select("article"):
            title_link = article.select_one('a[data-qa-id="ui-lib-card-link-title"]')
            paragraph_link = article.select_one('a[data-qa-id="ui-lib-card-link-paragraph"]')
            if not title_link or not paragraph_link:
                continue

            title = title_link.get_text(" ", strip=True)
            reasoning = paragraph_link.get_text(" ", strip=True)
            if not title or not reasoning:
                continue

            idea_url = urljoin(self.BASE_URL, title_link.get("href", ""))
            author_link = article.select_one('address[data-qa-id="ui-lib-card-link-author"] a')
            author = author_link.get_text(" ", strip=True).replace("by ", "") if author_link else "TradingView author"
            author_url = urljoin(self.BASE_URL, author_link.get("href", "")) if author_link else None

            time_tag = article.select_one("time[datetime]")
            posted_at_raw = time_tag.get("datetime") if time_tag else None
            posted_at = self._parse_datetime(posted_at_raw)

            comment_button = article.select_one('[data-qa-id="ui-lib-card-comment-button"]')
            boost_label = article.select_one('[data-qa-id="ui-lib-card-like-button"] [aria-label*="boost"]')
            image = article.select_one('a[data-qa-id="ui-lib-card-link-image"] img')
            bias_tag = article.select_one('[class*="previewRowItem"][title]')

            parsed.append(
                {
                    "id": idea_url.rsplit("/", 2)[-2] if "/" in idea_url else idea_url,
                    "source": "TradingView",
                    "symbol": symbol,
                    "bias": self._normalize_bias(bias_tag.get("title") if bias_tag else None),
                    "title": title,
                    "reasoning": reasoning,
                    "image_url": image.get("src") if image else None,
                    "source_url": idea_url,
                    "author": author,
                    "author_url": author_url,
                    "posted_at": posted_at,
                    "boosts": self._extract_number(boost_label.get("aria-label") if boost_label else None),
                    "comments": self._extract_number(comment_button.get("aria-label") if comment_button else None),
                }
            )

        return parsed

    def _build_pulse(self, ideas: list[dict[str, Any]]) -> dict[str, Any]:
        if not ideas:
            return {
                "consensus_bias": "neutral",
                "total_posts": 0,
                "top_symbols": [],
                "top_authors": [],
                "summary": "No live public community ideas were available at the moment.",
            }

        bias_counter = Counter(item["bias"] for item in ideas)
        top_symbols = [symbol for symbol, _ in Counter(item["symbol"] for item in ideas).most_common(3)]
        top_authors = [author for author, _ in Counter(item["author"] for item in ideas).most_common(3)]
        consensus_bias = bias_counter.most_common(1)[0][0]

        if consensus_bias == "long":
            summary = "The real public TradingView flow is leaning bullish right now, with most high-engagement posts focusing on continuation or reclaim setups."
        elif consensus_bias == "short":
            summary = "The real public TradingView flow is leaning defensive right now, with more traders focused on breakdowns, failed bounces, and downside risk."
        else:
            summary = "The real public TradingView flow is mixed right now, so traders are debating both directions rather than showing one clean consensus."

        return {
            "consensus_bias": consensus_bias,
            "total_posts": len(ideas),
            "top_symbols": top_symbols,
            "top_authors": top_authors,
            "summary": summary,
        }

    def _extract_number(self, value: str | None) -> int:
        if not value:
            return 0
        digits = "".join(ch for ch in value if ch.isdigit())
        return int(digits) if digits else 0

    def _parse_datetime(self, value: str | None) -> datetime:
        if not value:
            return datetime.now(UTC)
        normalized = value.replace("Z", "+00:00")
        try:
            return datetime.fromisoformat(normalized)
        except ValueError:
            return datetime.now(UTC)

    def _normalize_bias(self, value: str | None) -> str:
        lowered = (value or "").strip().lower()
        if "long" in lowered:
            return "long"
        if "short" in lowered:
            return "short"
        return "neutral"
