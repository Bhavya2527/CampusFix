from fastapi import APIRouter, HTTPException, status
import schemas
from ai import ai_service

router = APIRouter(prefix="/ai", tags=["AI Integration (Member 3 Interface)"])


@router.post("/analyze", response_model=schemas.AIAnalyzeResponse)
async def analyze_complaint_endpoint(request: schemas.AIAnalyzeRequest):
    """AI endpoint for automatic complaint categorization, priority detection, and department routing.
    Calls Member 3's AI service (or Ollama/local heuristic fallback).
    """
    try:
        result = await ai_service.analyze_complaint(
            text=request.text,
            title=request.title,
            description=request.description,
            location=request.location
        )
        return schemas.AIAnalyzeResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI analysis error: {str(e)}"
        )


@router.post("/chat", response_model=schemas.AIChatResponse)
async def chat_endpoint(request: schemas.AIChatRequest):
    """AI endpoint for student complaint chatbot assistance.
    Calls Member 3's conversational AI interface (or Ollama/local assistant fallback).
    """
    try:
        result = await ai_service.chat(
            message=request.message,
            conversation_history=request.conversation_history,
            context=request.context
        )
        return schemas.AIChatResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI chat error: {str(e)}"
        )
