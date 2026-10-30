# CampusFix – Local AI Module

Strictly offline, local AI integration for the **CampusFix** campus maintenance reporting system.

This module uses **Ollama** running locally on the student/campus server (`http://localhost:11434`) for all model inference. Absolutely no external AI APIs (OpenAI, Gemini, Claude, Groq, etc.) are called, and no network traffic leaves the local machine.

---

## Architecture Overview

```
backend/ai/
├── __init__.py              # Package exports (analyze_complaint, chat_with_campus_assistant, exceptions)
├── ollama_service.py        # Low-level HTTP client for local Ollama daemon (offline, zero-dep)
├── complaint_analyzer.py    # Structured maintenance complaint triage and classification
├── campus_assistant.py      # Grounded FAQ chat assistant using local knowledge base
├── faq_data.json            # Curated campus maintenance procedures and FAQ knowledge base
└── README.md                # Integration contract, offline testing, and architecture docs
```

### Key Design Principles:
1. **100% Offline & Private:** Operates strictly against `http://localhost:11434`. Pure Python standard library implementation (`urllib.request`) ensures zero external cloud dependencies.
2. **Model via Environment Variable:** The active model is never hardcoded. It is read dynamically from the `OLLAMA_MODEL` environment variable.
3. **No Fake AI Output:** If Ollama is offline or the configured model is missing, the module raises descriptive exceptions (`OllamaConnectionError`, `OllamaModelNotFoundError`). It **never** returns mocked or synthetic triage data.
4. **Strictly Grounded Assistant:** The FAQ assistant answers queries using `faq_data.json`. If a question is outside the scope of the maintenance guide or asks for student records, it explicitly states the information is unavailable rather than hallucinating university policies.
5. **Optimized for RTX 3050 (6GB VRAM) & 24GB RAM:** Concise system prompts, constrained JSON generation (`format="json"`), and modest context windows ensure low latency and high stability without memory exhaustion.

---

## Environment Configuration

Configure the following environment variables in your `.env` or system environment:

| Variable | Required | Default | Description |
|---|---|---|---|
| `OLLAMA_MODEL` | **Yes** | *None* | Name of the installed Ollama model (e.g. `gemma4:e4b`). |
| `OLLAMA_BASE_URL` | No | `http://localhost:11434` | URL of the local Ollama daemon. |
| `OLLAMA_TIMEOUT` | No | `60.0` | Request timeout in seconds for local inference. |

### Example (PowerShell / Windows):
```powershell
$env:OLLAMA_MODEL = "gemma4:e4b"
$env:OLLAMA_BASE_URL = "http://localhost:11434"
$env:OLLAMA_TIMEOUT = "60.0"
```

### Example (.env):
```bash
OLLAMA_MODEL=gemma4:e4b
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_TIMEOUT=60.0
```

---

## Integration Contract for Backend Developers

This module provides two primary Python functions to be imported into your FastAPI/Starlette router. **Do not create a second FastAPI application; plug these functions into your existing backend routes.**

### 1. `analyze_complaint(description: str) -> dict`

Connects to endpoint: `POST /api/ai/analyze`

#### Function Signature:
```python
from backend.ai import analyze_complaint

result = analyze_complaint(description="Three computers in Lab 204 have broken screens.")
```

#### Input:
- `description` (str): Non-empty string containing the student's maintenance complaint description.

#### Structured Output:
```json
{
  "category": "Lab Equipment",
  "summary": "Three computers in Lab 204 have broken screens.",
  "location": "Lab 204",
  "priority": "Medium",
  "department": "Lab Systems & Technical Support",
  "reasoning": "The complaint involves damaged computer monitors in an academic laboratory, requiring technical hardware support."
}
```

#### Supported Categories:
- `Electrical`
- `Internet/Wi-Fi`
- `Lab Equipment`
- `Hostel`
- `Cleaning`
- `Water Supply`
- `Classroom`
- `Other`

#### Priority Levels (AI Suggestion):
- `Low` (Cosmetic, minor routine upkeep)
- `Medium` (Operational defects affecting classes/labs without immediate safety risks)
- `High` (Safety hazards, power sparks, campus-wide outages, exam blockers)

*Note: The AI suggests a priority to assist the maintenance team; it does not make an irreversible scheduling decision.*

---

### 2. `chat_with_campus_assistant(message: str) -> dict`

Connects to endpoint: `POST /api/ai/chat`

#### Function Signature:
```python
from backend.ai import chat_with_campus_assistant

response = chat_with_campus_assistant(message="How do I check the status of my complaint?")
```

#### Input:
- `message` (str): Non-empty student question or chat query.

#### Output:
```json
{
  "reply": "To check your complaint status, log in to the CampusFix student portal and click on 'My Complaints' or 'Track Status'. Enter your Complaint ID to view real-time updates.",
  "response": "To check your complaint status, log in to the CampusFix student portal...",
  "sources": ["Checking complaint status"],
  "disclaimer": "This assistant provides general maintenance FAQ information and does not connect to live university student records."
}
```

#### Grounding & Safety Guarantees:
- **No Live Record Access:** The assistant will not search database records, lookup individual ticket numbers, or view student profiles. It directs students to their portal dashboard.
- **Out-of-Scope Queries:** If a student asks about cafeteria hours, exam marks, or fees, the model politely replies that the information is unavailable in the campus maintenance guide.

---

## FastAPI Route Integration Example

Here is how the backend developer can integrate these functions into FastAPI:

```python
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from backend.ai import (
    analyze_complaint,
    chat_with_campus_assistant,
    OllamaConnectionError,
    OllamaModelNotFoundError,
    OllamaTimeoutError,
    ComplaintAnalysisError,
    CampusAssistantError
)

router = APIRouter(prefix="/api/ai", tags=["AI"])

class AnalyzeRequest(BaseModel):
    description: str = Field(..., min_length=5, description="Student complaint text")

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="Student question")

@router.post("/analyze")
async def api_analyze_complaint(payload: AnalyzeRequest):
    try:
        return analyze_complaint(payload.description)
    except (OllamaConnectionError, OllamaModelNotFoundError) as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Local AI service unavailable: {str(e)}"
        )
    except OllamaTimeoutError as e:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=f"AI inference timed out: {str(e)}"
        )
    except (ValueError, ComplaintAnalysisError) as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )

@router.post("/chat")
async def api_chat_assistant(payload: ChatRequest):
    try:
        return chat_with_campus_assistant(payload.message)
    except (OllamaConnectionError, OllamaModelNotFoundError) as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Local AI assistant unavailable: {str(e)}"
        )
    except OllamaTimeoutError as e:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=f"AI chat timed out: {str(e)}"
        )
    except (ValueError, CampusAssistantError) as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
```

---

## Offline Verification & Testing

### 1. Verify Local Ollama Installation
Open PowerShell and verify Ollama is active:
```powershell
ollama list
```
You should see the installed model (e.g. `gemma4:e4b`).

### 2. Set Model Variable & Run Automated Test
Run the automated test runner offline:
```powershell
$env:OLLAMA_MODEL = "gemma4:e4b"
python backend/ai/test_offline_ai.py
```

This executes test scenarios verifying:
1. Model connectivity and version checks.
2. Complaint analysis with a broken lab computers scenario.
3. Grounded FAQ queries and out-of-scope refusal checks.
4. Privacy boundary checks (refusal to claim access to student records).
5. Error handling when Ollama is offline or model is misconfigured.
