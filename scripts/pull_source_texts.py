#!/usr/bin/env python3
import datetime
import html
import re
import subprocess
import sys
import tempfile
import time
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin
from urllib.error import HTTPError
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "docs" / "source_texts"
DATE = datetime.date.today().isoformat()


class HTMLTextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
        self.in_script = False
        self.in_style = False

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"):
            if tag == "script":
                self.in_script = True
            else:
                self.in_style = True
        if tag in ("p", "br", "div", "hr", "li", "tr", "h1", "h2", "h3", "h4", "h5", "h6"):
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag == "script":
            self.in_script = False
        if tag == "style":
            self.in_style = False
        if tag in ("p", "div", "li", "tr", "h1", "h2", "h3", "h4", "h5", "h6"):
            self.parts.append("\n")

    def handle_data(self, data):
        if self.in_script or self.in_style:
            return
        self.parts.append(data)


class SectionLinkParser(HTMLParser):
    def __init__(self, section_title):
        super().__init__()
        self.section_title = section_title.lower()
        self.in_heading = False
        self.heading_text = []
        self.in_section = False
        self.links = []
        self.stop = False

    def handle_starttag(self, tag, attrs):
        if tag in ("h1", "h2", "h3", "h4", "h5", "h6"):
            self.in_heading = True
            self.heading_text = []
        if tag == "a" and self.in_section and not self.stop:
            for key, value in attrs:
                if key.lower() == "href" and value:
                    self.links.append(value)

    def handle_endtag(self, tag):
        if tag in ("h1", "h2", "h3", "h4", "h5", "h6"):
            text = "".join(self.heading_text).strip().lower()
            if text:
                if text == self.section_title:
                    self.in_section = True
                elif self.in_section:
                    self.stop = True
                    self.in_section = False
            self.in_heading = False
            self.heading_text = []

    def handle_data(self, data):
        if self.in_heading:
            self.heading_text.append(data)


def fetch_text(url, retries=2, backoff=2.0):
    req = Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (compatible; CodexFetcher/1.0)"},
    )
    last_error = None
    for attempt in range(retries + 1):
        try:
            with urlopen(req) as resp:
                raw = resp.read()
                charset = None
                content_type = resp.headers.get("Content-Type")
                if content_type and "charset=" in content_type:
                    charset = content_type.split("charset=")[-1].split(";")[0].strip()
                encoding = charset or "utf-8"
                return raw.decode(encoding, errors="replace")
        except HTTPError as exc:
            last_error = exc
            if exc.code == 429 and attempt < retries:
                time.sleep(backoff * (attempt + 1))
                continue
            raise
    if last_error:
        raise last_error
    raise RuntimeError("Failed to fetch URL")


def normalize_text(text):
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip() + "\n"


def write_output(path, sources, body, notes=None):
    if isinstance(sources, str):
        sources = [sources]
    header_lines = ["Sources:"]
    for src in sources:
        header_lines.append(f"- {src}")
    header_lines.append(f"Retrieved: {DATE}")
    if notes:
        header_lines.append(f"Notes: {notes}")
    header_lines.append("")
    content = "\n".join(header_lines) + normalize_text(body)
    path.write_text(content, encoding="utf-8")
    print(f"Wrote {path}")


def extract_gutenberg_section(text, start_marker, stop_marker):
    lines = text.splitlines()
    start_idx = None
    stop_idx = None
    for idx, line in enumerate(lines):
        if start_idx is None and start_marker in line:
            start_idx = idx
        if start_idx is not None and stop_marker in line:
            stop_idx = idx
            break
    if start_idx is None:
        raise ValueError("Start marker not found")
    if stop_idx is None:
        raise ValueError("Stop marker not found")
    return "\n".join(lines[start_idx:stop_idx]).strip() + "\n"


def html_to_text(html_text):
    parser = HTMLTextExtractor()
    parser.feed(html_text)
    raw = html.unescape("".join(parser.parts))
    return normalize_text(raw)


