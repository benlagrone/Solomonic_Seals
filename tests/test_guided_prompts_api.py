import os
import unittest
import base64
import json
from datetime import datetime
from http import HTTPStatus
from pathlib import Path
from urllib.parse import parse_qs, urlparse
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
        self.assertEqual(wisdom["ref"], "Proverbs 13")

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
        self.assertIn(
            "Daily Proverb: calendar day 13 selects Proverbs 13.",
            payload["why_selected"]["reasons"],
        )
        self.assertIn("content_bundle", payload)
        self.assertEqual(payload["schema_version"], "clock-context-v2")
        self.assertEqual(payload["content_id"], "clock-content:guest:2026-03-13:America/Chicago:v1")
        self.assertEqual(payload["content_generation"]["status"], "ready")
        self.assertEqual(payload["content_generation"]["cache_status"], "deterministic")
        self.assertIn("moment", payload)
        self.assertEqual(payload["moment"]["as_of"], "2026-03-13T20:15:00-05:00")
        self.assertEqual(payload["moment"]["timezone"], "America/Chicago")
        self.assertEqual(
            set(payload["moment"]["scales"]),
            {"minute", "hour", "day", "week", "month", "season", "year", "decade", "lifespan", "era"},
        )
        self.assertEqual(
            set(payload["moment"]["scale_status"]["implemented"]),
            {"minute", "hour", "day", "week", "month", "season", "year", "decade"},
        )
        self.assertEqual(set(payload["moment"]["scale_status"]["declared_future"]), {"lifespan", "era"})
        self.assertEqual(set(payload["moment"]["scale_status"]["unmeasured"]), {"lifespan", "era"})
        self.assertEqual(payload["moment"]["scales"]["hour"]["position"], 0.25)
        self.assertEqual(payload["moment"]["scales"]["hour"]["phase"]["key"], "rising")
        self.assertEqual(payload["moment"]["scales"]["hour"]["implementation_status"], "implemented")
        self.assertIn("evidence_profile", payload["moment"]["scales"]["hour"])
        self.assertIn("calculation", payload["moment"]["scales"]["hour"]["evidence_profile"])
        self.assertEqual(payload["moment"]["scales"]["day"]["phase"]["key"], "declining")
        self.assertIsNone(payload["moment"]["scales"]["lifespan"]["position"])
        self.assertEqual(payload["moment"]["scales"]["lifespan"]["implementation_status"], "declared_future")
        self.assertEqual(payload["moment"]["scales"]["lifespan"]["precision"], "unmeasured")
        self.assertIn("false personal precision", payload["moment"]["scales"]["lifespan"]["evidence_profile"]["limitations"][0])
        self.assertGreaterEqual(len(payload["moment"]["resonances"]), 1)
        self.assertGreaterEqual(len(payload["moment"]["tensions"]), 1)
        self.assertIn("section_content", payload)
        self.assertIn("counsel", payload["section_content"])
        self.assertIn("practice", payload["section_content"])
        self.assertIn("temporal_scales", payload["section_content"])
        self.assertIn("summary", payload["section_content"]["temporal_scales"])
        self.assertEqual(
            payload["section_content"]["temporal_scales"]["scales"]["hour"],
            payload["moment"]["scales"]["hour"],
        )
        self.assertIn("solomonic_meditation", payload["section_content"])
        self.assertIn("planetary_guidance", payload["section_content"])
        self.assertIn("timely_guidance", payload)
        self.assertEqual(payload["timely_guidance"]["valid_from"], "2026-03-13T20:00:00-05:00")
        self.assertEqual(payload["timely_guidance"]["valid_until"], "2026-03-13T21:00:00-05:00")
        self.assertIn("cited_works", payload)
        cited_work_records = [work for work in payload["cited_works"] if work.get("kind") == "cited_work"]
        self.assertGreaterEqual(len(cited_work_records), 1)
        self.assertIn(cited_work_records[0]["author"], {"Marcus Aurelius", "Benjamin Franklin", "Adam Smith"})
        self.assertEqual(cited_work_records[0]["editorial_review"]["status"], "reviewed_seed")
        self.assertIn("relation_to_moment", cited_work_records[0])
        self.assertIn(
            "cited_work_passages",
            payload["section_content"]["solomonic_meditation"],
        )
        self.assertEqual(
            payload["section_content"]["solomonic_meditation"]["cited_work_passages"],
            cited_work_records,
        )
        self.assertNotIn("persona", json.dumps(cited_work_records).lower())
        self.assertIn("sources", payload)
        self.assertIn(
            "passage-meaning-seed-v1",
            {source["id"] for source in payload["sources"]},
        )
        self.assertNotIn("guided_prompts", payload)

    def test_passage_meaning_seed_records_are_reviewed_and_clock_eligible(self) -> None:
        payload = webserver._load_passage_meaning_records()
        records = payload["records"]

        authors = {record["author"] for record in records}
        self.assertTrue({"Marcus Aurelius", "Benjamin Franklin", "Adam Smith"}.issubset(authors))
        for record in records:
            self.assertTrue(record["passage_id"])
            self.assertEqual(record["editorial_review"]["status"], "reviewed_seed")
            self.assertIn("clock_relevance", record)
            self.assertIn("practice_tags", record["clock_relevance"])
            self.assertLessEqual(len(record["excerpt"].split()), 25)

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
        self.assertIn("moment", payload)
        self.assertNotIn("1999-01-01", payload["moment"]["as_of"])
        self.assertIn("temporal_scales", payload["section_content"])
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
        self.assertEqual(payload["wisdom"]["ref"], "Proverbs 13")
        self.assertNotIn("guided_prompts", payload)

    def test_proverb_reference_follows_calendar_day_of_month(self) -> None:
        self.assertEqual(
            webserver._get_proverb_reference_for_date(datetime(2026, 7, 20)),
            "Proverbs 20",
        )
        self.assertEqual(
            webserver._get_proverb_reference_for_date(datetime(2026, 7, 31)),
            "Proverbs 31",
        )

    def test_pericope_chat_launch_payload_encodes_clock_context_metadata(self) -> None:
        payload, error, status = webserver._build_pericope_chat_launch_payload(
            {
                "timezone": "America/Chicago",
                "as_of": "1999-01-01T00:00:00-06:00",
                "mode": "guided",
                "message_override": "How should I carry today's proverb into one concrete act?",
                "prompt_id": "manual-proverb-practice",
                "base_url": "https://pericopeai.com",
            }
        )

        self.assertEqual(status, HTTPStatus.OK, error)
        self.assertIsNone(error)
        self.assertIsNotNone(payload)
        assert payload is not None

        self.assertEqual(payload["mode"], "guided")
        self.assertEqual(payload["source"], "solomonic_clock")
        self.assertEqual(payload["prompt_id"], "manual-proverb-practice")
        self.assertEqual(payload["message"], "How should I carry today's proverb into one concrete act?")
        self.assertIn("ctx", payload)
        self.assertNotIn("guided_prompts", payload["clock_context"])
        self.assertNotIn("1999-01-01", payload["clock_context"]["as_of"])
        self.assertEqual(payload["clock_context"]["temporal_policy"], "fixed_now")
        self.assertEqual(payload["clock_context"]["handoff"]["ctx_is_metadata"], True)

        parsed_url = urlparse(payload["launch_url"])
        query = parse_qs(parsed_url.query)
        self.assertEqual(parsed_url.scheme, "https")
        self.assertEqual(parsed_url.netloc, "pericopeai.com")
        self.assertEqual(parsed_url.path, "/chat")
        self.assertEqual(query["mode"], ["guided"])
        self.assertEqual(query["source"], ["solomonic_clock"])
        self.assertEqual(query["message"], [payload["message"]])
        self.assertEqual(query["prompt_id"], ["manual-proverb-practice"])
        self.assertEqual(query["ctx"], [payload["ctx"]])

        padded_ctx = payload["ctx"] + "=" * ((4 - (len(payload["ctx"]) % 4)) % 4)
        decoded_context = json.loads(base64.urlsafe_b64decode(padded_ctx.encode("ascii")).decode("utf-8"))
        self.assertEqual(decoded_context["content_id"], payload["clock_context"]["content_id"])
        self.assertEqual(decoded_context["handoff"]["message_is_user_facing"], True)
        self.assertNotIn("Clock context is attached", payload["message"])

    def test_pericope_chat_launch_payload_selects_prompt_when_override_missing(self) -> None:
        payload, error, status = webserver._build_pericope_chat_launch_payload(
            {
                "timezone": "America/Chicago",
                "as_of": "2026-03-13T20:15:00-05:00",
            }
        )

        self.assertEqual(status, HTTPStatus.OK, error)
        self.assertIsNone(error)
        self.assertIsNotNone(payload)
        assert payload is not None
        self.assertEqual(payload["mode"], "guided")
        self.assertTrue(payload["message"])
        self.assertTrue(payload["prompt_id"])
        self.assertNotIn("Launch context", payload["message"])

    def test_pericope_chat_launch_payload_preserves_client_context_overlay(self) -> None:
        payload, error, status = webserver._build_pericope_chat_launch_payload(
            {
                "timezone": "America/Chicago",
                "as_of": "1999-01-01T00:00:00-06:00",
                "mode": "guided",
                "message_override": "Help me examine today's guidance in light of this reflection.",
                "prompt_id": "reflection-mind-mercury",
                "client_context": {
                    "as_of": "1999-01-01T00:00:00-06:00",
                    "timezone": "Bad/Override",
                    "temporal_policy": "client_supplied",
                    "reflection": "I avoided the hard conversation.",
                    "rule_of_life": {
                        "virtue": "Prudence",
                        "domain": "Mind",
                    },
                    "weekly_review": {
                        "carry_forward": "Name the conversation before noon.",
                    },
                    "guided_prompts": [{"id": "should-not-merge"}],
                },
            }
        )

        self.assertEqual(status, HTTPStatus.OK, error)
        self.assertIsNone(error)
        self.assertIsNotNone(payload)
        assert payload is not None

        context = payload["clock_context"]
        self.assertNotIn("1999-01-01", context["as_of"])
        self.assertEqual(context["timezone"], "America/Chicago")
        self.assertEqual(context["temporal_policy"], "fixed_now")
        self.assertNotIn("guided_prompts", context)
        self.assertEqual(context["reflection"], "I avoided the hard conversation.")
        self.assertEqual(context["rule_of_life"]["virtue"], "Prudence")
        self.assertEqual(context["weekly_review"]["carry_forward"], "Name the conversation before noon.")

        padded_ctx = payload["ctx"] + "=" * ((4 - (len(payload["ctx"]) % 4)) % 4)
        decoded_context = json.loads(base64.urlsafe_b64decode(padded_ctx.encode("ascii")).decode("utf-8"))
        self.assertEqual(decoded_context["reflection"], "I avoided the hard conversation.")
        self.assertEqual(decoded_context["handoff"]["prompt_id"], "reflection-mind-mercury")

    def test_pericope_chat_launch_payload_keeps_freeform_blank_when_no_override(self) -> None:
        payload, error, status = webserver._build_pericope_chat_launch_payload(
            {
                "timezone": "America/Chicago",
                "mode": "freeform",
                "base_url": "https://pericopeai.com",
            }
        )

        self.assertEqual(status, HTTPStatus.OK, error)
        self.assertIsNone(error)
        self.assertIsNotNone(payload)
        assert payload is not None
        self.assertEqual(payload["mode"], "freeform")
        self.assertEqual(payload["message"], "")
        self.assertEqual(payload["prompt_id"], "")

        parsed_url = urlparse(payload["launch_url"])
        query = parse_qs(parsed_url.query)
        self.assertEqual(query["mode"], ["freeform"])
        self.assertNotIn("prompt_id", query)
        self.assertNotIn("message", query)

    def test_pericope_chat_launch_payload_rejects_invalid_timezone(self) -> None:
        payload, error, status = webserver._build_pericope_chat_launch_payload(
            {
                "timezone": "No/SuchZone",
            }
        )

        self.assertEqual(status, HTTPStatus.BAD_REQUEST)
        self.assertIsNone(payload)
        self.assertIn("Invalid timezone", error or "")

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

    def test_runtime_proverb_selection_uses_calendar_date_not_ruler_map(self) -> None:
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
                self.assertNotIn("WISDOM_REFERENCE_BY_RULER", source)
                for snippet in forbidden:
                    self.assertNotIn(snippet, source)


if __name__ == "__main__":
    unittest.main()
