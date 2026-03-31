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
import hashlib
import hmac
import json
import os
import re
import threading
from dataclasses import dataclass
from datetime import datetime
from functools import partial
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import parse_qs, urlparse
from urllib.request import Request, urlopen
from xml.sax.saxutils import escape as xml_escape
from zoneinfo import ZoneInfo

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = REPO_ROOT / "data" / "solomonic_clock_full.json"
PENTACLE_PSALMS_PATH = REPO_ROOT / "data" / "pentacle_psalms.json"
SCRIPTURE_MAPPINGS_PATH = REPO_ROOT / "data" / "scripture_mappings.json"
LIFE_DOMAINS_PATH = REPO_ROOT / "data" / "life_domains.json"
LOCAL_SOURCE_TEXTS_DIR = REPO_ROOT / "docs" / "source_texts"
DEFAULT_AUGUSTINE_CORPUS_ROOT = Path(
    "/Users/benjaminlagrone/Documents/projects/pericopeai.com/AugustineCorpus"
)
DEFAULT_AUGUSTINE_AUTHOR_INDEX_PATH = DEFAULT_AUGUSTINE_CORPUS_ROOT / "author_index.json"
DEFAULT_EXTERNAL_PSALMS_PATH = Path(
    "/Users/benjaminlagrone/Documents/projects/pericopeai.com/AugustineCorpus/texts/david_texts/Psalms.txt"
)
DEFAULT_LOCAL_PSALMS_PATH = LOCAL_SOURCE_TEXTS_DIR / "Psalms.txt"
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
SCRIPTURE_CHAPTER_LINE_RE = re.compile(r"(?im)^\s*chapter\s+(\d+)\b")
SCRIPTURE_VERSE_LINE_RE = re.compile(r"(?m)^\s*(\d+)\s+")
BOOK_PARTIAL_API_PATH = "/api/pericope/book-partial"
KEY_OF_SOLOMON_SOURCE = "key_of_solomon_esotericarchives.txt"
KEY_OF_SOLOMON_BOOK = "Key of Solomon, Book II"
PENTACLE_ORDINAL_WORDS = {
    1: "first",
    2: "second",
    3: "third",
    4: "fourth",
    5: "fifth",
    6: "sixth",
    7: "seventh",
}

_PSALM_LOOKUP: dict[int, dict[int, str]] | None = None
_PSALM_LOOKUP_PATH: Path | None = None
_PSALM_LOOKUP_MTIME: float | None = None
_PSALM_LOOKUP_SOURCE: str | None = None
_PSALM_LOOKUP_MODE: str | None = None
_PSALM_LOOKUP_NUMBERING: str | None = None
_PSALM_NUMBER_MAP: dict[int, list["PsalmReferenceSpan"]] | None = None
_PSALM_NUMBER_MAP_ERROR: str | None = None
_AUTHOR_TEXTS_DIR_CACHE: dict[str, Path] | None = None
GUIDED_PROMPTS_API_KEY_ENV = "SOLOMONIC_GUIDED_PROMPTS_API_KEY"
GUIDED_PROMPTS_AUTH_HEADER = "X-Solomonic-Clock-Key"
HISTORY_SYNC_API_PATH = "/api/history/sync"
HISTORY_CLIENT_HEADER = "X-TrueVine-History-Client"
HISTORY_KEY_HEADER = "X-TrueVine-History-Key"
HISTORY_STORE_PATH_ENV = "SOLOMONIC_HISTORY_STORE_PATH"
DEFAULT_HISTORY_STORE_PATH = Path("/var/lib/solomonic-clock/history_store.json")
MAX_HISTORY_ENTRIES_PER_CLIENT = 400
MAX_HISTORY_REFLECTION_LENGTH = 4000
MAX_HISTORY_LAUNCHES_PER_ENTRY = 12
_HISTORY_STORE_LOCK = threading.Lock()
DEFAULT_SITE_URL = "https://truevineos.cloud"
SITE_URL_ENV = "SOLOMONIC_SITE_URL"
PUBLIC_PAGE_TEMPLATES = {
    "/": (REPO_ROOT / "web" / "index.html", "/"),
    "/clock": (REPO_ROOT / "web" / "clock_visualizer.html", "/clock"),
    "/how-to-use": (REPO_ROOT / "web" / "how_to_use.html", "/how-to-use"),
    "/web/index.html": (REPO_ROOT / "web" / "index.html", "/"),
    "/web/clock_visualizer.html": (REPO_ROOT / "web" / "clock_visualizer.html", "/clock"),
    "/web/how_to_use.html": (REPO_ROOT / "web" / "how_to_use.html", "/how-to-use"),
}
SITEMAP_PAGE_SOURCES = {
    "/": REPO_ROOT / "web" / "index.html",
    "/clock": REPO_ROOT / "web" / "clock_visualizer.html",
    "/how-to-use": REPO_ROOT / "web" / "how_to_use.html",
}
NOINDEX_PREFIXES = ("/api/", "/data/", "/docs/", "/src/", "/deploy/", "/output/", "/.playwright-cli/")
NOINDEX_PATHS = {"/web/index.html", "/web/clock_visualizer.html", "/web/how_to_use.html"}

MS_PER_DAY = 1000 * 60 * 60 * 24
CHALDEAN_ORDER = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"]
PLANETARY_DAY_GUIDANCE = {
    "Sun": {
        "tone": "Visibility, confidence, and leadership work are favored.",
        "activities": [
            "Present your work publicly.",
            "Make decisions that set direction.",
            "Focus on vitality and renewal.",
        ],
    },
    "Moon": {
        "tone": "Reflection, receptivity, and home-centered work are favored.",
        "activities": [
            "Journal dreams and emotional patterns.",
            "Cleanse your space and routines.",
            "Prioritize family and restoration.",
        ],
    },
    "Mars": {
        "tone": "Bold action, protection, and difficult tasks are favored.",
        "activities": [
            "Handle conflict directly and clearly.",
            "Do hard tasks first.",
            "Set and defend boundaries.",
        ],
    },
    "Mercury": {
        "tone": "Communication, study, and planning are favored.",
        "activities": [
            "Write, research, and organize ideas.",
            "Schedule key conversations.",
            "Review contracts and details.",
        ],
    },
    "Jupiter": {
        "tone": "Growth, opportunity, and wise leadership are favored.",
        "activities": [
            "Plan expansion and long-range goals.",
            "Teach, mentor, or advise.",
            "Act on strategic opportunities.",
        ],
    },
    "Venus": {
        "tone": "Harmony, creativity, and relationship work are favored.",
        "activities": [
            "Repair social friction with diplomacy.",
            "Make time for art or design.",
            "Strengthen key partnerships.",
        ],
    },
    "Saturn": {
        "tone": "Discipline, structure, and enduring work are favored.",
        "activities": [
            "Set limits and simplify commitments.",
            "Complete long-term maintenance work.",
            "Focus on serious, patient progress.",
        ],
    },
}
PLANETARY_CORRESPONDENCES = {
    "Sun": {"color": "Gold", "metal": "Gold", "angel": "Michael"},
    "Moon": {"color": "Silver", "metal": "Silver", "angel": "Gabriel"},
    "Mars": {"color": "Scarlet", "metal": "Iron", "angel": "Camael"},
    "Mercury": {"color": "Yellow", "metal": "Quicksilver", "angel": "Raphael"},
    "Jupiter": {"color": "Royal Blue", "metal": "Tin", "angel": "Sachiel"},
    "Venus": {"color": "Emerald", "metal": "Copper", "angel": "Anael"},
    "Saturn": {"color": "Black", "metal": "Lead", "angel": "Cassiel"},
}
WISDOM_CONTENT_BY_RULER = {
    "Sun": {
        "ref": "Proverbs 4:18",
        "text": "The path of the just is as the shining light, that shineth more and more unto the perfect day.",
    },
    "Moon": {
        "ref": "Ecclesiastes 3:1",
        "text": "To every thing there is a season, and a time to every purpose under the heaven.",
    },
    "Mars": {
        "ref": "Proverbs 24:10",
        "text": "If thou faint in the day of adversity, thy strength is small.",
    },
    "Mercury": {
        "ref": "Proverbs 18:21",
        "text": "Death and life are in the power of the tongue.",
    },
    "Jupiter": {
        "ref": "Proverbs 11:25",
        "text": "The liberal soul shall be made fat: and he that watereth shall be watered also himself.",
    },
    "Venus": {
        "ref": "Proverbs 15:1",
        "text": "A soft answer turneth away wrath: but grievous words stir up anger.",
    },
    "Saturn": {
        "ref": "Proverbs 25:28",
        "text": "He that hath no rule over his own spirit is like a city that is broken down, and without walls.",
    },
}
FALLBACK_DAILY_PSALM_BY_RULER = {
    "Sun": {"chapter": 19, "verse": 1},
    "Moon": {"chapter": 63, "verse": 6},
    "Mars": {"chapter": 144, "verse": 1},
    "Mercury": {"chapter": 119, "verse": 105},
    "Jupiter": {"chapter": 112, "verse": 3},
    "Venus": {"chapter": 45, "verse": 2},
    "Saturn": {"chapter": 90, "verse": 12},
}
PLANETARY_DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
PLANETARY_RULERS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]
LIFE_DOMAIN_FOCUS_KEYWORDS = [
    (re.compile(r"\b(study|learn|understand|message|speech|word|reason|clarity|think|mind)\b", re.I), "mind"),
    (re.compile(r"\b(body|health|sleep|rest|strength|travel|journey|road|movement|discipline)\b", re.I), "body"),
    (re.compile(r"\b(relationship|repair|peace|conflict|anger|friend|partner|love|reconcile)\b", re.I), "relationships"),
    (re.compile(r"\b(money|wealth|trade|resource|budget|steward|provision|prosper)\b", re.I), "stewardship"),
    (re.compile(r"\b(work|task|career|labor|courage|purpose|calling|vocation|lead)\b", re.I), "vocation"),
    (re.compile(r"\b(home|house|household|order|routine|maintenance|boundary)\b", re.I), "household"),
    (re.compile(r"\b(prayer|silence|reflect|contemplate|faith|spirit|mercy|devotion)\b", re.I), "contemplation"),
]


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


@dataclass(frozen=True)
class BookPartialTarget:
    author_slug: str
    book: str
    source: str
    start_position: int
    end_position: int
    chapter: str | None = None
    reference: str | None = None


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


