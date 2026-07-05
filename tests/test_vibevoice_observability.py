import os
import unittest
from http import HTTPStatus
from unittest.mock import patch

from src.webserver import (
    _annotate_vibevoice_response,
    _build_vibevoice_health_payload,
    _build_vibevoice_job_payload,
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

    def test_primary_missing_token_error_falls_back_when_no_app_token_is_configured(self) -> None:
        with (
            patch.dict(
                os.environ,
                {
                    "SOLOMONIC_VIBEVOICE_API_TOKEN": "",
                    "VIBEVOICE_API_TOKEN": "",
                },
                clear=False,
            ),
            patch(
                "src.webserver._fetch_vibevoice_json",
                side_effect=[
                    ValueError(
                        'VibeVoice request failed (401): {"detail":"Invalid or missing VibeVoice API token."}.'
                    ),
                    {
                        "job_id": "azv-20260705-045206-test",
                        "status": "completed",
                        "audio_url": "/files/audio/vibevoice/test.wav",
                        "engine": "azure-speech",
                    },
                ],
            ) as fetch_json,
        ):
            payload, error, status = _build_vibevoice_job_payload({"text": "fallback probe"})

        self.assertIsNone(error)
        self.assertEqual(status, HTTPStatus.ACCEPTED)
        self.assertEqual(payload["proxy_route"], "fallback")
        self.assertEqual(payload["proxy_engine"], "azure-speech")
        self.assertEqual(fetch_json.call_count, 2)

    def test_primary_auth_error_is_preserved_when_app_token_is_configured(self) -> None:
        with (
            patch.dict(
                os.environ,
                {
                    "SOLOMONIC_VIBEVOICE_API_TOKEN": "configured-token",
                    "VIBEVOICE_API_TOKEN": "",
                },
                clear=False,
            ),
            patch(
                "src.webserver._fetch_vibevoice_json",
                side_effect=ValueError(
                    'VibeVoice request failed (401): {"detail":"Invalid or missing VibeVoice API token."}.'
                ),
            ) as fetch_json,
        ):
            payload, error, status = _build_vibevoice_job_payload({"text": "auth probe"})

        self.assertIsNone(payload)
        self.assertIn("Invalid or missing VibeVoice API token", error)
        self.assertEqual(status, HTTPStatus.UNAUTHORIZED)
        self.assertEqual(fetch_json.call_count, 1)


if __name__ == "__main__":
    unittest.main()
