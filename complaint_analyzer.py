"""
Complaint Analyzer Module for CampusFix.

Analyzes campus maintenance complaints using the local Ollama LLM.
Extracts structured classification: category, summary, location, priority, department, and reasoning.
Strictly offline and never generates mock data if the model or Ollama server is unreachable.
"""

import json
import logging
import re
from typing import Any, Dict, Optional, Tuple

from .ollama_service import (
    OllamaConnectionError,
    OllamaError,
    OllamaModelNotFoundError,
    OllamaResponseError,
    OllamaService,
    OllamaTimeoutError,
)

logger = logging.getLogger("campusfix.ai.complaint_analyzer")

ALLOWED_CATEGORIES = [
    "Electrical",
    "Internet/Wi-Fi",
    "Lab Equipment",
    "Hostel",
    "Cleaning",
    "Water Supply",
    "Classroom",
    "Other",
]

ALLOWED_PRIORITIES = ["Low", "Medium", "High"]

SYSTEM_PROMPT = """You are CampusFix AI, an automated maintenance triage assistant for a university campus.
Your task is to analyze student maintenance complaints and produce a structured JSON assessment.

Guidelines:
1. Category must be strictly chosen from:
   - "Electrical": Power cuts, lighting, switches, fans, AC, wiring, appliances.
   - "Internet/Wi-Fi": Wi-Fi down, Ethernet ports, slow connectivity, router issues.
   - "Lab Equipment": Computers, monitors, instruments, lab machines, 3D printers, oscilloscopes.
   - "Hostel": Room furniture, locks, windows, hostel common areas.
   - "Cleaning": Trash disposal, dirty washrooms, litter, pest control.
   - "Water Supply": Plumbing leaks, dry taps, geysers, drinking water coolers.
   - "Classroom": Desks, blackboards/whiteboards, podiums, classroom projectors.
   - "Other": Any issue not covered above.

2. Priority is a SUGGESTION (Low, Medium, or High):
   - "High": Safety hazards (sparks, flooding, smoke), severe campus-wide outages, issues blocking exams/classes.
   - "Medium": Non-hazardous operational failures affecting classes, labs, or essential daily activities.
   - "Low": Minor cosmetic defects, minor squeaks, non-urgent routine maintenance.

3. Location:
   - Extract the specific block, room, floor, or lab if mentioned.
   - If no specific location is found in the text, output "Unspecified".

4. Department:
   - Recommend the campus maintenance department (e.g. "Electrical Maintenance Unit", "Lab Systems & Technical Support", "IT & Network Infrastructure Services", "Estate & Civil Maintenance", "Sanitation & Housekeeping").

5. You must output ONLY a valid JSON object matching the requested schema. No surrounding text or markdown fences."""

USER_PROMPT_TEMPLATE = """Analyze this student complaint description:
\"\"\"{description}\"\"\"

Return a valid JSON object with EXACTLY these keys:
{{
  "category": "<one of Electrical, Internet/Wi-Fi, Lab Equipment, Hostel, Cleaning, Water Supply, Classroom, Other>",
  "summary": "<1-sentence concise summary of the reported issue>",
  "location": "<detected room, building, lab, or 'Unspecified'>",
  "priority": "<Low, Medium, or High>",
  "department": "<responsible campus maintenance department>",
  "reasoning": "<brief 1-2 sentence explanation for the suggested category, priority, and department>"
}}"""


class ComplaintAnalysisError(Exception):
    """Raised when complaint analysis fails due to AI, validation, or service errors."""
    pass


def _clean_json_text(raw_text: str) -> str:
    """Strip markdown code blocks or surrounding commentary if present."""
    text = raw_text.strip()
    # Strip markdown code blocks ```json ... ```
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        text = match.group(1).strip()
    return text


def _normalize_category(cat_raw: Optional[str]) -> str:
    """Normalize and match category string against ALLOWED_CATEGORIES."""
    if not cat_raw:
        return "Other"
    cleaned = cat_raw.strip().lower()
    for cat in ALLOWED_CATEGORIES:
        if cat.lower() == cleaned:
            return cat

    # Partial/synonym matches
    if any(k in cleaned for k in ["wifi", "wi-fi", "internet", "ethernet", "lan", "network"]):
        return "Internet/Wi-Fi"
    if any(k in cleaned for k in ["computer", "pc", "monitor", "lab", "printer", "instrument", "device"]):
        return "Lab Equipment"
    if any(k in cleaned for k in ["light", "fan", "switch", "wire", "power", "electric", "ac", "spark"]):
        return "Electrical"
    if any(k in cleaned for k in ["water", "pipe", "plumb", "leak", "tap", "drain", "cooler"]):
        return "Water Supply"
    if any(k in cleaned for k in ["clean", "dirt", "washroom", "toilet", "garbage", "trash", "dust"]):
        return "Cleaning"
    if any(k in cleaned for k in ["hostel", "dorm", "bed", "wardrobe", "mess"]):
        return "Hostel"
    if any(k in cleaned for k in ["classroom", "lecture", "projector", "bench", "podium", "board"]):
        return "Classroom"

    return "Other"


