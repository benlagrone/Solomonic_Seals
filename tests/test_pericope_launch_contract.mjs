import assert from "node:assert/strict";

import {
  CLOCK_PERICOPE_SOURCE,
  buildClockPericopeLaunchUrl,
  parseClockPericopeLaunchUrl,
} from "../web/pericope_launch_contract.js";

const launchContext = {
  as_of: "2026-06-19T13:00:00-05:00",
  timezone: "America/Chicago",
  mode: "guided",
  daily_guidance: {
    day: "Friday (Venus)",
    tone: "Harmony, creativity, and relationship work are favored.",
    activities: [
      "Repair social friction with diplomacy.",
      "Make time for art or design.",
      "Strengthen key partnerships.",
    ],
  },
  weekly_arc: {
    focus: "Negotiation success",
    wisdom_ref: "Proverbs 15:1",
  },
  daily_profile: {
    focus: "Negotiation success",
    life_domain_focus: "Mind",
    weakest_domain: "Contemplation",
  },
  why_selected: {
    reasons: [
      "Friday is ruled by Venus, so Venus-aligned intentions are prioritized.",
    ],
  },
  content_bundle: {
    wisdom: {
      ref: "Proverbs 15:1",
      text: "A soft answer turneth away wrath: but grievous words stir up anger.",
    },
  },
};

const userFacingPrompt = "Where should I begin if I need to repair social friction with diplomacy today?";
const launchUrl = buildClockPericopeLaunchUrl({
  baseUrl: "https://pericopeai.com/chat",
  mode: "guided",
  message: userFacingPrompt,
  promptId: "practice-mind-venus",
  clockContext: launchContext,
});

const parsedUrl = new URL(launchUrl);
assert.equal(parsedUrl.pathname, "/chat", "launch should target Pericope chat");
assert.equal(parsedUrl.searchParams.get("mode"), "guided", "launch should preserve guided mode");
assert.equal(parsedUrl.searchParams.get("source"), CLOCK_PERICOPE_SOURCE, "launch should identify the clock as source");
assert.equal(parsedUrl.searchParams.get("message"), userFacingPrompt, "message should be the only user-facing prompt");
assert.equal(parsedUrl.searchParams.get("prompt_id"), "practice-mind-venus", "launch should preserve prompt_id");
assert.ok(parsedUrl.searchParams.get("ctx"), "launch should attach encoded clock context");

const parsedLaunch = parseClockPericopeLaunchUrl(launchUrl);
assert.equal(parsedLaunch.message, userFacingPrompt, "parsed message should remain the selected prompt");
assert.deepEqual(parsedLaunch.clockContext, launchContext, "ctx should round-trip as structured clock metadata");
assert.equal(
  parsedLaunch.clockContext.daily_guidance.tone,
  "Harmony, creativity, and relationship work are favored.",
  "daily guidance tone belongs inside ctx metadata"
);
assert.equal(
  parsedLaunch.message.includes(parsedLaunch.clockContext.daily_guidance.tone),
  false,
  "daily guidance tone must not be flattened into the user-facing message"
);
assert.equal(
  parsedLaunch.message.includes("Launch context"),
  false,
  "launch URL should not put a launch-context label into the main prompt"
);
assert.equal(
  parsedLaunch.message.includes("Clock context is attached"),
  false,
  "launch URL should not put clock-context attachment copy into the main prompt"
);

console.log("pericope launch contract tests: PASS");
