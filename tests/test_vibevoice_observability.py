import os
import unittest
from unittest.mock import patch

from src.webserver import (
    _annotate_vibevoice_response,
    _build_vibevoice_health_payload,
)


class VibeVoiceObservabilityTests(unittest.TestCase):
    def test_health_payload_exposes_configuration_without_token_value(self) -> None:
        with patch.dict(
            os.environ,
            {
                "SOLOMONIC_VIBEVOICE_API_BASE": "http://192.168.0.126:8011",
                "SOLOMONIC_VIBEVOICE_FALLBACK_API_BASE": "http://192.168.0.126:8013",
                "SOLOMONIC_VIBEVOICE_API_TOKEN": "secret-token",
                "SOLOMONIC_VIBEVOICE_PROJECT_ID": "solomonic-seals",
                "SOLOMONIC_VIBEVOICE_SPEAKER": "Carter",
            },
            clear=False,
        ):
            payload = _build_vibevoice_health_payload()

        self.assertEqual(payload["status"], "configured")
        self.assertTrue(payload["token_configured"])
        self.assertEqual(payload["primary"]["engine"], "official")
        self.assertEqual(payload["fallback"]["engine"], "azure-speech")
        self.assertNotIn("secret-token", repr(payload))

    def test_health_payload_keeps_token_presence_separate_from_route_readiness(self) -> None:
        with patch.dict(
            os.environ,
            {
                "SOLOMONIC_VIBEVOICE_API_TOKEN": "",
                "VIBEVOICE_API_TOKEN": "",
            },
            clear=False,
        ):
            payload = _build_vibevoice_health_payload()

        self.assertEqual(payload["status"], "configured")
        self.assertFalse(payload["token_configured"])

    def test_job_annotation_infers_fallback_engine_and_proxy_audio_url(self) -> None:
        payload = _annotate_vibevoice_response(
            {
                "job_id": "azv-20260608-000615-773d",
                "status": "completed",
                "audio_url": "/files/audio/vibevoice/sample.wav",
            },
            "fallback",
        )

        self.assertEqual(payload["proxy_route"], "fallback")
        self.assertEqual(payload["engine"], "azure-speech")
        self.assertEqual(payload["proxy_engine"], "azure-speech")
        self.assertTrue(payload["proxy_audio_url"].startswith("/api/vibevoice/audio?url="))


if __name__ == "__main__":
    unittest.main()
