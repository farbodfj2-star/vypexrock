from typing import Literal

from pydantic import BaseModel, Field


class AIChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class AIChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    mode: Literal["short", "long"] = "long"
    history: list[AIChatMessage] = Field(default_factory=list)


class AIChatSource(BaseModel):
    title: str
    url: str


class AIChatResponse(BaseModel):
    answer: str
    assistant_name: str = "Vypexrock AI"
    used_live_ai: bool = False
    used_web_search: bool = False
    sources: list[AIChatSource] = Field(default_factory=list)
