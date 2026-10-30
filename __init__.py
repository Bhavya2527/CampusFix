"""
CampusFix AI Module
-------------------
NOTE: Member 3 will provide and expand the full AI service here.
This module defines the standardized contract and local Ollama / heuristic interface
so that the backend and frontend can interact seamlessly without external cloud APIs.
"""

import os
import re
from typing import Dict, Any, List, Optional
import httpx

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")


class CampusFixAIService:
    """Service handling complaint analysis and interactive chat assistant.
    Member 3 can customize inference, prompts, and local LLM pipelines here.
    """

    @staticmethod
    def _rule_based_analyze(title: str, description: str, location: str) -> Dict[str, Any]:
        """Local heuristic fallback when local Ollama is offline or warming up."""
        combined_text = f"{title} {description} {location}".lower()

        # Keyword mapping for campus categories and departments
        if any(w in combined_text for w in ["water", "pipe", "tap", "leak", "flush", "drain", "sewage", "sink"]):
            category = "Plumbing"
            suggested_department = "Plumbing & Sanitation"
            priority = "High" if any(w in combined_text for w in ["burst", "flood", "major", "overflow", "urgent"]) else "Medium"
            key_issues = ["Water leakage / plumbing defect", "Requires maintenance inspection"]

        elif any(w in combined_text for w in ["light", "fan", "switch", "wire", "spark", "power", "electricity", "socket", "ac", "air conditioner"]):
            category = "Electrical"
            suggested_department = "Electrical & Power"
            priority = "Urgent" if any(w in combined_text for w in ["spark", "fire", "shock", "smoke"]) else "Medium"
            key_issues = ["Electrical appliance / power line fault"]

        elif any(w in combined_text for w in ["wifi", "wi-fi", "internet", "router", "lan", "network", "portal", "ethernet"]):
            category = "IT & Network"
            suggested_department = "IT & Network Infrastructure"
            priority = "Medium"
            key_issues = ["Campus connectivity / network downtime"]

        elif any(w in combined_text for w in ["hostel", "room", "bed", "door", "window", "cupboard", "almirah", "lock"]):
            category = "Hostel Infrastructure"
            suggested_department = "Hostel & Housing"
            priority = "Medium"
            key_issues = ["Hostel room furniture / fixture issue"]

        elif any(w in combined_text for w in ["clean", "garbage", "trash", "dustbin", "waste", "smell", "odor", "dirty"]):
            category = "Cleanliness"
            suggested_department = "Sanitation & Housekeeping"
            priority = "Low"
            key_issues = ["Campus sanitation / waste clearance required"]

        elif any(w in combined_text for w in ["food", "mess", "canteen", "cafeteria", "meal"]):
            category = "Mess & Food"
            suggested_department = "Cafeteria & Mess"
            priority = "High"
            key_issues = ["Campus food quality or hygiene issue"]

        elif any(w in combined_text for w in ["theft", "stolen", "security", "guard", "fight", "safety", "harassment"]):
            category = "Security"
            suggested_department = "Security & Campus Safety"
            priority = "Urgent"
            key_issues = ["Campus safety and security alert"]

        else:
            category = "General Maintenance"
            suggested_department = "Hostel & Housing"
            priority = "Medium"
            key_issues = ["Campus infrastructure issue"]

        summary = f"Reported {category.lower()} issue at {location or 'campus premises'} requiring attention from {suggested_department}."

        return {
            "category": category,
            "priority": priority,
            "suggested_department": suggested_department,
            "summary": summary,
            "key_issues": key_issues,
            "confidence_score": 0.92
        }

    @classmethod
    async def analyze_complaint(
        cls,
        text: Optional[str] = None,
        title: Optional[str] = None,
        description: Optional[str] = None,
        location: Optional[str] = None
    ) -> Dict[str, Any]:
        """Analyze complaint content using local Ollama if available, falling back to local classifier.
        Member 3 can inject custom prompt templates or fine-tuned model weights here.
        """
        full_title = title or ""
        full_desc = description or text or ""
        full_loc = location or ""

        # Attempt local Ollama inference if running
        try:
            prompt = (
                f"You are CampusFix AI. Analyze this campus complaint and return JSON with keys: "
                f"category, priority (Low/Medium/High/Urgent), suggested_department, summary, key_issues (list of strings).\n"
                f"Title: {full_title}\nDescription: {full_desc}\nLocation: {full_loc}\n"
            )
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.post(
                    f"{OLLAMA_BASE_URL}/api/generate",
                    json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False, "format": "json"}
                )
                if res.status_code == 200:
                    import json
                    response_json = res.json()
                    parsed = json.loads(response_json.get("response", "{}"))
                    if "category" in parsed and "priority" in parsed:
                        parsed["confidence_score"] = 0.98
                        return parsed
        except Exception:
            # Local Ollama not active or timed out - seamlessly proceed with rule-based engine
            pass

        return cls._rule_based_analyze(full_title, full_desc, full_loc)

    @classmethod
    async def chat(
        cls,
        message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Chat with the CampusFix AI Assistant.
        Member 3 can integrate RAG or LLM conversation chains here.
        """
        # Try local Ollama if available
        try:
            messages = [{"role": "system", "content": "You are CampusFix AI Assistant for campus complaint tracking and grievance support. Keep answers concise, empathetic and helpful."}]
            if conversation_history:
                messages.extend(conversation_history)
            messages.append({"role": "user", "content": message})

            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.post(
                    f"{OLLAMA_BASE_URL}/api/chat",
                    json={"model": OLLAMA_MODEL, "messages": messages, "stream": False}
                )
                if res.status_code == 200:
                    data = res.json()
                    reply = data.get("message", {}).get("content", "")
                    if reply:
                        return {
                            "reply": reply,
                            "suggested_actions": ["Track Complaint", "View Status History", "Contact Admin"],
                            "intent": "general_inquiry"
                        }
        except Exception:
            pass

        # Intelligent local assistant fallback
        msg_lower = message.lower()
        if any(w in msg_lower for w in ["status", "track", "check", "where is"]):
            reply = "You can track the status of your complaints anytime under 'My Complaints'. Complaints transition from 'Pending' -> 'In Progress' -> 'Resolved' with audit notes."
            actions = ["View My Complaints", "Check Status History"]
            intent = "track_status"
        elif any(w in msg_lower for w in ["submit", "new", "lodge", "register", "create", "file"]):
            reply = "To submit a new complaint, navigate to 'New Complaint', provide a descriptive title, category, location, and description. Our system will automatically assign a unique tracking ID and notify the relevant department."
            actions = ["Submit New Complaint", "View Department Directory"]
            intent = "submit_complaint"
        elif any(w in msg_lower for w in ["urgent", "emergency", "danger", "fire", "shock", "hazard"]):
            reply = "For immediate physical hazards or security emergencies, please contact Campus Security or Emergency Services immediately at the Security Desk or call internal helpline 100/108."
            actions = ["Contact Security", "Mark as Urgent"]
            intent = "emergency"
        elif any(w in msg_lower for w in ["hello", "hi", "hey"]):
            reply = "Hello! I am CampusFix AI, your campus grievance and complaint assistant. How can I assist you today?"
            actions = ["Submit a Complaint", "Check Complaint Status", "Campus Analytics"]
            intent = "greeting"
        else:
            reply = "I'm here to help you navigate CampusFix. You can submit complaints, check resolution progress, view department contacts, or monitor campus-wide resolution statistics."
            actions = ["Browse Complaints", "View Analytics", "Submit Complaint"]
            intent = "help"

        return {
            "reply": reply,
            "suggested_actions": actions,
            "intent": intent
        }


# Module instance
ai_service = CampusFixAIService()
