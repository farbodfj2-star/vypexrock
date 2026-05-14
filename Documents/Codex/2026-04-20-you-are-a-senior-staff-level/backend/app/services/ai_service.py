from __future__ import annotations

import logging
import re
from urllib.parse import quote

import httpx

from app.core.config import settings
from app.schemas.ai import AIChatMessage, AIChatResponse, AIChatSource

logger = logging.getLogger(__name__)


class AIExplanationService:
    async def generate_analysis_text(self, signal_data: dict) -> str:
        fallback = signal_data["explanation"]
        response = await self.chat(
            message=f"Explain this trading setup in a balanced, risk-aware way: {signal_data}",
            mode="short",
        )
        return response.answer or fallback

    async def chat(
        self,
        message: str,
        mode: str = "long",
        history: list[AIChatMessage] | None = None,
    ) -> AIChatResponse:
        clean_message = message.strip()
        if not clean_message:
            return AIChatResponse(answer="Ask me anything. I will answer it clearly, like a smart human assistant who keeps the signal high and the noise low.")

        lowered = clean_message.lower()
        if self._is_identity_question(lowered):
            return AIChatResponse(answer="I'm Vypexrock AI.")

        providers = self._resolve_providers()

        if "openai" in providers:
            live_response = await self._openai_chat(clean_message, mode=mode, history=history or [])
            if live_response:
                return live_response

        if "nvidia" in providers:
            live_response = await self._nvidia_chat(clean_message, mode=mode, history=history or [])
            if live_response:
                return live_response

        return await self._web_fallback_chat(clean_message, mode=mode)

    def _resolve_providers(self) -> list[str]:
        explicit = settings.ai_provider.lower().strip()
        providers: list[str] = []
        if explicit == "openai" and settings.openai_api_key:
            providers.append("openai")
        elif explicit == "nvidia" and settings.nvidia_api_key:
            providers.append("nvidia")

        if settings.openai_api_key and "openai" not in providers:
            providers.append("openai")
        if settings.nvidia_api_key and "nvidia" not in providers:
            providers.append("nvidia")
        return providers

    async def _openai_chat(
        self,
        message: str,
        mode: str,
        history: list[AIChatMessage],
    ) -> AIChatResponse | None:
        instructions = self._build_system_prompt(mode)
        headers = {
            "Authorization": f"Bearer {settings.openai_api_key}",
            "Content-Type": "application/json",
        }

        input_items = [
            {
                "role": item.role,
                "content": [
                    {
                        "type": "input_text",
                        "text": item.content,
                    }
                ],
            }
            for item in history[-10:]
        ]
        input_items.append(
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": message,
                    }
                ],
            }
        )

        body: dict = {
            "model": settings.openai_model,
            "instructions": instructions,
            "input": input_items,
        }

        if settings.openai_enable_web_search:
            body["tools"] = [
                {
                    "type": "web_search",
                    "user_location": {
                        "type": "approximate",
                        "country": "FR",
                        "city": "Paris",
                        "region": "Ile-de-France",
                        "timezone": "Europe/Paris",
                    },
                }
            ]
            body["tool_choice"] = "auto"
            body["include"] = ["web_search_call.action.sources"]

        try:
            async with httpx.AsyncClient(timeout=40, trust_env=False) as client:
                response = await client.post(
                    "https://api.openai.com/v1/responses",
                    json=body,
                    headers=headers,
                )
                response.raise_for_status()
                payload = response.json()
        except httpx.HTTPStatusError as exc:
            detail = exc.response.text[:500] if exc.response is not None else "No response body"
            logger.warning("OpenAI Responses API request failed: %s %s", exc.response.status_code if exc.response else "unknown", detail)
            return None
        except Exception as exc:
            logger.warning("OpenAI Responses API request errored: %s %r", exc.__class__.__name__, exc)
            return None

        answer = self._extract_response_text(payload).strip()
        if not answer:
            return None

        return AIChatResponse(
            answer=answer,
            used_live_ai=True,
            used_web_search=bool(settings.openai_enable_web_search),
            sources=self._extract_sources(payload),
        )

    async def _nvidia_chat(
        self,
        message: str,
        mode: str,
        history: list[AIChatMessage],
    ) -> AIChatResponse | None:
        if not settings.nvidia_api_key:
            return None

        headers = {
            "Authorization": f"Bearer {settings.nvidia_api_key}",
            "Content-Type": "application/json",
        }

        messages = [{"role": "system", "content": self._build_system_prompt(mode)}]
        for item in history[-10:]:
            messages.append({"role": item.role, "content": item.content})
        messages.append({"role": "user", "content": message})

        body = {
            "model": settings.nvidia_model,
            "messages": messages,
            "temperature": 0.3 if mode == "short" else 0.45,
            "max_tokens": 180 if mode == "short" else 650,
            "stream": False,
        }

        try:
            async with httpx.AsyncClient(timeout=40, trust_env=False) as client:
                response = await client.post(
                    f"{settings.nvidia_base_url}/chat/completions",
                    json=body,
                    headers=headers,
                )
                response.raise_for_status()
                payload = response.json()
        except httpx.HTTPStatusError as exc:
            detail = exc.response.text[:500] if exc.response is not None else "No response body"
            logger.warning("NVIDIA chat completions request failed: %s %s", exc.response.status_code if exc.response else "unknown", detail)
            return None
        except Exception as exc:
            logger.warning("NVIDIA chat completions request errored: %s %r", exc.__class__.__name__, exc)
            return None

        answer = self._extract_nvidia_text(payload).strip()
        if not answer:
            return None

        return AIChatResponse(
            answer=answer,
            used_live_ai=True,
            used_web_search=False,
            sources=[],
        )

    async def _web_fallback_chat(self, message: str, mode: str) -> AIChatResponse:
        web_context = await self._fetch_public_context(message)
        if web_context["summary"]:
            answer = self._format_web_fallback_answer(
                message=message,
                summary=web_context["summary"],
                mode=mode,
                has_sources=bool(web_context["sources"]),
            )
            return AIChatResponse(
                answer=answer,
                used_live_ai=False,
                used_web_search=bool(web_context["sources"]),
                sources=web_context["sources"],
            )

        return AIChatResponse(
            answer=self._generic_fallback(message, mode),
            used_live_ai=False,
            used_web_search=False,
            sources=[],
        )

    async def _fetch_public_context(self, message: str) -> dict:
        sources: list[AIChatSource] = []
        snippets: list[str] = []

        async with httpx.AsyncClient(timeout=15, follow_redirects=True, trust_env=False) as client:
            try:
                duckduckgo = await client.get(
                    "https://api.duckduckgo.com/",
                    params={
                        "q": message,
                        "format": "json",
                        "no_html": 1,
                        "no_redirect": 1,
                    },
                )
                duckduckgo.raise_for_status()
                data = duckduckgo.json()

                abstract_text = (data.get("AbstractText") or "").strip()
                abstract_url = (data.get("AbstractURL") or "").strip()
                heading = (data.get("Heading") or message).strip()
                if abstract_text:
                    snippets.append(abstract_text)
                    if abstract_url:
                        sources.append(AIChatSource(title=heading or "DuckDuckGo", url=abstract_url))

                for topic in data.get("RelatedTopics", [])[:3]:
                    if isinstance(topic, dict) and topic.get("Text") and topic.get("FirstURL"):
                        snippets.append(topic["Text"])
                        sources.append(AIChatSource(title=topic["Text"][:80], url=topic["FirstURL"]))
            except Exception:
                pass

            topic = self._extract_wikipedia_topic(message)
            if topic:
                wikipedia_context = await self._fetch_wikipedia_context(client, topic)
                snippets.extend(wikipedia_context["snippets"])
                sources.extend(wikipedia_context["sources"])

        unique_sources: list[AIChatSource] = []
        seen_urls: set[str] = set()
        for source in sources:
            if source.url in seen_urls:
                continue
            seen_urls.add(source.url)
            unique_sources.append(source)

        summary = " ".join(snippets[:3]).strip()
        return {"summary": summary, "sources": unique_sources[:4]}

    async def _fetch_wikipedia_context(self, client: httpx.AsyncClient, topic: str) -> dict:
        snippets: list[str] = []
        sources: list[AIChatSource] = []

        async def load_summary(title: str) -> bool:
            try:
                wikipedia = await client.get(
                    f"https://en.wikipedia.org/api/rest_v1/page/summary/{quote(title)}",
                )
                if wikipedia.status_code != 200:
                    return False
                data = wikipedia.json()
                extract = (data.get("extract") or "").strip()
                content_urls = data.get("content_urls", {}).get("desktop", {})
                page_url = content_urls.get("page")
                page_title = data.get("title") or title
                if not extract:
                    return False
                snippets.append(extract)
                if page_url:
                    sources.append(AIChatSource(title=page_title, url=page_url))
                return True
            except Exception:
                return False

        if await load_summary(topic):
            return {"snippets": snippets, "sources": sources}

        try:
            search = await client.get(
                "https://en.wikipedia.org/w/api.php",
                params={
                    "action": "query",
                    "list": "search",
                    "srsearch": topic,
                    "format": "json",
                    "srlimit": 1,
                },
            )
            search.raise_for_status()
            rows = search.json().get("query", {}).get("search", [])
            if rows:
                await load_summary(str(rows[0].get("title") or topic))
        except Exception:
            pass

        return {"snippets": snippets, "sources": sources}

    def _build_system_prompt(self, mode: str) -> str:
        answer_style = (
            "Keep answers concise, sharp, and premium. Answer in 2 to 4 sentences unless the user asks for depth."
            if mode == "short"
            else "Give a fuller answer with practical detail, but stay clean and easy to scan. Avoid rambling."
        )
        return (
            "You are Vypexrock AI, a premium assistant inside a crypto SaaS platform. "
            "You can answer broad questions about crypto, trading, finance, markets, charts, technology, and general knowledge. "
            "If the user asks your name, answer exactly: I'm Vypexrock AI. "
            "Sound intelligent, polished, warm, and naturally human, not robotic. "
            "Write like a sharp private analyst who can also teach clearly. "
            "When the user is confused, simplify without sounding childish. "
            "When the user asks for a recommendation, be decisive but risk-aware. "
            "Use plain English, short paragraphs, and direct answers first. "
            "For trading or investment questions, never promise outcomes and never present profits as guaranteed. "
            "Frame ideas in probabilities, setup quality, risk, and invalidation. "
            f"{answer_style}"
        )

    def _extract_response_text(self, payload: dict) -> str:
        output_text = payload.get("output_text")
        if output_text:
            return str(output_text)

        parts: list[str] = []
        for item in payload.get("output", []):
            if item.get("type") != "message":
                continue
            for content in item.get("content", []):
                text = content.get("text")
                if text:
                    parts.append(text)
        return "\n".join(parts).strip()

    def _extract_sources(self, payload: dict) -> list[AIChatSource]:
        sources: list[AIChatSource] = []
        seen_urls: set[str] = set()

        for item in payload.get("output", []):
            if item.get("type") != "web_search_call":
                continue
            action = item.get("action", {})
            for source in action.get("sources", []):
                url = source.get("url")
                title = source.get("title") or url
                if not url or url in seen_urls:
                    continue
                seen_urls.add(url)
                sources.append(AIChatSource(title=title, url=url))

        return sources[:5]

    def _extract_nvidia_text(self, payload: dict) -> str:
        choices = payload.get("choices") or []
        if not choices:
            return ""
        message = choices[0].get("message") or {}
        content = message.get("content")
        if isinstance(content, str):
            return content
        return ""

    def _extract_wikipedia_topic(self, message: str) -> str | None:
        cleaned = message.strip().rstrip("?.!")
        cleaned = re.sub(r"\b(in simple words|in simple terms|simply|please|for me)\b", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        lowered = cleaned.lower()
        prefixes = ["what is ", "who is ", "explain ", "tell me about "]
        for prefix in prefixes:
            if lowered.startswith(prefix):
                return cleaned[len(prefix) :].strip()
        if len(cleaned.split()) <= 4:
            return cleaned
        return None

    def _is_identity_question(self, lowered_message: str) -> bool:
        normalized = re.sub(r"[^a-z0-9\s]", " ", lowered_message)
        normalized = re.sub(r"\s+", " ", normalized).strip()
        identity_questions = {
            "what is your name",
            "whats your name",
            "who are you",
            "your name",
            "tell me your name",
        }
        return normalized in identity_questions

    def _format_web_fallback_answer(self, message: str, summary: str, mode: str, has_sources: bool) -> str:
        intro = "Here is the cleanest way to think about it."
        if self._looks_like_trade_question(message):
            intro = "Here is the balanced trading view."
        if mode == "short":
            return f"{intro} {summary.split('. ')[0].strip()}."

        source_note = " I also attached the sources I used." if has_sources else ""
        return f"{intro} {summary}{source_note}"

    def _generic_fallback(self, message: str, mode: str) -> str:
        lowered = message.lower()

        if "best coin" in lowered or "buy right now" in lowered:
            text = (
                "The best coin right now is usually the one with the cleanest structure, the cleanest invalidation, and the least emotional chasing. "
                "I would judge it by trend quality, liquidity, nearby resistance, and whether the risk still makes sense from the current price. "
                "So the right answer is not a guaranteed ticker, it is the highest-quality setup with controlled downside."
            )
        elif "stop loss" in lowered:
            text = (
                "A stop loss is the line where your trade idea is considered wrong. "
                "It protects capital and defines your position size before entry, which is what separates a structured trade from a random bet."
            )
        elif "what is bitcoin" in lowered or "explain bitcoin" in lowered:
            text = (
                "Bitcoin is the original decentralized digital asset. "
                "No central company controls it, the supply is limited, and it became the reference asset for the broader crypto market. "
                "The easiest way to think about it is as a digital monetary network with scarce supply and global liquidity."
            )
        elif "quantum computer" in lowered or "quantum computing" in lowered:
            text = (
                "A quantum computer is a computer that uses quantum bits, or qubits, instead of normal bits. "
                "A normal bit is either 0 or 1, while a qubit can behave like a blend of possibilities until it is measured. "
                "That makes quantum computers promising for certain hard problems, but they are not a faster version of a normal laptop for everyday tasks."
            )
        elif "tokyo" in lowered and ("visit" in lowered or "place" in lowered or "travel" in lowered):
            text = (
                "For Tokyo, I would build the trip around neighborhoods. "
                "Use Shibuya and Shinjuku for energy, Asakusa for history, Ginza for polished shopping, Akihabara for gaming and tech culture, and Odaiba or teamLab for a futuristic visual stop."
            )
        elif "long" in lowered and "short" in lowered:
            text = (
                "Long means you benefit if price rises. Short means you benefit if price falls. "
                "Neutral means the chart may be moving, but the edge is not clean enough to justify risk right now."
            )
        elif "risk management" in lowered or "manage risk" in lowered:
            text = (
                "Risk management is how you survive long enough for your edge to matter. "
                "That means risking small, defining invalidation before entry, and never letting one trade damage the week."
            )
        else:
            text = (
                "I can answer broad questions across crypto, trading, markets, tech, and general knowledge. "
                "If live model access is configured, I can go deeper with fresher internet-backed answers, but even without that I can still give you a clean, useful explanation."
            )

        if mode == "short":
            return text.split(". ")[0].strip() + "."
        return text

    def _looks_like_trade_question(self, message: str) -> bool:
        lowered = message.lower()
        keywords = [
            "buy",
            "sell",
            "trade",
            "btc",
            "eth",
            "crypto",
            "stop loss",
            "take profit",
            "long",
            "short",
            "chart",
        ]
        return any(keyword in lowered for keyword in keywords)
