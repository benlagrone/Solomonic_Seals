import json
import threading
import unittest
from functools import partial
from http import HTTPStatus
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from unittest.mock import patch

from src import webserver


REPO_ROOT = Path(__file__).resolve().parents[1]


class QuietClockRequestHandler(webserver.ClockRequestHandler):
    def log_message(self, format: str, *args) -> None:
        return None


class BillingHttpRouteTests(unittest.TestCase):
    def _serve(self):
        handler = partial(QuietClockRequestHandler, directory=str(REPO_ROOT))
        server = webserver.ThreadingHTTPServer(("127.0.0.1", 0), handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        return server, f"http://127.0.0.1:{server.server_address[1]}"

    def _json_request(
        self,
        base_url: str,
        path: str,
        payload: dict | None = None,
        headers: dict[str, str] | None = None,
        method: str | None = None,
    ) -> tuple[int, dict]:
        body = None if payload is None else json.dumps(payload).encode("utf-8")
        request = Request(
            f"{base_url}{path}",
            data=body,
            method=method or ("GET" if body is None else "POST"),
            headers={
                "Accept": "application/json",
                **({"Content-Type": "application/json"} if body is not None else {}),
                **(headers or {}),
            },
        )
        try:
            with urlopen(request, timeout=5) as response:
                return response.status, json.loads(response.read().decode("utf-8"))
        except HTTPError as exc:
            try:
                return exc.code, json.loads(exc.read().decode("utf-8"))
            finally:
                exc.close()

    def test_checkout_route_creates_session_for_authenticated_user(self) -> None:
        server, base_url = self._serve()
        captured = {}

        def fake_billing_request(path: str, payload: dict | None = None):
            captured["path"] = path
            captured["payload"] = payload
            return {"id": "cs_live_route", "url": "https://checkout.stripe.com/c/pay/live", "livemode": True}

        try:
            with (
                patch(
                    "src.webserver._verify_userinfo_token",
                    return_value={"sub": "route-user", "email": "Route.User@Example.com"},
                ),
                patch("src.webserver._billing_service_request", side_effect=fake_billing_request),
                patch("src.webserver.time.time", return_value=1_780_000_000),
            ):
                status, payload = self._json_request(
                    base_url,
                    webserver.BILLING_CHECKOUT_API_PATH,
                    {"price_lookup_key": "truevineos_starter_monthly"},
                    {
                        "Authorization": "Bearer user-token",
                        "X-Forwarded-Proto": "https",
                        "X-Forwarded-Host": "truevineos.cloud",
                    },
                )
        finally:
            server.shutdown()
            server.server_close()

        self.assertEqual(status, HTTPStatus.CREATED)
        self.assertEqual(payload["url"], "https://checkout.stripe.com/c/pay/live")
        self.assertEqual(captured["path"], "/v1/checkout/sessions")
        self.assertEqual(captured["payload"]["project"], "truevineos")
        self.assertEqual(captured["payload"]["user_id"], "route-user")
        self.assertEqual(captured["payload"]["email"], "route.user@example.com")
        self.assertEqual(captured["payload"]["price_lookup_key"], "truevineos_starter_monthly")
        self.assertEqual(
            captured["payload"]["success_url"],
            "https://truevineos.cloud/clock?billing=success&session_id={CHECKOUT_SESSION_ID}",
        )
        self.assertEqual(captured["payload"]["cancel_url"], "https://truevineos.cloud/clock?billing=cancelled")

    def test_billing_routes_reject_unauthenticated_requests(self) -> None:
        server, base_url = self._serve()
        try:
            for path, method in (
                (webserver.BILLING_CHECKOUT_API_PATH, "POST"),
                (webserver.BILLING_PORTAL_API_PATH, "POST"),
                (webserver.BILLING_INVOICES_API_PATH, "GET"),
            ):
                status, payload = self._json_request(
                    base_url,
                    path,
                    {"price_lookup_key": "truevineos_starter_monthly"} if method == "POST" else None,
                    method=method,
                )
                self.assertEqual(status, HTTPStatus.UNAUTHORIZED)
                self.assertIn("Sign in", payload["error"])
        finally:
            server.shutdown()
            server.server_close()

    def test_portal_and_invoice_routes_proxy_authenticated_identity(self) -> None:
        server, base_url = self._serve()
        calls = []

        def fake_billing_request(path: str, payload: dict | None = None):
            calls.append((path, payload))
            if path == "/v1/customer-portal/sessions":
                return {"id": "bps_live_route", "url": "https://billing.stripe.com/session/live"}
            if path == "/v1/invoices":
                return {"invoices": [{"id": "in_live_route"}], "has_more": False}
            raise AssertionError(path)

        try:
            with (
                patch(
                    "src.webserver._verify_userinfo_token",
                    return_value={"sub": "route-user", "email": "route.user@example.com"},
                ),
                patch("src.webserver._billing_service_request", side_effect=fake_billing_request),
            ):
                portal_status, portal_payload = self._json_request(
                    base_url,
                    webserver.BILLING_PORTAL_API_PATH,
                    {},
                    {
                        "Authorization": "Bearer user-token",
                        "X-Forwarded-Proto": "https",
                        "X-Forwarded-Host": "truevineos.cloud",
                    },
                )
                invoices_status, invoices_payload = self._json_request(
                    base_url,
                    webserver.BILLING_INVOICES_API_PATH,
                    headers={"Authorization": "Bearer user-token"},
                )
        finally:
            server.shutdown()
            server.server_close()

        self.assertEqual(portal_status, HTTPStatus.CREATED)
        self.assertEqual(portal_payload["url"], "https://billing.stripe.com/session/live")
        self.assertEqual(invoices_status, HTTPStatus.OK)
        self.assertEqual(invoices_payload["invoices"][0]["id"], "in_live_route")
        self.assertEqual(calls[0][0], "/v1/customer-portal/sessions")
        self.assertEqual(calls[0][1]["project"], "truevineos")
        self.assertEqual(calls[0][1]["user_id"], "route-user")
        self.assertEqual(calls[0][1]["return_url"], "https://truevineos.cloud/clock")
        self.assertEqual(calls[1], ("/v1/invoices", {"project": "truevineos", "user_id": "route-user", "email": "route.user@example.com"}))

    def test_stripe_webhook_route_preserves_raw_body_and_signature(self) -> None:
        server, base_url = self._serve()
        captured = {}

        def fake_proxy(raw_body: bytes, signature: str):
            captured["raw_body"] = raw_body
            captured["signature"] = signature
            return {"received": True}, None, HTTPStatus.OK

        raw_body = b'{"id":"evt_live_route", "spacing":"must remain"}'
        request = Request(
            f"{base_url}{webserver.STRIPE_WEBHOOK_PROXY_API_PATH}",
            data=raw_body,
            method="POST",
            headers={
                "Content-Type": "application/json",
                "Stripe-Signature": "t=100,v1=signed",
            },
        )
        try:
            with patch("src.webserver._proxy_stripe_webhook", side_effect=fake_proxy):
                with urlopen(request, timeout=5) as response:
                    status = response.status
                    payload = json.loads(response.read().decode("utf-8"))
        finally:
            server.shutdown()
            server.server_close()

        self.assertEqual(status, HTTPStatus.OK)
        self.assertTrue(payload["received"])
        self.assertEqual(captured["raw_body"], raw_body)
        self.assertEqual(captured["signature"], "t=100,v1=signed")


if __name__ == "__main__":
    unittest.main()
