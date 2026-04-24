import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scriptPath = path.join(__dirname, "..", "web", "scripture_study.js");
const source = fs.readFileSync(scriptPath, "utf8");

const context = {
  console,
  URLSearchParams,
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(source, context, { filename: "scripture_study.js" });

const hooks = context.__scriptureStudyTest;
assert.ok(hooks, "expected scripture study test hooks to be registered");

const {
  buildPairedReading,
  buildCrossReferenceItems,
  buildPracticePlan,
  extractVersePassageText,
  formatPassageBlockText,
  parseScriptureReference,
} = hooks;

const rawPassage = `
Chapter 18

20 A man's belly shall be satisfied with the fruit of his mouth;
and with the increase
of his lips shall he be filled.

21 Death and life
are in the power
of the tongue:
and they that love it
shall eat the fruit thereof.

22 Whoso findeth a wife findeth a good thing,
and obtaineth favour of the LORD.
`;

const formatted = formatPassageBlockText(rawPassage);
assert.match(
  formatted,
  /21 Death and life are in the power of the tongue: and they that love it shall eat the fruit thereof\./,
  "expected formatted passage to collapse wrapped verse lines"
);
assert.equal(
  extractVersePassageText(formatted, "21"),
  "21 Death and life are in the power of the tongue: and they that love it shall eat the fruit thereof.",
  "expected verse extraction to return the selected wisdom verse"
);

const study = {
  kind: "wisdom",
  reference: "Proverbs 18:21",
  chapter: 18,
  verseSpec: "21",
  preview: "",
  dayText: "Wednesday",
  rulerText: "Mercury",
  virtue: "Prudence",
  domain: "Mind",
  planet: "Sun",
  pentacle: 1,
  psalmRef: "Psalm 119:105",
  wisdomRef: "Proverbs 18:21",
  origin: "daily-opening",
  depth: "anchor",
};

const paired = {
  kind: "psalm",
  reference: "Psalm 119:105",
  chapter: 119,
  verseSpec: "105",
  preview: "",
};

const derivedPaired = buildPairedReading(study);
assert.equal(derivedPaired.kind, "psalm");
assert.equal(derivedPaired.reference, "Psalm 119:105");
assert.equal(derivedPaired.chapter, 119);
assert.equal(derivedPaired.verseSpec, "105");

const pentaclePsalmPayload = {
  pentacles: [
    {
      planet: "Sun",
      pentacle: 1,
      psalms: [
        { number: 19, verses: "1" },
        { number: 72, verses: "9" },
      ],
    },
  ],
};

const pentaclesPayload = {
  pentacles: {
    sun_1: {
      name: "Pentacle of Sun #1",
      purpose: "Visibility and order",
      virtue: "Justice",
    },
  },
};

const crossrefs = buildCrossReferenceItems(study, paired, pentaclePsalmPayload, pentaclesPayload);
assert.ok(
  crossrefs.some((item) => item.reference === "Psalm 119:105"),
  "expected paired reading to appear in cross references"
);
assert.ok(
  crossrefs.some((item) => item.reference === "Psalm 19:1"),
  "expected active pentacle psalms to appear in cross references"
);
assert.ok(
  !crossrefs.some((item) => item.reference === "Proverbs 18:21"),
  "expected current anchor not to be duplicated in cross references"
);

const practicePlan = buildPracticePlan(
  study,
  paired,
  {
    name: "Pentacle of Sun #1",
    purpose: "Visibility and order",
    virtue: "Justice",
  }
);
assert.match(practicePlan.practice, /mind/i, "expected practice plan to include domain");
assert.match(practicePlan.practice, /prudence/i, "expected practice plan to include virtue");
assert.match(practicePlan.carryPrompt, /Psalm 119:105/, "expected carry prompt to include the paired reading");

const parsed = parseScriptureReference("Psalm 119:105");
assert.equal(parsed.book, "Psalm");
assert.equal(parsed.chapter, 119);
assert.equal(parsed.verseSpec, "105");

console.log("scripture study helper tests: PASS");
