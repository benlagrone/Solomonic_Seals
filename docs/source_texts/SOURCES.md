# Source Intake Inventory

This file documents all requested sources for import into `docs/source_texts`.
Outputs use a simple header block (Sources + Retrieved date) followed by normalized text.

## Source list

1) Gutenberg (PG124)
   - URL: https://www.gutenberg.org/cache/epub/124/pg124.txt
   - Extract: section starting with `The Book of Wisdom` / `[The Wisdom of Solomon]`
   - Stop before: `The Book of Sirach (or Ecclesiasticus)` / `[The Wisdom of Jesus the Son of Sirach, or Ecclesiasticus]`
   - Output: docs/source_texts/wisdom_of_solomon_gutenberg.txt
   - Status: ✅ Pulled

2) Sacred Texts (Forgotten Books of Eden index)
   - URL: https://sacred-texts.com/bib/fbe/index.htm#section_003
   - Extract: all linked child pages under:
     - The Psalms of Solomon
     - The Odes of Solomon
   - Output: docs/source_texts/psalms_of_solomon_fbe.txt, docs/source_texts/odes_of_solomon_fbe.txt
   - Status: ✅ Pulled

3) eBible (Wisdom of Solomon PDF)
   - URL: https://ebible.org/pdf/eng-web/eng-web_WIS.pdf?utm_source=chatgpt.com
   - Extract: full PDF text
   - Output: docs/source_texts/wisdom_of_solomon_web.txt
   - Status: ✅ Pulled (pypdf fallback)

4) MIT (Testament of Solomon)
   - URL: https://web.mit.edu/mjperson/Desktop/mjperson/OldFiles/Assassin/Darkness/Books/testament-solomon.txt
   - Extract: full text
   - Output: docs/source_texts/testament_of_solomon_mit.txt
   - Status: ✅ Pulled

5) Archive.org (b24884431)
   - URL: https://archive.org/stream/b24884431/b24884431_djvu.txt
   - Extract: full text
   - Output: docs/source_texts/archive_b24884431.txt
   - Status: ✅ Pulled

6) Archive.org (Lesser Key audiobook companion PDF)
   - URL: https://archive.org/stream/lesser-key-audiobook/The%20Lesser%20Key%20of%20Solomon%20Accompanying%20PDF_djvu.txt
   - Extract: full text
   - Output: docs/source_texts/lesser_key_of_solomon_audiobook_djvu.txt
   - Status: ✅ Pulled

7) Esoteric Archives (Key of Solomon)
   - URL: https://www.esotericarchives.com/solomon/ksol.htm
   - Extract: main page content (exclude navigation/footer)
   - Output: docs/source_texts/key_of_solomon_esotericarchives.txt
   - Status: ✅ Pulled

8) Sacred Texts (Lesser Key of Solomon index)
   - URL: https://www.sacred-texts.com/grim/lks/index.htm
   - Extract: all linked child pages under this index, in order
   - Output: docs/source_texts/lesser_key_of_solomon_sacred_texts.txt
   - Status: ✅ Pulled

9) Archive.org (Ars Notoria)
   - URL: https://archive.org/stream/ars_notoria/ars_notoria_djvu.txt?utm_source=chatgpt.com
   - Extract: full text
   - Output: docs/source_texts/ars_notoria_archive.txt
   - Status: ✅ Pulled

10) Archive.org (Hygromanteia / Magical Treatise of Solomon)
    - URL: https://archive.org/stream/Grimoires_201812/MagicalTreatiseOfSolomon-Hygromanteia_djvu.txt
    - Extract: full text
    - Output: docs/source_texts/hygromanteia_archive.txt
    - Status: ✅ Pulled

11) Esoteric Archives (Raziel)
    - URL: https://www.esotericarchives.com/raziel/raziel.htm
    - Extract: main page content (exclude navigation/footer)
    - Output: docs/source_texts/raziel_esotericarchives.txt
    - Status: ✅ Pulled

## Open questions
- None.
