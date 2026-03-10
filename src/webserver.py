#!/usr/bin/env python3
"""
Small development web server for the Solomonic Clock project.

The handler serves the entire repository (so /web assets and docs are
available) and provides a JSON endpoint at /api/clock that streams the
latest generated dataset. Intended for local use and the Docker container.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import re
from dataclasses import dataclass
from functools import partial
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse
from urllib.request import Request, urlopen

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = REPO_ROOT / "data" / "solomonic_clock_full.json"
DEFAULT_EXTERNAL_PSALMS_PATH = Path(
    "/Users/benjaminlagrone/Documents/projects/pericopeai.com/AugustineCorpus/texts/david_texts/Psalms.txt"
)
DEFAULT_LOCAL_PSALMS_PATH = REPO_ROOT / "docs" / "source_texts" / "Psalms.txt"
PSALM_NUMBER_MAP_PATH = REPO_ROOT / "data" / "psalm_number_map.csv"
DEFAULT_PSALM_SOURCE_MODE = "pericope_first"
VALID_PSALM_SOURCE_MODES = {
    "pericope_first",
    "file_first",
    "pericope_only",
    "file_only",
}
DEFAULT_PSALM_LOOKUP_NUMBERING = "auto"
VALID_PSALM_LOOKUP_NUMBERINGS = {"auto", "vulgate", "hebrew"}

_PSALM_LOOKUP: dict[int, dict[int, str]] | None = None
_PSALM_LOOKUP_PATH: Path | None = None
_PSALM_LOOKUP_MTIME: float | None = None
_PSALM_LOOKUP_SOURCE: str | None = None
_PSALM_LOOKUP_MODE: str | None = None
_PSALM_LOOKUP_NUMBERING: str | None = None
_PSALM_NUMBER_MAP: dict[int, list["PsalmReferenceSpan"]] | None = None
_PSALM_NUMBER_MAP_ERROR: str | None = None


@dataclass(frozen=True)
class PsalmReferenceSpan:
    chapter: int
    verse_start: int | None = None
    verse_end: int | None = None

    def label(self) -> str:
        if self.verse_start is None:
            return str(self.chapter)
        if self.verse_end is None or self.verse_end == self.verse_start:
            return f"{self.chapter}:{self.verse_start}"
        return f"{self.chapter}:{self.verse_start}-{self.verse_end}"


def _resolve_psalm_lookup_numbering() -> str:
    raw = os.environ.get("SOLOMONIC_PSALM_LOOKUP_NUMBERING", DEFAULT_PSALM_LOOKUP_NUMBERING)
    mode = raw.strip().lower()
    if mode in VALID_PSALM_LOOKUP_NUMBERINGS:
        return mode
    return DEFAULT_PSALM_LOOKUP_NUMBERING


def _infer_psalm_lookup_numbering(
    lookup: dict[int, dict[int, str]],
    source_label: str | None,
) -> str:
    configured = _resolve_psalm_lookup_numbering()
    if configured in {"vulgate", "hebrew"}:
        return configured

    hints = [
        os.environ.get("SOLOMONIC_PERICOPE_SOURCE", ""),
        os.environ.get("SOLOMONIC_PSALMS_TEXT_PATH", ""),
        source_label or "",
    ]
    hint_blob = " ".join(hints).lower()

    if any(token in hint_blob for token in ("vulgate", "clementine", "douay", "drb")):
        return "vulgate"
    if any(token in hint_blob for token in ("hebrew", "masoretic", "kjv", "nkjv", "esv", "niv")):
        return "hebrew"

    chapter_116 = lookup.get(116)
    if chapter_116:
        verse_count = len(chapter_116)
        if verse_count >= 15:
            return "hebrew"
        if verse_count <= 5:
            return "vulgate"

    chapter_147 = lookup.get(147)
    if chapter_147:
        verse_count = len(chapter_147)
        if verse_count >= 15:
            return "hebrew"
        if verse_count <= 11:
            return "vulgate"

    # Safe fallback: avoid remapping a Vulgate-aligned source incorrectly.
    return "vulgate"


def _parse_hebrew_reference(raw_reference: str) -> list[PsalmReferenceSpan] | None:
    ref = raw_reference.strip()
    if not ref:
        return None

    chapter_only = re.fullmatch(r"(\d+)", ref)
    if chapter_only:
        return [PsalmReferenceSpan(chapter=int(chapter_only.group(1)))]

    chapter_range = re.fullmatch(r"(\d+)-(\d+)", ref)
    if chapter_range:
        start = int(chapter_range.group(1))
        end = int(chapter_range.group(2))
        if start > end:
            return None
        return [PsalmReferenceSpan(chapter=chapter) for chapter in range(start, end + 1)]

    verse_window = re.fullmatch(r"(\d+):(\d+)-(\d+)", ref)
    if verse_window:
        chapter = int(verse_window.group(1))
        start = int(verse_window.group(2))
        end = int(verse_window.group(3))
        if start > end:
            return None
        return [PsalmReferenceSpan(chapter=chapter, verse_start=start, verse_end=end)]

    single_verse = re.fullmatch(r"(\d+):(\d+)", ref)
    if single_verse:
        chapter = int(single_verse.group(1))
        verse = int(single_verse.group(2))
        return [PsalmReferenceSpan(chapter=chapter, verse_start=verse, verse_end=verse)]

    return None


def _load_psalm_number_map() -> tuple[dict[int, list[PsalmReferenceSpan]] | None, str | None]:
    global _PSALM_NUMBER_MAP, _PSALM_NUMBER_MAP_ERROR

    if _PSALM_NUMBER_MAP is not None:
        return _PSALM_NUMBER_MAP, None
    if _PSALM_NUMBER_MAP_ERROR is not None:
        return None, _PSALM_NUMBER_MAP_ERROR

    if not PSALM_NUMBER_MAP_PATH.exists():
        _PSALM_NUMBER_MAP_ERROR = f"Psalm numbering map not found: {PSALM_NUMBER_MAP_PATH}"
        return None, _PSALM_NUMBER_MAP_ERROR

    parsed_map: dict[int, list[PsalmReferenceSpan]] = {}
    try:
        with PSALM_NUMBER_MAP_PATH.open("r", encoding="utf-8", newline="") as handle:
            reader = csv.DictReader(handle)
            for line_number, row in enumerate(reader, start=2):
                try:
                    vulgate_raw = (row.get("vulgate_number") or "").strip()
                    hebrew_raw = (row.get("hebrew_reference") or "").strip()
                    vulgate_number = int(vulgate_raw)
                except ValueError as exc:
                    raise ValueError(
                        f"Invalid vulgate_number at line {line_number}: {row.get('vulgate_number')!r}"
                    ) from exc

                spans = _parse_hebrew_reference(hebrew_raw)
                if not spans:
                    raise ValueError(
                        f"Invalid hebrew_reference at line {line_number}: {hebrew_raw!r}"
                    )
                parsed_map[vulgate_number] = spans
    except Exception as exc:
        _PSALM_NUMBER_MAP_ERROR = f"Unable to parse Psalm numbering map: {exc}"
        return None, _PSALM_NUMBER_MAP_ERROR

    _PSALM_NUMBER_MAP = parsed_map
    return _PSALM_NUMBER_MAP, None


def _resolve_reference_spans(
    chapter: int,
    lookup_numbering: str,
) -> tuple[list[PsalmReferenceSpan] | None, str | None]:
    if lookup_numbering != "hebrew":
        return [PsalmReferenceSpan(chapter=chapter)], None

    psalm_map, map_error = _load_psalm_number_map()
    if psalm_map is None:
        return None, map_error

    return psalm_map.get(chapter, [PsalmReferenceSpan(chapter=chapter)]), None


def _collect_span_verses(
    chapter_map: dict[int, str],
    span: PsalmReferenceSpan,
) -> tuple[list[int] | None, str | None]:
    ordered_verses = sorted(chapter_map)
    if not ordered_verses:
        return None, f"Chapter {span.chapter} has no verses in configured Psalms source."

    if span.verse_start is None:
        return ordered_verses, None

    start = span.verse_start
    end = span.verse_end if span.verse_end is not None else start
    if start > end:
        return None, f"Invalid verse window for chapter {span.chapter}: {start}-{end}"

    selected = [verse for verse in ordered_verses if start <= verse <= end]
    if not selected:
        return None, f"Psalm {span.label()} not found in configured Psalms source."

    return selected, None


def _collect_spans_text(
    lookup: dict[int, dict[int, str]],
    spans: list[PsalmReferenceSpan],
) -> tuple[list[tuple[int, int, str]] | None, str | None]:
    entries: list[tuple[int, int, str]] = []
    for span in spans:
        chapter_map = lookup.get(span.chapter)
        if not chapter_map:
            return None, f"Chapter {span.chapter} not found in configured Psalms source."

        verses, verse_error = _collect_span_verses(chapter_map, span)
        if verses is None:
            return None, verse_error

        for verse in verses:
            text = chapter_map.get(verse)
            if text:
                entries.append((span.chapter, verse, text))

    if not entries:
        references = ", ".join(span.label() for span in spans)
        return None, f"Psalm reference {references} not found in configured Psalms source."

    return entries, None


def _resolve_mapped_verse(
    lookup: dict[int, dict[int, str]],
    spans: list[PsalmReferenceSpan],
    requested_verse: int,
) -> tuple[tuple[int, int] | None, str | None]:
    if requested_verse < 1:
        return None, f"Invalid verse value: {requested_verse!r}"

    remaining = requested_verse
    for span in spans:
        chapter_map = lookup.get(span.chapter)
        if not chapter_map:
            return None, f"Chapter {span.chapter} not found in configured Psalms source."

        verses, verse_error = _collect_span_verses(chapter_map, span)
        if verses is None:
            return None, verse_error

        if remaining <= len(verses):
            return (span.chapter, verses[remaining - 1]), None
        remaining -= len(verses)

    references = ", ".join(span.label() for span in spans)
    return (
        None,
        f"Psalm verse {requested_verse} exceeds available verses for mapped reference {references}.",
    )


def _resolve_psalm_path() -> Path | None:
    env_path = os.environ.get("SOLOMONIC_PSALMS_TEXT_PATH")
    if env_path:
        candidate = Path(env_path).expanduser()
        return candidate if candidate.exists() else None
    if DEFAULT_EXTERNAL_PSALMS_PATH.exists():
        return DEFAULT_EXTERNAL_PSALMS_PATH
    if DEFAULT_LOCAL_PSALMS_PATH.exists():
        return DEFAULT_LOCAL_PSALMS_PATH
    return None


def _resolve_psalm_source_mode() -> str:
    raw = os.environ.get("SOLOMONIC_PSALM_SOURCE_MODE", DEFAULT_PSALM_SOURCE_MODE)
    mode = raw.strip().lower()
    if mode in VALID_PSALM_SOURCE_MODES:
        return mode
    return DEFAULT_PSALM_SOURCE_MODE


def _resolve_pericope_book_partial_urls() -> list[str]:
    explicit_url = os.environ.get("SOLOMONIC_PERICOPE_BOOK_PARTIAL_URL")
    urls: list[str] = []
    if explicit_url:
        urls.append(explicit_url.strip())

    base = os.environ.get("SOLOMONIC_PERICOPE_API_BASE")
    if base:
        base = base.rstrip("/")
        if base.endswith("/v1"):
            urls.append(f"{base}/book_partial")
        else:
            urls.append(f"{base}/v1/book_partial")
            urls.append(f"{base}/api/v1/book_partial")

    urls.extend(
        [
            "http://host.docker.internal:8001/v1/book_partial",
            "http://localhost:8001/v1/book_partial",
            "https://pericopeai.com/api/v1/book_partial",
            "https://pericopeai.com/v1/book_partial",
        ]
    )

    deduped: list[str] = []
    seen: set[str] = set()
    for url in urls:
        cleaned = url.strip()
        if not cleaned or cleaned in seen:
            continue
        seen.add(cleaned)
        deduped.append(cleaned)
    return deduped


def _env_int(name: str, default: int) -> int:
    raw = os.environ.get(name)
    if raw is None:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def _load_psalm_lookup_from_pericope() -> tuple[dict[int, dict[int, str]] | None, str | None]:
    author_slug = os.environ.get("SOLOMONIC_PERICOPE_AUTHOR_SLUG", "david")
    book = os.environ.get("SOLOMONIC_PERICOPE_BOOK", "Psalms")
    source = os.environ.get("SOLOMONIC_PERICOPE_SOURCE", "Psalms.txt")
    start_position = _env_int("SOLOMONIC_PERICOPE_START_POSITION", 1)
    end_position = _env_int("SOLOMONIC_PERICOPE_END_POSITION", 1000)

    payload = {
        "author_slug": author_slug,
        "book": book,
        "source": source,
        "start_position": start_position,
        "end_position": end_position,
    }

    errors: list[str] = []
    for url in _resolve_pericope_book_partial_urls():
        try:
            request = Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urlopen(request, timeout=20) as response:
                body = response.read()
            decoded = json.loads(body.decode("utf-8"))
            content = decoded.get("content") if isinstance(decoded, dict) else None
            if not isinstance(content, str) or not content.strip():
                errors.append(f"{url}: missing content")
                continue

            parsed = _parse_psalm_text(content)
            if not parsed:
                errors.append(f"{url}: parsed empty content")
                continue

            source_label = (
                f"{url} (author={author_slug}, book={book}, source={source}, "
                f"positions={start_position}-{end_position})"
            )
            return parsed, source_label
        except Exception as exc:  # pragma: no cover - network/runtime dependent
            errors.append(f"{url}: {exc}")

    if errors:
        return None, (
            "Unable to load Psalms from Pericope book_partial. Tried: "
            + " | ".join(errors[:3])
        )

    return None, "Unable to load Psalms from Pericope book_partial."


def _parse_psalm_text(raw_text: str) -> dict[int, dict[int, str]]:
    lookup: dict[int, dict[int, str]] = {}
    chapter_num: int | None = None
    verse_num: int | None = None

    for raw_line in raw_text.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        chapter_match = re.match(r"^Chapter\s+(\d+)\s*$", line, re.IGNORECASE)
        if chapter_match:
            chapter_num = int(chapter_match.group(1))
            lookup.setdefault(chapter_num, {})
            verse_num = None
            continue

        verse_match = re.match(r"^(\d+)\s+(.*)$", line)
        if chapter_num is not None and verse_match:
            verse_num = int(verse_match.group(1))
            verse_text = verse_match.group(2).strip()
            lookup[chapter_num][verse_num] = verse_text
            continue

        # Wrapped verse lines continue until the next verse/chapter header.
        if chapter_num is not None and verse_num is not None:
            existing = lookup[chapter_num].get(verse_num, "")
            lookup[chapter_num][verse_num] = f"{existing} {line}".strip()

    return lookup


def _load_psalm_lookup_from_file(
    path: Path,
) -> tuple[dict[int, dict[int, str]] | None, str | None, float | None]:
    try:
        mtime = path.stat().st_mtime
    except OSError as exc:
        return None, f"Unable to stat Psalms source file {path}: {exc}", None

    try:
        raw_text = path.read_text(encoding="utf-8", errors="replace")
    except OSError as exc:
        return None, f"Unable to read Psalms source file {path}: {exc}", None

    parsed = _parse_psalm_text(raw_text)
    if not parsed:
        return None, f"Psalms source file {path} parsed to an empty lookup.", None

    return parsed, str(path), mtime


def _load_psalm_lookup() -> tuple[dict[int, dict[int, str]] | None, str | None]:
    global _PSALM_LOOKUP
    global _PSALM_LOOKUP_MTIME
    global _PSALM_LOOKUP_MODE
    global _PSALM_LOOKUP_NUMBERING
    global _PSALM_LOOKUP_PATH
    global _PSALM_LOOKUP_SOURCE

    mode = _resolve_psalm_source_mode()
    path = _resolve_psalm_path()

    def load_from_pericope() -> tuple[dict[int, dict[int, str]] | None, str | None]:
        nonlocal mode
        global _PSALM_LOOKUP
        global _PSALM_LOOKUP_MTIME
        global _PSALM_LOOKUP_MODE
        global _PSALM_LOOKUP_NUMBERING
        global _PSALM_LOOKUP_PATH
        global _PSALM_LOOKUP_SOURCE

        if _PSALM_LOOKUP is not None and _PSALM_LOOKUP_PATH is None and _PSALM_LOOKUP_MODE == mode:
            if _PSALM_LOOKUP_NUMBERING is None:
                _PSALM_LOOKUP_NUMBERING = _infer_psalm_lookup_numbering(
                    _PSALM_LOOKUP,
                    _PSALM_LOOKUP_SOURCE,
                )
            return _PSALM_LOOKUP, None

        pericope_lookup, pericope_source_or_error = _load_psalm_lookup_from_pericope()
        if pericope_lookup is None:
            return None, pericope_source_or_error

        _PSALM_LOOKUP = pericope_lookup
        _PSALM_LOOKUP_PATH = None
        _PSALM_LOOKUP_MTIME = None
        _PSALM_LOOKUP_SOURCE = pericope_source_or_error
        _PSALM_LOOKUP_MODE = mode
        _PSALM_LOOKUP_NUMBERING = _infer_psalm_lookup_numbering(
            _PSALM_LOOKUP,
            _PSALM_LOOKUP_SOURCE,
        )
        return _PSALM_LOOKUP, None

    def load_from_file() -> tuple[dict[int, dict[int, str]] | None, str | None]:
        nonlocal path, mode
        global _PSALM_LOOKUP
        global _PSALM_LOOKUP_MTIME
        global _PSALM_LOOKUP_MODE
        global _PSALM_LOOKUP_NUMBERING
        global _PSALM_LOOKUP_PATH
        global _PSALM_LOOKUP_SOURCE

        if path is None:
            return None, "No local Psalms text file found for fallback."

        try:
            mtime = path.stat().st_mtime
        except OSError as exc:
            return None, f"Unable to stat Psalms source file {path}: {exc}"

        if (
            _PSALM_LOOKUP is not None
            and _PSALM_LOOKUP_PATH == path
            and _PSALM_LOOKUP_MTIME == mtime
            and _PSALM_LOOKUP_MODE == mode
        ):
            if _PSALM_LOOKUP_NUMBERING is None:
                _PSALM_LOOKUP_NUMBERING = _infer_psalm_lookup_numbering(
                    _PSALM_LOOKUP,
                    _PSALM_LOOKUP_SOURCE,
                )
            return _PSALM_LOOKUP, None

        file_lookup, file_source_or_error, loaded_mtime = _load_psalm_lookup_from_file(path)
        if file_lookup is None:
            return None, file_source_or_error

        _PSALM_LOOKUP = file_lookup
        _PSALM_LOOKUP_PATH = path
        _PSALM_LOOKUP_MTIME = loaded_mtime
        _PSALM_LOOKUP_SOURCE = file_source_or_error
        _PSALM_LOOKUP_MODE = mode
        _PSALM_LOOKUP_NUMBERING = _infer_psalm_lookup_numbering(
            _PSALM_LOOKUP,
            _PSALM_LOOKUP_SOURCE,
        )
        return _PSALM_LOOKUP, None

    if mode == "pericope_only":
        return load_from_pericope()

    if mode == "file_only":
        return load_from_file()

    errors: list[str] = []

    if mode == "pericope_first":
        lookup, error = load_from_pericope()
        if lookup is not None:
            return lookup, None
        if error:
            errors.append(error)

        lookup, error = load_from_file()
        if lookup is not None:
            return lookup, None
        if error:
            errors.append(error)

    if mode == "file_first":
        lookup, error = load_from_file()
        if lookup is not None:
            return lookup, None
        if error:
            errors.append(error)

        lookup, error = load_from_pericope()
        if lookup is not None:
            return lookup, None
        if error:
            errors.append(error)

    if errors:
        return None, (
            f"Unable to load Psalms for source mode '{mode}'. "
            + " | ".join(errors[:4])
        )
    return None, f"Unable to load Psalms for source mode '{mode}'."


class ClockRequestHandler(SimpleHTTPRequestHandler):
    """Serve static files and expose /api/clock with the JSON dataset."""

    def __init__(self, *args: Any, directory: str | None = None, **kwargs: Any) -> None:
        super().__init__(*args, directory=directory, **kwargs)

    def _send_json(self, payload: dict[str, Any], status: HTTPStatus) -> None:
        body = json.dumps(payload, indent=2, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802  (HTTPRequestHandler overrides camelCase)
        parsed_url = urlparse(self.path)
        request_path = parsed_url.path

        if request_path in {"", "/"}:
            clock_path = REPO_ROOT / "web" / "clock_visualizer.html"
            if not clock_path.exists():
                self.send_error(HTTPStatus.NOT_FOUND, "clock_visualizer.html not found")
                return

            html = clock_path.read_text(encoding="utf-8")
            injection = '<base href="/web/">'
            if "<head>" in html and injection not in html:
                html = html.replace("<head>", f"<head>\n    {injection}", 1)

            body = html.encode("utf-8")
            self.send_response(HTTPStatus.OK)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        if request_path.rstrip("/") == "/api/clock":
            if not DATA_PATH.exists():
                message = (
                    "Dataset not found. Run `python src/generate_full_dataset.py` first."
                )
                self._send_json({"error": message}, HTTPStatus.NOT_FOUND)
                return

            try:
                data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
            except json.JSONDecodeError as exc:  # pragma: no cover - only hit on corruption
                self._send_json(
                    {"error": f"Dataset is invalid JSON: {exc}"}, HTTPStatus.INTERNAL_SERVER_ERROR
                )
                return

            self._send_json(data, HTTPStatus.OK)
            return

        if request_path.rstrip("/") == "/api/psalm":
            query = parse_qs(parsed_url.query)
            chapter_raw = (query.get("chapter") or [None])[0]
            verse_raw = (query.get("verse") or [None])[0]

            if chapter_raw is None:
                self._send_json(
                    {"error": "Missing required query parameter: chapter"},
                    HTTPStatus.BAD_REQUEST,
                )
                return

            try:
                chapter = int(chapter_raw)
            except (TypeError, ValueError):
                self._send_json(
                    {"error": f"Invalid chapter value: {chapter_raw!r}"},
                    HTTPStatus.BAD_REQUEST,
                )
                return
            if chapter < 1:
                self._send_json(
                    {"error": f"Invalid chapter value: {chapter_raw!r}"},
                    HTTPStatus.BAD_REQUEST,
                )
                return

            verse: int | None = None
            if verse_raw not in {None, ""}:
                try:
                    verse = int(verse_raw)
                except (TypeError, ValueError):
                    self._send_json(
                        {"error": f"Invalid verse value: {verse_raw!r}"},
                        HTTPStatus.BAD_REQUEST,
                    )
                    return
                if verse < 1:
                    self._send_json(
                        {"error": f"Invalid verse value: {verse_raw!r}"},
                        HTTPStatus.BAD_REQUEST,
                    )
                    return

            lookup, error = _load_psalm_lookup()
            if lookup is None:
                self._send_json({"error": error or "Psalms source unavailable."}, HTTPStatus.NOT_FOUND)
                return

            lookup_numbering = _PSALM_LOOKUP_NUMBERING or _infer_psalm_lookup_numbering(
                lookup,
                _PSALM_LOOKUP_SOURCE,
            )
            spans, span_error = _resolve_reference_spans(chapter, lookup_numbering)
            if spans is None:
                self._send_json(
                    {"error": span_error or "Unable to resolve Psalm numbering map."},
                    HTTPStatus.INTERNAL_SERVER_ERROR,
                )
                return

            resolved_reference = ", ".join(span.label() for span in spans)
            response_meta = {
                "requested_numbering": "vulgate",
                "lookup_numbering": lookup_numbering,
                "resolved_reference": resolved_reference,
            }

            if verse is None:
                entries, collect_error = _collect_spans_text(lookup, spans)
                if entries is None:
                    self._send_json(
                        {"error": collect_error or f"Chapter {chapter} not found in configured Psalms source."},
                        HTTPStatus.NOT_FOUND,
                    )
                    return

                ordered_text = [text for _chapter, _verse, text in entries]
                self._send_json(
                    {
                        "chapter": chapter,
                        "text": "\n".join(ordered_text),
                        "source": _PSALM_LOOKUP_SOURCE,
                        "numbering": response_meta,
                    },
                    HTTPStatus.OK,
                )
                return

            mapped_reference, map_error = _resolve_mapped_verse(lookup, spans, verse)
            if mapped_reference is None:
                self._send_json(
                    {"error": map_error or f"Psalm {chapter}:{verse} not found in configured Psalms source."},
                    HTTPStatus.NOT_FOUND,
                )
                return

            resolved_chapter, resolved_verse = mapped_reference
            verse_text = lookup.get(resolved_chapter, {}).get(resolved_verse)
            if not verse_text:
                self._send_json(
                    {"error": f"Psalm {chapter}:{verse} not found in configured Psalms source."},
                    HTTPStatus.NOT_FOUND,
                )
                return

            self._send_json(
                {
                    "chapter": chapter,
                    "verse": verse,
                    "text": verse_text,
                    "source": _PSALM_LOOKUP_SOURCE,
                    "numbering": response_meta,
                    "resolved_chapter": resolved_chapter,
                    "resolved_verse": resolved_verse,
                },
                HTTPStatus.OK,
            )
            return

        super().do_GET()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Serve the Solomonic Clock files.")
    parser.add_argument("--host", default=os.environ.get("HOST", "0.0.0.0"))
    parser.add_argument(
        "--port", type=int, default=int(os.environ.get("PORT", "8080")), help="Port to bind."
    )
    parser.add_argument(
        "--root",
        default=str(REPO_ROOT),
        help="Directory to serve (defaults to repository root).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    source_mode = _resolve_psalm_source_mode()
    numbering_mode = _resolve_psalm_lookup_numbering()
    handler = partial(ClockRequestHandler, directory=args.root)
    server = ThreadingHTTPServer((args.host, args.port), handler)
    print(f"Serving {args.root} on http://{args.host}:{args.port}")
    print("• Static assets are available directly (e.g. /web/clock_visualizer.html)")
    print("• Dataset endpoint: /api/clock")
    print("• Local Psalms endpoint: /api/psalm?chapter=91&verse=11")
    print(f"• Psalms source mode: {source_mode} (set SOLOMONIC_PSALM_SOURCE_MODE to override)")
    print(
        "• Psalm numbering mode: "
        f"{numbering_mode} (set SOLOMONIC_PSALM_LOOKUP_NUMBERING=auto|vulgate|hebrew)"
    )
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
