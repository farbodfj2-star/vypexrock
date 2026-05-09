from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.chart_analysis import ChartAnalysisRequest, ChartAnalysisResponse
from app.services.chart_analysis_service import ChartAnalysisService

router = APIRouter()


@router.post("/analyze", response_model=ChartAnalysisResponse)
async def analyze_chart(
    payload: ChartAnalysisRequest,
    db: AsyncSession = Depends(get_db),
) -> ChartAnalysisResponse:
    try:
        return await ChartAnalysisService(db).analyze(payload)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
