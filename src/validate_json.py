#!/usr/bin/env python3
"""
validate_json.py
----------------
Quick integrity checks for solomonic_clock_full.json so the visualiser can
rely on consistent structure. The script confirms layer counts, validates the
72 contiguous spirit sectors, and emits a short summary report.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "solomonic_clock_full.json"


def load_data() -> dict[str, object]:
    try:
        with DATA_FILE.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    except FileNotFoundError as exc:
        raise SystemExit(f"Data file missing: {DATA_FILE}") from exc


def validate_spirit_layer(spirit_layer: dict[str, object]) -> list[str]:
    errors: list[str] = []
    sectors = spirit_layer.get("sectors", [])
    expected_count = spirit_layer.get("count")

    if expected_count != len(sectors):
        errors.append(
            f"Spirit layer count mismatch: declared {expected_count}, found {len(sectors)} sectors"
        )

    if len(sectors) != 72:
        errors.append(f"Spirit layer expected 72 sectors, found {len(sectors)}")

    for index, entry in enumerate(sectors, start=1):
        if entry.get("sector") != index:
            errors.append(
                f"Spirit sector index mismatch at position {index}: got {entry.get('sector')}"
            )
            break

        if "zodiac" not in entry or "degrees" not in entry or "spirit" not in entry:
            errors.append(f"Spirit sector {index} missing required fields")
            break

    return errors


def validate_planetary_layer(planetary_layer: dict[str, object]) -> list[str]:
    errors: list[str] = []
    groups = planetary_layer.get("groups", [])
    if len(groups) != 7:
        errors.append(f"Expected 7 planetary groups, found {len(groups)}")

    total_pentacles = sum(len(group.get("pentacles", [])) for group in groups)
    declared = planetary_layer.get("count")

    if declared != total_pentacles:
        errors.append(
            f"Planetary count mismatch: declared {declared}, found {total_pentacles} pentacles"
        )

    if total_pentacles != 44:
        errors.append(f"Expected 44 planetary pentacles, found {total_pentacles}")

    return errors


def validate_visual_parameters(visual: dict[str, object]) -> list[str]:
    required_mappings = {"radius", "rotation_speed", "color_scheme"}
    missing = required_mappings.difference(visual.keys())
    if missing:
        return [f"Visual parameters missing keys: {', '.join(sorted(missing))}"]
    return []


def main() -> int:
    payload = load_data()

    layers = payload.get("layers", {})
    visual = payload.get("visual_parameters", {})

    errors: list[str] = []
    errors.extend(validate_spirit_layer(layers.get("spirit", {})))
    errors.extend(validate_planetary_layer(layers.get("planetary", {})))
    errors.extend(validate_visual_parameters(visual))

    if errors:
        print("Validation failed:")
        for issue in errors:
            print(f" • {issue}")
        return 1

    print("Solomonic clock dataset looks good ✅")
    print(f" - Spirit sectors: {layers['spirit']['count']}")
    print(f" - Planetary pentacles: {layers['planetary']['count']}")
    print(f" - Celestial seals: {layers['celestial']['count']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
