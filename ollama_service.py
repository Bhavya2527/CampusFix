"""
Ollama Service Module for CampusFix.

Handles local inference communication with the Ollama server at http://localhost:11434.
Strictly offline: No external cloud AI APIs are used.
"""

import json
import logging
import os
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, List, Optional

logger = logging.getLogger("campusfix.ai.ollama_service")


class OllamaError(Exception):
    """Base exception for all Ollama-related failures."""
    pass


class OllamaConnectionError(OllamaError):
    """Raised when the Ollama server cannot be reached."""
    pass


class OllamaModelNotFoundError(OllamaError):
    """Raised when the requested model is not installed in Ollama or OLLAMA_MODEL is unset."""
    pass


class OllamaTimeoutError(OllamaError):
    """Raised when an inference request times out."""
    pass


class OllamaResponseError(OllamaError):
    """Raised when Ollama returns an HTTP error or an invalid response format."""
    pass


class OllamaService:
    """Service client for interacting with a local Ollama instance."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        timeout: Optional[float] = None,
    ) -> None:
        """
        Initialize the Ollama service client.

        :param base_url: Base URL for Ollama. Defaults to env OLLAMA_BASE_URL or http://localhost:11434.
        :param timeout: Request timeout in seconds. Defaults to env OLLAMA_TIMEOUT or 60.0.
        """
        self.base_url = (
            base_url
            or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        ).rstrip("/")

        env_timeout = os.getenv("OLLAMA_TIMEOUT")
        if timeout is not None:
            self.timeout = float(timeout)
        elif env_timeout:
            try:
                self.timeout = float(env_timeout)
            except ValueError:
                self.timeout = 90.0
        else:
            self.timeout = 90.0

    def get_configured_model(self, model_override: Optional[str] = None) -> str:
        """
        Resolve the target model name from the environment variable OLLAMA_MODEL or override.
        Strict requirement: Does not assume a model is installed.
        """
        model = model_override or os.getenv("OLLAMA_MODEL")
        if not model or not model.strip():
            raise OllamaModelNotFoundError(
                "Environment variable 'OLLAMA_MODEL' is not set. "
                "Please configure OLLAMA_MODEL with the name of an installed model (e.g. 'gemma4:e4b')."
            )
        return model.strip()

    def list_models(self) -> List[str]:
        """
        Query Ollama for the list of locally installed models.

        :raises OllamaConnectionError: If Ollama daemon is unreachable.
        :raises OllamaResponseError: If the server returns an unexpected response.
        :return: List of installed model tags.
        """
        endpoint = f"{self.base_url}/api/tags"
        req = urllib.request.Request(endpoint, method="GET")

        try:
            with urllib.request.urlopen(req, timeout=10.0) as response:
                status_code = response.getcode()
                if status_code != 200:
                    raise OllamaResponseError(
                        f"Ollama returned HTTP status {status_code} while listing models."
                    )
                raw_data = response.read().decode("utf-8")
                payload = json.loads(raw_data)
                models = [m.get("name", "") for m in payload.get("models", []) if m.get("name")]
                return models
        except urllib.error.URLError as e:
            if isinstance(e.reason, (ConnectionRefusedError, TimeoutError)) or "WinError 10061" in str(e):
                raise OllamaConnectionError(
                    f"Unable to connect to Ollama at '{self.base_url}'. "
                    "Please ensure the Ollama service is running locally (`ollama serve`)."
                ) from e
            raise OllamaConnectionError(f"Network error communicating with Ollama: {e.reason}") from e
        except json.JSONDecodeError as e:
            raise OllamaResponseError(f"Failed to parse Ollama model listing: {e}") from e
        except Exception as e:
            raise OllamaConnectionError(f"Unexpected error communicating with Ollama: {e}") from e

    def verify_model_installed(self, model_name: str) -> None:
        """
        Verify that the requested model is installed in the local Ollama instance.

        :param model_name: Name of model to check (e.g. 'gemma4:e4b').
        :raises OllamaModelNotFoundError: If the model is not found in the local installation.
        """
        available = self.list_models()
        # Direct match or match without tag if tag omitted
        normalized_name = model_name if ":" in model_name else f"{model_name}:latest"
        match = any(
            m == model_name or m == normalized_name or m.split(":")[0] == model_name
            for m in available
        )
        if not match:
            raise OllamaModelNotFoundError(
                f"Model '{model_name}' is not installed in local Ollama. "
                f"Installed models: {available}. "
                f"Set OLLAMA_MODEL to one of the installed models."
            )

    def generate(
        self,
        prompt: str,
        system: Optional[str] = None,
        model: Optional[str] = None,
        format_json: bool = False,
        temperature: float = 0.1,
        max_tokens: Optional[int] = None,
        timeout: Optional[float] = None,
    ) -> str:
        """
        Execute an offline text generation request against the local Ollama server.

        :param prompt: The input prompt.
        :param system: Optional system instruction prompt.
        :param model: Optional model override. If None, reads from OLLAMA_MODEL.
        :param format_json: If True, instructs Ollama to enforce valid JSON output format.
        :param temperature: Sampling temperature (0.0 to 1.0).
        :param max_tokens: Maximum number of tokens to predict.
        :param timeout: Optional override for request timeout in seconds.
        :return: Generated text response string from the model.
        :raises OllamaConnectionError: If connection cannot be established.
        :raises OllamaModelNotFoundError: If OLLAMA_MODEL is not set or not installed.
        :raises OllamaTimeoutError: If inference exceeds the timeout.
        :raises OllamaResponseError: If an error status or invalid response occurs.
        """
        target_model = self.get_configured_model(model)
        self.verify_model_installed(target_model)

        endpoint = f"{self.base_url}/api/generate"
        req_timeout = timeout if timeout is not None else self.timeout

        options: Dict[str, Any] = {
            "temperature": max(0.0, min(temperature, 1.0)),
        }
        if max_tokens is not None and max_tokens > 0:
            options["num_predict"] = max_tokens

        payload: Dict[str, Any] = {
            "model": target_model,
            "prompt": prompt,
            "stream": False,
            "options": options,
        }

        if system:
            payload["system"] = system

        if format_json:
            payload["format"] = "json"

        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            endpoint,
            data=data_bytes,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=req_timeout) as response:
                status_code = response.getcode()
                if status_code != 200:
                    raise OllamaResponseError(
                        f"Ollama returned HTTP status {status_code} during generation."
                    )
                raw_body = response.read().decode("utf-8")
                res_obj = json.loads(raw_body)
                if "error" in res_obj:
                    raise OllamaResponseError(f"Ollama error: {res_obj['error']}")
                return res_obj.get("response", "")

        except urllib.error.HTTPError as e:
            try:
                err_body = e.read().decode("utf-8")
                err_json = json.loads(err_body)
                err_msg = err_json.get("error", str(e))
            except Exception:
                err_msg = str(e)
            if e.code == 404:
                raise OllamaModelNotFoundError(f"Model '{target_model}' not found on Ollama: {err_msg}") from e
            raise OllamaResponseError(f"Ollama HTTP error {e.code}: {err_msg}") from e

        except urllib.error.URLError as e:
            if isinstance(e.reason, (TimeoutError, TimeoutError)) or "timed out" in str(e.reason).lower():
                raise OllamaTimeoutError(
                    f"Inference timed out after {req_timeout:.1f} seconds. "
                    "Ensure your GPU/CPU is not overburdened."
                ) from e
            if isinstance(e.reason, (ConnectionRefusedError,)) or "WinError 10061" in str(e):
                raise OllamaConnectionError(
                    f"Connection refused at '{self.base_url}'. "
                    "Ollama is not running locally. Please start it with `ollama serve`."
                ) from e
            raise OllamaConnectionError(f"Failed to communicate with Ollama: {e.reason}") from e

        except TimeoutError as e:
            raise OllamaTimeoutError(
                f"Inference timed out after {req_timeout:.1f} seconds."
            ) from e

        except json.JSONDecodeError as e:
            raise OllamaResponseError(f"Invalid JSON returned by Ollama service: {e}") from e

        except Exception as e:
            raise OllamaError(f"Unexpected error during Ollama generation: {e}") from e

    def check_health(self) -> Dict[str, Any]:
        """
        Return the health status of the local Ollama service and configured model.
        """
        try:
            models = self.list_models()
            model_configured = os.getenv("OLLAMA_MODEL")
            model_installed = bool(
                model_configured and any(
                    m == model_configured or m.startswith(f"{model_configured}:")
                    for m in models
                )
            )
            return {
                "status": "healthy",
                "base_url": self.base_url,
                "configured_model": model_configured,
                "is_model_installed": model_installed,
                "installed_models": models,
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "base_url": self.base_url,
                "error": str(e),
                "configured_model": os.getenv("OLLAMA_MODEL"),
                "is_model_installed": False,
                "installed_models": [],
            }