def _normalize_priority(prio_raw: Optional[str]) -> str:
    """Normalize priority string to 'Low', 'Medium', or 'High'."""
    if not prio_raw:
        return "Medium"
    cleaned = prio_raw.strip().lower()
    if "high" in cleaned or "urgent" in cleaned or "critical" in cleaned:
        return "High"
    if "low" in cleaned or "minor" in cleaned:
        return "Low"
    return "Medium"


def analyze_complaint(
    description: str,
    model_name: Optional[str] = None,
    service: Optional[OllamaService] = None,
) -> Dict[str, Any]:
    """
    Analyze a student's maintenance complaint description using the local Ollama model.

    Returns structured JSON containing:
    - category (str)
    - summary (str)
    - location (str)
    - priority (str: "Low" | "Medium" | "High")
    - department (str)
    - reasoning (str)

    :param description: The student's complaint text.
    :param model_name: Optional model override (otherwise reads OLLAMA_MODEL).
    :param service: Optional pre-configured OllamaService instance.
    :raises ValueError: If description is empty or invalid.
    :raises OllamaConnectionError: If Ollama is offline (strict: no fake outputs).
    :raises OllamaModelNotFoundError: If OLLAMA_MODEL is unset or missing.
    :raises OllamaTimeoutError: If inference exceeds timeout.
    :raises ComplaintAnalysisError: If model response is invalid or unparseable.
    :return: Validated structured dictionary.
    """
    if not description or not isinstance(description, str) or not description.strip():
        raise ValueError("Complaint description must be a non-empty string.")

    cleaned_description = description.strip()
    ollama = service or OllamaService()

    full_prompt = f"""{SYSTEM_PROMPT}

{USER_PROMPT_TEMPLATE.format(description=cleaned_description)}"""

    try:
        raw_response = ollama.generate(
            prompt=full_prompt,
            model=model_name,
            format_json=True,
            temperature=0.1,
            max_tokens=None,
        )
    except (OllamaConnectionError, OllamaModelNotFoundError, OllamaTimeoutError) as e:
        # Strict offline requirement: NEVER return fake AI output when Ollama is unavailable
        logger.error("Failed to run local complaint analysis via Ollama: %s", e)
        raise

    except OllamaResponseError as e:
        logger.error("Ollama response error during complaint analysis: %s", e)
        raise ComplaintAnalysisError(f"Ollama response error: {e}") from e

    except Exception as e:
        logger.error("Unexpected error calling Ollama for complaint analysis: %s", e)
        raise ComplaintAnalysisError(f"Unexpected inference error: {e}") from e

    # Parse and validate model output
    cleaned_json = _clean_json_text(raw_response)
    try:
        parsed = json.loads(cleaned_json)
    except json.JSONDecodeError as e:
        logger.warning("Model output was not valid JSON: %s. Raw: %r", e, raw_response)
        raise ComplaintAnalysisError(
            f"Model returned invalid JSON output: {e}. Output was: {raw_response[:200]}"
        ) from e

    if not isinstance(parsed, dict):
        raise ComplaintAnalysisError(
            f"Expected a JSON object from model, but received: {type(parsed).__name__}"
        )

    # Extract, validate, and normalize fields
    category = _normalize_category(parsed.get("category"))
    priority = _normalize_priority(parsed.get("priority"))

    summary = str(parsed.get("summary") or "").strip()
    if not summary:
        summary = cleaned_description[:100] + ("..." if len(cleaned_description) > 100 else "")

    location = str(parsed.get("location") or "").strip()
    if not location or location.lower() in ["none", "null", "unknown", "n/a"]:
        location = "Unspecified"

    department = str(parsed.get("department") or "").strip()
    if not department:
        # Default based on category
        dept_map = {
            "Electrical": "Electrical Maintenance Unit",
            "Internet/Wi-Fi": "IT & Network Infrastructure Services",
            "Lab Equipment": "Lab Systems & Technical Support",
            "Hostel": "Estate & Civil Maintenance",
            "Cleaning": "Sanitation & Housekeeping",
            "Water Supply": "Estate & Civil Maintenance",
            "Classroom": "Estate & Civil Maintenance",
            "Other": "General Campus Maintenance",
        }
        department = dept_map.get(category, "General Campus Maintenance")

    reasoning = str(parsed.get("reasoning") or "").strip()
    if not reasoning:
        reasoning = f"Categorized as {category} with {priority} priority based on reported symptoms."

    result: Dict[str, Any] = {
        "category": category,
        "summary": summary,
        "location": location,
        "priority": priority,
        "department": department,
        "reasoning": reasoning,
    }

    return result
