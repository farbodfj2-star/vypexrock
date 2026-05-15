from __future__ import annotations

import secrets
from urllib.parse import quote


AVATAR_STYLES = ("notionists", "glass", "bottts-neutral", "rings")


def generate_avatar_url(seed: str | None = None) -> str:
    """Premium Dicebear avatar — stable per seed, random on signup."""
    token = seed or secrets.token_hex(12)
    style = AVATAR_STYLES[sum(ord(char) for char in token) % len(AVATAR_STYLES)]
    palette = "0a0c10,5eead4,a78bfa,1e293b"
    return (
        f"https://api.dicebear.com/7.x/{style}/svg"
        f"?seed={quote(token)}&backgroundColor={palette}&backgroundType=gradientLinear"
    )
