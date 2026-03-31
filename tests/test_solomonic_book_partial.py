import unittest
from http import HTTPStatus

from src.webserver import _build_local_book_partial_payload, _resolve_solomonic_book_partial_target


class SolomonicBookPartialTests(unittest.TestCase):
    def _resolve_payload(self, planet: str, pentacle: int) -> dict:
        target, error, status = _resolve_solomonic_book_partial_target(
            {
                "kind": "solomonic",
                "planet": planet,
                "pentacle": pentacle,
                "reference": f"Key of Solomon, Book II • {planet} Pentacle #{pentacle}",
            }
        )
        self.assertEqual(status, HTTPStatus.OK, error)
        self.assertIsNone(error)
        self.assertIsNotNone(target)

        payload, local_error = _build_local_book_partial_payload(target)
        self.assertIsNone(local_error)
        self.assertIsNotNone(payload)
        return payload

    def test_all_solomonic_pentacles_resolve(self) -> None:
        counts = {
            "Saturn": 7,
            "Jupiter": 7,
            "Mars": 7,
            "Sun": 7,
            "Venus": 5,
            "Mercury": 5,
            "Moon": 6,
        }

        for planet, count in counts.items():
            for pentacle in range(1, count + 1):
                with self.subTest(planet=planet, pentacle=pentacle):
                    payload = self._resolve_payload(planet, pentacle)
                    self.assertIn(f"{planet} Pentacle #{pentacle}", payload["reference"])

    def test_mars_third_pentacle_stops_before_fourth_heading(self) -> None:
        payload = self._resolve_payload("Mars", 3)
        content = payload["content"]
        self.assertIn("Figure 27", content)
        self.assertIn("third pentacle of mars", content.lower())
        self.assertNotIn("Figure 28.-- The fourth pentacle of Mars.--", content)


if __name__ == "__main__":
    unittest.main()
