#!/usr/bin/env python3
import argparse
import datetime
import json
import os
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE_DIR = ROOT / "docs" / "source_texts"
DEFAULT_OUTPUT_JSON = ROOT / "data" / "source_texts_index.json"


def slugify(text):
    slug = re.sub(r"[^a-zA-Z0-9]+", "_", text.lower()).strip("_")
    return slug or "section"


def normalize_text(text):
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = text.lstrip("\ufeff")
    if not text.endswith("\n"):
        text += "\n"
    return text


def split_header(text):
    lines = text.splitlines()
    if not lines or lines[0].strip() != "Sources:":
        return {}, text
    meta = {"sources": [], "retrieved": None, "notes": None}
    i = 1
    for i in range(1, len(lines)):
        line = lines[i]
        if not line.strip():
            i += 1
            break
        if line.startswith("- "):
            meta["sources"].append(line[2:].strip())
        elif line.startswith("Retrieved:"):
            meta["retrieved"] = line.replace("Retrieved:", "", 1).strip()
        elif line.startswith("Notes:"):
            meta["notes"] = line.replace("Notes:", "", 1).strip()
    body = "\n".join(lines[i:]) + ("\n" if i < len(lines) else "")
    return meta, body


def is_title_case(line):
    if len(line) > 80:
        return False
    if line.endswith((".", ":", ";", ",")):
        return False
    words = re.findall(r"[A-Za-z][A-Za-z']*", line)
    if len(words) < 2 or len(words) > 8:
        return False
    return all(word[0].isupper() for word in words)


def is_heading(line, prev_line, next_line):
    s = line.strip()
    if not s:
        return False
    if re.match(r"^-{2,}\s*https?://", s):
        return True
    if re.match(r"^(CHAPTER|BOOK|PSALM|ODE|SECTION|PART)\b", s, re.I):
        return True
    if re.match(r"^[IVXLCDM]{1,8}$", s):
        return True
    if re.match(r"^\d{1,3}$", s) and (not prev_line.strip() or not next_line.strip()):
        return True
    if re.search(r"\b\d+:\d+\b", s) and len(s) <= 80:
        return True
    if s.isupper() and len(s) <= 80 and sum(c.isalpha() for c in s) >= 4:
        return True
    if is_title_case(s):
        return True
    return False


def html_to_text(html_text):
    # Minimal HTML strip for indexing if needed.
    text = re.sub(r"(?s)<script.*?>.*?</script>", "", html_text)
    text = re.sub(r"(?s)<style.*?>.*?</style>", "", text)
    text = re.sub(r"(?s)<!--.*?-->", "", text)
    text = re.sub(r"<[^>]+>", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text


def compute_line_offsets(lines):
    offsets = []
    pos = 0
    for line in lines:
        offsets.append(pos)
        pos += len(line) + 1  # +1 for newline
    return offsets


def extract_sections(text):
    lines = text.splitlines()
    if not lines:
        return []
    offsets = compute_line_offsets(lines)
    section_starts = [0]

    for idx, line in enumerate(lines):
        prev_line = lines[idx - 1] if idx > 0 else ""
        next_line = lines[idx + 1] if idx + 1 < len(lines) else ""
        if is_heading(line, prev_line, next_line) and idx != 0:
            section_starts.append(idx)

    section_starts = sorted(set(section_starts))
    section_starts.append(len(lines))

    sections = []
    slug_counts = {}
    for order, (start, end) in enumerate(zip(section_starts, section_starts[1:]), start=1):
        chunk_lines = lines[start:end]
        if not chunk_lines:
            continue
        heading = chunk_lines[0].strip() if is_heading(chunk_lines[0], "", "") else None
        heading_slug = slugify(heading) if heading else "section"
        slug_counts.setdefault(heading_slug, 0)
        slug_counts[heading_slug] += 1
        if slug_counts[heading_slug] > 1:
            heading_slug = f"{heading_slug}_{slug_counts[heading_slug]}"

        char_start = offsets[start]
        char_end = offsets[end] if end < len(offsets) else len(text)
        section_text = "\n".join(chunk_lines).strip() + "\n"

        sections.append(
            {
                "section_id": heading_slug,
                "heading": heading,
                "order": order,
                "char_start": char_start,
                "char_end": char_end,
                "text": section_text,
            }
        )
    return sections


def path_for_output(path):
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


def index_sources(source_dir, metadata_path):
    sources = []
    metadata_map = {}
    if metadata_path.exists():
        meta_list = json.loads(metadata_path.read_text(encoding="utf-8"))
        for entry in meta_list:
            filename = entry.get("filename")
            if filename:
                metadata_map[filename] = entry
    txt_files = sorted(p for p in source_dir.glob("*.txt") if p.is_file())
    for path in txt_files:
        raw = path.read_text(encoding="utf-8", errors="replace")
        raw = normalize_text(raw)
        meta, body = split_header(raw)
        if "<html" in body.lower() and "</html>" in body.lower():
            body = html_to_text(body)
            body = normalize_text(body)
        sections = extract_sections(body)

        source_id = slugify(path.stem)
        title = path.stem.replace("_", " ").title()
        metadata = metadata_map.get(path.name)
        if metadata and metadata.get("title"):
            title = metadata["title"]
        sources.append(
            {
                "source_id": source_id,
                "title": title,
                "file": path_for_output(path),
                "source_urls": meta.get("sources") or [],
                "retrieved": meta.get("retrieved"),
                "notes": meta.get("notes"),
                "metadata": metadata or {},
                "section_count": len(sections),
                "sections": sections,
            }
        )
    return sources


def main():
    parser = argparse.ArgumentParser(
        description="Build a structured index from plain-text source files."
    )
    parser.add_argument(
        "--source-dir",
        type=Path,
        default=Path(
            os.environ.get("SOLOMONIC_SOURCE_TEXTS_DIR", str(DEFAULT_SOURCE_DIR))
        ),
        help="Directory containing source .txt files (default: docs/source_texts or SOLOMONIC_SOURCE_TEXTS_DIR).",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT_JSON,
        help="Output JSON path (default: data/source_texts_index.json).",
    )
    args = parser.parse_args()

    source_dir = args.source_dir.expanduser().resolve()
    output_json = args.output.expanduser().resolve()
    metadata_path = source_dir / "book_metadata.json"

    if not source_dir.exists() or not source_dir.is_dir():
        raise SystemExit(f"Source directory not found: {source_dir}")

    output_json.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "generated": datetime.date.today().isoformat(),
        "source_count": 0,
        "sources": [],
    }
    payload["sources"] = index_sources(source_dir, metadata_path)
    payload["source_count"] = len(payload["sources"])

    output_json.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {output_json} from {source_dir}")


if __name__ == "__main__":
    main()
