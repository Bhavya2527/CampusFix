"""
Campus Assistant Module for CampusFix.

Answers student inquiries grounded strictly in the local FAQ knowledge base (faq_data.json).
Never hallucinates university policy or claims access to live student or campus records.
Strictly offline via local Ollama.
"""

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from .ollama_service import (
    OllamaConnectionError,
    OllamaError,
    OllamaModelNotFoundError,
    OllamaResponseError,
    OllamaService,
    OllamaTimeoutError,
)

logger = logging.getLogger("campusfix.ai.campus_assistant")

FAQ_FILE_PATH = Path(__file__).parent / "faq_data.json"
_CACHED_FAQ_DATA: Optional[Dict[str, Any]] = None


class CampusAssistantError(Exception):
    """Raised when the campus assistant fails to process a chat query."""
    pass


def load_faq_data() -> Dict[str, Any]:
    """
    Load and cache FAQ knowledge base from faq_data.json.

    :return: Dictionary containing FAQ items and campus information.
    :raises CampusAssistantError: If faq_data.json cannot be read or parsed.
    """
    global _CACHED_FAQ_DATA
    if _CACHED_FAQ_DATA is not None:
        return _CACHED_FAQ_DATA

    if not FAQ_FILE_PATH.exists():
        raise CampusAssistantError(f"FAQ knowledge file missing at: {FAQ_FILE_PATH}")

    try:
        with open(FAQ_FILE_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            _CACHED_FAQ_DATA = data
            return data
    except Exception as e:
        raise CampusAssistantError(f"Failed to read FAQ knowledge file: {e}") from e


def _format_faq_context(faq_data: Dict[str, Any]) -> Tuple[str, List[str]]:
    """Format the FAQ questions and answers into a compact context block for the model."""
    faqs = faq_data.get("faqs", [])
    lines: List[str] = []
    categories: List[str] = []

    for idx, item in enumerate(faqs, start=1):
        cat = item.get("category", "General")
        q = item.get("question", "")
        a = item.get("answer", "")
        if cat not in categories:
            categories.append(cat)
        lines.append(f"[{cat}] Q: {q}\nA: {a}\n")

    return "\n".join(lines), categories


SYSTEM_PROMPT = """You are CampusFix AI, an informational campus maintenance assistant.
You help students with maintenance procedures, complaint categories, reporting steps, and campus maintenance departments.

CRITICAL OPERATIONAL RULES:
1. STRICT GROUNDING: Answer ONLY using the facts present in the FAQ knowledge base provided in the prompt.
2. MISSING INFORMATION: If the student asks about something NOT covered in the FAQ (e.g. general university policies, cafeteria menus, professor contacts, admission rules, grading, or fees), state politely and clearly that the information is unavailable in the campus maintenance guide and advise them to contact the relevant campus department. NEVER invent or assume university policies.
3. NO ACCESS TO LIVE RECORDS: You do NOT have access to university databases, live complaint records, or student accounts. If a user asks you to check, track, look up, cancel, or modify a specific complaint ID or ticket, state clearly that you cannot access personal records and direct them to log in to the CampusFix portal dashboard ('My Complaints') to view their status.
4. TONE: Helpful, concise, polite, and professional.
"""


def chat_with_campus_assistant(
    message: str,
    model_name: Optional[str] = None,
    service: Optional[OllamaService] = None,
) -> Dict[str, Any]:
    """
    Generate an offline assistant response grounded in local campus FAQ data.

    :param message: Student inquiry or question.
    :param model_name: Optional model override. Reads from OLLAMA_MODEL by default.
    :param service: Optional pre-configured OllamaService instance.
    :raises ValueError: If message is empty or whitespace.
    :raises OllamaConnectionError: If local Ollama is offline.
    :raises OllamaModelNotFoundError: If OLLAMA_MODEL is not configured or installed.
    :raises OllamaTimeoutError: If inference times out.
    :raises CampusAssistantError: For assistant processing failures.
    :return: Dictionary containing the reply, source categories, and model details.
    """
    if not message or not isinstance(message, str) or not message.strip():
        raise ValueError("Chat message must be a non-empty string.")

    cleaned_query = message.strip()
    faq_data = load_faq_data()
    faq_context, categories = _format_faq_context(faq_data)

    ollama = service or OllamaService()

    user_prompt = f"""{SYSTEM_PROMPT}

KNOWLEDGE BASE (CAMPUS MAINTENANCE FAQ):
{faq_context}

STUDENT MESSAGE:
"{cleaned_query}"

INSTRUCTIONS:
Respond concisely and helpfully to the student message grounded strictly in the knowledge base above.
- If the question cannot be answered from the knowledge base, state that the information is unavailable in the campus maintenance guide.
- Do not claim access to live student complaint records.
- Be concise and clear."""

    try:
        reply = ollama.generate(
            prompt=user_prompt,
            model=model_name,
            format_json=False,
            temperature=0.2,
            max_tokens=None,
        )
    except (OllamaConnectionError, OllamaModelNotFoundError, OllamaTimeoutError) as e:
        # Strict offline requirement: NEVER return fake AI output when Ollama is unavailable
        logger.error("Failed to run local assistant chat via Ollama: %s", e)
        raise

    except OllamaResponseError as e:
        logger.error("Ollama response error during assistant chat: %s", e)
        raise CampusAssistantError(f"Ollama response error: {e}") from e

    except Exception as e:
        logger.error("Unexpected error calling Ollama for campus assistant: %s", e)
        raise CampusAssistantError(f"Unexpected chat error: {e}") from e

    cleaned_reply = reply.strip()

    # Determine matched source categories based on keywords
    matched_sources: List[str] = []
    query_lower = cleaned_query.lower()
    for cat in categories:
        cat_lower = cat.lower()
        if any(word in query_lower for word in cat_lower.split()):
            matched_sources.append(cat)

    if not matched_sources:
        matched_sources = ["General Campus Maintenance FAQ"]

    return {
        "reply": cleaned_reply,
        "response": cleaned_reply,  # convenient alias for backend developer
        "sources": matched_sources,
        "disclaimer": (
            "This assistant provides general maintenance FAQ information and does not "
            "connect to live university student records."
        ),
    }
