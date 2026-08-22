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
assertIncludes(js, "const billingAuthHeaders = access?.mode === \"user\" ? access.headers : {};", "Paid voice generation should send authenticated account headers");
assertIncludes(js, 'const BILLING_CHECKOUT_API_ENDPOINT = "/api/billing/checkout";', "Account UI should create same-origin Checkout Sessions");
assertIncludes(js, "function refreshBillingAccount", "Account UI should refresh webhook-backed entitlements");
assertIncludes(js, "function openBillingPortal", "Paid accounts should use Stripe Customer Portal");
assertIncludes(js, "free_voice_remaining_today", "Free accounts should see their remaining daily generated voice allowance");
assertIncludes(js, "createPayload?.billing", "Successful voice jobs should immediately update the displayed free allowance");
assertIncludes(js, "The complete clock is free. Sign in for three generated voice requests each day.", "Guest runtime state should preserve the usable free-tier message");
assertIncludes(html, "truevineos_starter_monthly", "The billing UI should offer the stable Starter lookup key");
assertIncludes(html, "complete clock is free", "The account UI should clearly present a usable free tier");
assertIncludes(html, "billing-manage", "The billing UI should expose subscription management");
assertIncludes(js, "Playing ${display.reference} via ${audioResult.engineLabel}.", "Scripture reader should disclose the engine used for Speak playback");
assertIncludes(js, "Finished reading ${display.reference} via ${audioResult.engineLabel}.", "Scripture reader should disclose the engine used after playback");
assertIncludes(js, "Generated ${kind} speech via ${audioResult.engineLabel}.", "Bundle Speak should disclose the engine used");
assertIncludes(js, "function speakDrawerMeditation", "Drawer Speak should read the active drawer tab as a meditation");
assertIncludes(html, "20260813-profile-pending1", "clock asset version should bust cached JS for Personal Time Profile pending action state");

console.log("vibevoice frontend contract tests: PASS");
