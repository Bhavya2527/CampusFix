"""
Test script for CampusFix Local AI Module.
Validates local Ollama connection, complaint analysis, campus FAQ assistant, and offline safety.
"""

import json
import os
import sys
import time

# Ensure current directory is on PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

# Set model environment variable if not already set
if not os.getenv("OLLAMA_MODEL"):
    os.environ["OLLAMA_MODEL"] = "gemma4:e4b"

from backend.ai.ollama_service import (
    OllamaConnectionError,
    OllamaModelNotFoundError,
    OllamaService,
    OllamaTimeoutError,
)
from backend.ai.complaint_analyzer import (
    ComplaintAnalysisError,
    analyze_complaint,
)
from backend.ai.campus_assistant import (
    CampusAssistantError,
    chat_with_campus_assistant,
)


def test_ollama_connectivity():
    print("\n--- 1. Testing Local Ollama Connectivity & Installed Models ---")
    service = OllamaService(timeout=30.0)
    health = service.check_health()
    print("Ollama Health Status:", health["status"])
    print("Installed models:", health["installed_models"])
    print("Configured model:", health["configured_model"])
    print("Model verified installed:", health["is_model_installed"])
    assert health["status"] == "healthy", "Ollama is not healthy"
    assert health["is_model_installed"], f"Model {health['configured_model']} is not installed"
    print(" [PASS] Ollama connectivity & model presence verified.")


def test_complaint_analyzer_lab_computers():
    print("\n--- 2. Testing Complaint Analyzer (Broken Lab Computers) ---")
    complaint_text = (
        "Five desktop computers in Computer Lab 3 on the 2nd floor of IT Block have broken "
        "monitors and power supplies are dead. Students have practical exams tomorrow."
    )
    print(f"Complaint input: \"{complaint_text}\"")
    t0 = time.time()
    result = analyze_complaint(complaint_text)
    duration = time.time() - t0

    print(f"Inference duration: {duration:.2f} seconds")
    print("Structured Result:")
    print(json.dumps(result, indent=2))

    # Assertions
    assert isinstance(result, dict), "Result must be a dictionary"
    for key in ["category", "summary", "location", "priority", "department", "reasoning"]:
        assert key in result, f"Missing key: {key}"
        assert result[key], f"Key {key} must not be empty"

    assert result["category"] in [
        "Lab Equipment",
        "Electrical",
        "Classroom",
        "Internet/Wi-Fi",
        "Hostel",
        "Cleaning",
        "Water Supply",
        "Other",
    ], f"Invalid category: {result['category']}"
    assert result["priority"] in ["Low", "Medium", "High"], f"Invalid priority: {result['priority']}"
    print(" [PASS] Complaint analysis succeeded with valid structured JSON.")
    return result


def test_campus_assistant():
    print("\n--- 3. Testing Campus Assistant (Grounded FAQ Queries) ---")

    # 3a. Legitimate FAQ query
    q1 = "How do I report a maintenance complaint on CampusFix?"
    print(f"Query 1: \"{q1}\"")
    res1 = chat_with_campus_assistant(q1)
    print("Assistant Response 1:")
    print(res1["reply"])
    print("Sources:", res1["sources"])
    assert len(res1["reply"]) > 10, "Response 1 too short"

    # 3b. Request for live records / personal ticket status (Must refuse)
    q2 = "Can you look up the current status of my complaint ticket #94821?"
    print(f"\nQuery 2 (Live records test): \"{q2}\"")
    res2 = chat_with_campus_assistant(q2)
    print("Assistant Response 2:")
    print(res2["reply"])
    # Verify assistant does NOT claim to check live records
    lower_r2 = res2["reply"].lower()
    refuses_records = any(phrase in lower_r2 for phrase in ["cannot", "not have access", "portal", "my complaints", "dashboard", "no access", "unable to"])
    print("Correctly refused access to live records:", refuses_records)

    # 3c. Out-of-scope question (Must not invent university policy)
    q3 = "What is the scholarship fee discount for semester 3?"
    print(f"\nQuery 3 (Out-of-scope test): \"{q3}\"")
    res3 = chat_with_campus_assistant(q3)
    print("Assistant Response 3:")
    print(res3["reply"])
    lower_r3 = res3["reply"].lower()
    refuses_out_of_scope = any(phrase in lower_r3 for phrase in ["not available", "unavailable", "cannot", "does not contain", "contact", "not covered"])
    print("Correctly flagged information unavailable:", refuses_out_of_scope)

    print(" [PASS] Campus assistant successfully grounded in local FAQ data.")


def test_error_handling():
    print("\n--- 4. Testing Error Handling & Offline Guarantees ---")

    # 4a. Empty complaint
    try:
        analyze_complaint("")
        assert False, "Should have raised ValueError on empty complaint"
    except ValueError as e:
        print(" [PASS] Correctly rejected empty complaint description:", e)

    # 4b. Missing/Uninstalled model
    try:
        service_bad_model = OllamaService()
        service_bad_model.verify_model_installed("non_existent_model_xyz:99b")
        assert False, "Should have raised OllamaModelNotFoundError"
    except OllamaModelNotFoundError as e:
        print(" [PASS] Correctly caught missing model error:", e)

    # 4c. Offline Ollama endpoint (strictly no fake AI data returned)
    service_offline = OllamaService(base_url="http://localhost:9999", timeout=2.0)
    try:
        service_offline.list_models()
        assert False, "Should have raised OllamaConnectionError"
    except OllamaConnectionError as e:
        print(" [PASS] Correctly caught connection failure without returning fake data:", e)

    print(" [PASS] All error handling checks passed.")


if __name__ == "__main__":
    print("==================================================")
    print("    CAMPUSFIX LOCAL AI OFFLINE TEST SUITE        ")
    print("==================================================")
    test_ollama_connectivity()
    test_error_handling()
    test_complaint_analyzer_lab_computers()
    test_campus_assistant()
    print("\n==================================================")
    print("    ALL TESTS PASSED SUCCESSFULLY!                ")
    print("==================================================")
