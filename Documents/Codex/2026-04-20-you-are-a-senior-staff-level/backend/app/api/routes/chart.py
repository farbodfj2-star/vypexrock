from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_db
from app.schemas.chart_analysis import ChartAnalysisRequest, ChartAnalysisResponse
from app.services.chart_analysis_service import ChartAnalysisService

router = APIRouter()
_media_dir = Path(settings.chart_media_dir)
_media_dir.mkdir(parents=True, exist_ok=True)


@router.post("/analyze", response_model=ChartAnalysisResponse)
async def analyze_chart(
    payload: ChartAnalysisRequest,
    db: AsyncSession = Depends(get_db),
) -> ChartAnalysisResponse:
    try:
        return await ChartAnalysisService(db).analyze(payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/media/{filename}")
async def chart_media(filename: str) -> FileResponse:
    path = _media_dir / Path(filename).name
    if not path.exists():
        raise HTTPException(status_code=404, detail="Chart image not found")
    return FileResponse(path, media_type="image/png")
