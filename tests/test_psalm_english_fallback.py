import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src import webserver


class EnvMonkeyPatch:
    def __init__(self) -> None:
        self._originals: dict[str, str | None] = {}

    def setenv(self, name: str, value: str) -> None:
        if name not in self._originals:
            self._originals[name] = os.environ.get(name)
        os.environ[name] = value

    def restore(self) -> None:
        for name, value in self._originals.items():
            if value is None:
                os.environ.pop(name, None)
            else:
                os.environ[name] = value
        self._originals.clear()


def reset_psalm_lookup_cache() -> None:
    webserver._PSALM_LOOKUP = None
    webserver._PSALM_LOOKUP_PATH = None
    webserver._PSALM_LOOKUP_MTIME = None
    webserver._PSALM_LOOKUP_SOURCE = None
    webserver._PSALM_LOOKUP_NUMBERING = None
    webserver._PSALM_LOOKUP_MODE = None


def test_latin_psalm_detection_rejects_vulgate_text() -> None:
    latin_text = "5 teth escam dedit timentibus se ioth memor erit in sempiternum pacti sui"
    english_text = "5 He hath given meat unto them that fear him: he will ever be mindful of his covenant."

    assert webserver._looks_like_latin_scripture_text(latin_text)
    assert not webserver._looks_like_latin_scripture_text(english_text)


def test_scripture_mapping_returns_english_verse_without_latin_prefix() -> None:
    excerpt = webserver._load_scripture_excerpt(110, "5", allow_lookup=False)

    assert excerpt == "He hath given meat unto them that fear him: he will ever be mindful of his covenant."
    assert not webserver._looks_like_latin_scripture_text(excerpt)


def test_latin_source_fallback_uses_english_mapping_only() -> None:
    payload = webserver._build_psalm_api_fallback_payload(
        110,
        5,
        {"requested_numbering": "vulgate", "lookup_numbering": "vulgate"},
        reason="latin_psalm_source",
    )

    assert payload is not None
    assert payload["source"] == "scripture_mappings_english"
    assert payload["fallback_reason"] == "latin_psalm_source"
    assert "teth escam" not in payload["text"].lower()


def test_local_psalms_source_maps_vulgate_reference_to_english_hebrew_chapter(monkeypatch) -> None:
    monkeypatch.setenv("SOLOMONIC_PSALM_SOURCE_MODE", "file_only")
    monkeypatch.setenv("SOLOMONIC_PSALMS_TEXT_PATH", str(webserver.DEFAULT_LOCAL_PSALMS_PATH))
    monkeypatch.setenv("SOLOMONIC_PSALM_LOOKUP_NUMBERING", "auto")
    reset_psalm_lookup_cache()

    try:
        payload, error = webserver._build_psalm_lookup_chapter_payload(110, "Psalm 110:5")
    finally:
        reset_psalm_lookup_cache()

    assert error is None
    assert payload is not None
    assert payload["numbering"]["lookup_numbering"] == "hebrew"
    assert payload["numbering"]["resolved_reference"] == "111"
    assert "5 He hath given meat unto them that fear him" in payload["content"]


def test_psalm_book_partial_uses_local_psalm_lookup_before_pericope(monkeypatch) -> None:
    monkeypatch.setenv("SOLOMONIC_PSALM_SOURCE_MODE", "file_only")
    monkeypatch.setenv("SOLOMONIC_PSALMS_TEXT_PATH", str(webserver.DEFAULT_LOCAL_PSALMS_PATH))
    monkeypatch.setenv("SOLOMONIC_PSALM_LOOKUP_NUMBERING", "auto")
    reset_psalm_lookup_cache()

    try:
        payload, error, status = webserver._build_book_partial_payload({
            "kind": "psalm",
            "chapter": 110,
            "reference": "Psalm 110:5",
        })
    finally:
        reset_psalm_lookup_cache()

    assert error is None
    assert int(status) == 200
    assert payload is not None
    assert payload["resolved_via"] == "psalm_lookup_fallback"
    assert payload["numbering"]["resolved_reference"] == "111"
    assert "5 He hath given meat unto them that fear him" in payload["content"]


def run_without_pytest() -> None:
    test_latin_psalm_detection_rejects_vulgate_text()
    test_scripture_mapping_returns_english_verse_without_latin_prefix()
    test_latin_source_fallback_uses_english_mapping_only()
    for test_case in (
        test_local_psalms_source_maps_vulgate_reference_to_english_hebrew_chapter,
        test_psalm_book_partial_uses_local_psalm_lookup_before_pericope,
    ):
        monkeypatch = EnvMonkeyPatch()
        try:
            test_case(monkeypatch)
        finally:
            monkeypatch.restore()


if __name__ == "__main__":
    run_without_pytest()
