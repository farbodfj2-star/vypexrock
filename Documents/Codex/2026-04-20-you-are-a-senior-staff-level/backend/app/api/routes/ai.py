from fastapi import APIRouter

from app.schemas.ai import AIChatRequest, AIChatResponse
from app.services.ai_service import AIExplanationService

router = APIRouter()


@router.post("/chat", response_model=AIChatResponse)
async def chat(payload: AIChatRequest) -> AIChatResponse:
    service = AIExplanationService()
    return await service.chat(
        message=payload.message,
        mode=payload.mode,
        history=payload.history,
    )
