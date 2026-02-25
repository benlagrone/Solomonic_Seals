#!/usr/bin/env python3
"""
Validate Solomonic Psalm mapping assets.

Checks:
- pentacle mapping structure and verse reference notation
- Vulgate/Hebrew crosswalk integrity
- scripture mapping consistency with crosswalk
- duplicate verse assignments across pentacles
- coverage gaps (reported as warnings by default)
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PENTACLE_PATH = ROOT / "data" / "pentacle_psalms.json"
DEFAULT_NUMBER_MAP_PATH = ROOT / "data" / "psalm_number_map.csv"
DEFAULT_SCRIPTURE_PATH = ROOT / "data" / "scripture_mappings.json"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate Psalm mapping assets.")
    parser.add_argument(
        "--pentacle-path",
        type=Path,
        default=DEFAULT_PENTACLE_PATH,
        help="Path to pentacle_psalms.json",
    )
    parser.add_argument(
        "--number-map-path",
        type=Path,
        default=DEFAULT_NUMBER_MAP_PATH,
        help="Path to psalm_number_map.csv",
    )
    parser.add_argument(
        "--scripture-path",
        type=Path,
        default=DEFAULT_SCRIPTURE_PATH,
        help="Path to scripture_mappings.json",
    )
    parser.add_argument(
        "--fail-on-warnings",
        action="store_true",
        help="Treat warnings as validation failures.",
    )
    return parser.parse_args()


def load_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise RuntimeError(f"Missing file: {path}") from exc
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Invalid JSON in {path}: {exc}") from exc


def parse_verse_spec(value: Any) -> tuple[list[int] | None, str]:
    """
    Parse verse notation used in the mapping files.

    Supported:
    - 7
    - 3-5
    - 3,5,7
    - 3-4-5 (legacy list shorthand)
    """
    if value is None:
        return None, "missing"

    raw = str(value).strip()
    if not raw:
        return None, "empty"

    if re.fullmatch(r"\d+", raw):
        return [int(raw)], "single"

    if re.fullmatch(r"\d+(,\d+)+", raw):
        return [int(part) for part in raw.split(",")], "list"

    if re.fullmatch(r"\d+-\d+", raw):
        start_str, end_str = raw.split("-", 1)
        start = int(start_str)
        end = int(end_str)
        if end < start:
            return None, "invalid_range"
        return list(range(start, end + 1)), "range"

    # Legacy shorthand used in older sources: 3-4-5 means [3, 4, 5]
    if re.fullmatch(r"\d+(?:-\d+){2,}", raw):
        return [int(part) for part in raw.split("-")], "legacy_hyphen_list"

    return None, "unrecognized"


def parse_crosswalk_number(value: str) -> int | None:
    text = (value or "").strip()
    return int(text) if text.isdigit() else None


def parse_hebrew_reference_to_int(value: str) -> int | None:
    text = (value or "").strip()
    return int(text) if text.isdigit() else None


def validate_number_map(
    number_map_path: Path,
    errors: list[str],
    warnings: list[str],
) -> dict[int, str]:
    try:
        rows = list(csv.DictReader(number_map_path.read_text(encoding="utf-8").splitlines()))
    except FileNotFoundError:
        errors.append(f"Missing number map: {number_map_path}")
        return {}

    if not rows:
        errors.append(f"Number map is empty: {number_map_path}")
        return {}

    required_cols = {"vulgate_number", "hebrew_reference"}
    first = rows[0]
    missing_cols = sorted(required_cols - set(first.keys()))
    if missing_cols:
        errors.append(
            f"Number map missing required columns {missing_cols} in {number_map_path}"
        )
        return {}

    crosswalk: dict[int, str] = {}
    for line_num, row in enumerate(rows, start=2):
        vulgate_raw = row.get("vulgate_number", "")
        hebrew_ref = (row.get("hebrew_reference") or "").strip()
        vulgate = parse_crosswalk_number(vulgate_raw)
        if vulgate is None:
            errors.append(f"{number_map_path}:{line_num} invalid vulgate_number={vulgate_raw!r}")
            continue
        if vulgate in crosswalk:
            errors.append(f"{number_map_path}:{line_num} duplicate vulgate_number={vulgate}")
            continue
        if not hebrew_ref:
            warnings.append(
                f"{number_map_path}:{line_num} missing hebrew_reference for Vulgate {vulgate}"
            )
        crosswalk[vulgate] = hebrew_ref

    if len(crosswalk) < 150:
        warnings.append(
            f"{number_map_path} contains {len(crosswalk)} Vulgate rows (expected 150)."
        )

    return crosswalk


def validate_pentacle_mappings(
    pentacle_payload: dict[str, Any],
    crosswalk: dict[int, str],
    crosswalk_label: str,
    allow_duplicate_psalms: bool,
    errors: list[str],
    warnings: list[str],
) -> tuple[set[int], int]:
    pentacles = pentacle_payload.get("pentacles")
    if not isinstance(pentacles, list):
        errors.append("pentacle_psalms.json must contain a list at key 'pentacles'.")
        return set(), 0

    seen_pentacles: set[tuple[str, int]] = set()
    seen_verse_assignments: dict[tuple[int, tuple[int, ...]], str] = {}
    referenced_psalms: set[int] = set()
    missing_pentacles = 0

    for idx, record in enumerate(pentacles, start=1):
        where = f"pentacles[{idx - 1}]"
        if not isinstance(record, dict):
            errors.append(f"{where} must be an object.")
            continue

        planet = str(record.get("planet", "")).strip()
        pentacle_idx = record.get("pentacle")
        psalms = record.get("psalms")
        supplemental_refs = record.get("supplemental_references")

        if not planet:
            errors.append(f"{where} missing 'planet'.")
            continue

        if not isinstance(pentacle_idx, int) or pentacle_idx <= 0:
            errors.append(f"{where} has invalid pentacle number {pentacle_idx!r}.")
            continue

        pentacle_key = (planet.lower(), pentacle_idx)
        if pentacle_key in seen_pentacles:
            errors.append(
                f"{where} duplicates pentacle assignment {planet} #{pentacle_idx}."
            )
        else:
            seen_pentacles.add(pentacle_key)

        if not isinstance(psalms, list):
            errors.append(f"{where}.psalms must be a list.")
            continue

        if supplemental_refs is None:
            supplemental_refs = []
        if not isinstance(supplemental_refs, list):
            errors.append(f"{where}.supplemental_references must be a list when present.")
            supplemental_refs = []

        for sidx, ref in enumerate(supplemental_refs, start=1):
            ref_where = f"{where}.supplemental_references[{sidx - 1}]"
            if not isinstance(ref, dict):
                errors.append(f"{ref_where} must be an object.")
                continue
            ref_type = str(ref.get("type", "")).strip()
            if not ref_type:
                warnings.append(f"{ref_where} missing type.")
            if ref_type == "biblical":
                if not ref.get("book"):
                    warnings.append(f"{ref_where} missing book.")
                if not ref.get("chapter"):
                    warnings.append(f"{ref_where} missing chapter.")
                if not ref.get("verses"):
                    warnings.append(f"{ref_where} missing verses.")
            if not ref.get("source_path"):
                warnings.append(f"{ref_where} missing source_path.")

        if not psalms and not supplemental_refs:
            missing_pentacles += 1
            continue

        for pidx, entry in enumerate(psalms, start=1):
            entry_where = f"{where}.psalms[{pidx - 1}]"
            if not isinstance(entry, dict):
                errors.append(f"{entry_where} must be an object.")
                continue

            number = entry.get("number")
            if not isinstance(number, int):
                errors.append(f"{entry_where} has invalid psalm number {number!r}.")
                continue

            referenced_psalms.add(number)

            if number not in crosswalk:
                errors.append(
                    f"{entry_where} references Psalm {number}, missing from {crosswalk_label}."
                )

            verses = entry.get("verses")
            if verses is None:
                continue

            parsed_verses, kind = parse_verse_spec(verses)
            if parsed_verses is None:
                errors.append(
                    f"{entry_where} has unrecognized verse notation {verses!r} ({kind})."
                )
                continue

            if kind == "legacy_hyphen_list":
                warnings.append(
                    f"{entry_where} uses legacy verse notation {verses!r}; prefer comma lists."
                )

            verse_key = (number, tuple(parsed_verses))
            location = f"{planet}#{pentacle_idx}"
            previous = seen_verse_assignments.get(verse_key)
            if previous and previous != location:
                if not allow_duplicate_psalms:
                    warnings.append(
                        f"Duplicate verse mapping Psalm {number}:{verses} appears in {previous} and {location}."
                    )
            else:
                seen_verse_assignments[verse_key] = location

    return referenced_psalms, missing_pentacles


def validate_scripture_mappings(
    scripture_payload: dict[str, Any],
    crosswalk: dict[int, str],
    referenced_psalms: set[int],
    errors: list[str],
    warnings: list[str],
) -> None:
    psalms = scripture_payload.get("psalms")
    if not isinstance(psalms, dict):
        errors.append("scripture_mappings.json must contain an object at key 'psalms'.")
        return

    mapped_psalms: set[int] = set()
    for key, entry in psalms.items():
        where = f"scripture.psalms[{key!r}]"

        if not str(key).isdigit():
            errors.append(f"{where} key must be numeric.")
            continue
        key_num = int(key)
        mapped_psalms.add(key_num)

        if not isinstance(entry, dict):
            errors.append(f"{where} must be an object.")
            continue

        vulgate_num = entry.get("psalm_number_vulgate")
        if vulgate_num != key_num:
            errors.append(
                f"{where} psalm_number_vulgate={vulgate_num!r} does not match key {key_num}."
            )

        if key_num not in crosswalk:
            errors.append(f"{where} Vulgate number missing from crosswalk.")
            continue

        hebrew_expected = parse_hebrew_reference_to_int(crosswalk[key_num])
        hebrew_actual = entry.get("psalm_number_hebrew")
        if hebrew_expected is not None:
            if hebrew_actual != hebrew_expected:
                errors.append(
                    f"{where} psalm_number_hebrew={hebrew_actual!r} expected {hebrew_expected}."
                )
        elif hebrew_actual is None:
            warnings.append(f"{where} missing psalm_number_hebrew for non-trivial crosswalk row.")

        verse_range = entry.get("verse_range")
        if verse_range:
            parsed_verses, kind = parse_verse_spec(verse_range)
            if parsed_verses is None:
                errors.append(
                    f"{where} has invalid verse_range={verse_range!r} ({kind})."
                )

        links = entry.get("links")
        if not isinstance(links, dict):
            errors.append(f"{where} links must be an object.")
        else:
            if not links.get("vulgate"):
                warnings.append(f"{where} missing links.vulgate")
            if not links.get("douay_rheims"):
                warnings.append(f"{where} missing links.douay_rheims")

    unmapped_refs = sorted(referenced_psalms - mapped_psalms)
    if unmapped_refs:
        preview = ", ".join(str(num) for num in unmapped_refs[:15])
        suffix = " ..." if len(unmapped_refs) > 15 else ""
        warnings.append(
            f"{len(unmapped_refs)} referenced psalms lack canonical entries in scripture_mappings.json: {preview}{suffix}"
        )


def main() -> int:
    args = parse_args()
    errors: list[str] = []
    warnings: list[str] = []

    number_map_path = args.number_map_path.expanduser().resolve()
    pentacle_path = args.pentacle_path.expanduser().resolve()
    scripture_path = args.scripture_path.expanduser().resolve()

    crosswalk = validate_number_map(number_map_path, errors, warnings)
    try:
        pentacle_payload = load_json(pentacle_path)
        scripture_payload = load_json(scripture_path)
    except RuntimeError as exc:
        print("Psalm validation summary")
        print("- Errors: 1")
        print("- Warnings: 0")
        print(f"\nErrors:\n  - {exc}")
        return 1

    metadata = pentacle_payload.get("metadata", {}) if isinstance(pentacle_payload, dict) else {}
    duplicate_policy = metadata.get("duplicate_psalm_policy", {}) if isinstance(metadata, dict) else {}
    allow_duplicate_psalms = bool(
        isinstance(duplicate_policy, dict) and duplicate_policy.get("allow_duplicates")
    )

    referenced_psalms, missing_pentacles = validate_pentacle_mappings(
        pentacle_payload,
        crosswalk,
        number_map_path.name,
        allow_duplicate_psalms,
        errors,
        warnings,
    )
    validate_scripture_mappings(
        scripture_payload, crosswalk, referenced_psalms, errors, warnings
    )

    total_pentacles = len(pentacle_payload.get("pentacles", [])) if isinstance(pentacle_payload, dict) else 0
    if total_pentacles and missing_pentacles:
        warnings.append(
            f"{missing_pentacles}/{total_pentacles} pentacles currently have no Psalm references."
        )

    print("Psalm validation summary")
    print(f"- Errors: {len(errors)}")
    print(f"- Warnings: {len(warnings)}")

    if errors:
        print("\nErrors:")
        for message in errors:
            print(f"  - {message}")

    if warnings:
        print("\nWarnings:")
        for message in warnings:
            print(f"  - {message}")

    if errors:
        return 1
    if args.fail_on_warnings and warnings:
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
