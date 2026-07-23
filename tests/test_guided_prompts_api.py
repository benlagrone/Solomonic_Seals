import os
import unittest
from http import HTTPStatus
from pathlib import Path
from unittest.mock import patch

from src import webserver


REPO_ROOT = Path(__file__).resolve().parents[1]


class GuidedPromptsApiTests(unittest.TestCase):
    def test_builds_clock_owned_payload_for_pericope(self) -> None:
        payload, error, status = webserver._build_guided_prompts_payload(
            {
                "timezone": "America/Chicago",
                "as_of": "2026-03-13T20:15:00-05:00",
                "limit": 4,
                "persona_hint": "solomon",
                "mode": "landing",
            }
        )

        self.assertEqual(status, HTTPStatus.OK, error)
        self.assertIsNone(error)
        self.assertIsNotNone(payload)
        assert payload is not None

        self.assertEqual(payload["timezone"], "America/Chicago")
        self.assertEqual(payload["source"]["service"], "solomonic_clock")
        self.assertIn("daily_guidance", payload)
        self.assertIn("weekly_arc", payload)
        self.assertIn("daily_profile", payload)
        self.assertIn("content_bundle", payload)
        self.assertEqual(payload["persona_hint"], "solomon")
        self.assertEqual(payload["mode"], "landing")
        self.assertGreaterEqual(len(payload["guided_prompts"]), 1)
        self.assertLessEqual(len(payload["guided_prompts"]), 4)

        wisdom = payload["content_bundle"]["wisdom"]
        self.assertIn("ref", wisdom)
        self.assertIn("text", wisdom)
        self.assertNotEqual(wisdom["ref"], wisdom["text"])

    def test_guided_prompt_limit_is_clamped(self) -> None:
        payload, error, status = webserver._build_guided_prompts_payload(
            {
                "timezone": "UTC",
                "as_of": "2026-03-13T20:15:00+00:00",
                "limit": 99,
            }
        )

        self.assertEqual(status, HTTPStatus.OK, error)
        self.assertIsNone(error)
        self.assertIsNotNone(payload)
        assert payload is not None
        self.assertLessEqual(len(payload["guided_prompts"]), 6)

    def test_invalid_timezone_is_rejected(self) -> None:
        payload, error, status = webserver._build_guided_prompts_payload(
            {
                "timezone": "No/SuchZone",
                "as_of": "2026-03-13T20:15:00+00:00",
            }
        )

        self.assertEqual(status, HTTPStatus.BAD_REQUEST)
        self.assertIsNone(payload)
        self.assertIn("Invalid timezone", error or "")

    def test_clock_context_api_payload_omits_guided_prompts(self) -> None:
        payload, error, status = webserver._build_clock_context_payload(
            {
                "timezone": "America/Chicago",
                "as_of": "2026-03-13T20:15:00-05:00",
                "latitude": 41.8781,
                "longitude": -87.6298,
            }
        )

        self.assertEqual(status, HTTPStatus.OK, error)
        self.assertIsNone(error)
        self.assertIsNotNone(payload)
        assert payload is not None
        self.assertEqual(payload["source"]["service"], "solomonic_clock")
        self.assertEqual(payload["source"]["api"], webserver.CLOCK_CONTEXT_API_PATH)
        self.assertIn("daily_guidance", payload)
        self.assertIn("weekly_arc", payload)
        self.assertIn("daily_profile", payload)
        self.assertIn("why_selected", payload)
        self.assertIn("content_bundle", payload)
        self.assertEqual(payload["schema_version"], "clock-context-v2")
        self.assertEqual(payload["content_id"], "clock-content:guest:2026-03-13:America/Chicago:v1")
        self.assertEqual(payload["content_generation"]["status"], "ready")
        self.assertEqual(payload["content_generation"]["cache_status"], "deterministic")
        self.assertIn("section_content", payload)
        self.assertIn("counsel", payload["section_content"])
        self.assertIn("practice", payload["section_content"])
        self.assertIn("solomonic_meditation", payload["section_content"])
        self.assertIn("planetary_guidance", payload["section_content"])
        self.assertIn("timely_guidance", payload)
        self.assertEqual(payload["timely_guidance"]["valid_from"], "2026-03-13T20:00:00-05:00")
        self.assertEqual(payload["timely_guidance"]["valid_until"], "2026-03-13T21:00:00-05:00")
        self.assertIn("cited_works", payload)
        self.assertIn("sources", payload)
        self.assertNotIn("guided_prompts", payload)

    def test_public_clock_context_ignores_request_as_of(self) -> None:
        payload, error, status = webserver._build_public_clock_context_payload(
            {
                "timezone": "America/Chicago",
                "as_of": "1999-01-01T00:00:00-06:00",
                "latitude": 41.8781,
                "longitude": -87.6298,
            }
        )

        self.assertEqual(status, HTTPStatus.OK, error)
        self.assertIsNone(error)
        self.assertIsNotNone(payload)
        assert payload is not None
        self.assertEqual(payload["temporal_policy"], "fixed_now")
        self.assertNotIn("1999-01-01", payload["as_of"])
        self.assertNotIn("guided_prompts", payload)

    def test_clock_content_bundle_api_payload_is_context_slice(self) -> None:
        payload, error, status = webserver._build_clock_content_bundle_payload(
            {
                "timezone": "America/Chicago",
                "as_of": "2026-03-13T20:15:00-05:00",
            }
        )

        self.assertEqual(status, HTTPStatus.OK, error)
        self.assertIsNone(error)
        self.assertIsNotNone(payload)
        assert payload is not None
        self.assertEqual(payload["source"]["api"], webserver.CLOCK_CONTENT_BUNDLE_API_PATH)
        self.assertIn("content_bundle", payload)
        self.assertIn("psalm", payload["content_bundle"])
        self.assertIn("wisdom", payload["content_bundle"])
        self.assertIn("solomonic", payload["content_bundle"])
        psalm = payload["content_bundle"]["psalm"]
        self.assertIn("chapter_ref", psalm)
        self.assertIn("full_text", psalm)
        self.assertGreaterEqual(len(psalm["full_text"]), len(psalm["text"]))
        self.assertNotIn("guided_prompts", payload)

    def test_clock_wisdom_anchor_api_payload_resolves_source_text(self) -> None:
        payload, error, status = webserver._build_clock_wisdom_anchor_payload(
            {
                "timezone": "America/Chicago",
                "as_of": "2026-03-13T20:15:00-05:00",
            }
        )

        self.assertEqual(status, HTTPStatus.OK, error)
        self.assertIsNone(error)
        self.assertIsNotNone(payload)
        assert payload is not None
        self.assertEqual(payload["source"]["api"], webserver.CLOCK_WISDOM_ANCHOR_API_PATH)
        self.assertIn("wisdom", payload)
        self.assertIn("ref", payload["wisdom"])
        self.assertIn("text", payload["wisdom"])
        self.assertNotEqual(payload["wisdom"]["ref"], payload["wisdom"]["text"])
        self.assertNotIn("guided_prompts", payload)

    def test_clock_runtime_payload_exposes_compact_state_contract(self) -> None:
        payload, error, status = webserver._build_clock_runtime_payload(
            {
                "timezone": "America/Chicago",
                "as_of": "2026-03-13T20:15:00-05:00",
            }
        )

        self.assertEqual(status, HTTPStatus.OK, error)
        self.assertIsNone(error)
        self.assertIsNotNone(payload)
        assert payload is not None
        self.assertEqual(payload["timezone"], "America/Chicago")
        self.assertEqual(payload["data_source"]["api"], webserver.CLOCK_RUNTIME_API_PATH)
        self.assertEqual(payload["data_source"]["runtime_model"], "solar_event_planetary_hour")
        self.assertEqual(payload["location"]["latitude"], 41.8781)
        self.assertEqual(payload["location"]["longitude"], -87.6298)
        self.assertIn("planetary_day", payload)
        self.assertIn("planetary_hour", payload)
        self.assertEqual(payload["planetary_hour"]["calculation"], "solar_event_interval")
        self.assertEqual(payload["planetary_hour"]["sunrise_sunset_status"], "ok")
        self.assertIsNotNone(payload["planetary_hour"]["start"])
        self.assertIsNotNone(payload["planetary_hour"]["end"])
        self.assertEqual(payload["planetary_hour"]["index"], 14)
        self.assertEqual(payload["planetary_hour"]["ruler"], "Sun")
        self.assertEqual(payload["next_planetary_hour"]["index"], 15)
        self.assertEqual(payload["next_planetary_hour"]["ruler"], "Venus")
        self.assertEqual(payload["next_planetary_hour"]["start"], payload["planetary_hour"]["end"])
        self.assertEqual(payload["next_planetary_hour"]["calculation"], "solar_event_interval")
        self.assertEqual(payload["solar_events"]["status"], "ok")
        self.assertIsNotNone(payload["solar_events"]["sunrise"])
        self.assertIsNotNone(payload["solar_events"]["sunset"])
        self.assertIsInstance(payload["is_daylight"], bool)
        self.assertEqual(payload["zodiac"]["label"], "Pisces")
        self.assertEqual(payload["zodiac"]["degree_range"], "20–25")
        self.assertEqual(payload["zodiac"]["calculation"], "solar_longitude")
        self.assertEqual(payload["degree"]["status"], "ok")
        self.assertGreater(payload["degree"]["solar_longitude"], 353)
        self.assertLess(payload["degree"]["solar_longitude"], 354)
        self.assertEqual(payload["sector"]["index"], 71)
        self.assertEqual(payload["sector"]["spirit"], "Dantalion")
        self.assertEqual(payload["sector"]["calculation"], "solar_longitude_sector")
        self.assertIn("active_pentacle", payload)
        self.assertIn("indices", payload)

    def test_clock_runtime_payload_rejects_invalid_timezone(self) -> None:
        payload, error, status = webserver._build_clock_runtime_payload(
            {
                "timezone": "No/SuchZone",
                "as_of": "2026-03-13T20:15:00-05:00",
            }
        )

        self.assertEqual(status, HTTPStatus.BAD_REQUEST)
        self.assertIsNone(payload)
        self.assertIn("Invalid timezone", error or "")

    def test_clock_runtime_payload_rejects_invalid_location(self) -> None:
        payload, error, status = webserver._build_clock_runtime_payload(
            {
                "timezone": "America/Chicago",
                "as_of": "2026-03-13T20:15:00-05:00",
                "latitude": 100,
                "longitude": -87.6298,
            }
        )

        self.assertEqual(status, HTTPStatus.BAD_REQUEST)
        self.assertIsNone(payload)
        self.assertIn("Invalid latitude", error or "")

    def test_guided_prompts_auth_accepts_shared_header_or_bearer(self) -> None:
        self.assertEqual(
            webserver._extract_guided_prompts_supplied_key(
                {webserver.GUIDED_PROMPTS_AUTH_HEADER: " shared-secret "}
            ),
            "shared-secret",
        )
        self.assertEqual(
            webserver._extract_guided_prompts_supplied_key(
                {"Authorization": "Bearer shared-secret"}
            ),
            "shared-secret",
        )

    def test_expected_key_comes_only_from_server_environment(self) -> None:
        with patch.dict(os.environ, {webserver.GUIDED_PROMPTS_API_KEY_ENV: "server-secret"}):
            self.assertEqual(webserver._get_guided_prompts_expected_key(), "server-secret")

    def test_runtime_wisdom_ruler_data_is_reference_map_not_content_library(self) -> None:
        runtime_files = [
            REPO_ROOT / "src" / "webserver.py",
            REPO_ROOT / "web" / "clock.js",
            REPO_ROOT / "web" / "scripture_study.js",
        ]
        forbidden = [
            "WISDOM_CONTENT_BY_RULER",
            "A soft answer turneth away wrath",
            "Death and life are in the power of the tongue",
            "The path of the just is as the shining light",
            "To every thing there is a season",
        ]

        for path in runtime_files:
            source = path.read_text(encoding="utf-8")
            with self.subTest(path=path.name):
                self.assertIn("WISDOM_REFERENCE_BY_RULER", source)
                for snippet in forbidden:
                    self.assertNotIn(snippet, source)


if __name__ == "__main__":
    unittest.main()
