#!/usr/bin/env python3
"""
Small development web server for the Solomonic Clock project.

The handler serves the entire repository (so /web assets and docs are
available) and provides a JSON endpoint at /api/clock that streams the
latest generated dataset. Intended for local use and the Docker container.
"""

from __future__ import annotations

import argparse
import json
import os
import re
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
DEFAULT_PSALM_SOURCE_MODE = "pericope_first"
VALID_PSALM_SOURCE_MODES = {
    "pericope_first",
    "file_first",
    "pericope_only",
    "file_only",
}

_PSALM_LOOKUP: dict[int, dict[int, str]] | None = None
_PSALM_LOOKUP_PATH: Path | None = None
_PSALM_LOOKUP_MTIME: float | None = None
_PSALM_LOOKUP_SOURCE: str | None = None
_PSALM_LOOKUP_MODE: str | None = None


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
    global _PSALM_LOOKUP, _PSALM_LOOKUP_MTIME, _PSALM_LOOKUP_PATH, _PSALM_LOOKUP_SOURCE, _PSALM_LOOKUP_MODE

    mode = _resolve_psalm_source_mode()
    path = _resolve_psalm_path()

    def load_from_pericope() -> tuple[dict[int, dict[int, str]] | None, str | None]:
        nonlocal mode
        global _PSALM_LOOKUP, _PSALM_LOOKUP_PATH, _PSALM_LOOKUP_MTIME, _PSALM_LOOKUP_SOURCE, _PSALM_LOOKUP_MODE

        if _PSALM_LOOKUP is not None and _PSALM_LOOKUP_PATH is None and _PSALM_LOOKUP_MODE == mode:
            return _PSALM_LOOKUP, None

        pericope_lookup, pericope_source_or_error = _load_psalm_lookup_from_pericope()
        if pericope_lookup is None:
            return None, pericope_source_or_error

        _PSALM_LOOKUP = pericope_lookup
        _PSALM_LOOKUP_PATH = None
        _PSALM_LOOKUP_MTIME = None
        _PSALM_LOOKUP_SOURCE = pericope_source_or_error
        _PSALM_LOOKUP_MODE = mode
        return _PSALM_LOOKUP, None

    def load_from_file() -> tuple[dict[int, dict[int, str]] | None, str | None]:
        nonlocal path, mode
        global _PSALM_LOOKUP, _PSALM_LOOKUP_PATH, _PSALM_LOOKUP_MTIME, _PSALM_LOOKUP_SOURCE, _PSALM_LOOKUP_MODE

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
            return _PSALM_LOOKUP, None

        file_lookup, file_source_or_error, loaded_mtime = _load_psalm_lookup_from_file(path)
        if file_lookup is None:
            return None, file_source_or_error

        _PSALM_LOOKUP = file_lookup
        _PSALM_LOOKUP_PATH = path
        _PSALM_LOOKUP_MTIME = loaded_mtime
        _PSALM_LOOKUP_SOURCE = file_source_or_error
        _PSALM_LOOKUP_MODE = mode
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

            lookup, error = _load_psalm_lookup()
            if lookup is None:
                self._send_json({"error": error or "Psalms source unavailable."}, HTTPStatus.NOT_FOUND)
                return

            chapter_map = lookup.get(chapter)
            if not chapter_map:
                self._send_json(
                    {"error": f"Chapter {chapter} not found in configured Psalms source."},
                    HTTPStatus.NOT_FOUND,
                )
                return

            if verse is None:
                ordered = [chapter_map[v] for v in sorted(chapter_map)]
                self._send_json(
                    {
                        "chapter": chapter,
                        "text": "\n".join(ordered),
                        "source": _PSALM_LOOKUP_SOURCE,
                    },
                    HTTPStatus.OK,
                )
                return

            verse_text = chapter_map.get(verse)
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
    handler = partial(ClockRequestHandler, directory=args.root)
    server = ThreadingHTTPServer((args.host, args.port), handler)
    print(f"Serving {args.root} on http://{args.host}:{args.port}")
    print("• Static assets are available directly (e.g. /web/clock_visualizer.html)")
    print("• Dataset endpoint: /api/clock")
    print("• Local Psalms endpoint: /api/psalm?chapter=91&verse=11")
    print(f"• Psalms source mode: {source_mode} (set SOLOMONIC_PSALM_SOURCE_MODE to override)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
