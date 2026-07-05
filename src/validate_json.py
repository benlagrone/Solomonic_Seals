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
PENTACLE_PSALMS_FILE = Path(__file__).resolve().parent.parent / "data" / "pentacle_psalms.json"


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


def validate_pentacle_psalm_tradition(planetary_layer: dict[str, object]) -> list[str]:
    warnings: list[str] = []
    if not PENTACLE_PSALMS_FILE.exists():
        warnings.append(f"Pentacle Psalm map not found: {PENTACLE_PSALMS_FILE}")
        return warnings

    try:
        payload = json.loads(PENTACLE_PSALMS_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        warnings.append(f"Pentacle Psalm map is invalid JSON: {exc}")
        return warnings

    groups = planetary_layer.get("groups", [])
    clock_keys: set[tuple[str, int]] = set()
    for group in groups:
        planet = str(group.get("name") or "").strip().lower()
        for pentacle in group.get("pentacles", []):
            if not isinstance(pentacle, dict):
                continue
            try:
                index = int(pentacle.get("index"))
            except (TypeError, ValueError):
                continue
            if planet:
                clock_keys.add((planet, index))

    psalm_keys: set[tuple[str, int]] = set()
    for record in payload.get("pentacles") or []:
        if not isinstance(record, dict):
            continue
        planet = str(record.get("planet") or "").strip().lower()
        try:
            index = int(record.get("pentacle"))
        except (TypeError, ValueError):
            continue
        if planet:
            psalm_keys.add((planet, index))

    if len(clock_keys) != len(psalm_keys):
        warnings.append(
            "Pentacle tradition count differs: "
            f"clock model has {len(clock_keys)} pentacles; Psalm source map has {len(psalm_keys)}. "
            "This is expected until the tradition switcher or canonical 43/44 decision is implemented."
        )

    missing_in_psalms = sorted(clock_keys - psalm_keys)
    if missing_in_psalms:
        formatted = ", ".join(f"{planet.title()} #{index}" for planet, index in missing_in_psalms[:8])
        warnings.append(f"Clock pentacles without Psalm-map records: {formatted}")

    extra_in_psalms = sorted(psalm_keys - clock_keys)
    if extra_in_psalms:
        formatted = ", ".join(f"{planet.title()} #{index}" for planet, index in extra_in_psalms[:8])
        warnings.append(f"Psalm-map records outside the clock model: {formatted}")

    return warnings


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
    warnings: list[str] = []
    errors.extend(validate_spirit_layer(layers.get("spirit", {})))
    errors.extend(validate_planetary_layer(layers.get("planetary", {})))
    warnings.extend(validate_pentacle_psalm_tradition(layers.get("planetary", {})))
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
    if warnings:
        print("Dataset guardrails:")
        for issue in warnings:
            print(f" - Warning: {issue}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
