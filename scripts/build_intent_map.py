#!/usr/bin/env python3
import datetime
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INDEX_PATH = ROOT / "data" / "source_texts_index.json"
OUTPUT_JSON = ROOT / "data" / "intent_reading_map.json"
OUTPUT_MD = ROOT / "docs" / "intent_reading_map.md"


SOURCE_WHITELIST = {
    "proverbs",
    "ecclesiastes",
    "song_of_solomon",
    "wisdom_of_solomon_gutenberg",
    "wisdom_of_solomon_web",
    "psalms_of_solomon_fbe",
    "odes_of_solomon_fbe",
}


INTENTS = {
    "health": [
        ("health", r"\bhealth\w*\b"),
        ("heal", r"\bheal\w*\b"),
        ("whole", r"\bwhole\w*\b"),
        ("restore", r"\brestor\w*\b"),
        ("life", r"\blife\b"),
        ("strength", r"\bstrength\b"),
    ],
    "wealth": [
        ("wealth", r"\bwealth\w*\b"),
        ("rich", r"\brich\w*\b"),
        ("prosper", r"\bprosper\w*\b"),
        ("abundance", r"\babundance\b"),
        ("treasure", r"\btreasure\w*\b"),
        ("gold", r"\bgold\b"),
        ("silver", r"\bsilver\b"),
        ("increase", r"\bincrease\b"),
    ],
    "power": [
        ("power", r"\bpower\w*\b"),
        ("might", r"\bmight\w*\b"),
        ("authority", r"\bauthority\b"),
        ("dominion", r"\bdominion\b"),
        ("rule", r"\brule\w*\b"),
        ("king", r"\bking\w*\b"),
        ("victory", r"\bvictor\w*\b"),
        ("overcome", r"\bovercome\b"),
        ("strength", r"\bstrength\b"),
    ],
    "protection": [
        ("protect", r"\bprotect\w*\b"),
        ("defend", r"\bdefend\w*\b"),
        ("deliver", r"\bdeliver\w*\b"),
        ("shield", r"\bshield\w*\b"),
        ("refuge", r"\brefuge\b"),
        ("save", r"\bsave\w*\b"),
        ("guard", r"\bguard\w*\b"),
        ("fear", r"\bfear\b"),
        ("safe", r"\bsafe\w*\b"),
    ],
    "clarity": [
        ("wisdom", r"\bwisdom\b"),
        ("understanding", r"\bunderstand\w*\b"),
        ("insight", r"\binsight\b"),
        ("discern", r"\bdiscern\w*\b"),
        ("knowledge", r"\bknowledge\b"),
        ("light", r"\blight\b"),
        ("truth", r"\btruth\b"),
        ("guide", r"\bguide\w*\b"),
        ("counsel", r"\bcounsel\w*\b"),
        ("instruction", r"\binstruct\w*\b"),
    ],
}

MIN_SECTION_CHARS = 200
MAX_RESULTS_PER_INTENT = 40
MAX_RESULTS_PER_SOURCE = 8


def load_index():
    return json.loads(INDEX_PATH.read_text(encoding="utf-8"))


def score_section(text, patterns):
    matches = []
    score = 0
    for label, pattern in patterns:
        count = len(re.findall(pattern, text))
        if count:
            score += count
            matches.append(label)
    return score, matches


def sanitize_heading(text):
    if not text:
        return ""
    return "".join(ch for ch in text if 32 <= ord(ch) < 127).strip()


def build_intent_map(index_data):
    results = {}
    for intent, patterns in INTENTS.items():
        compiled = [(label, re.compile(pattern, re.IGNORECASE)) for label, pattern in patterns]
        scored = []
        for src in index_data["sources"]:
            if src["source_id"] not in SOURCE_WHITELIST:
                continue
            source_count = 0
            for sec in src["sections"]:
                if len(sec["text"]) < MIN_SECTION_CHARS:
                    continue
                text = sec["text"]
                heading = sec.get("heading") or ""
                combined = f"{heading}\n{text}"
                score, matches = score_section(combined, compiled)
                if score <= 0:
                    continue
                scored.append(
                    {
                        "source_id": src["source_id"],
                        "source_title": src.get("title", ""),
                        "section_id": sec["section_id"],
                        "heading": sanitize_heading(heading),
                        "score": score,
                        "match_terms": matches,
                        "char_start": sec["char_start"],
                        "char_end": sec["char_end"],
                    }
                )
                source_count += 1
        # Rank
        scored.sort(key=lambda item: (item["score"], item["source_id"]), reverse=True)

        # Enforce per-source cap
        per_source = {}
        pruned = []
        for item in scored:
            sid = item["source_id"]
            per_source.setdefault(sid, 0)
            if per_source[sid] >= MAX_RESULTS_PER_SOURCE:
                continue
            per_source[sid] += 1
            pruned.append(item)
            if len(pruned) >= MAX_RESULTS_PER_INTENT:
                break
        results[intent] = pruned
    return results


def write_outputs(results):
    payload = {
        "generated": datetime.date.today().isoformat(),
        "source_whitelist": sorted(SOURCE_WHITELIST),
        "min_section_chars": MIN_SECTION_CHARS,
        "max_results_per_intent": MAX_RESULTS_PER_INTENT,
        "max_results_per_source": MAX_RESULTS_PER_SOURCE,
        "intents": results,
    }
    OUTPUT_JSON.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    lines = []
    lines.append("# Intent to Reading Map (Auto-Generated)")
    lines.append("")
    lines.append("This map is generated from keyword matching against indexed texts.")
    lines.append("Use it as a starting point for manual curation.")
    lines.append("")
    for intent, items in results.items():
        lines.append(f"## {intent.title()}")
        if not items:
            lines.append("- No matches found.")
            lines.append("")
            continue
        for item in items[:10]:
            heading = f" ({item['heading']})" if item["heading"] else ""
            lines.append(
                f"- {item['source_id']} | {item['section_id']}{heading} | score={item['score']} | matches={','.join(item['match_terms'])}"
            )
        lines.append("")

    OUTPUT_MD.write_text("\n".join(lines).strip() + "\n", encoding="utf-8")


def main():
    index_data = load_index()
    results = build_intent_map(index_data)
    write_outputs(results)
    print(f"Wrote {OUTPUT_JSON}")
    print(f"Wrote {OUTPUT_MD}")


if __name__ == "__main__":
    main()
