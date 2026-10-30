"""
CampusFix Local AI Module.

Provides strictly offline AI capabilities powered by local Ollama:
- analyze_complaint: Structure and categorize maintenance complaints.
- chat_with_campus_assistant: Grounded campus maintenance FAQ assistant.
"""

from .campus_assistant import (
    CampusAssistantError,
    chat_with_campus_assistant,
    load_faq_data,
)
from .complaint_analyzer import (
    ALLOWED_CATEGORIES,
    ALLOWED_PRIORITIES,
    ComplaintAnalysisError,
    analyze_complaint,
)
from .ollama_service import (
    OllamaConnectionError,
    OllamaError,
    OllamaModelNotFoundError,
    OllamaResponseError,
    OllamaService,
    OllamaTimeoutError,
)

__all__ = [
    "analyze_complaint",
    "chat_with_campus_assistant",
    "load_faq_data",
    "OllamaService",
    "ALLOWED_CATEGORIES",
    "ALLOWED_PRIORITIES",
    "OllamaError",
    "OllamaConnectionError",
    "OllamaModelNotFoundError",
    "OllamaTimeoutError",
    "OllamaResponseError",
    "ComplaintAnalysisError",
    "CampusAssistantError",
]