def _load_external_author_text_dirs() -> dict[str, Path]:
    global _AUTHOR_TEXTS_DIR_CACHE

    if _AUTHOR_TEXTS_DIR_CACHE is not None:
        return _AUTHOR_TEXTS_DIR_CACHE

    author_index_path = Path(
        os.environ.get("SOLOMONIC_AUGUSTINE_AUTHOR_INDEX_PATH", DEFAULT_AUGUSTINE_AUTHOR_INDEX_PATH)
    ).expanduser()
    mapped: dict[str, Path] = {}

    try:
        raw = json.loads(author_index_path.read_text(encoding="utf-8"))
    except Exception:
        _AUTHOR_TEXTS_DIR_CACHE = mapped
        return mapped

    if not isinstance(raw, list):
        _AUTHOR_TEXTS_DIR_CACHE = mapped
        return mapped

    for entry in raw:
        if not isinstance(entry, dict):
            continue
        slug = str(entry.get("slug") or "").strip().lower()
        texts_dir = str(entry.get("texts_dir") or "").strip()
        if not slug or not texts_dir:
            continue
        path = Path(texts_dir).expanduser()
        if not path.is_absolute():
            path = author_index_path.parent / path
        mapped[slug] = path

    _AUTHOR_TEXTS_DIR_CACHE = mapped
    return mapped


def _resolve_text_candidate_paths(author_slug: str, source: str) -> list[Path]:
    safe_source = os.path.basename(str(source or "").strip())
    if not safe_source:
        return []

    candidates: list[Path] = []
    author_text_dirs = _load_external_author_text_dirs()
    author_dir = author_text_dirs.get(str(author_slug or "").strip().lower())
    if author_dir:
        candidates.append(author_dir / safe_source)

    if safe_source == "Psalms.txt":
        candidates.append(DEFAULT_EXTERNAL_PSALMS_PATH)
        candidates.append(DEFAULT_LOCAL_PSALMS_PATH)

    candidates.append(LOCAL_SOURCE_TEXTS_DIR / safe_source)

    deduped: list[Path] = []
    seen: set[str] = set()
    for candidate in candidates:
        key = str(candidate)
        if key in seen:
            continue
        seen.add(key)
        deduped.append(candidate)
    return deduped


def _load_source_text(author_slug: str, source: str) -> tuple[str | None, Path | None, str | None]:
    for candidate in _resolve_text_candidate_paths(author_slug, source):
        if not candidate.exists():
            continue
        try:
            return candidate.read_text(encoding="utf-8", errors="replace"), candidate, None
        except OSError as exc:
            return None, candidate, f"Unable to read source text {candidate}: {exc}"

    return None, None, f"Source text not found for {author_slug}:{source}."


def _split_into_positions(content: str) -> list[tuple[int, str]]:
    paragraphs: list[tuple[int, str]] = []
    position = 0
    for block in content.split("\n\n"):
        text = block.strip()
        if not text:
            continue
        position += 1
        paragraphs.append((position, text))
    return paragraphs


def _extract_reference_fields(
    text: str,
    current_chapter: str | None,
) -> tuple[str | None, int | None, int | None]:
    chapter = current_chapter
    chapter_matches = SCRIPTURE_CHAPTER_LINE_RE.findall(text)
    if chapter_matches:
        chapter = chapter_matches[-1]

    verse_numbers = [int(num) for num in SCRIPTURE_VERSE_LINE_RE.findall(text)]
    if verse_numbers:
        verse_start = min(verse_numbers)
        verse_end = max(verse_numbers)
    else:
        verse_start = None
        verse_end = None

    return chapter, verse_start, verse_end


def _build_reference_label(
    book: str,
    chapter: str | None,
    verse_start: int | None,
    verse_end: int | None,
) -> str:
    if chapter and verse_start is not None:
        if verse_end is not None and verse_end != verse_start:
            return f"{book} {chapter}:{verse_start}-{verse_end}"
        return f"{book} {chapter}:{verse_start}"
    if chapter:
        return f"{book} {chapter}"
    return book


def _split_into_position_entries(content: str) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    current_chapter: str | None = None

    for position, text in _split_into_positions(content):
        chapter, verse_start, verse_end = _extract_reference_fields(text, current_chapter)
        current_chapter = chapter or current_chapter
        entries.append(
            {
                "position": position,
                "text": text,
                "chapter": current_chapter,
                "verse_start": verse_start,
                "verse_end": verse_end,
            }
        )

    return entries


def _coalesce_chapter(entries: list[dict[str, Any]]) -> str | None:
    chapters = [str(entry.get("chapter")) for entry in entries if entry.get("chapter")]
    if not chapters:
        return None
    if len(set(chapters)) == 1:
        return chapters[0]
    return f"{chapters[0]}-{chapters[-1]}"


def _build_local_book_partial_payload(
    target: BookPartialTarget,
) -> tuple[dict[str, Any] | None, str | None]:
    raw_text, source_path, error = _load_source_text(target.author_slug, target.source)
    if raw_text is None:
        return None, error or "Source text unavailable."

    entries = _split_into_position_entries(raw_text)
    if not entries:
        return None, f"Book content not available for {target.source}."

    start = min(max(1, target.start_position), len(entries))
    end = min(max(start, target.end_position), len(entries))
    selected = [entry for entry in entries if start <= entry["position"] <= end]
    if not selected:
        return None, f"Position range {start}-{end} produced no content for {target.source}."

    chapter = target.chapter or _coalesce_chapter(selected)
    verse_starts = [int(entry["verse_start"]) for entry in selected if entry.get("verse_start") is not None]
    verse_ends = [int(entry["verse_end"]) for entry in selected if entry.get("verse_end") is not None]
    verse_start = min(verse_starts) if verse_starts else None
    verse_end = max(verse_ends) if verse_ends else None

    return (
        {
            "author_slug": target.author_slug,
            "book": target.book,
            "source": target.source,
            "chapter": chapter or "Unknown Chapter",
            "start_position": start,
            "end_position": end,
            "verse_start": verse_start,
            "verse_end": verse_end,
            "reference": target.reference or _build_reference_label(target.book, chapter, verse_start, verse_end),
            "content": "\n\n".join(entry["text"] for entry in selected),
            "source_path": str(source_path) if source_path else None,
            "resolved_via": "local_fallback",
        },
        None,
    )


