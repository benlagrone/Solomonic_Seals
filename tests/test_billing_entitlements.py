import os
import hashlib
import hmac
import json
import tempfile
import time
import unittest
from http import HTTPStatus
from pathlib import Path
from unittest.mock import patch

from src.webserver import (
    _authorize_paid_feature,
    _apply_billing_fulfillment,
    _build_billing_entitlement_payload,
    _finalize_free_voice_reservation,
    _proxy_stripe_webhook,
)


class BillingEntitlementTests(unittest.TestCase):
    def _dev_headers(self, roles: str = "") -> dict[str, str]:
        headers = {"X-Dev-Auth-Sub": "billing-test-user"}
        if roles:
            headers["X-Dev-Auth-Roles"] = roles
        return headers

    def test_disabled_mode_preserves_existing_voice_access(self) -> None:
        with patch.dict(os.environ, {"SOLOMONIC_BILLING_ENFORCEMENT": "disabled"}, clear=False):
            allowed, status, error, billing = _authorize_paid_feature({}, "voice_generation")

        self.assertTrue(allowed)
        self.assertEqual(status, HTTPStatus.OK)
        self.assertIsNone(error)
        self.assertEqual(billing["enforcement_mode"], "disabled")

    def test_audit_mode_marks_free_user_without_blocking(self) -> None:
        with patch.dict(
            os.environ,
            {
                "SOLOMONIC_BILLING_ENFORCEMENT": "audit",
                "SOLOMONIC_DEV_FAKE_AUTH": "true",
                "SOLOMONIC_DEV_FAKE_AUTH_DEFAULT_ROLES": "",
            },
            clear=False,
        ):
            allowed, status, error, billing = _authorize_paid_feature(
                self._dev_headers(),
                "voice_generation",
            )

        self.assertTrue(allowed)
        self.assertEqual(status, HTTPStatus.OK)
        self.assertIsNone(error)
        self.assertTrue(billing["would_deny_paid_features"])
        self.assertFalse(billing["has_paid_access"])

    def test_entitlement_environment_defaults_to_test_when_enabled(self) -> None:
        with patch.dict(
            os.environ,
            {
                "SOLOMONIC_BILLING_ENFORCEMENT": "audit",
                "SOLOMONIC_DEV_FAKE_AUTH": "true",
            },
            clear=False,
        ):
            payload, error, status = _build_billing_entitlement_payload(self._dev_headers())

        self.assertIsNone(error)
        self.assertEqual(status, HTTPStatus.OK)
        self.assertEqual(payload["environment"], "test")

    def test_entitlement_environment_can_be_marked_live(self) -> None:
        with patch.dict(
            os.environ,
            {
                "SOLOMONIC_BILLING_ENFORCEMENT": "audit",
                "SOLOMONIC_BILLING_ENVIRONMENT": "live",
                "SOLOMONIC_DEV_FAKE_AUTH": "true",
            },
            clear=False,
        ):
            payload, error, status = _build_billing_entitlement_payload(self._dev_headers())

        self.assertIsNone(error)
        self.assertEqual(status, HTTPStatus.OK)
        self.assertEqual(payload["environment"], "live")

    def test_disabled_entitlement_environment_is_unconfigured(self) -> None:
        with patch.dict(
            os.environ,
            {
                "SOLOMONIC_BILLING_ENFORCEMENT": "disabled",
                "SOLOMONIC_BILLING_ENVIRONMENT": "live",
            },
            clear=False,
        ):
            payload, error, status = _build_billing_entitlement_payload({})

        self.assertIsNone(error)
        self.assertEqual(status, HTTPStatus.OK)
        self.assertEqual(payload["environment"], "unconfigured")

    def test_enforce_mode_requires_sign_in(self) -> None:
        with patch.dict(os.environ, {"SOLOMONIC_BILLING_ENFORCEMENT": "enforce"}, clear=False):
            allowed, status, error, billing = _authorize_paid_feature({}, "voice_generation")

        self.assertFalse(allowed)
        self.assertEqual(status, HTTPStatus.UNAUTHORIZED)
        self.assertIn("Sign in", error)
        self.assertFalse(billing["authenticated"])

    def test_enforce_mode_gives_free_user_three_daily_voice_requests(self) -> None:
        with tempfile.TemporaryDirectory() as tempdir, patch.dict(
            os.environ,
            {
                "SOLOMONIC_BILLING_ENFORCEMENT": "enforce",
                "SOLOMONIC_BILLING_STORE_PATH": str(Path(tempdir) / "billing.json"),
                "SOLOMONIC_FREE_VOICE_DAILY_LIMIT": "3",
                "SOLOMONIC_DEV_FAKE_AUTH": "true",
                "SOLOMONIC_DEV_FAKE_AUTH_DEFAULT_ROLES": "",
            },
            clear=False,
        ):
            for expected_remaining in (2, 1, 0):
                allowed, status, error, billing = _authorize_paid_feature(
                    self._dev_headers(), "voice_generation"
                )
                self.assertTrue(allowed)
                self.assertEqual(status, HTTPStatus.OK)
                self.assertIsNone(error)
                self.assertEqual(billing["tier"], "free")
                self.assertEqual(billing["free_voice_remaining_today"], expected_remaining)

            allowed, status, error, billing = _authorize_paid_feature(
                self._dev_headers(), "voice_generation"
            )

        self.assertFalse(allowed)
        self.assertEqual(status, HTTPStatus.TOO_MANY_REQUESTS)
        self.assertIn("daily free voice limit", error.lower())
        self.assertEqual(billing["voice_access"], "quota_exhausted")

    def test_failed_voice_job_refunds_free_reservation(self) -> None:
        with tempfile.TemporaryDirectory() as tempdir, patch.dict(
            os.environ,
            {
                "SOLOMONIC_BILLING_ENFORCEMENT": "enforce",
                "SOLOMONIC_BILLING_STORE_PATH": str(Path(tempdir) / "billing.json"),
                "SOLOMONIC_FREE_VOICE_DAILY_LIMIT": "1",
                "SOLOMONIC_DEV_FAKE_AUTH": "true",
            },
            clear=False,
        ):
            allowed, _, _, billing = _authorize_paid_feature(
                self._dev_headers(), "voice_generation"
            )
            self.assertTrue(allowed)
            self.assertEqual(billing["free_voice_remaining_today"], 0)
            _finalize_free_voice_reservation(billing, successful=False)
            entitlement, error, status = _build_billing_entitlement_payload(self._dev_headers())

        self.assertIsNone(error)
        self.assertEqual(status, HTTPStatus.OK)
        self.assertEqual(entitlement["free_voice_remaining_today"], 1)

    def test_enforce_mode_accepts_starter_subscription(self) -> None:
        with patch.dict(
            os.environ,
            {
                "SOLOMONIC_BILLING_ENFORCEMENT": "enforce",
                "SOLOMONIC_DEV_FAKE_AUTH": "true",
            },
            clear=False,
        ):
            allowed, status, error, billing = _authorize_paid_feature(
                self._dev_headers("truevineos_starter"),
                "voice_generation",
            )

        self.assertTrue(allowed)
        self.assertEqual(status, HTTPStatus.OK)
        self.assertIsNone(error)
        self.assertEqual(billing["plan"], "starter")
        self.assertEqual(billing["price_lookup_key"], "truevineos_starter_monthly")

    def test_highest_truevine_plan_wins(self) -> None:
        with patch.dict(
            os.environ,
            {
                "SOLOMONIC_BILLING_ENFORCEMENT": "audit",
                "SOLOMONIC_DEV_FAKE_AUTH": "true",
            },
            clear=False,
        ):
            payload, error, status = _build_billing_entitlement_payload(
                self._dev_headers("truevineos_starter,truevineos_org,truevineos_pro")
            )

        self.assertIsNone(error)
        self.assertEqual(status, HTTPStatus.OK)
        self.assertEqual(payload["plan"], "org")
        self.assertTrue(payload["has_paid_access"])

    def test_client_resource_role_grants_paid_access(self) -> None:
        claims = {
            "sub": "billing-test-user",
            "resource_access": {"truevineos": {"roles": ["truevineos_pro"]}},
        }
        with (
            patch.dict(os.environ, {"SOLOMONIC_BILLING_ENFORCEMENT": "enforce"}, clear=False),
            patch("src.webserver._verify_userinfo_token", return_value=claims),
        ):
            allowed, status, error, billing = _authorize_paid_feature(
                {"Authorization": "Bearer test-token"},
                "voice_generation",
            )

        self.assertTrue(allowed)
        self.assertEqual(status, HTTPStatus.OK)
        self.assertIsNone(error)
        self.assertEqual(billing["plan"], "pro")

    def test_inactive_truevine_subscription_falls_back_to_free_tier(self) -> None:
        claims = {
            "sub": "billing-test-user",
            "realm_access": {"roles": ["truevineos_pro"]},
            "truevineos_subscription_status": "canceled",
        }
        with tempfile.TemporaryDirectory() as tempdir:
            with (
                patch.dict(
                    os.environ,
                    {
                        "SOLOMONIC_BILLING_ENFORCEMENT": "enforce",
                        "SOLOMONIC_BILLING_STORE_PATH": str(Path(tempdir) / "billing.json"),
                    },
                    clear=False,
                ),
                patch("src.webserver._verify_userinfo_token", return_value=claims),
            ):
                allowed, status, error, billing = _authorize_paid_feature(
                    {"Authorization": "Bearer test-token"},
                    "voice_generation",
                )

        self.assertTrue(allowed)
        self.assertEqual(status, HTTPStatus.OK)
        self.assertIsNone(error)
        self.assertEqual(billing["subscription_status"], "canceled")
        self.assertFalse(billing["has_paid_access"])
        self.assertEqual(billing["tier"], "free")

    def test_invalid_bearer_token_fails_closed_in_enforce_mode(self) -> None:
        with (
            patch.dict(os.environ, {"SOLOMONIC_BILLING_ENFORCEMENT": "enforce"}, clear=False),
            patch("src.webserver._verify_userinfo_token", side_effect=ValueError("invalid token")),
        ):
            allowed, status, error, _billing = _authorize_paid_feature(
                {"Authorization": "Bearer bad-token"},
                "voice_generation",
            )

        self.assertFalse(allowed)
        self.assertEqual(status, HTTPStatus.UNAUTHORIZED)
        self.assertEqual(error, "invalid token")

    def test_invalid_enforcement_configuration_fails_closed(self) -> None:
        with patch.dict(os.environ, {"SOLOMONIC_BILLING_ENFORCEMENT": "maybe"}, clear=False):
            allowed, status, error, _billing = _authorize_paid_feature({}, "voice_generation")

        self.assertFalse(allowed)
        self.assertEqual(status, HTTPStatus.SERVICE_UNAVAILABLE)
        self.assertIn("SOLOMONIC_BILLING_ENFORCEMENT", error)

    def test_signed_fulfillment_grants_and_revokes_paid_access(self) -> None:
        with tempfile.TemporaryDirectory() as tempdir:
            store_path = str(Path(tempdir) / "billing.json")
            environment = {
                "SOLOMONIC_BILLING_ENFORCEMENT": "enforce",
                "SOLOMONIC_BILLING_FULFILLMENT_SECRET": "fulfillment-secret",
                "SOLOMONIC_BILLING_STORE_PATH": store_path,
                "SOLOMONIC_DEV_FAKE_AUTH": "true",
            }

            def deliver(event_id: str, status: str):
                payload = {
                    "project": "truevineos",
                    "event_id": event_id,
                    "event_type": "customer.subscription.updated",
                    "user_id": "billing-test-user",
                    "customer_id": "cus_test",
                    "subscription_id": "sub_test",
                    "status": status,
                    "plan": "starter",
                    "price_lookup_key": "truevineos_starter_monthly",
                }
                body = json.dumps(payload, separators=(",", ":")).encode()
                timestamp = int(time.time())
                signature = hmac.new(
                    b"fulfillment-secret", f"{timestamp}.".encode() + body, hashlib.sha256
                ).hexdigest()
                return _apply_billing_fulfillment(body, f"t={timestamp},v1={signature}")

            with patch.dict(os.environ, environment, clear=False):
                response, error, status = deliver("evt_active", "active")
                self.assertIsNone(error)
                self.assertEqual(status, HTTPStatus.OK)
                self.assertTrue(response["received"])
                allowed, _, _, billing = _authorize_paid_feature(
                    self._dev_headers(), "voice_generation"
                )
                self.assertTrue(allowed)
                self.assertEqual(billing["matched_role"], "stripe_webhook")

                deliver("evt_cancelled", "canceled")
                allowed, status, error, billing = _authorize_paid_feature(
                    self._dev_headers(), "voice_generation"
                )
                self.assertTrue(allowed)
                self.assertEqual(status, HTTPStatus.OK)
                self.assertIsNone(error)
                self.assertEqual(billing["subscription_status"], "canceled")
                self.assertEqual(billing["tier"], "free")

    def test_fulfillment_rejects_bad_signature(self) -> None:
        with patch.dict(
            os.environ,
            {"SOLOMONIC_BILLING_FULFILLMENT_SECRET": "fulfillment-secret"},
            clear=False,
        ):
            payload, error, status = _apply_billing_fulfillment(
                b'{"project":"truevineos"}', "t=1,v1=bad"
            )
        self.assertIsNone(payload)
        self.assertEqual(status, HTTPStatus.UNAUTHORIZED)
        self.assertIn("signature", error.lower())

    def test_public_webhook_proxy_preserves_raw_body_and_signature(self) -> None:
        captured = {}

        class Response:
            status = 200
            def __enter__(self): return self
            def __exit__(self, *_args): return None
            def read(self): return b'{"received":true}'

        def fake_urlopen(request, timeout):
            captured["body"] = request.data
            captured["signature"] = request.headers["Stripe-signature"]
            captured["timeout"] = timeout
            return Response()

        raw_body = b'{"id":"evt_test", "spacing":"must remain"}'
        with patch("src.webserver.urlopen", fake_urlopen):
            payload, error, status = _proxy_stripe_webhook(raw_body, "t=100,v1=signed")
        self.assertIsNone(error)
        self.assertEqual(status, HTTPStatus.OK)
        self.assertTrue(payload["received"])
        self.assertEqual(captured["body"], raw_body)
        self.assertEqual(captured["signature"], "t=100,v1=signed")


if __name__ == "__main__":
    unittest.main()
