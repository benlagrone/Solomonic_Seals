#!/usr/bin/env python3
"""
Backfill Solomonic scripture mappings from a Latin Pericope Psalter source.

Flow:
1) Fetch Latin Psalms via Pericope /v1/book_partial
2) Resolve verse targets from pentacle_psalms + scripture mapping verse_range
3) Optionally translate each Latin excerpt via translator API (/translate, lat-en)
4) Write updated latin_excerpt / translation_excerpt back to scripture_mappings.json
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SCRIPTURE_PATH = ROOT / "data" / "scripture_mappings.json"
DEFAULT_PENTACLE_PATH = ROOT / "data" / "pentacle_psalms.json"
DEFAULT_NUMBER_MAP_PATH = ROOT / "data" / "psalm_number_map.csv"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Backfill scripture_mappings.json from Latin Pericope source."
    )
    parser.add_argument(
        "--scripture-path",
        type=Path,
        default=DEFAULT_SCRIPTURE_PATH,
        help="Path to scripture_mappings.json",
    )
    parser.add_argument(
        "--pentacle-path",
        type=Path,
        default=DEFAULT_PENTACLE_PATH,
        help="Path to pentacle_psalms.json",
    )
    parser.add_argument(
        "--pericope-base-url",
        default="http://localhost:8001",
        help="Pericope API base URL (default: http://localhost:8001)",
    )
    parser.add_argument(
        "--translator-base-url",
        default="http://localhost:8010",
        help="Translator API base URL (default: http://localhost:8010)",
    )
    parser.add_argument(
        "--author-slug",
        default="david",
        help="Pericope author slug (default: david)",
    )
    parser.add_argument(
        "--book",
        default="Psalms",
        help="Pericope book name (default: Psalms)",
    )
    parser.add_argument(
        "--source",
        default="Psalms_Vulgate_Clementine.txt",
        help="Pericope source file (default: Psalms_Vulgate_Clementine.txt)",
    )
    parser.add_argument(
        "--start-position",
        type=int,
        default=1,
        help="Pericope start position (default: 1)",
    )
    parser.add_argument(
        "--end-position",
        type=int,
        default=5000,
        help="Pericope end position (default: 5000)",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=60.0,
        help="HTTP timeout in seconds (default: 60)",
    )
    parser.add_argument(
        "--overwrite-existing",
        action="store_true",
        help="Overwrite latin_excerpt even when not pending.",
    )
    parser.add_argument(
        "--skip-translation",
        action="store_true",
        help="Only fill latin_excerpt; leave translation_excerpt unchanged.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview updates without writing files.",
    )
    parser.add_argument(
        "--psalms",
        nargs="*",
        type=int,
        help="Optional explicit Vulgate psalm numbers to process.",
    )
    parser.add_argument(
        "--number-map-path",
        type=Path,
        default=DEFAULT_NUMBER_MAP_PATH,
        help="Path to Vulgate/Hebrew crosswalk CSV (default: data/psalm_number_map.csv)",
    )
    return parser.parse_args()


def load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise RuntimeError(f"Missing file: {path}") from exc
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Invalid JSON in {path}: {exc}") from exc


def post_json(url: str, payload: dict[str, Any], timeout: float) -> dict[str, Any]:
    request = Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=timeout) as response:
            raw = response.read().decode("utf-8")
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace") if exc.fp else ""
        raise RuntimeError(f"{url} HTTP {exc.code}: {detail}") from exc
    except URLError as exc:
        raise RuntimeError(f"{url} unavailable: {exc}") from exc

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"{url} returned non-JSON response") from exc
    if not isinstance(parsed, dict):
        raise RuntimeError(f"{url} returned unexpected payload type")
    return parsed


def parse_psalm_text(raw_text: str) -> dict[int, dict[int, str]]:
    lookup: dict[int, dict[int, str]] = {}
    chapter_num: int | None = None
    verse_num: int | None = None

    for raw_line in raw_text.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        chapter_match = re.match(r"^(?:Chapter|Psalm)\s+(\d+)\b", line, re.IGNORECASE)
        if chapter_match:
            chapter_num = int(chapter_match.group(1))
            lookup.setdefault(chapter_num, {})
            verse_num = None
            continue

        verse_match = re.match(r"^(\d+)[\.:]?\s+(.*)$", line)
        if chapter_num is not None and verse_match:
            verse_num = int(verse_match.group(1))
            verse_text = verse_match.group(2).strip()
            lookup[chapter_num][verse_num] = verse_text
            continue

        if chapter_num is not None and verse_num is not None:
            existing = lookup[chapter_num].get(verse_num, "")
            lookup[chapter_num][verse_num] = f"{existing} {line}".strip()

    return lookup


def parse_verse_spec(value: Any) -> tuple[list[int] | None, bool]:
    if value is None:
        return None, False
    raw = str(value).strip()
    if not raw:
        return None, False

    if re.fullmatch(r"\d+", raw):
        return [int(raw)], False

    if re.fullmatch(r"\d+(,\d+)+", raw):
        return [int(part) for part in raw.split(",")], False

    if re.fullmatch(r"\d+-\d+", raw):
        start_str, end_str = raw.split("-", 1)
        start = int(start_str)
        end = int(end_str)
        if end < start:
            return None, True
        return list(range(start, end + 1)), False

    if re.fullmatch(r"\d+(?:-\d+){2,}", raw):
        return [int(part) for part in raw.split("-")], False

    return None, True


def build_verse_targets(pentacle_payload: dict[str, Any]) -> dict[int, dict[str, Any]]:
    targets: dict[int, dict[str, Any]] = {}
    pentacles = pentacle_payload.get("pentacles", [])
    if not isinstance(pentacles, list):
        return targets

    for record in pentacles:
        if not isinstance(record, dict):
            continue
        psalms = record.get("psalms", [])
        if not isinstance(psalms, list):
            continue
        for entry in psalms:
            if not isinstance(entry, dict):
                continue
            number = entry.get("number")
            if not isinstance(number, int):
                continue

            target = targets.setdefault(number, {"all": False, "verses": set()})
            verses = entry.get("verses")
            if verses is None:
                target["all"] = True
                continue
            parsed, bad = parse_verse_spec(verses)
            if bad or not parsed:
                continue
            for verse in parsed:
                target["verses"].add(int(verse))

    return targets


def load_number_map(number_map_path: Path) -> dict[int, int]:
    try:
        rows = list(csv.DictReader(number_map_path.read_text(encoding="utf-8").splitlines()))
    except FileNotFoundError:
        return {}

    mapping: dict[int, int] = {}
    for row in rows:
        vul_raw = (row.get("vulgate_number") or "").strip()
        heb_raw = (row.get("hebrew_reference") or "").strip()
        if not vul_raw.isdigit():
            continue
        if not heb_raw.isdigit():
            continue
        mapping[int(vul_raw)] = int(heb_raw)
    return mapping


def fetch_latin_lookup(
    pericope_base_url: str,
    author_slug: str,
    book: str,
    source: str,
    start_position: int,
    end_position: int,
    timeout: float,
) -> dict[int, dict[int, str]]:
    endpoint = f"{pericope_base_url.rstrip('/')}/v1/book_partial"
    payload = {
        "author_slug": author_slug,
        "book": book,
        "source": source,
        "start_position": start_position,
        "end_position": end_position,
    }
    response = post_json(endpoint, payload, timeout=timeout)
    content = response.get("content")
    if not isinstance(content, str) or not content.strip():
        raise RuntimeError(f"{endpoint} returned empty content for source={source}")
    lookup = parse_psalm_text(content)
    if not lookup:
        raise RuntimeError("Parsed empty Psalm lookup from Pericope content.")
    return lookup


def translate_text(text: str, translator_base_url: str, timeout: float) -> str:
    endpoint = f"{translator_base_url.rstrip('/')}/translate"
    payload = {"text": text, "direction": "lat-en"}
    response = post_json(endpoint, payload, timeout=timeout)
    translated = response.get("translation")
    if not isinstance(translated, str) or not translated.strip():
        raise RuntimeError(f"{endpoint} returned empty translation")
    return translated.strip()


def choose_verses_for_chapter(
    chapter_num: int,
    mapping_entry: dict[str, Any],
    target_info: dict[str, Any] | None,
    latin_lookup: dict[int, dict[int, str]],
) -> list[int]:
    available = latin_lookup.get(chapter_num, {})
    if not available:
        return []

    verse_candidates: list[int] = []

    if isinstance(mapping_entry.get("verse_range"), str):
        parsed, bad = parse_verse_spec(mapping_entry["verse_range"])
        if not bad and parsed:
            verse_candidates.extend(parsed)

    if target_info and target_info.get("verses"):
        verse_candidates.extend(sorted(int(v) for v in target_info["verses"]))

    deduped: list[int] = []
    seen = set()
    for verse in verse_candidates:
        if verse in seen:
            continue
        seen.add(verse)
        deduped.append(verse)

    if deduped:
        return [v for v in deduped if v in available]

    if target_info and target_info.get("all"):
        first_verse = min(available.keys())
        return [first_verse]

    first_verse = min(available.keys())
    return [first_verse]


def latin_excerpt_for_verses(chapter: int, verses: list[int], lookup: dict[int, dict[int, str]]) -> str:
    chapter_lookup = lookup.get(chapter, {})
    parts = []
    for verse in verses:
        text = chapter_lookup.get(verse, "").strip()
        if text:
            parts.append(f"{verse} {text}")
    return " ".join(parts).strip()


def should_update_latin(entry: dict[str, Any], overwrite_existing: bool) -> bool:
    if overwrite_existing:
        return True
    latin_excerpt = str(entry.get("latin_excerpt", "")).strip()
    return latin_excerpt.startswith("Pending Vulgate excerpt capture.")


def main() -> int:
    args = parse_args()

    scripture_path = args.scripture_path.expanduser().resolve()
    pentacle_path = args.pentacle_path.expanduser().resolve()

    scripture_payload = load_json(scripture_path)
    pentacle_payload = load_json(pentacle_path)

    psalm_entries = scripture_payload.get("psalms")
    if not isinstance(psalm_entries, dict):
        print(f"error: {scripture_path} missing object at key 'psalms'", file=sys.stderr)
        return 1

    target_map = build_verse_targets(pentacle_payload)
    number_map = load_number_map(args.number_map_path.expanduser().resolve())

    try:
        latin_lookup = fetch_latin_lookup(
            pericope_base_url=args.pericope_base_url,
            author_slug=args.author_slug,
            book=args.book,
            source=args.source,
            start_position=args.start_position,
            end_position=args.end_position,
            timeout=args.timeout,
        )
    except RuntimeError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    selected_psalms = set(args.psalms or [])

    updated_latin = 0
    updated_translation = 0
    skipped = 0
    missing_lookup = 0

    for key in sorted(psalm_entries.keys(), key=lambda x: int(x)):
        entry = psalm_entries.get(key)
        if not isinstance(entry, dict):
            continue

        try:
            psalm_num = int(key)
        except ValueError:
            continue

        if selected_psalms and psalm_num not in selected_psalms:
            skipped += 1
            continue

        if not should_update_latin(entry, overwrite_existing=args.overwrite_existing):
            skipped += 1
            continue

        target_info = target_map.get(psalm_num)
        chapter_candidates = [
            psalm_num,
            psalm_num - 1,
            psalm_num + 1,
        ]
        hebrew_fallback = number_map.get(psalm_num)
        if isinstance(hebrew_fallback, int) and hebrew_fallback > 0:
            chapter_candidates.append(hebrew_fallback)
            chapter_candidates.append(hebrew_fallback - 1)
            chapter_candidates.append(hebrew_fallback + 1)
        chapter_candidates = [
            c
            for c in dict.fromkeys(chapter_candidates)
            if isinstance(c, int) and c > 0
        ]

        chosen_chapter: int | None = None
        verses: list[int] = []
        for chapter_candidate in chapter_candidates:
            verses = choose_verses_for_chapter(
                chapter_candidate, entry, target_info, latin_lookup
            )
            if verses:
                chosen_chapter = chapter_candidate
                break

        if chosen_chapter is None:
            print(
                f"warn: Psalm {psalm_num} missing from fetched Latin lookup "
                f"(tried chapters {chapter_candidates})"
            )
            missing_lookup += 1
            continue

        if chosen_chapter != psalm_num:
            print(
                f"info: Psalm {psalm_num} used chapter {chosen_chapter} via crosswalk fallback"
            )

        latin_excerpt = latin_excerpt_for_verses(chosen_chapter, verses, latin_lookup)
        if not latin_excerpt:
            print(
                f"warn: Psalm {psalm_num} chapter {chosen_chapter} verses {verses} had no text"
            )
            missing_lookup += 1
            continue

        entry["latin_excerpt"] = latin_excerpt
        updated_latin += 1

        if args.skip_translation:
            continue

        try:
            translated = translate_text(
                text=latin_excerpt,
                translator_base_url=args.translator_base_url,
                timeout=args.timeout,
            )
            entry["translation_excerpt"] = translated
            updated_translation += 1
        except RuntimeError as exc:
            print(f"warn: Psalm {psalm_num} translation failed: {exc}")

    print(
        f"summary: latin_updated={updated_latin} translation_updated={updated_translation} "
        f"skipped={skipped} missing_lookup={missing_lookup}"
    )

    if args.dry_run:
        print("dry-run: no file changes written")
        return 0

    scripture_path.write_text(
        json.dumps(scripture_payload, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"wrote {scripture_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
