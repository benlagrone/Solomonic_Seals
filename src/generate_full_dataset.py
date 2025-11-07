#!/usr/bin/env python3
"""
generate_full_dataset.py
------------------------
Creates solomonic_clock_full.json with the full Solomonic Clock hierarchy.
Besides the 72 spirit sectors, the export now bundles metadata for the core,
celestial, and planetary rings so the web visualizer can draw everything from
a single source of truth.
"""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

# Each zodiac sign covers 30°, split into six 5° sectors.
ZODIAC_SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer",
    "Leo", "Virgo", "Libra", "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

# 72 spirits in traditional order with their rank
SPIRITS = [
    ("Bael", "King"), ("Agares", "Duke"), ("Vassago", "Prince"), ("Samigina", "Marquis"), ("Marbas", "President"), ("Valefor", "Duke"),
    ("Amon", "Marquis"), ("Barbatos", "Duke"), ("Paimon", "King"), ("Buer", "President"), ("Gusion", "Duke"), ("Sitri", "Prince"),
    ("Beleth", "King"), ("Leraje", "Marquis"), ("Eligos", "Duke"), ("Zepar", "Duke"), ("Botis", "President"), ("Bathin", "Duke"),
    ("Sallos", "Duke"), ("Purson", "King"), ("Marax", "Earl"), ("Ipos", "Earl"), ("Aim", "Duke"), ("Naberius", "Marquis"),
    ("Glasya-Labolas", "President"), ("Bune", "Duke"), ("Ronove", "Marquis"), ("Berith", "Duke"), ("Astaroth", "Duke"), ("Forneus", "Marquis"),
    ("Foras", "President"), ("Asmoday", "King"), ("Gaap", "President"), ("Furfur", "Earl"), ("Marchosias", "Marquis"), ("Stolas", "Prince"),
    ("Phenex", "Marquis"), ("Halphas", "Earl"), ("Malphas", "President"), ("Raum", "Earl"), ("Focalor", "Duke"), ("Vepar", "Duke"),
    ("Sabnock", "Marquis"), ("Shax", "Marquis"), ("Vine", "King"), ("Bifrons", "Earl"), ("Uvall", "Duke"), ("Haagenti", "President"),
    ("Crocell", "Duke"), ("Furcas", "Knight"), ("Balam", "King"), ("Alloces", "Duke"), ("Camio", "President"), ("Murmur", "Duke"),
    ("Orobas", "Prince"), ("Gremory", "Duke"), ("Ose", "President"), ("Amy", "President"), ("Orias", "Marquis"), ("Vapula", "Duke"),
    ("Zagan", "King"), ("Valac", "President"), ("Andras", "Marquis"), ("Flauros", "Duke"), ("Andrealphus", "Marquis"), ("Cimejes", "Marquis"),
    ("Amdusias", "Duke"), ("Belial", "King"), ("Decarabia", "Marquis"), ("Seere", "Prince"), ("Dantalion", "Duke"), ("Andromalius", "Earl"),
]

CELESTIAL_SEALS = [
    {"order": 1, "name": "Earth", "virtue": "Foundation", "element": "Earth"},
    {"order": 2, "name": "Moon", "virtue": "Reflection & Change", "element": "Water"},
    {"order": 3, "name": "Mercury", "virtue": "Thought & Motion", "element": "Air"},
    {"order": 4, "name": "Venus", "virtue": "Harmony & Love", "element": "Air"},
    {"order": 5, "name": "Sun", "virtue": "Illumination & Life", "element": "Fire"},
    {"order": 6, "name": "Mars", "virtue": "Justice & Strength", "element": "Fire"},
    {"order": 7, "name": "Jupiter", "virtue": "Mercy & Rule", "element": "Ether"},
    {"order": 8, "name": "Saturn", "virtue": "Boundaries & Time", "element": "Lead"},
    {"order": 9, "name": "Divine Throne", "virtue": "Source & Rest", "element": "Pure Spirit"},
]