def _fetch_book_partial_from_pericope(
    target: BookPartialTarget,
) -> tuple[dict[str, Any] | None, str | None]:
    payload = {
        "author_slug": target.author_slug,
        "book": target.book,
        "source": target.source,
        "chapter": target.chapter,
        "start_position": target.start_position,
        "end_position": target.end_position,
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
            if not isinstance(decoded, dict):
                errors.append(f"{url}: invalid JSON payload")
                continue

            content = decoded.get("content")
            if not isinstance(content, str) or not content.strip():
                errors.append(f"{url}: missing content")
                continue

            result = dict(decoded)
            result.setdefault("author_slug", target.author_slug)
            result.setdefault("book", target.book)
            result.setdefault("source", target.source)
            result.setdefault("chapter", target.chapter or "Unknown Chapter")
            result.setdefault("start_position", target.start_position)
            result.setdefault("end_position", target.end_position)
            result.setdefault("reference", target.reference or target.book)
            result["resolved_via"] = "pericope"
            return result, None
        except Exception as exc:  # pragma: no cover - depends on runtime network/service state
            errors.append(f"{url}: {exc}")

    if not errors:
        return None, "Pericope book_partial unavailable."
    return None, "Unable to reach Pericope book_partial. Tried: " + " | ".join(errors[:3])


def _parse_scripture_reference(
    reference: str,
) -> tuple[str | None, int | None, str | None]:
    match = re.fullmatch(r"\s*(.+?)\s+(\d+)(?::([\d,\-\s]+))?\s*", str(reference or ""))
    if not match:
        return None, None, None

    book = match.group(1).strip()
    chapter = int(match.group(2))
    verse_spec = match.group(3).strip() if match.group(3) else None
    return book, chapter, verse_spec


def _resolve_scripture_book_partial_target(
    *,
    author_slug: str,
    book: str,
    source: str,
    chapter: int,
    reference: str | None,
) -> tuple[BookPartialTarget | None, str | None, HTTPStatus]:
    raw_text, _source_path, error = _load_source_text(author_slug, source)
    if raw_text is None:
        return None, error or "Source text unavailable.", HTTPStatus.NOT_FOUND

    entries = _split_into_position_entries(raw_text)
    chapter_entries = [entry for entry in entries if entry.get("chapter") == str(chapter)]
    if not chapter_entries:
        return None, f"{book} chapter {chapter} not found in {source}.", HTTPStatus.NOT_FOUND

    return (
        BookPartialTarget(
            author_slug=author_slug,
            book=book,
            source=source,
            start_position=chapter_entries[0]["position"],
            end_position=chapter_entries[-1]["position"],
            chapter=str(chapter),
            reference=reference or f"{book} {chapter}",
        ),
        None,
        HTTPStatus.OK,
    )


def _resolve_psalm_book_partial_target(
    payload: dict[str, Any],
) -> tuple[BookPartialTarget | None, str | None, HTTPStatus]:
    chapter_raw = payload.get("chapter")
    reference = str(payload.get("reference") or "").strip() or None

    if chapter_raw in {None, ""} and reference:
        _book, parsed_chapter, _verse_spec = _parse_scripture_reference(reference.replace("Psalm ", "Psalms ", 1))
        chapter_raw = parsed_chapter

    try:
        chapter = int(chapter_raw)
    except (TypeError, ValueError):
        return None, "Missing or invalid Psalm chapter.", HTTPStatus.BAD_REQUEST

    if chapter < 1:
        return None, "Missing or invalid Psalm chapter.", HTTPStatus.BAD_REQUEST

    return _resolve_scripture_book_partial_target(
        author_slug=os.environ.get("SOLOMONIC_PERICOPE_AUTHOR_SLUG", "david"),
        book=os.environ.get("SOLOMONIC_PERICOPE_BOOK", "Psalms"),
        source=os.environ.get("SOLOMONIC_PERICOPE_SOURCE", "Psalms.txt"),
        chapter=chapter,
        reference=reference or f"Psalm {chapter}",
    )


def _resolve_wisdom_book_partial_target(
    payload: dict[str, Any],
) -> tuple[BookPartialTarget | None, str | None, HTTPStatus]:
    reference = str(payload.get("reference") or "").strip()
    book, chapter, _verse_spec = _parse_scripture_reference(reference)
    if not book or chapter is None:
        return None, "Missing or invalid wisdom reference.", HTTPStatus.BAD_REQUEST

    source_map = {
        "proverbs": ("Proverbs", "Proverbs.txt"),
        "ecclesiastes": ("Ecclesiastes", "Ecclesiastes.txt"),
        "song of solomon": ("Song of Solomon", "Song_of_Solomon.txt"),
    }
    resolved = source_map.get(book.lower())
    if not resolved:
        return None, f"Unsupported wisdom book: {book}.", HTTPStatus.BAD_REQUEST

    book_name, source = resolved
    return _resolve_scripture_book_partial_target(
        author_slug="solomon",
        book=book_name,
        source=source,
        chapter=chapter,
        reference=reference,
    )


def _resolve_solomonic_book_partial_target(
    payload: dict[str, Any],
) -> tuple[BookPartialTarget | None, str | None, HTTPStatus]:
    planet = str(payload.get("planet") or "").strip()
    pentacle_raw = payload.get("pentacle")
    reference = str(payload.get("reference") or "").strip() or None

    if not planet:
        return None, "Missing Solomonic planet.", HTTPStatus.BAD_REQUEST

    try:
        pentacle = int(pentacle_raw)
    except (TypeError, ValueError):
        return None, "Missing Solomonic pentacle index.", HTTPStatus.BAD_REQUEST

    ordinal = PENTACLE_ORDINAL_WORDS.get(pentacle)
    if not ordinal:
        return None, f"Unsupported Solomonic pentacle index: {pentacle}.", HTTPStatus.BAD_REQUEST

    raw_text, _source_path, error = _load_source_text("solomon_expanded", KEY_OF_SOLOMON_SOURCE)
    if raw_text is None:
        return None, error or "Solomonic source text unavailable.", HTTPStatus.NOT_FOUND

    entries = _split_into_position_entries(raw_text)
    heading_pattern = re.compile(
        rf"Figure\s+\d+\.--\s+The\s+{ordinal}\s+pentacle of {re.escape(planet)}\.--",
        re.IGNORECASE,
    )
    next_heading_pattern = re.compile(r"Figure\s+\d+\.--\s+The\s+\w+\s+pentacle of ", re.IGNORECASE)

    start_entry: dict[str, Any] | None = None
    end_entry: dict[str, Any] | None = None
    started = False
    for entry in entries:
        text = str(entry.get("text") or "")
        if not started and heading_pattern.search(text):
            start_entry = entry
            end_entry = entry
            started = True
            continue
        if started and next_heading_pattern.search(text):
            break
        if started:
            end_entry = entry

    if start_entry is None or end_entry is None:
        return (
            None,
            f"Unable to locate {planet} pentacle #{pentacle} in {KEY_OF_SOLOMON_SOURCE}.",
            HTTPStatus.NOT_FOUND,
        )

    return (
        BookPartialTarget(
            author_slug="solomon_expanded",
            book=KEY_OF_SOLOMON_BOOK,
            source=KEY_OF_SOLOMON_SOURCE,
            start_position=start_entry["position"],
            end_position=end_entry["position"],
            reference=reference or f"{KEY_OF_SOLOMON_BOOK} • {planet} Pentacle #{pentacle}",
        ),
        None,
        HTTPStatus.OK,
    )


def _build_psalm_lookup_chapter_payload(
    chapter: int,
    reference: str | None,
) -> tuple[dict[str, Any] | None, str | None]:
    lookup, error = _load_psalm_lookup()
    if lookup is None:
        return None, error or "Psalms source unavailable."

    chapter_map = lookup.get(chapter)
    if not chapter_map:
        return None, f"Psalm {chapter} not found in configured Psalms source."

    ordered = [text for _verse, text in sorted(chapter_map.items())]
    if not ordered:
        return None, f"Psalm {chapter} not found in configured Psalms source."

    return (
        {
            "author_slug": os.environ.get("SOLOMONIC_PERICOPE_AUTHOR_SLUG", "david"),
            "book": os.environ.get("SOLOMONIC_PERICOPE_BOOK", "Psalms"),
            "source": os.environ.get("SOLOMONIC_PERICOPE_SOURCE", "Psalms.txt"),
            "chapter": str(chapter),
            "reference": reference or f"Psalm {chapter}",
            "content": "\n".join(ordered),
            "resolved_via": "psalm_lookup_fallback",
        },
        None,
    )


def _build_book_partial_payload(
    payload: dict[str, Any],
) -> tuple[dict[str, Any] | None, str | None, HTTPStatus]:
    kind = str(payload.get("kind") or "").strip().lower()
    requested_reference = str(payload.get("reference") or "").strip() or None

    resolver_map = {
        "psalm": _resolve_psalm_book_partial_target,
def _build_psalm_api_fallback_payload(
    chapter: int,
    verse: int | None,
    response_meta: dict[str, Any],
) -> dict[str, Any] | None:
    excerpt = _load_scripture_excerpt(chapter, str(verse) if verse is not None else None)
    if not excerpt or excerpt == "Psalm excerpt unavailable.":
        return None

    payload: dict[str, Any] = {
        "chapter": chapter,
        "text": excerpt,
        "source": "scripture_mappings_fallback",
        "numbering": response_meta,
        "fallback": True,
    }
    if verse is not None:
        payload["verse"] = verse
    return payload


        "wisdom": _resolve_wisdom_book_partial_target,
        "solomonic": _resolve_solomonic_book_partial_target,
    }
    resolver = resolver_map.get(kind)
    if resolver is None:
        return None, f"Unsupported book_partial kind: {kind or 'unknown'}.", HTTPStatus.BAD_REQUEST

    target, error, status = resolver(payload)
    if target is None:
        if kind == "psalm":
            chapter_raw = payload.get("chapter")
            try:
                chapter = int(chapter_raw)
            except (TypeError, ValueError):
                chapter = -1
            if chapter > 0:
                fallback_payload, fallback_error = _build_psalm_lookup_chapter_payload(chapter, requested_reference)
                if fallback_payload is not None:
                    fallback_payload["requested_reference"] = requested_reference
                    fallback_payload["kind"] = kind
                    return fallback_payload, None, HTTPStatus.OK
                error = fallback_error or error
        return None, error or "Unable to resolve book_partial target.", status

    remote_payload, remote_error = _fetch_book_partial_from_pericope(target)
    if remote_payload is not None:
        remote_payload["requested_reference"] = requested_reference
        remote_payload["kind"] = kind
        return remote_payload, None, HTTPStatus.OK

    local_payload, local_error = _build_local_book_partial_payload(target)
    if local_payload is not None:
        if remote_error:
            local_payload["resolution_warning"] = remote_error
        local_payload["requested_reference"] = requested_reference
        local_payload["kind"] = kind
        return local_payload, None, HTTPStatus.OK

    return None, local_error or remote_error or "Unable to expand requested text.", HTTPStatus.NOT_FOUND


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


def _read_json_file(path: Path) -> tuple[dict[str, Any] | None, str | None]:
    if not path.exists():
        return None, f"Required JSON file not found: {path}"
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        return None, f"Invalid JSON in {path.name}: {exc}"
    if not isinstance(payload, dict):
        return None, f"Expected top-level object in {path.name}"
    return payload, None


def _resolve_history_store_path() -> Path:
    configured = os.environ.get(HISTORY_STORE_PATH_ENV, "").strip()
    if configured:
        return Path(configured)
    return DEFAULT_HISTORY_STORE_PATH


def _ensure_parent_dir(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def _read_history_store() -> dict[str, Any]:
    path = _resolve_history_store_path()
    if not path.exists():
        return {"clients": {}}

    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {"clients": {}}

    if not isinstance(payload, dict):
        return {"clients": {}}
    clients = payload.get("clients")
    if not isinstance(clients, dict):
        return {"clients": {}}
    return {"clients": clients}


def _write_history_store(payload: dict[str, Any]) -> None:
    path = _resolve_history_store_path()
    _ensure_parent_dir(path)
    temp_path = path.with_suffix(f"{path.suffix}.tmp")
    temp_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    temp_path.replace(path)


def _hash_history_key(secret: str) -> str:
    return hashlib.sha256(secret.encode("utf-8")).hexdigest()


def _is_valid_history_client_id(client_id: str) -> bool:
    return bool(re.fullmatch(r"[A-Za-z0-9_-]{16,120}", client_id))


def _normalize_history_launch(entry: Any) -> dict[str, Any] | None:
    if not isinstance(entry, dict):
        return None

    payload = {
        "launchedAt": _to_snippet(str(entry.get("launchedAt", "")).strip(), 64),
        "mode": _to_snippet(str(entry.get("mode", "")).strip(), 24),
        "promptId": _to_snippet(str(entry.get("promptId", "")).strip(), 120),
        "message": _to_snippet(str(entry.get("message", "")).strip(), 280),
        "bundleKind": _to_snippet(str(entry.get("bundleKind", "")).strip(), 40),
        "bundleRef": _to_snippet(str(entry.get("bundleRef", "")).strip(), 140),
        "reflectionIncluded": bool(entry.get("reflectionIncluded")),
        "source": _to_snippet(str(entry.get("source", "")).strip(), 60),
    }
    return {key: value for key, value in payload.items() if value not in {"", None, False}}


def _normalize_history_entry(entry: Any) -> dict[str, Any]:
    if not isinstance(entry, dict):
        return {}

    launches = []
    for launch in entry.get("launches") or []:
        normalized = _normalize_history_launch(launch)
        if normalized is not None:
            launches.append(normalized)
    launches = launches[-MAX_HISTORY_LAUNCHES_PER_ENTRY:]

    rule_of_life = entry.get("ruleOfLife")
    normalized_rule = None
    if isinstance(rule_of_life, dict):
        normalized_rule = {
            key: _to_snippet(str(rule_of_life.get(key, "")).strip(), 400 if key in {"morning", "midday", "evening", "summary"} else 160)
            for key in ("virtue", "domain", "morning", "midday", "evening", "summary", "repairNote", "scriptureRef")
        }
        normalized_rule = {key: value for key, value in normalized_rule.items() if value}

    payload = {
        "adoptedAt": _to_snippet(str(entry.get("adoptedAt", "")).strip(), 64),
        "completedAt": _to_snippet(str(entry.get("completedAt", "")).strip(), 64),
        "openingCompletedAt": _to_snippet(str(entry.get("openingCompletedAt", "")).strip(), 64),
        "openingIntention": _to_snippet(str(entry.get("openingIntention", "")).strip(), 280),
        "openingScriptureRef": _to_snippet(str(entry.get("openingScriptureRef", "")).strip(), 120),
        "closingCompletedAt": _to_snippet(str(entry.get("closingCompletedAt", "")).strip(), 64),
        "closingSummary": _to_snippet(str(entry.get("closingSummary", "")).strip(), 600),
        "closingGratitude": _to_snippet(str(entry.get("closingGratitude", "")).strip(), 400),
        "closingDifficulty": _to_snippet(str(entry.get("closingDifficulty", "")).strip(), 400),
        "closingCarryForward": _to_snippet(str(entry.get("closingCarryForward", "")).strip(), 400),
        "closingUpdatedAt": _to_snippet(str(entry.get("closingUpdatedAt", "")).strip(), 64),
        "reflection": str(entry.get("reflection", "")).strip()[:MAX_HISTORY_REFLECTION_LENGTH],
        "reflectionUpdatedAt": _to_snippet(str(entry.get("reflectionUpdatedAt", "")).strip(), 64),
        "updatedAt": _to_snippet(str(entry.get("updatedAt", "")).strip(), 64),
        "guidedPrompt": _to_snippet(str(entry.get("guidedPrompt", "")).strip(), 280),
        "label": _to_snippet(str(entry.get("label", "")).strip(), 160),
        "dayDisplay": _to_snippet(str(entry.get("dayDisplay", "")).strip(), 120),
        "rulerText": _to_snippet(str(entry.get("rulerText", "")).strip(), 32),
        "activeFocus": _to_snippet(str(entry.get("activeFocus", "")).strip(), 180),
        "weeklyReviewStatus": _to_snippet(str(entry.get("weeklyReviewStatus", "")).strip(), 32),
        "weeklyReviewStatusAt": _to_snippet(str(entry.get("weeklyReviewStatusAt", "")).strip(), 64),
        "weeklyReviewNote": _to_snippet(str(entry.get("weeklyReviewNote", "")).strip(), 400),
        "weeklyReviewEncouragement": _to_snippet(str(entry.get("weeklyReviewEncouragement", "")).strip(), 400),
        "weeklyReviewWarning": _to_snippet(str(entry.get("weeklyReviewWarning", "")).strip(), 400),
        "weeklyReviewCarryForward": _to_snippet(str(entry.get("weeklyReviewCarryForward", "")).strip(), 400),
        "weeklyReviewScriptureRef": _to_snippet(str(entry.get("weeklyReviewScriptureRef", "")).strip(), 120),
        "activePentacleLabel": _to_snippet(str(entry.get("activePentacleLabel", "")).strip(), 120),
        "psalmRef": _to_snippet(str(entry.get("psalmRef", "")).strip(), 80),
        "wisdomRef": _to_snippet(str(entry.get("wisdomRef", "")).strip(), 80),
        "solomonicRef": _to_snippet(str(entry.get("solomonicRef", "")).strip(), 180),
        "lifeDomainFocus": _to_snippet(str(entry.get("lifeDomainFocus", "")).strip(), 80),
        "weakestDomain": _to_snippet(str(entry.get("weakestDomain", "")).strip(), 80),
        "weakestDomainScore": entry.get("weakestDomainScore"),
        "ruleOfLife": normalized_rule,
        "launches": launches,
        "lastLaunchAt": _to_snippet(str(entry.get("lastLaunchAt", "")).strip(), 64),
    }
    cleaned = {
        key: value
        for key, value in payload.items()
        if value not in ("", None) and value != [] and value != {}
    }
    score = cleaned.get("weakestDomainScore")
    if score is not None:
        try:
            cleaned["weakestDomainScore"] = max(0, min(100, int(score)))
        except Exception:
            cleaned.pop("weakestDomainScore", None)
    return cleaned


def _normalize_history_state(state: Any) -> dict[str, dict[str, Any]]:
    if not isinstance(state, dict):
        return {}

    normalized: dict[str, dict[str, Any]] = {}
    for date_key, entry in state.items():
        if not isinstance(date_key, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date_key):
            continue
        normalized[date_key] = _normalize_history_entry(entry)

    sorted_items = sorted(normalized.items(), key=lambda item: item[0], reverse=True)[:MAX_HISTORY_ENTRIES_PER_CLIENT]
    return dict(sorted(sorted_items, key=lambda item: item[0]))


def _history_entry_timestamp(entry: dict[str, Any]) -> str:
    for key in (
        "updatedAt",
        "closingUpdatedAt",
        "closingCompletedAt",
        "lastLaunchAt",
        "reflectionUpdatedAt",
        "completedAt",
        "adoptedAt",
    ):
        value = str(entry.get(key, "")).strip()
        if value:
            return value
    return ""


def _merge_history_states(server_state: dict[str, Any], client_state: dict[str, Any]) -> dict[str, dict[str, Any]]:
    left = _normalize_history_state(server_state)
    right = _normalize_history_state(client_state)
    merged = dict(left)

    for date_key, client_entry in right.items():
        server_entry = merged.get(date_key, {})
        if _history_entry_timestamp(client_entry) >= _history_entry_timestamp(server_entry):
            combined = dict(server_entry)
            combined.update(client_entry)
        else:
            combined = dict(client_entry)
            combined.update(server_entry)

        seen_launches: set[tuple[str, str, str]] = set()
        launches: list[dict[str, Any]] = []
        for launch_list in (server_entry.get("launches") or [], client_entry.get("launches") or []):
            if not isinstance(launch_list, list):
                continue
            for source in launch_list:
                if not isinstance(source, dict):
                    continue
                launch_key = (
                    str(source.get("launchedAt", "")),
                    str(source.get("mode", "")),
                    str(source.get("promptId", "")),
                )
                if launch_key in seen_launches:
                    continue
                seen_launches.add(launch_key)
                launches.append(source)
        if launches:
            launches.sort(key=lambda entry: str(entry.get("launchedAt", "")))
            combined["launches"] = launches[-MAX_HISTORY_LAUNCHES_PER_ENTRY:]
            combined["lastLaunchAt"] = str(combined["launches"][-1].get("launchedAt", ""))

        merged[date_key] = _normalize_history_entry(combined)

    return _normalize_history_state(merged)


def _authorize_history_client(headers: Any) -> tuple[bool, HTTPStatus, str | None, str | None]:
    client_id = str(headers.get(HISTORY_CLIENT_HEADER, "")).strip()
    client_key = str(headers.get(HISTORY_KEY_HEADER, "")).strip()

    if not _is_valid_history_client_id(client_id):
        return False, HTTPStatus.BAD_REQUEST, None, f"Invalid or missing {HISTORY_CLIENT_HEADER}."
    if len(client_key) < 24:
        return False, HTTPStatus.UNAUTHORIZED, None, f"Invalid or missing {HISTORY_KEY_HEADER}."

    return True, HTTPStatus.OK, client_id, client_key


def _to_snippet(text: str, max_length: int = 220) -> str:
    clean = re.sub(r"\s+", " ", str(text or "")).strip()
    if not clean:
        return ""
    if len(clean) <= max_length:
        return clean
    return f"{clean[: max_length - 1].rstrip()}…"


def _strip_translation_meta(text: str) -> str:
    clean = str(text or "").strip()
    if not clean:
        return ""

    clean = re.sub(r"\n{2,}English translation:\s*\n+", "\n", clean, flags=re.I)
    clean = re.sub(
        r"\n{2,}(\((?:Note|Please note|Translation maintained|Translation of the Bible)[\s\S]*\)|"
        r"(?:I have translated[\s\S]*|While trying to maintain[\s\S]*|This translation[\s\S]*|"
        r"In a literal translation[\s\S]*|The number\s+\"?\d+\"?\s+may indicate[\s\S]*|"
        r"A more natural rendering could[\s\S]*|The correct English sentence should be[\s\S]*))$",
        "",
        clean,
        flags=re.I,
    )
    return clean.strip()


def _flatten_pentacles(groups: list[dict[str, Any]]) -> list[dict[str, Any]]:
    flattened: list[dict[str, Any]] = []
    for group_index, group in enumerate(groups):
        for pentacle_index, pentacle in enumerate(group.get("pentacles") or []):
            flattened.append(
                {
                    "groupIndex": group_index,
                    "pentacleIndex": pentacle_index,
                    "planet": group.get("name"),
                    "pentacle": pentacle,
                    "group": group,
                }
            )
    return flattened


def _is_leap_year(year: int) -> bool:
    return (year % 4 == 0 and year % 100 != 0) or year % 400 == 0


def _get_day_of_year(now: datetime) -> int:
    start_of_year = datetime(now.year, 1, 1, tzinfo=now.tzinfo)
    return int((now - start_of_year).total_seconds() // 86400)


def _get_day_progress(now: datetime) -> float:
    start_of_day = datetime(now.year, now.month, now.day, tzinfo=now.tzinfo)
    return (now - start_of_day).total_seconds() / 86400


def _get_week_fraction(now: datetime) -> float:
    hours_into_day = now.hour + (now.minute + (now.second + now.microsecond / 1_000_000) / 60) / 60
    return ((now.weekday() + 1) % 7 + hours_into_day / 24) / 7 % 1


def _get_planetary_day_label(now: datetime) -> dict[str, str]:
    index = int(now.strftime("%w"))
    return {
        "dayText": PLANETARY_DAY_NAMES[index],
        "rulerText": PLANETARY_RULERS[index],
    }


def _get_pentacle_key(active_pentacle: dict[str, Any] | None) -> str | None:
    if not active_pentacle:
        return None
    planet = active_pentacle.get("planet")
    pentacle = active_pentacle.get("pentacle") or {}
    index = pentacle.get("index")
    if not planet or index is None:
        return None
    return f"{str(planet).lower()}-{index}"


def _get_planetary_hour_ruler(now: datetime, day_ruler: str) -> dict[str, Any] | None:
    try:
        start_index = CHALDEAN_ORDER.index(day_ruler)
    except ValueError:
        return None
    hour_index = now.hour
    return {
        "hourIndex": hour_index,
        "ruler": CHALDEAN_ORDER[(start_index + hour_index) % len(CHALDEAN_ORDER)],
    }


def _build_pentacle_reference_map(payload: dict[str, Any]) -> dict[str, dict[str, Any]]:
    references: dict[str, dict[str, Any]] = {}
    for record in payload.get("pentacles") or []:
        planet = record.get("planet")
        pentacle = record.get("pentacle")
        if not planet or not isinstance(pentacle, int):
            continue
        references[f"{str(planet).lower()}-{pentacle}"] = {
            "psalms": list(record.get("psalms") or []),
            "supplementalReferences": list(record.get("supplemental_references") or []),
        }
    return references


def _get_primary_psalm_entry(record: dict[str, Any] | None) -> dict[str, Any] | None:
    if not record:
        return None
    for entry in record.get("psalms") or []:
        try:
            chapter = int(entry.get("number", entry.get("psalm")))
        except (TypeError, ValueError):
            continue
        if chapter > 0:
            return entry
    return None


def _format_psalm_reference(entry: dict[str, Any] | None) -> str | None:
    if not entry:
        return None
    try:
        chapter = int(entry.get("number", entry.get("psalm")))
    except (TypeError, ValueError):
        return None
    verse_label = f":{entry['verses']}" if entry.get("verses") else ""
    return f"Psalm {chapter}{verse_label}"


def _expand_verse_specification(spec: str) -> list[str]:
    clean = str(spec or "").strip()
    if not clean:
        return []

    verses: list[str] = []
    for part in clean.split(","):
        piece = part.strip()
        if not piece:
            continue
        match = re.fullmatch(r"(\d+)\s*-\s*(\d+)", piece)
        if match:
            start = int(match.group(1))
            end = int(match.group(2))
            if start <= end:
                verses.extend(str(value) for value in range(start, end + 1))
                continue
        verses.append(piece)
    return verses


def _load_scripture_excerpt(chapter: int, verse: str | None = None) -> str:
    scripture_payload, _ = _read_json_file(SCRIPTURE_MAPPINGS_PATH)
    if scripture_payload:
        entry = (scripture_payload.get("psalms") or {}).get(str(chapter))
        if isinstance(entry, dict):
            excerpt = _strip_translation_meta(
                str(entry.get("translation_excerpt") or entry.get("latin_excerpt") or "").strip()
            )
            if excerpt:
                return _to_snippet(excerpt)

    lookup, _ = _load_psalm_lookup()
    if lookup is None:
        return "Psalm excerpt unavailable."

    chapter_map = lookup.get(chapter)
    if not chapter_map:
        return "Psalm excerpt unavailable."

    if verse:
        try:
            resolved = int(verse)
        except ValueError:
            resolved = None
        if resolved is not None:
            text = chapter_map.get(resolved)
            if text:
                return _to_snippet(text)

    ordered = [text for _, text in sorted(chapter_map.items())]
    if not ordered:
        return "Psalm excerpt unavailable."
    return _to_snippet(" ".join(ordered))


def _resolve_life_focus_domain(
    time_state: dict[str, Any],
    life_config: dict[str, Any],
) -> str:
    active = time_state.get("active") or {}
    pentacle = (active.get("pentacle") or {}).get("pentacle") or {}
    planetary = active.get("planetary") or {}
    spirit = active.get("spirit") or {}

    focus_text = " ".join(
        [
            str(pentacle.get("focus") or ""),
            " ".join(planetary.get("themes") or []),
            str(spirit.get("spirit") or ""),
            str(spirit.get("zodiac") or ""),
        ]
    ).strip()

    for pattern, domain_id in LIFE_DOMAIN_FOCUS_KEYWORDS:
        if pattern.search(focus_text):
            return domain_id

    ruler_text = ((time_state.get("dayLabel") or {}).get("rulerText")) or ""
    planet_focus = (life_config.get("planetFocus") or {}).get(ruler_text)
    if planet_focus:
        return str(planet_focus)

    domains = life_config.get("domains") or []
    if domains:
        return str(domains[0].get("id") or "mind")
    return "mind"


def _get_life_wheel_state(time_state: dict[str, Any], life_config: dict[str, Any]) -> dict[str, Any] | None:
    domains = life_config.get("domains")
    if not isinstance(domains, list) or not domains:
        return None

    resolved_domains: list[dict[str, Any]] = []
    for domain in domains:
        resolved_domains.append(
            {
                **domain,
                "score": max(0, min(100, int(domain.get("seedScore") or 0))),
            }
        )

    focused_id = _resolve_life_focus_domain(time_state, life_config)
    weakest = min(resolved_domains, key=lambda item: item.get("score", 0))
    focused = next((domain for domain in resolved_domains if domain.get("id") == focused_id), resolved_domains[0])
    return {"domains": resolved_domains, "focusedDomain": focused, "weakestDomain": weakest}


def _build_weekly_arc_entry(
    base_datetime: datetime,
    offset: int,
    layers: dict[str, Any],
    derived: dict[str, Any],
    reference_map: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    target = base_datetime.replace(hour=12, minute=0, second=0, microsecond=0)
    from datetime import timedelta

    target = target + timedelta(days=offset)
    day_label = _get_planetary_day_label(target)
    guidance = PLANETARY_DAY_GUIDANCE.get(day_label["rulerText"], {})
    wisdom = WISDOM_CONTENT_BY_RULER.get(day_label["rulerText"], {})
    week_fraction = _get_week_fraction(target) if derived["planetaryGroupCount"] else 0
    pentacle_index = int(week_fraction * derived["totalPentacles"]) % derived["totalPentacles"] if derived["totalPentacles"] else -1
    active_pentacle = derived["flatPentacles"][pentacle_index] if pentacle_index >= 0 else None
    pentacle_key = _get_pentacle_key(active_pentacle)
    record = reference_map.get(pentacle_key) if pentacle_key else None
    primary_psalm = _get_primary_psalm_entry(record)

    if primary_psalm:
        try:
            chapter = int(primary_psalm.get("number", primary_psalm.get("psalm")))
        except (TypeError, ValueError):
            chapter = None
        verse_label = f":{primary_psalm['verses']}" if primary_psalm.get("verses") else ""
        psalm_ref = f"Psalm {chapter}{verse_label}" if chapter else "Psalm"
    else:
        fallback = FALLBACK_DAILY_PSALM_BY_RULER.get(day_label["rulerText"], {"chapter": 1, "verse": 1})
        psalm_ref = f"Psalm {fallback['chapter']}:{fallback['verse']}"

    return {
        "isToday": offset == 0,
        "dateLabel": target.strftime("%a, %b %-d") if os.name != "nt" else target.strftime("%a, %b %#d"),
        "rulerText": day_label["rulerText"],
        "pentacleLabel": (
            f"{active_pentacle['planet']} #{active_pentacle['pentacle']['index']}" if active_pentacle else "Unavailable"
        ),
        "focus": (active_pentacle or {}).get("pentacle", {}).get("focus", "Focus unavailable"),
        "tone": guidance.get("tone", "Steady, practical action is favored."),
        "psalmRef": psalm_ref,
        "wisdomRef": wisdom.get("ref", "Proverbs 16:3"),
    }


def _compute_time_state(now: datetime, layers: dict[str, Any], derived: dict[str, Any]) -> dict[str, Any]:
    year_length = 366 if _is_leap_year(now.year) else 365
    day_index = _get_day_of_year(now)
    day_progress = _get_day_progress(now)
    year_fraction = (day_index + day_progress) / year_length
    spirit_fraction = year_fraction % 1 if derived["spiritCount"] else 0
    week_fraction = _get_week_fraction(now) if derived["planetaryGroupCount"] else 0
    years_since_epoch = now.year - 2000 + year_fraction
    celestial_fraction = ((years_since_epoch % 9) / 9) if derived["celestialCount"] else 0

    spirit_index = int(spirit_fraction * derived["spiritCount"]) % derived["spiritCount"] if derived["spiritCount"] else -1
    planetary_index = (
        int(week_fraction * derived["planetaryGroupCount"]) % derived["planetaryGroupCount"]
        if derived["planetaryGroupCount"]
        else -1
    )
    celestial_index = (
        int(celestial_fraction * derived["celestialCount"]) % derived["celestialCount"]
        if derived["celestialCount"]
        else -1
    )
    pentacle_index = int(week_fraction * derived["totalPentacles"]) % derived["totalPentacles"] if derived["totalPentacles"] else -1

    return {
        "fractions": {
            "spirit": spirit_fraction,
            "planetary": week_fraction,
            "celestial": celestial_fraction,
        },
        "indices": {
            "spirit": spirit_index,
            "planetary": planetary_index,
            "celestial": celestial_index,
            "pentacle": pentacle_index,
        },
        "active": {
            "spirit": layers["spirit"]["sectors"][spirit_index] if spirit_index >= 0 else None,
            "planetary": layers["planetary"]["groups"][planetary_index] if planetary_index >= 0 else None,
            "celestial": layers["celestial"]["seals"][celestial_index] if celestial_index >= 0 else None,
            "pentacle": derived["flatPentacles"][pentacle_index] if pentacle_index >= 0 else None,
        },
        "clockText": now.strftime("%I:%M %p").lstrip("0"),
        "dayLabel": _get_planetary_day_label(now),
    }


def _build_guided_prompts(
    daily_guidance: dict[str, Any],
    weekly_arc: dict[str, Any],
    daily_profile: dict[str, Any],
    why_selected: dict[str, Any],
    content_bundle: dict[str, Any],
    limit: int,
) -> list[dict[str, str]]:
    prompts: list[dict[str, str]] = []
    seen_texts: set[str] = set()

    def clean_fragment(text: Any) -> str:
        return " ".join(str(text or "").split()).strip().rstrip(".")

    def lower_lead(text: Any) -> str:
        clean = clean_fragment(text)
        if not clean:
            return ""
        return clean[:1].lower() + clean[1:]

    def first_person_activity(text: Any) -> str:
        clean = lower_lead(text)
        if not clean:
            return ""
        clean = re.sub(r"\byour\b", "my", clean, flags=re.I)
        clean = re.sub(r"\byourself\b", "myself", clean, flags=re.I)
        return clean

    def bare_reference(text: Any) -> str:
        return re.sub(r"\s+\(.*\)\s*$", "", clean_fragment(text))

    def stable_seed(*parts: Any) -> int:
        blob = "|".join(clean_fragment(part) for part in parts if clean_fragment(part))
        return sum((index + 1) * ord(char) for index, char in enumerate(blob))

    def pick_variant(category: str, options: list[str]) -> str:
        if not options:
            return ""
        seed = stable_seed(
            daily_guidance.get("day"),
            weekly_arc.get("focus"),
            daily_profile.get("focus"),
            daily_profile.get("life_domain_focus"),
            daily_profile.get("weakest_domain"),
            (content_bundle.get("wisdom") or {}).get("ref"),
            category,
        )
        return options[seed % len(options)]

    def add_prompt(prefix: str, text: str, source: str, kind: str) -> None:
        clean = " ".join(str(text or "").split()).strip()
        if not clean or clean in seen_texts:
            return
        seen_texts.add(clean)
        slug = re.sub(r"[^a-z0-9]+", "-", clean.lower()).strip("-")[:64] or "prompt"
        prompts.append({"id": f"{prefix}-{slug}", "text": clean, "source": source, "kind": kind})

    activities = list(daily_guidance.get("activities") or [])
    weekly_focus = clean_fragment(weekly_arc.get("focus"))
    weekly_tone = clean_fragment(weekly_arc.get("tone"))
    profile_focus = clean_fragment(str(daily_profile.get("focus") or "").replace("Suggested focus: ", ""))
    life_focus = clean_fragment(daily_profile.get("life_domain_focus"))
    weakest_domain = clean_fragment(daily_profile.get("weakest_domain"))
    angel = clean_fragment(daily_profile.get("angel"))
    color = clean_fragment(daily_profile.get("color"))
    metal = clean_fragment(daily_profile.get("metal"))
    hour_ruler = clean_fragment(daily_profile.get("hour_ruler"))
    active_pentacle = clean_fragment(daily_profile.get("active_pentacle"))
    spirit = clean_fragment(daily_profile.get("spirit"))
    zodiac_sector = clean_fragment(daily_profile.get("zodiac_sector"))
    wisdom_ref = bare_reference((content_bundle.get("wisdom") or {}).get("ref"))
    psalm_ref = bare_reference((content_bundle.get("psalm") or {}).get("ref"))
    solomonic_ref = bare_reference((content_bundle.get("solomonic") or {}).get("ref"))
    reasons = [clean_fragment(reason) for reason in (why_selected.get("reasons") or []) if clean_fragment(reason)]
    ruler_text = ""
    day_label = clean_fragment(daily_guidance.get("day"))
    match = re.search(r"\(([^)]+)\)", day_label)
    if match:
        ruler_text = clean_fragment(match.group(1))

    if activities:
        first_activity = first_person_activity(activities[0])
        add_prompt(
            "today-guidance",
            pick_variant(
                "practical-1",
                [
                    f"What would it look like to {first_activity} well today?",
                    f"Where should I begin if I need to {first_activity} today?",
                    f"How can I {first_activity} without losing the day's center?",
                ],
            ),
            "daily_guidance",
            "practical",
        )

    if life_focus and weakest_domain:
        add_prompt(
            "life-domain",
            pick_variant(
                "life-domain",
                [
                    f"How should I apply today's guidance to {life_focus} while strengthening {weakest_domain}?",
                    f"What practice would help my {weakest_domain} without neglecting {life_focus} today?",
                    f"Where does today's focus belong in my {life_focus}: action, restraint, or repair?",
                ],
            ),
            "daily_profile",
            "life_domain",
        )

    if weekly_focus:
        weekly_prompt_options = [
            f"What does {lower_lead(weekly_focus)} require in practical terms today?",
            f"Where is the real opportunity inside today's theme of {lower_lead(weekly_focus)}?",
        ]
        if ruler_text:
            weekly_prompt_options.insert(
                0,
                f"How does today's {ruler_text} tone change the way I should approach {lower_lead(weekly_focus)}?",
            )
        elif weekly_tone:
            weekly_prompt_options.insert(
                0,
                f"How should I approach {lower_lead(weekly_focus)} if {lower_lead(weekly_tone)}?",
            )
        add_prompt(
            "weekly-arc",
            pick_variant("weekly-arc", weekly_prompt_options),
            "weekly_arc",
            "strategy",
        )

    if psalm_ref and wisdom_ref:
        add_prompt(
            "scripture-pair",
            pick_variant(
                "scripture-pair",
                [
                    f"How do {psalm_ref} and {wisdom_ref} interpret today's focus together?",
                    f"What in {wisdom_ref} sharpens the meaning of {lower_lead(profile_focus or weekly_focus)} today?",
                    f"How should I read {psalm_ref} beside {wisdom_ref} before I act today?",
                ],
            ),
            "content_bundle",
            "scripture",
        )
    elif wisdom_ref:
        add_prompt(
            "scripture-wisdom",
            pick_variant(
                "scripture-wisdom",
                [
                    f"How should I apply {wisdom_ref} to today's focus?",
                    f"What does {wisdom_ref} correct or clarify about today?",
                ],
            ),
            "content_bundle",
            "scripture",
        )

    explainability_options = []
    if profile_focus:
        explainability_options.extend(
            [
                f"What does the clock see in this moment that makes {lower_lead(profile_focus)} the right focus?",
                f"Why do today's signals converge on {lower_lead(profile_focus)} right now?",
            ]
        )
    if active_pentacle and spirit:
        explainability_options.append(
            f"How do {active_pentacle} and {spirit} reinforce each other in the present moment?"
        )
    elif active_pentacle:
        explainability_options.append(
            f"What does {active_pentacle} add to the meaning of today's guidance?"
        )
    if hour_ruler and ruler_text:
        explainability_options.append(
            f"How should I read a {ruler_text} day passing through a {hour_ruler} hour?"
        )
    if reasons:
        explainability_options.append("Which part of the clock's selection logic matters most right now?")
    if explainability_options:
        add_prompt(
            "why-selected",
            pick_variant("why-selected", explainability_options),
            "why_selected",
            "explainability",
        )

    correspondence_options = []
    if angel and profile_focus:
        correspondence_options.append(f"How might {angel} frame today's work of {lower_lead(profile_focus)}?")
    if color and metal and weekly_focus:
        correspondence_options.append(
            f"What do today's {color.lower()} and {metal.lower()} correspondences suggest about {lower_lead(weekly_focus)}?"
        )
    if solomonic_ref and profile_focus:
        correspondence_options.append(
            f"How does {solomonic_ref} deepen today's focus on {lower_lead(profile_focus)}?"
        )
    if zodiac_sector and spirit:
        correspondence_options.append(
            f"What does the {zodiac_sector} sector of {spirit} imply about today's posture?"
        )
    if correspondence_options:
        add_prompt(
            "correspondence",
            pick_variant("correspondence", correspondence_options),
            "content_bundle",
            "symbolic",
        )

    if len(prompts) < limit and len(activities) > 1:
        second_activity = first_person_activity(activities[1])
        add_prompt(
            "today-guidance",
            pick_variant(
                "practical-2",
                [
                    f"What does it look like to {second_activity} with judgment today?",
                    f"How can I {second_activity} without scattering my attention today?",
                    f"What is the simplest faithful way to {second_activity} today?",
                ],
            ),
            "daily_guidance",
            "practical",
        )

    return prompts[:limit]


def _build_guided_prompts_payload(request_payload: dict[str, Any]) -> tuple[dict[str, Any] | None, str | None, HTTPStatus]:
    dataset, error = _read_json_file(DATA_PATH)
    if dataset is None:
        return None, error, HTTPStatus.INTERNAL_SERVER_ERROR

    psalm_payload, error = _read_json_file(PENTACLE_PSALMS_PATH)
    if psalm_payload is None:
        return None, error, HTTPStatus.INTERNAL_SERVER_ERROR

    life_config, error = _read_json_file(LIFE_DOMAINS_PATH)
    if life_config is None:
        return None, error, HTTPStatus.INTERNAL_SERVER_ERROR

    timezone_name = str(request_payload.get("timezone") or "UTC").strip() or "UTC"
    try:
        zone = ZoneInfo(timezone_name)
    except Exception:
        return None, f"Invalid timezone: {timezone_name!r}", HTTPStatus.BAD_REQUEST

    as_of_raw = request_payload.get("as_of")
    if as_of_raw in {None, ""}:
        as_of = datetime.now(zone)
    else:
        try:
            parsed = datetime.fromisoformat(str(as_of_raw).replace("Z", "+00:00"))
        except ValueError:
            return None, f"Invalid as_of value: {as_of_raw!r}", HTTPStatus.BAD_REQUEST
        as_of = parsed.replace(tzinfo=zone) if parsed.tzinfo is None else parsed.astimezone(zone)

    try:
        limit = int(request_payload.get("limit", 4))
    except (TypeError, ValueError):
        return None, "Invalid limit value; expected integer 1..6.", HTTPStatus.BAD_REQUEST
    limit = max(1, min(6, limit))

    layers = dataset.get("layers")
    if not isinstance(layers, dict):
        return None, "Clock dataset is missing layers.", HTTPStatus.INTERNAL_SERVER_ERROR

    derived = {
        "flatPentacles": _flatten_pentacles((layers.get("planetary") or {}).get("groups") or []),
        "spiritCount": int((layers.get("spirit") or {}).get("count") or 0),
        "planetaryGroupCount": len((layers.get("planetary") or {}).get("groups") or []),
        "celestialCount": int((layers.get("celestial") or {}).get("count") or 0),
    }
    derived["totalPentacles"] = len(derived["flatPentacles"])
    time_state = _compute_time_state(as_of, layers, derived)
    reference_map = _build_pentacle_reference_map(psalm_payload)
    life_state = _get_life_wheel_state(time_state, life_config)

    day_label = time_state["dayLabel"]
    ruler_text = day_label["rulerText"]
    day_text = day_label["dayText"]
    active = time_state["active"]
    active_pentacle = active.get("pentacle")
    active_spirit = active.get("spirit")
    pentacle_key = _get_pentacle_key(active_pentacle)
    pentacle_record = reference_map.get(pentacle_key) if pentacle_key else None
    primary_psalm = _get_primary_psalm_entry(pentacle_record)
    readable_psalm = _format_psalm_reference(primary_psalm)
    wisdom = WISDOM_CONTENT_BY_RULER.get(ruler_text, {})
    correspondences = PLANETARY_CORRESPONDENCES.get(ruler_text, {})
    hour_rule = _get_planetary_hour_ruler(as_of, ruler_text)

    daily_guidance = {
        "day": f"{day_text} ({ruler_text})",
        "tone": PLANETARY_DAY_GUIDANCE.get(ruler_text, {}).get(
            "tone",
            "Use this day for steady, intentional progress with focused attention.",
        ),
        "activities": PLANETARY_DAY_GUIDANCE.get(ruler_text, {}).get(
            "activities",
            ["Review priorities.", "Do one high-value task deeply.", "End with reflection."],
        ),
    }

    weekly_arc = _build_weekly_arc_entry(as_of, 0, layers, derived, reference_map)
    daily_profile = {
        "day_label": f"{day_text} ruled by {ruler_text}",
        "active_pentacle": (
            f"{active_pentacle['planet']} #{active_pentacle['pentacle']['index']}"
            if active_pentacle
            else "Unavailable"
        ),
        "focus": (
            active_pentacle.get("pentacle", {}).get("focus")
            if active_pentacle
            else "center attention on deliberate, disciplined action"
        ),
        "day_tone": daily_guidance["tone"],
        "color": correspondences.get("color", "Unspecified"),
        "metal": correspondences.get("metal", "Unspecified"),
        "angel": correspondences.get("angel", "Unspecified"),
    }
    if hour_rule:
        daily_profile["hour_ruler"] = hour_rule["ruler"]
        daily_profile["hour_index"] = hour_rule["hourIndex"] + 1
    if active_spirit:
        daily_profile["spirit"] = active_spirit.get("spirit")
        daily_profile["zodiac_sector"] = f"{active_spirit['zodiac']} {active_spirit['degrees']}"
    if life_state:
        daily_profile["life_domain_focus"] = life_state["focusedDomain"].get("name")
        daily_profile["weakest_domain"] = life_state["weakestDomain"].get("name")

    reasons = [f"{day_text} is ruled by {ruler_text}, so {ruler_text}-aligned intentions are prioritized."]
    if hour_rule:
        reasons.append(
            f"Planetary hour proxy: local hour {hour_rule['hourIndex'] + 1} resolves to {hour_rule['ruler']} in the Chaldean sequence."
        )
    if active_spirit:
        reasons.append(
            f"Active spirit sector: {active_spirit['zodiac']} {active_spirit['degrees']} ({active_spirit['spirit']}) informs the sign layer."
        )
    if active_pentacle:
        reasons.append(
            f"Active pentacle rule: {active_pentacle['planet']} #{active_pentacle['pentacle']['index']} ({active_pentacle['pentacle']['focus']})."
        )
    if primary_psalm:
        reasons.append(f"Primary scripture citation: {readable_psalm}.")
    else:
        reasons.append("Primary scripture citation: fallback psalm is used when this pentacle has no direct Psalm note.")

    why_selected = {
        "reasons": reasons,
    }

    if primary_psalm:
        try:
            chapter = int(primary_psalm.get("number", primary_psalm.get("psalm")))
        except (TypeError, ValueError):
            chapter = None
        verse = _expand_verse_specification(str(primary_psalm.get("verses") or ""))[0] if primary_psalm.get("verses") else None
    else:
        fallback = FALLBACK_DAILY_PSALM_BY_RULER.get(ruler_text, {"chapter": 1, "verse": 1})
        chapter = int(fallback["chapter"])
        verse = str(fallback["verse"])

    psalm_ref = f"Psalm {chapter}:{verse}" if verse else f"Psalm {chapter}"
    psalm_text = _load_scripture_excerpt(chapter, verse) if chapter else "Psalm excerpt unavailable."
    content_bundle = {
        "psalm": {"ref": psalm_ref, "text": psalm_text},
        "wisdom": {
            "ref": wisdom.get("ref", "Proverbs 16:3"),
            "text": wisdom.get(
                "text",
                "Commit thy works unto the LORD, and thy thoughts shall be established.",
            ),
        },
        "solomonic": {
            "ref": (
                f"Key of Solomon, Book II • {active_pentacle['planet']} Pentacle #{active_pentacle['pentacle']['index']}"
                if active_pentacle
                else "Key of Solomon, Book II"
            ),
            "text": (
                f"Purpose: {active_pentacle['pentacle']['focus']}."
                if active_pentacle and active_pentacle.get("pentacle", {}).get("focus")
                else "No active pentacle focus available."
            ),
        },
    }

    guided_prompts = _build_guided_prompts(
        daily_guidance,
        weekly_arc,
        daily_profile,
        why_selected,
        content_bundle,
        limit,
    )

    payload = {
        "as_of": as_of.isoformat(),
        "timezone": timezone_name,
        "daily_guidance": daily_guidance,
        "weekly_arc": {
            "date_label": weekly_arc["dateLabel"],
            "ruler": weekly_arc["rulerText"],
            "is_today": weekly_arc["isToday"],
            "pentacle": weekly_arc["pentacleLabel"],
            "focus": weekly_arc["focus"],
            "tone": weekly_arc["tone"],
            "psalm_ref": weekly_arc["psalmRef"],
            "wisdom_ref": weekly_arc["wisdomRef"],
        },
        "daily_profile": daily_profile,
        "why_selected": why_selected,
        "content_bundle": content_bundle,
        "guided_prompts": guided_prompts,
        "source": {
            "service": "solomonic_clock",
            "derived_from": [
                "daily_guidance",
                "weekly_arc",
                "daily_profile",
                "explainability",
                "content_bundle",
            ],
        },
    }

    if request_payload.get("persona_hint"):
        payload["persona_hint"] = request_payload.get("persona_hint")
    if request_payload.get("mode"):
        payload["mode"] = request_payload.get("mode")

    return payload, None, HTTPStatus.OK


def _build_history_sync_get_payload(headers: Any) -> tuple[dict[str, Any] | None, str | None, HTTPStatus]:
    allowed, status, client_id, error = _authorize_history_client(headers)
    if not allowed or client_id is None:
        return None, error or "Unauthorized.", status

    client_key = str(headers.get(HISTORY_KEY_HEADER, "")).strip()
    with _HISTORY_STORE_LOCK:
        store = _read_history_store()
        client_record = store.get("clients", {}).get(client_id)
        if client_record is None:
            return {
                "service": "solomonic_clock",
                "client_id": client_id,
                "state": {},
                "stored_entries": 0,
                "synced_at": datetime.utcnow().isoformat() + "Z",
            }, None, HTTPStatus.OK

        if not hmac.compare_digest(str(client_record.get("key_hash", "")), _hash_history_key(client_key)):
            return None, "Invalid history key.", HTTPStatus.FORBIDDEN

        state = _normalize_history_state(client_record.get("state") or {})
        return {
            "service": "solomonic_clock",
            "client_id": client_id,
            "state": state,
            "stored_entries": len(state),
            "synced_at": str(client_record.get("updated_at") or datetime.utcnow().isoformat() + "Z"),
        }, None, HTTPStatus.OK


def _build_history_sync_post_payload(
    headers: Any,
    request_payload: dict[str, Any],
) -> tuple[dict[str, Any] | None, str | None, HTTPStatus]:
    allowed, status, client_id, error = _authorize_history_client(headers)
    if not allowed or client_id is None:
        return None, error or "Unauthorized.", status

    client_key = str(headers.get(HISTORY_KEY_HEADER, "")).strip()
    client_state = _normalize_history_state(request_payload.get("state") or {})
    now_iso = datetime.utcnow().isoformat() + "Z"

    with _HISTORY_STORE_LOCK:
        store = _read_history_store()
        clients = store.setdefault("clients", {})
        client_record = clients.get(client_id)
        key_hash = _hash_history_key(client_key)

        if client_record is None:
            merged_state = client_state
            clients[client_id] = {
                "key_hash": key_hash,
                "created_at": now_iso,
                "updated_at": now_iso,
                "state": merged_state,
            }
        else:
            if not hmac.compare_digest(str(client_record.get("key_hash", "")), key_hash):
                return None, "Invalid history key.", HTTPStatus.FORBIDDEN

            merged_state = _merge_history_states(client_record.get("state") or {}, client_state)
            client_record["updated_at"] = now_iso
            client_record["state"] = merged_state

        _write_history_store(store)

    return {
        "service": "solomonic_clock",
        "client_id": client_id,
        "state": merged_state,
        "stored_entries": len(merged_state),
        "synced_at": now_iso,
    }, None, HTTPStatus.OK


def _get_guided_prompts_expected_key() -> str:
    return str(os.environ.get(GUIDED_PROMPTS_API_KEY_ENV) or "").strip()


def _extract_guided_prompts_supplied_key(headers: Any) -> str:
    direct_key = str(headers.get(GUIDED_PROMPTS_AUTH_HEADER, "") or "").strip()
    if direct_key:
        return direct_key

    authorization = str(headers.get("Authorization", "") or "").strip()
    match = re.match(r"Bearer\s+(.+)$", authorization, re.I)
    if match:
        return match.group(1).strip()
    return ""


class ClockRequestHandler(SimpleHTTPRequestHandler):
    """Serve static files and expose /api/clock with the JSON dataset."""

    def __init__(self, *args: Any, directory: str | None = None, **kwargs: Any) -> None:
        super().__init__(*args, directory=directory, **kwargs)

    def end_headers(self) -> None:
        request_path = urlparse(getattr(self, "path", "")).path
        normalized_path = "/" if request_path in {"", "/"} else request_path.rstrip("/")
        if normalized_path in NOINDEX_PATHS or normalized_path.startswith(NOINDEX_PREFIXES):
            self.send_header("X-Robots-Tag", "noindex, nofollow")
        super().end_headers()

    def list_directory(self, path: str):  # type: ignore[override]
        self.send_error(HTTPStatus.NOT_FOUND, "Directory listing is not available.")
        return None

    def _send_json(self, payload: dict[str, Any], status: HTTPStatus, send_body: bool = True) -> None:
        body = json.dumps(payload, indent=2, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        if send_body:
            self.wfile.write(body)

    def _send_text(
        self,
        body: str,
        status: HTTPStatus,
        content_type: str,
        send_body: bool = True,
    ) -> None:
        encoded = body.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", f"{content_type}; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        if send_body:
            self.wfile.write(encoded)

    def _resolve_site_url(self) -> str:
        configured = os.environ.get(SITE_URL_ENV, "").strip()
        if configured:
            return configured.rstrip("/")

        forwarded_proto = (self.headers.get("X-Forwarded-Proto") or "").split(",")[0].strip()
        forwarded_host = (self.headers.get("X-Forwarded-Host") or "").split(",")[0].strip()
        host = (self.headers.get("Host") or "").split(",")[0].strip()
        proto = forwarded_proto or "http"
        authority = forwarded_host or host
        if authority:
            return f"{proto}://{authority}"
        return DEFAULT_SITE_URL

    def _build_absolute_url(self, path: str) -> str:
        origin = self._resolve_site_url()
        if path == "/":
            return origin
        return f"{origin}{path}"

    def _render_public_template(self, template_path: Path, canonical_path: str) -> str:
        html = template_path.read_text(encoding="utf-8")
        replacements = {
            "__SITE_URL__": self._resolve_site_url(),
            "__CANONICAL_URL__": self._build_absolute_url(canonical_path),
            "__SITEMAP_URL__": self._build_absolute_url("/sitemap.xml"),
        }
        for token, value in replacements.items():
            html = html.replace(token, value)
        return html

    def _send_public_page(self, template_path: Path, canonical_path: str, send_body: bool = True) -> None:
        if not template_path.exists():
            self.send_error(HTTPStatus.NOT_FOUND, f"{template_path.name} not found")
            return
        self._send_text(
            self._render_public_template(template_path, canonical_path),
            HTTPStatus.OK,
            "text/html",
            send_body=send_body,
        )

    def _build_robots_txt(self) -> str:
        sitemap_url = self._build_absolute_url("/sitemap.xml")
        lines = [
            "User-agent: *",
            "Allow: /",
            "Disallow: /api/",
            "Disallow: /data/",
            "Disallow: /docs/",
            "Disallow: /src/",
            "Disallow: /deploy/",
            "Disallow: /output/",
            "Disallow: /.playwright-cli/",
            "Disallow: /web/index.html",
            "Disallow: /web/clock_visualizer.html",
            "Disallow: /web/how_to_use.html",
            "",
            f"Sitemap: {sitemap_url}",
        ]
        return "\n".join(lines)

    def _build_sitemap_xml(self) -> str:
        rows = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
        for path, source_path in SITEMAP_PAGE_SOURCES.items():
            loc = xml_escape(self._build_absolute_url(path))
            try:
                lastmod = datetime.fromtimestamp(source_path.stat().st_mtime).astimezone().date().isoformat()
            except FileNotFoundError:
                lastmod = datetime.now().astimezone().date().isoformat()
            rows.append("  <url>")
            rows.append(f"    <loc>{loc}</loc>")
            rows.append(f"    <lastmod>{lastmod}</lastmod>")
            rows.append("  </url>")
        rows.append("</urlset>")
        return "\n".join(rows)

    def _authorize_guided_prompts_request(self) -> tuple[bool, HTTPStatus, str | None]:
        expected_key = _get_guided_prompts_expected_key()
        if not expected_key:
            return (
                False,
                HTTPStatus.SERVICE_UNAVAILABLE,
                f"Guided prompts API is not configured. Set {GUIDED_PROMPTS_API_KEY_ENV}.",
            )

        supplied_key = _extract_guided_prompts_supplied_key(self.headers)
        if not supplied_key:
            return (
                False,
                HTTPStatus.UNAUTHORIZED,
                f"Missing guided prompts API key. Supply {GUIDED_PROMPTS_AUTH_HEADER} or Authorization: Bearer <token>.",
            )

        if not hmac.compare_digest(supplied_key, expected_key):
            return False, HTTPStatus.FORBIDDEN, "Invalid guided prompts API key."

        return True, HTTPStatus.OK, None

    def do_POST(self) -> None:  # noqa: N802
        parsed_url = urlparse(self.path)
        request_path = parsed_url.path.rstrip("/")

        if request_path not in {"/api/pericope/guided-prompts", BOOK_PARTIAL_API_PATH, HISTORY_SYNC_API_PATH}:
            self.send_error(HTTPStatus.NOT_FOUND, "Unknown API route")
            return

        if request_path == "/api/pericope/guided-prompts":
            allowed, status, error = self._authorize_guided_prompts_request()
            if not allowed:
                self._send_json({"error": error or "Unauthorized."}, status)
                return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self._send_json({"error": "Invalid Content-Length header."}, HTTPStatus.BAD_REQUEST)
            return

        try:
            raw_body = self.rfile.read(content_length) if content_length > 0 else b"{}"
        except Exception as exc:  # pragma: no cover - socket read failure
            self._send_json({"error": f"Unable to read request body: {exc}"}, HTTPStatus.BAD_REQUEST)
            return

        try:
            payload = json.loads(raw_body.decode("utf-8") or "{}")
        except json.JSONDecodeError as exc:
            self._send_json({"error": f"Invalid JSON body: {exc}"}, HTTPStatus.BAD_REQUEST)
            return

        if not isinstance(payload, dict):
            self._send_json({"error": "JSON body must be an object."}, HTTPStatus.BAD_REQUEST)
            return

        if request_path == BOOK_PARTIAL_API_PATH:
            response_payload, error, status = _build_book_partial_payload(payload)
        elif request_path == HISTORY_SYNC_API_PATH:
            response_payload, error, status = _build_history_sync_post_payload(self.headers, payload)
        else:
            response_payload, error, status = _build_guided_prompts_payload(payload)

        if response_payload is None:
            fallback_error = (
                "Unable to expand requested text."
                if request_path == BOOK_PARTIAL_API_PATH
                else "Unable to build guided prompts payload."
            )
            self._send_json({"error": error or fallback_error}, status)
            return

        self._send_json(response_payload, status)

    def _handle_request(self, parsed_url, send_body: bool) -> bool:
        request_path = parsed_url.path
        normalized_path = "/" if request_path in {"", "/"} else request_path.rstrip("/")

        if normalized_path == "/robots.txt":
            self._send_text(self._build_robots_txt(), HTTPStatus.OK, "text/plain", send_body=send_body)
            return True

        if normalized_path == "/sitemap.xml":
            self._send_text(
                self._build_sitemap_xml(),
                HTTPStatus.OK,
                "application/xml",
                send_body=send_body,
            )
            return True

        public_page = PUBLIC_PAGE_TEMPLATES.get(normalized_path)
        if public_page is not None:
            template_path, canonical_path = public_page
            self._send_public_page(template_path, canonical_path, send_body=send_body)
            return True

        if normalized_path == "/api/clock":
            if not DATA_PATH.exists():
                message = (
                    "Dataset not found. Run `python src/generate_full_dataset.py` first."
                )
                self._send_json({"error": message}, HTTPStatus.NOT_FOUND, send_body=send_body)
                return True

            try:
                data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
            except json.JSONDecodeError as exc:  # pragma: no cover - only hit on corruption
                self._send_json(
                    {"error": f"Dataset is invalid JSON: {exc}"},
                    HTTPStatus.INTERNAL_SERVER_ERROR,
                    send_body=send_body,
                )
                return True

            self._send_json(data, HTTPStatus.OK, send_body=send_body)
            return True

        if normalized_path == "/api/psalm":
            query = parse_qs(parsed_url.query)
            chapter_raw = (query.get("chapter") or [None])[0]
            verse_raw = (query.get("verse") or [None])[0]

            if chapter_raw is None:
                self._send_json(
                    {"error": "Missing required query parameter: chapter"},
                    HTTPStatus.BAD_REQUEST,
                    send_body=send_body,
                )
                return True

            try:
                chapter = int(chapter_raw)
            except (TypeError, ValueError):
                self._send_json(
                    {"error": f"Invalid chapter value: {chapter_raw!r}"},
                    HTTPStatus.BAD_REQUEST,
                    send_body=send_body,
                )
                return True
            if chapter < 1:
                self._send_json(
                    {"error": f"Invalid chapter value: {chapter_raw!r}"},
                    HTTPStatus.BAD_REQUEST,
                    send_body=send_body,
                )
                return True

            verse: int | None = None
            if verse_raw not in {None, ""}:
                try:
                    verse = int(verse_raw)
                except (TypeError, ValueError):
                    self._send_json(
                        {"error": f"Invalid verse value: {verse_raw!r}"},
                        HTTPStatus.BAD_REQUEST,
                        send_body=send_body,
                    )
                    return True
                if verse < 1:
                    self._send_json(
                        {"error": f"Invalid verse value: {verse_raw!r}"},
                        HTTPStatus.BAD_REQUEST,
                        send_body=send_body,
                    )
                    return True

            lookup, error = _load_psalm_lookup()
            if lookup is None:
                self._send_json(
                    {"error": error or "Psalms source unavailable."},
                    HTTPStatus.NOT_FOUND,
                    send_body=send_body,
                )
                return True

            lookup_numbering = _PSALM_LOOKUP_NUMBERING or _infer_psalm_lookup_numbering(
                lookup,
                _PSALM_LOOKUP_SOURCE,
            )
            spans, span_error = _resolve_reference_spans(chapter, lookup_numbering)
            if spans is None:
                self._send_json(
                    {"error": span_error or "Unable to resolve Psalm numbering map."},
                    HTTPStatus.INTERNAL_SERVER_ERROR,
                    send_body=send_body,
                )
                return True

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
                        send_body=send_body,
                    )
                    return True

                ordered_text = [text for _chapter, _verse, text in entries]
                self._send_json(
                    fallback_payload = _build_psalm_api_fallback_payload(chapter, None, response_meta)
                    if fallback_payload is not None:
                        self._send_json(fallback_payload, HTTPStatus.OK, send_body=send_body)
                        return True
                    {
                        "chapter": chapter,
                        "text": "\n".join(ordered_text),
                        "source": _PSALM_LOOKUP_SOURCE,
                        "numbering": response_meta,
                    },
                    HTTPStatus.OK,
                    send_body=send_body,
                )
                return True

            mapped_reference, map_error = _resolve_mapped_verse(lookup, spans, verse)
            if mapped_reference is None:
                self._send_json(
                    {"error": map_error or f"Psalm {chapter}:{verse} not found in configured Psalms source."},
                    HTTPStatus.NOT_FOUND,
                    send_body=send_body,
                )
                return True

            resolved_chapter, resolved_verse = mapped_reference
            verse_text = lookup.get(resolved_chapter, {}).get(resolved_verse)
                fallback_payload = _build_psalm_api_fallback_payload(chapter, verse, response_meta)
                if fallback_payload is not None:
                    self._send_json(fallback_payload, HTTPStatus.OK, send_body=send_body)
                    return True
            if not verse_text:
                self._send_json(
                    {"error": f"Psalm {chapter}:{verse} not found in configured Psalms source."},
                    HTTPStatus.NOT_FOUND,
                    send_body=send_body,
                )
                return True

            self._send_json(
                {
                fallback_payload = _build_psalm_api_fallback_payload(chapter, verse, response_meta)
                if fallback_payload is not None:
                    self._send_json(fallback_payload, HTTPStatus.OK, send_body=send_body)
                    return True
                    "chapter": chapter,
                    "verse": verse,
                    "text": verse_text,
                    "source": _PSALM_LOOKUP_SOURCE,
                    "numbering": response_meta,
                    "resolved_chapter": resolved_chapter,
                    "resolved_verse": resolved_verse,
                },
                HTTPStatus.OK,
                send_body=send_body,
            )
            return True

        if normalized_path == HISTORY_SYNC_API_PATH:
            response_payload, error, status = _build_history_sync_get_payload(self.headers)
            if response_payload is None:
                self._send_json({"error": error or "Unable to load history state."}, status, send_body=send_body)
                return True

            self._send_json(response_payload, status, send_body=send_body)
            return True

        return False

    def do_GET(self) -> None:  # noqa: N802  (HTTPRequestHandler overrides camelCase)
        parsed_url = urlparse(self.path)
        if self._handle_request(parsed_url, send_body=True):
            return

        super().do_GET()

    def do_HEAD(self) -> None:  # noqa: N802
        parsed_url = urlparse(self.path)
        if self._handle_request(parsed_url, send_body=False):
            return

        super().do_HEAD()


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