def extract_section_links(html_text, base_url, section_title):
    parser = SectionLinkParser(section_title)
    parser.feed(html_text)
    links = []
    for href in parser.links:
        if href.startswith("#"):
            continue
        full = urljoin(base_url, href)
        if full not in links:
            links.append(full)
    return links


def extract_index_links(html_text, base_url):
    class IndexLinkParser(HTMLParser):
        def __init__(self):
            super().__init__()
            self.links = []

        def handle_starttag(self, tag, attrs):
            if tag != "a":
                return
            for key, value in attrs:
                if key.lower() == "href" and value:
                    self.links.append(value)

    parser = IndexLinkParser()
    parser.feed(html_text)
    links = []
    for href in parser.links:
        if href.startswith("#"):
            continue
        full = urljoin(base_url, href)
        if full not in links:
            links.append(full)
    return links


def concatenate_pages(urls, sleep_between=1.0):
    pieces = []
    for url in urls:
        page_html = fetch_text(url)
        page_text = html_to_text(page_html)
        pieces.append(f"----- {url} -----\n\n{page_text}")
        if sleep_between:
            time.sleep(sleep_between)
    return "\n\n".join(pieces).strip() + "\n"


def extract_pdf_text(pdf_url):
    with tempfile.TemporaryDirectory() as tmp_dir:
        pdf_path = Path(tmp_dir) / "source.pdf"
        txt_path = Path(tmp_dir) / "source.txt"
        with urlopen(pdf_url) as resp:
            pdf_path.write_bytes(resp.read())
        try:
            subprocess.run(
                ["pdftotext", "-layout", str(pdf_path), str(txt_path)],
                check=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            return txt_path.read_text(encoding="utf-8", errors="replace")
        except FileNotFoundError:
            try:
                from pypdf import PdfReader
            except ImportError as exc:
                raise RuntimeError("pdftotext not found and pypdf is not installed") from exc
            reader = PdfReader(str(pdf_path))
            parts = []
            for page in reader.pages:
                text = page.extract_text() or ""
                parts.append(text)
            return "\n\n".join(parts)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    failures = []

    # 1) Gutenberg section
    try:
        url = "https://www.gutenberg.org/cache/epub/124/pg124.txt"
        text = fetch_text(url)
        section = extract_gutenberg_section(
            text,
            "The Book of Wisdom",
            "The Book of Sirach (or Ecclesiasticus)",
        )
        write_output(
            OUT_DIR / "wisdom_of_solomon_gutenberg.txt",
            url,
            section,
            notes="Extracted section from 'The Book of Wisdom' up to (but excluding) 'The Book of Sirach (or Ecclesiasticus)'.",
        )
    except Exception as exc:
        failures.append(("gutenberg", str(exc)))

    # 2) Sacred Texts FBE sections
    try:
        base_url = "https://sacred-texts.com/bib/fbe/index.htm"
        index_html = fetch_text(base_url)
        ps_links = extract_section_links(index_html, base_url, "The Psalms of Solomon")
        od_links = extract_section_links(index_html, base_url, "The Odes of Solomon")
        if not ps_links:
            raise RuntimeError("No links found for The Psalms of Solomon")
        if not od_links:
            raise RuntimeError("No links found for The Odes of Solomon")
        ps_text = concatenate_pages(ps_links, sleep_between=1.0)
        od_text = concatenate_pages(od_links, sleep_between=1.0)
        write_output(
            OUT_DIR / "psalms_of_solomon_fbe.txt",
            ps_links,
            ps_text,
            notes="Links collected from the FBE index section.",
        )
        write_output(
            OUT_DIR / "odes_of_solomon_fbe.txt",
            od_links,
            od_text,
            notes="Links collected from the FBE index section.",
        )
    except Exception as exc:
        failures.append(("sacred-texts-fbe", str(exc)))

    # 3) eBible PDF (Wisdom of Solomon)
    try:
        pdf_url = "https://ebible.org/pdf/eng-web/eng-web_WIS.pdf?utm_source=chatgpt.com"
        pdf_text = extract_pdf_text(pdf_url)
        write_output(
            OUT_DIR / "wisdom_of_solomon_web.txt",
            pdf_url,
            pdf_text,
            notes="Extracted from PDF via pdftotext -layout.",
        )
    except Exception as exc:
        failures.append(("ebible-pdf", str(exc)))

    # 4) MIT Testament of Solomon
    try:
        url = "https://web.mit.edu/mjperson/Desktop/mjperson/OldFiles/Assassin/Darkness/Books/testament-solomon.txt"
        text = fetch_text(url)
        write_output(OUT_DIR / "testament_of_solomon_mit.txt", url, text)
    except Exception as exc:
        failures.append(("mit-testament", str(exc)))

    # 5) Archive.org b24884431
    try:
        url = "https://archive.org/stream/b24884431/b24884431_djvu.txt"
        text = fetch_text(url)
        write_output(OUT_DIR / "archive_b24884431.txt", url, text)
    except Exception as exc:
        failures.append(("archive-b24884431", str(exc)))

    # 6) Archive.org lesser key audiobook companion PDF
    try:
        url = "https://archive.org/stream/lesser-key-audiobook/The%20Lesser%20Key%20of%20Solomon%20Accompanying%20PDF_djvu.txt"
        text = fetch_text(url)
        write_output(OUT_DIR / "lesser_key_of_solomon_audiobook_djvu.txt", url, text)
    except Exception as exc:
        failures.append(("archive-lesser-key-audio", str(exc)))

    # 7) Esoteric Archives Key of Solomon page
    try:
        url = "https://www.esotericarchives.com/solomon/ksol.htm"
        html_text = fetch_text(url)
        text = html_to_text(html_text)
        write_output(OUT_DIR / "key_of_solomon_esotericarchives.txt", url, text)
    except Exception as exc:
        failures.append(("esoteric-ksol", str(exc)))

    # 8) Sacred Texts Lesser Key index (all linked pages)
    try:
        base_url = "https://www.sacred-texts.com/grim/lks/index.htm"
        index_html = fetch_text(base_url)
        links = extract_index_links(index_html, base_url)
        # Limit to links in the same directory for this index.
        links = [u for u in links if "/grim/lks/" in u]
        if not links:
            raise RuntimeError("No links found on the Lesser Key index")
        text = concatenate_pages(links, sleep_between=1.0)
        write_output(
            OUT_DIR / "lesser_key_of_solomon_sacred_texts.txt",
            links,
            text,
            notes="All links under the Lesser Key index page.",
        )
    except Exception as exc:
        failures.append(("sacred-texts-lks", str(exc)))

    # 9) Archive.org Ars Notoria
    try:
        url = "https://archive.org/stream/ars_notoria/ars_notoria_djvu.txt?utm_source=chatgpt.com"
        text = fetch_text(url)
        write_output(OUT_DIR / "ars_notoria_archive.txt", url, text)
    except Exception as exc:
        failures.append(("archive-ars-notoria", str(exc)))

    # 10) Archive.org Hygromanteia
    try:
        url = "https://archive.org/stream/Grimoires_201812/MagicalTreatiseOfSolomon-Hygromanteia_djvu.txt"
        text = fetch_text(url)
        write_output(OUT_DIR / "hygromanteia_archive.txt", url, text)
    except Exception as exc:
        failures.append(("archive-hygromanteia", str(exc)))

    # 11) Esoteric Archives Raziel
    try:
        url = "https://www.esotericarchives.com/raziel/raziel.htm"
        html_text = fetch_text(url)
        text = html_to_text(html_text)
        write_output(OUT_DIR / "raziel_esotericarchives.txt", url, text)
    except Exception as exc:
        failures.append(("esoteric-raziel", str(exc)))

    if failures:
        print("\nFailures:")
        for key, msg in failures:
            print(f"- {key}: {msg}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
