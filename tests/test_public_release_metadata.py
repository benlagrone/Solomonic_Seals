import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from src.webserver import ClockRequestHandler


class PublicReleaseMetadataTests(unittest.TestCase):
    def _make_handler(self) -> ClockRequestHandler:
        handler = ClockRequestHandler.__new__(ClockRequestHandler)
        handler.headers = {}
        return handler

    def test_render_public_template_includes_release_metadata(self) -> None:
        handler = self._make_handler()
        with tempfile.TemporaryDirectory() as tmpdir:
            template_path = Path(tmpdir) / "page.html"
            template_path.write_text(
                (
                    "<p>"
                    "version=__APP_VERSION__ "
                    "release=__APP_RELEASE__ "
                    "released_at=__APP_RELEASED_AT__ "
                    "canonical=__CANONICAL_URL__"
                    "</p>"
                ),
                encoding="utf-8",
            )

            with patch.dict(
                os.environ,
                {
                    "SOLOMONIC_SITE_URL": "https://truevineos.cloud",
                    "SOLOMONIC_APP_VERSION": "v1.4.0",
                    "SOLOMONIC_RELEASE": "sha-abc1234",
                    "SOLOMONIC_RELEASED_AT": "2026-04-11T12:34:56Z",
                },
                clear=False,
            ):
                html = handler._render_public_template(template_path, "/clock")

        self.assertIn("version=1.4.0", html)
        self.assertIn("release=sha-abc1234", html)
        self.assertIn("released_at=2026-04-11 12:34 UTC", html)
        self.assertIn("canonical=https://truevineos.cloud/clock", html)

    def test_render_public_template_falls_back_for_local_builds(self) -> None:
        handler = self._make_handler()
        with tempfile.TemporaryDirectory() as tmpdir:
            template_path = Path(tmpdir) / "page.html"
            template_path.write_text(
                "<p>version=__APP_VERSION__ release=__APP_RELEASE__ released_at=__APP_RELEASED_AT__</p>",
                encoding="utf-8",
            )

            with patch.dict(
                os.environ,
                {
                    "SOLOMONIC_APP_VERSION": "",
                    "SOLOMONIC_RELEASE": "",
                    "SOLOMONIC_RELEASED_AT": "",
                },
                clear=False,
            ):
                html = handler._render_public_template(template_path, "/")

        self.assertIn("version=dev", html)
        self.assertIn("release=local", html)
        self.assertIn("released_at=Built locally", html)


if __name__ == "__main__":
    unittest.main()
