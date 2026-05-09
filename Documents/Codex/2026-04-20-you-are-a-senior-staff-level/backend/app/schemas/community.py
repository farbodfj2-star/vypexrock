from datetime import datetime

from pydantic import BaseModel


class CommunityIdeaRead(BaseModel):
    id: str
    source: str
    symbol: str
    bias: str
    title: str
    reasoning: str
    image_url: str | None = None
    source_url: str
    author: str
    author_url: str | None = None
    posted_at: datetime
    boosts: int
    comments: int


class CommunityPulseRead(BaseModel):
    consensus_bias: str
    total_posts: int
    top_symbols: list[str]
    top_authors: list[str]
    summary: str


class CommunityFeedRead(BaseModel):
    ideas: list[CommunityIdeaRead]
    pulse: CommunityPulseRead
