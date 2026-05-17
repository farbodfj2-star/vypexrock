"""
Avatar service — premium, varied, deterministic-per-seed avatars.

Every new account gets a real avatar. Each user can change it later.

Strategy:
  - 8 Dicebear styles cycled by seed hash so accounts feel distinct
  - Each style gets a curated background palette so it never feels flat
  - Helper to backfill avatars for accounts created before this code shipped
"""
from __future__ import annotations

import secrets
from typing import Final
from urllib.parse import quote


# Curated styles — each looks premium on a dark luxury UI.
AVATAR_STYLES: Final[tuple[str, ...]] = (
    "notionists",
    "notionists-neutral",
    "glass",
    "bottts-neutral",
    "shapes",
    "rings",
    "lorelei",
    "personas",
)

# Each style gets a coordinated palette pulled from the Vypexrock theme.
PALETTES: Final[tuple[str, ...]] = (
    "0a0c10,5eead4,a78bfa,1e293b",   # cyan + violet
    "020617,38bdf8,8b5cf6,0f172a",   # deep midnight
    "020617,fcd34d,fb923c,0f172a",   # warm amber
    "0a0c10,fda4af,a78bfa,1e293b",   # rose + violet
    "020617,6ee7b7,38bdf8,0f172a",   # mint + sky
    "0a0c10,d6e4ee,7dd3fc,1e293b",   # cool ivory
    "020617,c4b5fd,a78bfa,0f172a",   # all violet
    "0a0c10,f0abfc,7dd3fc,1e293b",   # fuchsia + sky
)


def generate_avatar_url(seed: str | None = None) -> str:
    """Build a Dicebear avatar URL.

    Stable per `seed` so the same email always renders the same avatar.
    Random when no seed is provided (used for one-off invites).
    """
    token = (seed or secrets.token_hex(12)).strip().lower() or secrets.token_hex(12)
    digest = sum(ord(char) for char in token)
    style = AVATAR_STYLES[digest % len(AVATAR_STYLES)]
    palette = PALETTES[digest % len(PALETTES)]
    return (
        f"https://api.dicebear.com/7.x/{style}/svg"
        f"?seed={quote(token)}"
        f"&backgroundColor={palette}"
        f"&backgroundType=gradientLinear"
        f"&radius=50"
    )


def ensure_avatar(user_avatar: str | None, seed: str | None) -> str:
    """Return the existing avatar if set, otherwise generate one for the seed.

    Used at login + profile-fetch time to backfill accounts created before
    the auto-avatar feature was enabled.
    """
    if user_avatar and user_avatar.strip():
        return user_avatar
    return generate_avatar_url(seed)
