from fastapi import APIRouter, Query

from app.schemas.community import CommunityFeedRead
from app.services.community_service import CommunityService

router = APIRouter()


@router.get("/ideas", response_model=CommunityFeedRead)
async def community_ideas(
    limit: int = Query(default=18, ge=6, le=30),
) -> CommunityFeedRead:
    payload = await CommunityService().fetch_feed(limit=limit)
    return CommunityFeedRead(**payload)
