import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.join(__dirname, "..");

const html = fs.readFileSync(path.join(repoRoot, "web", "clock_visualizer.html"), "utf8");
const js = fs.readFileSync(path.join(repoRoot, "web", "clock.js"), "utf8");

function assertIncludes(source, needle, message) {
  assert.ok(source.includes(needle), message || `expected source to include ${needle}`);
}

assertIncludes(js, 'const VIBEVOICE_HEALTH_API_ENDPOINT = "/api/vibevoice/health";', "Speak diagnostics should expose the VibeVoice health endpoint");
assertIncludes(js, "function formatVibeVoiceEngineLabel", "Speak playback should format VibeVoice engine labels");
assertIncludes(js, "function buildVibeVoiceAudioResult", "Speak playback should preserve VibeVoice job metadata");
assertIncludes(js, "Playing ${display.reference} via ${audioResult.engineLabel}.", "Scripture reader should disclose the engine used for Speak playback");
assertIncludes(js, "Finished reading ${display.reference} via ${audioResult.engineLabel}.", "Scripture reader should disclose the engine used after playback");
assertIncludes(js, "Generated ${kind} speech via ${audioResult.engineLabel}.", "Bundle Speak should disclose the engine used");
assertIncludes(js, "function speakDrawerMeditation", "Drawer Speak should read the active drawer tab as a meditation");
assertIncludes(html, "20260621-illumination1", "clock asset version should bust cached JS for drawer meditation Speak");

console.log("vibevoice frontend contract tests: PASS");