PLANETARY_PENTACLES = [
    {
        "name": "Saturn",
        "day": "Saturday",
        "themes": ["Discipline", "Protection", "Silence"],
        "pentacles": [
            {"index": 1, "focus": "Banish harmful forces"},
            {"index": 2, "focus": "Endurance under trial"},
            {"index": 3, "focus": "Invisibility before foes"},
            {"index": 4, "focus": "Defense against illness"},
            {"index": 5, "focus": "Discover hidden things"},
            {"index": 6, "focus": "Patience and restraint"},
            {"index": 7, "focus": "Binding destructive powers"},
        ],
    },
    {
        "name": "Jupiter",
        "day": "Thursday",
        "themes": ["Mercy", "Justice", "Wealth"],
        "pentacles": [
            {"index": 1, "focus": "Gain favor of rulers"},
            {"index": 2, "focus": "Growth of fortune"},
            {"index": 3, "focus": "Peace and reconciliation"},
            {"index": 4, "focus": "Divine grace and goodwill"},
            {"index": 5, "focus": "Longevity and reputation"},
            {"index": 6, "focus": "Victory in disputes"},
            {"index": 7, "focus": "Righteous rulership"},
        ],
    },
    {
        "name": "Mars",
        "day": "Tuesday",
        "themes": ["Courage", "Purification", "Defense"],
        "pentacles": [
            {"index": 1, "focus": "Victory in conflict"},
            {"index": 2, "focus": "Overcome anger"},
            {"index": 3, "focus": "Destroy malice"},
            {"index": 4, "focus": "Protection from harm"},
            {"index": 5, "focus": "Strength of purpose"},
        ],
    },
    {
        "name": "Sun",
        "day": "Sunday",
        "themes": ["Glory", "Healing", "Authority"],
        "pentacles": [
            {"index": 1, "focus": "Success and illumination"},
            {"index": 2, "focus": "Restoration of vitality"},
            {"index": 3, "focus": "Clarity of understanding"},
            {"index": 4, "focus": "Favor before leaders"},
            {"index": 5, "focus": "Revelation of truth"},
            {"index": 6, "focus": "Blessing and joy"},
        ],
    },
    {
        "name": "Venus",
        "day": "Friday",
        "themes": ["Love", "Beauty", "Harmony"],
        "pentacles": [
            {"index": 1, "focus": "Unity and affection"},
            {"index": 2, "focus": "Forgiveness and peace"},
            {"index": 3, "focus": "Artistic inspiration"},
            {"index": 4, "focus": "Joy and delight"},
            {"index": 5, "focus": "Charm and eloquence"},
        ],
    },
    {
        "name": "Mercury",
        "day": "Wednesday",
        "themes": ["Wisdom", "Speech", "Invention"],
        "pentacles": [
            {"index": 1, "focus": "Increase of knowledge"},
            {"index": 2, "focus": "Retention of learning"},
            {"index": 3, "focus": "Understanding mysteries"},
            {"index": 4, "focus": "Eloquent speech"},
            {"index": 5, "focus": "Negotiation success"},
            {"index": 6, "focus": "Discovery of secrets"},
            {"index": 7, "focus": "Safe travel"},
            {"index": 8, "focus": "Prosperity in trade"},
        ],
    },
    {
        "name": "Moon",
        "day": "Monday",
        "themes": ["Dreams", "Protection", "Intuition"],
        "pentacles": [
            {"index": 1, "focus": "Prophetic dreams"},
            {"index": 2, "focus": "Fertility and safe birth"},
            {"index": 3, "focus": "Emotional cleansing"},
            {"index": 4, "focus": "Protection for travelers"},
            {"index": 5, "focus": "Guidance through darkness"},
            {"index": 6, "focus": "Manifestation of hidden things"},
        ],
    },
]

VISUAL_PARAMETERS = {
    "radius": {
        "core": 100,
        "celestial": 200,
        "planetary": 300,
        "spirit": 400,
    },
    "rotation_speed": {
        "core": 0.0,
        "celestial": 0.001,
        "planetary": 0.05,
        "spirit": 0.3,
    },
    "color_scheme": {
        "core": "#facc15",
        "celestial": "#60a5fa",
        "planetary": "#34d399",
        "spirit": "#f472b6",
    },
}


def build_spirit_sectors() -> list[dict[str, str | int]]:
    sectors = []
    sector = 1
    for sign in ZODIAC_SIGNS:
        for step in range(0, 30, 5):
            name, rank = SPIRITS[sector - 1]
            sectors.append(
                {
                    "sector": sector,
                    "zodiac": sign,
                    "degrees": f"{step}–{step + 5}",
                    "spirit": name,
                    "rank": rank,
                }
            )
            sector += 1
    return sectors


def build_dataset() -> dict[str, object]:
    spirit_sectors = build_spirit_sectors()
    return {
        "title": "Solomonic Clock of Spheres",
        "generated_at": datetime.utcnow().isoformat(timespec="seconds") + "Z",
        "visual_parameters": VISUAL_PARAMETERS,
        "layers": {
            "core": {
                "name": "Master Seal of Solomon",
                "description": "Fixed hub aligning the motions of the heavens and spirits.",
            },
            "celestial": {
                "count": len(CELESTIAL_SEALS),
                "seals": CELESTIAL_SEALS,
            },
            "planetary": {
                "count": sum(len(group["pentacles"]) for group in PLANETARY_PENTACLES),
                "groups": PLANETARY_PENTACLES,
            },
            "spirit": {
                "count": len(spirit_sectors),
                "sectors": spirit_sectors,
            },
        },
    }


def main() -> None:
    dataset = build_dataset()
    out_path = Path(__file__).resolve().parent.parent / "data" / "solomonic_clock_full.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2, ensure_ascii=False)

    spirit_total = dataset["layers"]["spirit"]["count"]
    planetary_total = dataset["layers"]["planetary"]["count"]
    print(
        f"Wrote {spirit_total} spirit sectors and {planetary_total} planetary pentacles to {out_path}"
    )


if __name__ == "__main__":
    main()
