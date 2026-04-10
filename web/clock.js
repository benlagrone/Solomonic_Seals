/* global d3 */
"use strict";

const WIDTH = 800;
const HEIGHT = 800;
const CENTER = { x: WIDTH / 2, y: HEIGHT / 2 };
const RING_THICKNESS = {
  core: 90,
  celestial: 70,
  planetary: 70,
  spirit: 70,
};

const MS_PER_DAY = 86_400_000;
const PROVIDENCE_MAP_MAX_DAYS = 42;
const PROVIDENCE_MAP_MAX_ENTRIES = 48;
const PROVIDENCE_MAP_MIN_CONTEXT_ENTRIES = 7;
const HISTORY_RULER_COLORS = {
  Sun: "#facc15",
  Moon: "#cbd5f5",
  Mars: "#ef4444",
  Mercury: "#f59e0b",
  Jupiter: "#60a5fa",
  Venus: "#34d399",
  Saturn: "#a78bfa",
};

const clockWrapper = d3.select(".clock-wrapper");
const tooltip = (() => {
  const existing = clockWrapper.select(".tooltip");
  return existing.empty()
    ? clockWrapper.append("div").attr("class", "tooltip")
    : existing;
})();

const svg = d3
  .select("#clock")
  .attr("width", WIDTH)
  .attr("height", HEIGHT);

const sealDefs = svg.append("defs").attr("class", "seal-sprite-defs");

const rootGroup = svg
  .append("g")
  .attr("class", "root")
  .attr("transform", `translate(${CENTER.x}, ${CENTER.y})`);

const ringGroups = {
  core: rootGroup.append("g").attr("class", "ring-core"),
  celestial: rootGroup.append("g").attr("class", "ring-celestial"),
  planetary: rootGroup.append("g").attr("class", "ring-planetary"),
  spirit: rootGroup.append("g").attr("class", "ring-spirit"),
};
const lifeWheelGroup = rootGroup
  .insert("g", ".ring-planetary")
  .attr("class", "life-wheel-overlay");
const planetarySealGlyphGroup = ringGroups.planetary
  .append("g")
  .attr("class", "planetary-seal-glyphs");
const activeSealFocusGroup = ringGroups.core
  .append("g")
  .attr("class", "active-seal-focus");
const scriptureOverlayGroup = rootGroup
  .append("g")
  .attr("class", "scripture-overlay");
const ritualOverlayGroup = rootGroup
  .append("g")
  .attr("class", "ritual-overlay");
const esotericOverlayGroup = rootGroup
  .append("g")
  .attr("class", "esoteric-overlay");
const historyPreviewGroup = rootGroup
  .append("g")
  .attr("class", "history-preview");
const lensFocusGroup = rootGroup
  .append("g")
  .attr("class", "lens-focus-overlay");
const lensAnnotationGroup = rootGroup
  .append("g")
  .attr("class", "lens-annotation-layer");
const centerModeGroup = rootGroup
  .append("g")
  .attr("class", "center-mode-control");

const centerGroup = rootGroup.append("g").attr("class", "center-label");
const centerDayLabel = centerGroup
  .append("text")
  .attr("class", "center-day")
  .attr("text-anchor", "middle")
  .attr("fill", "#f1f5f9")
  .attr("font-size", "26px")
  .attr("font-weight", "600")
  .attr("y", -12);

const centerTitleLabel = centerGroup
  .append("text")
  .attr("class", "center-title")
  .attr("text-anchor", "middle")
  .attr("fill", "#facc15")
  .attr("font-size", "18px")
  .attr("font-weight", "500")
  .attr("y", 18);

const centerSpiritLabel = centerGroup
  .append("text")
  .attr("class", "center-spirit")
  .attr("text-anchor", "middle")
  .attr("fill", "#cbd5f5")
  .attr("font-size", "16px")
  .attr("font-weight", "500")
  .attr("y", 48);

const centerPentacleLabel = centerGroup
  .append("text")
  .attr("class", "center-pentacle")
  .attr("text-anchor", "middle")
  .attr("fill", "#94a3b8")
  .attr("font-size", "14px")
  .attr("font-weight", "500")
  .attr("y", 72);

const drawerElements = {
  accountStatus: document.querySelector(".account-status"),
  accountSignIn: document.querySelector(".account-sign-in"),
  accountSignOut: document.querySelector(".account-sign-out"),
  headerTitle: document.querySelector(".drawer-header h2"),
  drawer: document.querySelector(".drawer"),
  drawerBody: document.querySelector(".drawer-body"),
  drawerToggle: document.querySelector(".drawer-toggle"),
  planet: document.querySelector(".psalm-planet"),
  focus: document.querySelector(".psalm-focus"),
  list: document.querySelector(".psalm-list"),
  subtitle: document.querySelector(".drawer-subtitle"),
  lensStatus: document.querySelector(".lens-status"),
  presentationButtons: Array.from(document.querySelectorAll(".presentation-button[data-presentation]")),
  presentationStatus: document.querySelector(".presentation-status"),
  lensButtons: Array.from(document.querySelectorAll(".lens-button[data-lens]")),
  sections: Array.from(document.querySelectorAll(".drawer-section[data-lenses]")),
  guidanceDay: document.querySelector(".guidance-day"),
  guidanceTone: document.querySelector(".guidance-tone"),
  guidanceList: document.querySelector(".guidance-list"),
  weeklyArcList: document.querySelector(".weekly-arc-list"),
  weeklyArcPrev: document.querySelector(".weekly-arc-prev"),
  weeklyArcNext: document.querySelector(".weekly-arc-next"),
  weeklyArcToday: document.querySelector(".weekly-arc-today"),
  historyWeeklyWindow: document.querySelector(".history-weekly-window"),
  historyWeeklyNarrative: document.querySelector(".history-weekly-narrative"),
  historyWeeklyMeta: document.querySelector(".history-weekly-meta"),
  historyPatternList: document.querySelector(".history-pattern-list"),
  historyReviewStatus: document.querySelector(".history-review-status"),
  historyReviewEncouragement: document.querySelector(".history-review-encouragement"),
  historyReviewWarning: document.querySelector(".history-review-warning"),
  historyReviewCarry: document.querySelector(".history-review-carry"),
  historyReviewScriptureRef: document.querySelector(".history-review-scripture-ref"),
  historyReviewScriptureText: document.querySelector(".history-review-scripture-text"),
  historyReviewNote: document.querySelector(".history-review-note"),
  historyReviewAccept: document.querySelector(".history-review-accept"),
  historyReviewRevise: document.querySelector(".history-review-revise"),
  historyReviewPericope: document.querySelector(".history-review-pericope"),
  historyCurrentDay: document.querySelector(".history-current-day"),
  historyCurrentSummary: document.querySelector(".history-current-summary"),
  historyCurrentMeta: document.querySelector(".history-current-meta"),
  historyCurrentReflection: document.querySelector(".history-current-reflection"),
  historyCurrentClosing: document.querySelector(".history-current-closing"),
  historyCurrentLaunches: document.querySelector(".history-current-launches"),
  historyCurrentLaunchesSummary: document.querySelector(".history-current-launches-summary"),
  historyCurrentLaunchActions: document.querySelector(".history-current-launch-actions"),
  historyCurrentResume: document.querySelector(".history-current-resume"),
  historyLogList: document.querySelector(".history-log-list"),
  providenceTimeline: document.querySelector(".providence-timeline"),
  providenceTimelineSummary: document.querySelector(".providence-timeline-summary"),
  providenceMapGuide: document.querySelector(".providence-map-guide"),
  providenceTimelineList: document.querySelector(".providence-timeline-list"),
  providencePrev: document.querySelector(".providence-prev"),
  providenceNext: document.querySelector(".providence-next"),
  providenceToday: document.querySelector(".providence-today"),
  profileDay: document.querySelector(".profile-day"),
  profilePentacle: document.querySelector(".profile-pentacle"),
  profileFocus: document.querySelector(".profile-focus"),
  profileCorrespondences: document.querySelector(".profile-correspondences"),
  profileColor: document.querySelector(".profile-color"),
  profileMetal: document.querySelector(".profile-metal"),
  profileAngel: document.querySelector(".profile-angel"),
  depthButtons: Array.from(document.querySelectorAll(".depth-button[data-depth]")),
  explainList: document.querySelector(".explain-list"),
  bundlePsalmRef: document.querySelector(".bundle-psalm-ref"),
  bundlePsalmText: document.querySelector(".bundle-psalm-text"),
  bundlePsalmExpand: document.querySelector(".bundle-psalm-expand"),
  bundlePsalmDiscuss: document.querySelector(".bundle-psalm-discuss"),
  bundleWisdomRef: document.querySelector(".bundle-wisdom-ref"),
  bundleWisdomText: document.querySelector(".bundle-wisdom-text"),
  bundleWisdomExpand: document.querySelector(".bundle-wisdom-expand"),
  bundleWisdomDiscuss: document.querySelector(".bundle-wisdom-discuss"),
  bundleSolomonicItem: document.querySelector(".bundle-item--solomonic"),
  bundleSolomonicRef: document.querySelector(".bundle-solomonic-ref"),
  bundleSolomonicText: document.querySelector(".bundle-solomonic-text"),
  bundleSolomonicExpand: document.querySelector(".bundle-solomonic-expand"),
  bundleSolomonicDiscuss: document.querySelector(".bundle-solomonic-discuss"),
  surfaceLensLabel: document.querySelector(".surface-lens-label"),
  surfaceLensTitle: document.querySelector(".surface-lens-title"),
  surfaceLensBody: document.querySelector(".surface-lens-body"),
  surfaceRule: document.querySelector(".surface-rule"),
  surfaceRuleVirtue: document.querySelector(".surface-rule-virtue"),
  surfaceRuleDomain: document.querySelector(".surface-rule-domain"),
  surfaceRuleMorning: document.querySelector(".surface-rule-morning"),
  surfaceRuleMidday: document.querySelector(".surface-rule-midday"),
  surfaceRuleEvening: document.querySelector(".surface-rule-evening"),
  surfaceRuleScripture: document.querySelector(".surface-rule-scripture"),
  surfaceRuleScriptureRef: document.querySelector(".surface-rule-scripture-ref"),
  surfaceRuleScriptureText: document.querySelector(".surface-rule-scripture-text"),
  ruleSection: document.querySelector(".rule-of-life"),
  ruleVirtue: document.querySelector(".rule-virtue"),
  ruleDomain: document.querySelector(".rule-domain"),
  ruleMorning: document.querySelector(".rule-morning"),
  ruleMidday: document.querySelector(".rule-midday"),
  ruleEvening: document.querySelector(".rule-evening"),
  ruleScripture: document.querySelector(".rule-scripture"),
  ruleScriptureRef: document.querySelector(".rule-scripture-ref"),
  ruleScriptureText: document.querySelector(".rule-scripture-text"),
  dailyOpeningOverlay: document.querySelector(".daily-opening-overlay"),
  dailyOpeningDay: document.querySelector(".daily-opening-day"),
  dailyOpeningFocus: document.querySelector(".daily-opening-focus"),
  dailyOpeningSummary: document.querySelector(".daily-opening-summary"),
  dailyOpeningAnchorRef: document.querySelector(".daily-opening-anchor-ref"),
  dailyOpeningAnchorText: document.querySelector(".daily-opening-anchor-text"),
  dailyOpeningAnchorToggle: document.querySelector(".daily-opening-anchor-toggle"),
  dailyOpeningIntent: document.querySelector(".daily-opening-intention"),
  dailyOpeningSuggested: document.querySelector(".daily-opening-suggested"),
  dailyOpeningSkip: document.querySelector(".daily-opening-skip"),
  dailyOpeningBegin: document.querySelector(".daily-opening-begin"),
  actionDailyOpening: document.querySelector(".action-daily-opening"),
  actionAdopt: document.querySelector(".action-adopt"),
  actionComplete: document.querySelector(".action-complete"),
  actionReflect: document.querySelector(".action-reflect"),
  actionCloseDay: document.querySelector(".action-close-day"),
  actionPericopeGuided: document.querySelector(".action-pericope-guided"),
  actionPericopeFreeform: document.querySelector(".action-pericope-freeform"),
  actionCopy: document.querySelector(".action-copy"),
  actionStatus: document.querySelector(".action-loop-status"),
  reflectionSection: document.querySelector(".reflection-capture"),
  reflectionInput: document.querySelector(".reflection-input"),
  reflectionSave: document.querySelector(".reflection-save"),
  reflectionClear: document.querySelector(".reflection-clear"),
  closingSection: document.querySelector(".closing-capture"),
  closingSummaryInput: document.querySelector(".closing-summary-input"),
  closingGratitudeInput: document.querySelector("#closing-gratitude-input"),
  closingDifficultyInput: document.querySelector("#closing-difficulty-input"),
  closingCarryInput: document.querySelector("#closing-carry-input"),
  closingSave: document.querySelector(".closing-save"),
  closingClear: document.querySelector(".closing-clear"),
};
let lastPsalmKey = null;
let lastGuidanceKey = null;
let lastWeeklyArcKey = null;
let lastProfileKey = null;
let lastExplainabilityKey = null;
let lastBundleKey = null;
let lastActiveSealFocusKey = null;
let lastPlanetaryRingPresentationKey = null;
let lastLifeWheelKey = null;
let lastRuleOfLifeKey = null;
let lastHistoryPanelKey = null;
let lastHistoryWeeklyKey = null;
let lastHistoryReviewKey = null;
let lastProvidenceTimelineKey = null;
let lastProvidenceMapKey = null;
let currentPsalmRequestId = 0;
let currentBundleRequestId = 0;
let currentRulePsalmRequestId = 0;
let currentDailyOpeningPsalmRequestId = 0;
let readingDepth = "medium";
let hoveredPlanetaryKey = null;
let selectedDayOffset = 0;
let baseDrawerSubtitleText = "Live mapping for the active planetary pentacle.";
let currentActionLoopContext = null;
let actionNotice = null;
let modeBeforeHistoryLens = null;
let historyLensOwnsMode = false;
const DAILY_ACTION_STORAGE_KEY = "truevineos-daily-actions-v1";
const DAILY_OPENING_DISMISSED_STORAGE_KEY = "truevineos-daily-opening-dismissed-v1";
const HISTORY_SYNC_API_PATH = "/api/history/sync";
const PERICOPE_HISTORY_SESSIONS_API_PATH = "/api/pericope/history-sessions";
const HISTORY_CLIENT_ID_STORAGE_KEY = "truevineos-history-client-id";
const HISTORY_CLIENT_KEY_STORAGE_KEY = "truevineos-history-client-key";
const HISTORY_CLIENT_HEADER = "X-TrueVine-History-Client";
const HISTORY_KEY_HEADER = "X-TrueVine-History-Key";
const DEV_AUTH_SUB_HEADER = "X-Dev-Auth-Sub";
const DEV_AUTH_NAME_HEADER = "X-Dev-Auth-Name";
const MAX_DAILY_ACTION_LAUNCHES = 12;
let dailyActionStateCache = null;
let historySyncIdentity = null;
let historySyncReady = false;
let historySyncInFlight = null;
let historySyncPendingTimer = null;
let historySyncLastSerializedState = "";
let historySyncNeedsFlush = false;
let historySyncScopeKey = "";
let pericopeSessionSyncTimer = null;
let pericopeSessionSyncInFlight = null;
let pericopeSessionSyncQueued = false;
let lastPericopeSessionSyncSignature = "";
let dailyOpeningAutofillKey = null;
let historyReviewAutofillKey = null;
let dailyOpeningAnchorExpanded = false;
let lastDailyOpeningAnchorKey = null;
let lastDailyOpeningDateKey = null;
let dailyOpeningSuggestionOffset = 0;
let currentWeeklyReviewContext = null;
const authDataset = typeof document !== "undefined" ? (document.body?.dataset || {}) : {};
const CLOCK_AUTH_URL = String(authDataset.authUrl || "https://auth.pericopeai.com").trim();
const CLOCK_AUTH_REALM = String(authDataset.authRealm || "pericope").trim();
const CLOCK_AUTH_CLIENT_ID = String(authDataset.authClientId || "pericope-web").trim();
const CLOCK_AUTH_BRIDGE_URL = String(
  authDataset.authBridgeUrl || "https://pericopeai.com/clock-auth-bridge.html"
).trim();
const CLOCK_AUTH_DISABLED = String(authDataset.authDisabled || "").trim().toLowerCase() === "true";
const CLOCK_DEV_FAKE_AUTH_ENABLED = String(authDataset.authDevFake || "").trim().toLowerCase() === "true";
const CLOCK_DEV_AUTH_SUB_PARAM = "clock_dev_auth_sub";
const CLOCK_DEV_AUTH_NAME_PARAM = "clock_dev_auth_name";
const CLOCK_AUTH_FORCE_BRIDGE_PARAM = "clock_auth_bridge";
const CLOCK_AUTH_BRIDGE_STORAGE_KEY = "truevineos-auth-bridge-v1";
const CLOCK_AUTH_BRIDGE_MESSAGE_SOURCE = "pericope-clock-auth";
let clockKeycloak = null;
let clockAuthReady = false;
let clockAuthRefreshTimer = null;
let clockAuthPopup = null;
let clockBridgeListenerInstalled = false;
let clockAuthState = {
  mode: "guest",
  authenticated: false,
  token: null,
  profile: null,
  devFake: false,
  bridge: false,
  error: "",
};
const uiState = {
  presentationMode: "guidance",
  lens: "base",
  mode: "guidance",
  focusedRing: null,
  drawerOpen: false,
  reflectionOpen: false,
  closingOpen: false,
  dailyOpeningOpen: false,
};
const psalmTextCache = new Map();
const psalmTextMetaCache = new Map();
const bundleExpansionCache = new Map();
const bundleExpansionState = {
  psalm: null,
  wisdom: null,
  solomonic: null,
};
const bundledPsalmMap = new Map();
const PSALM_API_ENDPOINT = "/api/psalm";
const BOOK_PARTIAL_API_ENDPOINT = "/api/pericope/book-partial";
const ENABLE_REMOTE_SCRIPTURE_FETCH = true;
const RULE_OF_LIFE_LIBRARY = {
  mind: {
    morning: "Read one demanding paragraph before messages or feeds.",
    midday: "Slow one decision until the terms are actually clear.",
    evening: "Write one sentence about what became clearer today.",
    repair: "Return to the question you avoided and name it plainly.",
  },
  body: {
    morning: "Begin with one deliberate act of physical order or movement.",
    midday: "Pause long enough to reset your pace, posture, and breath.",
    evening: "End the day with one act that restores strength rather than drains it.",
    repair: "Choose steadiness over excess in the next physical decision.",
  },
  relationships: {
    morning: "Send one clarifying or reconciling message before noon.",
    midday: "Answer tension with a calm sentence instead of a quick reaction.",
    evening: "Review one conversation and name where love held or failed.",
    repair: "Repair one strained edge before resentment hardens.",
  },
  stewardship: {
    morning: "Name one obligation and one resource before you spend or promise.",
    midday: "Check one exchange for fairness rather than convenience.",
    evening: "Put one account, note, or obligation back into order.",
    repair: "Restore order where waste or drift has appeared.",
  },
  vocation: {
    morning: "Do the resisted task first while your will is still clean.",
    midday: "Finish one difficult piece of work before changing context.",
    evening: "Name whether your labor served purpose or only motion today.",
    repair: "Return to the work you postponed and move it one step forward.",
  },
  household: {
    morning: "Put one room, surface, or routine into visible order.",
    midday: "Keep one boundary or domestic promise instead of improvising around it.",
    evening: "Restore one area of the house before ending the day.",
    repair: "Rebuild one neglected routine before it becomes clutter.",
  },
  contemplation: {
    morning: "Keep ten quiet minutes before noise, news, or requests.",
    midday: "Step back long enough to recover inward attention.",
    evening: "Close the day with one honest note, prayer, or silence.",
    repair: "Return to silence where distraction has ruled the day.",
  },
};
const RULE_OF_LIFE_DAY_TONES = {
  Sun: "with purpose",
  Moon: "with attention",
  Mars: "with courage",
  Mercury: "with clarity",
  Jupiter: "with breadth",
  Venus: "with gentleness",
  Saturn: "with discipline",
};
const DAILY_OPENING_SUMMARY_TEMPLATES = [
  "{ruler} gives the day to {domain}. Carry it with {virtue}",
  "Receive {ruler} as a summons to {virtue} in {domain}",
  "The weight of the day falls on {domain}. Let {virtue} keep it rightly ordered",
  "{ruler} presses toward {domain} today. {virtue} is the right way to bear it",
  "Take this {ruler} day as a call to {virtue} in {domain}",
  "{ruler} favors {domain} today, but only if it is carried with {virtue}",
];
const DAILY_OPENING_FOCUS_CLAUSES = [
  "Keep {focus} near the next decision",
  "Let {focus} shape the first hard turn",
  "Use {focus} as the day’s practical edge",
  "Make {focus} concrete before noon",
  "Let {focus} govern one real choice early",
];
const DAILY_OPENING_REPAIR_CLAUSES = [
  "Leave room to repair {weakest} before night",
  "Do not let {weakest} go unattended by the close",
  "Before the day shuts, return attention to {weakest}",
  "If the day scatters, come back to {weakest} before evening",
];
const DAILY_OPENING_INTENTION_TEMPLATES = [
  "Today I will practice {virtue} in {domain}: {morning}",
  "Today I will begin {domain} with {virtue}: {morning}",
  "Today I will answer {ruler} with {virtue} in {domain}: {morning}",
  "Today I will keep {virtue} near {domain}: {morning}",
  "Today I will take one concrete step in {domain} with {virtue}: {morning}",
  "Today I will let {focus} shape {domain}: {morning}",
];
const DAILY_OPENING_INTENTION_CLOSES = [
  "I will begin before hesitation gathers.",
  "I will start while the day is still clear.",
  "I will go early rather than late.",
  "I will begin with steadiness instead of pressure.",
  "I will take the first step before the day fragments.",
];
const READING_DEPTHS = new Set(["short", "medium", "long"]);
const PRESENTATION_DEFINITIONS = {
  guidance: {
    title: "Guidance First",
    status: "Guidance-first keeps Scripture, practice, and life-balance primary. Historical symbol layers stay off until you ask for them.",
    allowEsotericLens: false,
    showHistoricalSymbols: false,
    showTalismans: false,
  },
  historical_symbols: {
    title: "Historical Symbols",
    status: "Historical symbol study is available, but Scripture, practice, and readable guidance remain primary.",
    allowEsotericLens: true,
    showHistoricalSymbols: true,
    showTalismans: false,
  },
  talismans: {
    title: "Talismans",
    status: "Full talisman rendering is now explicit and opt-in. Guidance remains the primary way to read the day.",
    allowEsotericLens: true,
    showHistoricalSymbols: true,
    showTalismans: true,
  },
};
const AVAILABLE_PRESENTATIONS = new Set(Object.keys(PRESENTATION_DEFINITIONS));
const LENS_DEFINITIONS = {
  base: {
    title: "Daily Guidance",
    subtitle: () => getBaseDrawerSubtitleText(),
    status: () => "Base lens keeps the clock primary and surfaces current guidance, life-balance state, and clear next action.",
    focusRing: null,
  },
  scripture: {
    title: "Scripture Lens",
    subtitle: () => `${getBaseDrawerSubtitleText()} Reading depth, verse mappings, and provenance are foregrounded.`,
    status: "See today's psalm, wisdom anchor, and selection notes.",
    focusRing: "core",
    focusLabel: "Scripture Anchor",
    focusColor: "#facc15",
  },
  ritual: {
    title: "Ritual Lens",
    subtitle: () => "Planetary day, weekly arc, timing cues, and practical devotional use are foregrounded.",
    status: "Ritual lens emphasizes timing, focus, and the day’s practical devotional posture.",
    focusRing: "planetary",
    focusLabel: "Timing Ring",
    focusColor: "#60a5fa",
  },
  esoteric: {
    title: "Esoteric Lens",
    subtitle: () => "Pentacle correspondences, symbolic profile, and hidden structural logic are foregrounded.",
    status: () => "Esoteric lens is an explicit opt-in for historical-symbol study and does not replace the guidance-first reading.",
    focusRing: "spirit",
    focusLabel: "Correspondence Ring",
    focusColor: "#c4b5fd",
  },
  history: {
    title: "History Lens",
    subtitle: () => "Timeline mode is foregrounded here. Saved practice, completion, reflection, and launch states are shown on the outer arc.",
    status: "History lens shifts attention toward temporal continuity and lets you revisit recorded days instead of only reading the weekly arc.",
    focusRing: "history",
    focusLabel: "History Arc",
    focusColor: "#4ade80",
  },
};
const AVAILABLE_LENSES = new Set(Object.keys(LENS_DEFINITIONS));
const MODE_DEFINITIONS = {
  guidance: {
    title: "Guidance",
    shortLabel: "Guide",
    description: "Keep the current day, scripture anchor, and practical guidance centered.",
    focusRing: null,
    accentColor: "#facc15",
  },
  practice: {
    title: "Practice",
    shortLabel: "Do",
    description: "Surface the current life-domain action and make the wheel primary.",
    focusRing: "life",
    accentColor: "#34d399",
  },
  reflection: {
    title: "Reflection",
    shortLabel: "Reflect",
    description: "Turn the center toward examination and self-review.",
    focusRing: "core",
    accentColor: "#818cf8",
  },
  mentor: {
    title: "Mentor",
    shortLabel: "Mentor",
    description: "Render the center through a wisdom voice anchored to today’s ruler.",
    focusRing: "core",
    accentColor: "#c4b5fd",
  },
  forecast: {
    title: "Forecast",
    shortLabel: "Next",
    description: "Preview the next hour and tomorrow’s dominant movement.",
    focusRing: "planetary",
    accentColor: "#60a5fa",
  },
  timeline: {
    title: "Timeline",
    shortLabel: "Past",
    description: "Pull recent and upcoming arc markers around the outer band.",
    focusRing: "history",
    accentColor: "#4ade80",
  },
};
const AVAILABLE_MODES = new Set(Object.keys(MODE_DEFINITIONS));
const CHALDEAN_ORDER = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"];
const SEAL_SPRITE_SIZE = 100;
const SEAL_SPRITE_CENTER = SEAL_SPRITE_SIZE / 2;
const PLANETARY_DAY_GUIDANCE = {
  Sun: {
    tone: "Visibility, confidence, and leadership work are favored.",
    activities: ["Present your work publicly.", "Make decisions that set direction.", "Focus on vitality and renewal."],
  },
  Moon: {
    tone: "Reflection, receptivity, and home-centered work are favored.",
    activities: ["Journal dreams and emotional patterns.", "Cleanse your space and routines.", "Prioritize family and restoration."],
  },
  Mars: {
    tone: "Bold action, protection, and difficult tasks are favored.",
    activities: ["Handle conflict directly and clearly.", "Do hard tasks first.", "Set and defend boundaries."],
  },
  Mercury: {
    tone: "Communication, study, and planning are favored.",
    activities: ["Write, research, and organize ideas.", "Schedule key conversations.", "Review contracts and details."],
  },
  Jupiter: {
    tone: "Growth, opportunity, and wise leadership are favored.",
    activities: ["Plan expansion and long-range goals.", "Teach, mentor, or advise.", "Act on strategic opportunities."],
  },
  Venus: {
    tone: "Harmony, creativity, and relationship work are favored.",
    activities: ["Repair social friction with diplomacy.", "Make time for art or design.", "Strengthen key partnerships."],
  },
  Saturn: {
    tone: "Discipline, structure, and enduring work are favored.",
    activities: ["Set limits and simplify commitments.", "Complete long-term maintenance work.", "Focus on serious, patient progress."],
  },
};
const PLANETARY_CORRESPONDENCES = {
  Sun: {
    color: "Gold",
    metal: "Gold",
    angel: "Michael",
  },
  Moon: {
    color: "Silver",
    metal: "Silver",
    angel: "Gabriel",
  },
  Mars: {
    color: "Scarlet",
    metal: "Iron",
    angel: "Camael",
  },
  Mercury: {
    color: "Yellow",
    metal: "Quicksilver",
    angel: "Raphael",
  },
  Jupiter: {
    color: "Royal Blue",
    metal: "Tin",
    angel: "Sachiel",
  },
  Venus: {
    color: "Emerald",
    metal: "Copper",
    angel: "Anael",
  },
  Saturn: {
    color: "Black",
    metal: "Lead",
    angel: "Cassiel",
  },
};
const WISDOM_CONTENT_BY_RULER = {
  Sun: {
    ref: "Proverbs 4:18",
    text: "The path of the just is as the shining light, that shineth more and more unto the perfect day.",
  },
  Moon: {
    ref: "Ecclesiastes 3:1",
    text: "To every thing there is a season, and a time to every purpose under the heaven.",
  },
  Mars: {
    ref: "Proverbs 24:10",
    text: "If thou faint in the day of adversity, thy strength is small.",
  },
  Mercury: {
    ref: "Proverbs 18:21",
    text: "Death and life are in the power of the tongue.",
  },
  Jupiter: {
    ref: "Proverbs 11:25",
    text: "The liberal soul shall be made fat: and he that watereth shall be watered also himself.",
  },
  Venus: {
    ref: "Proverbs 15:1",
    text: "A soft answer turneth away wrath: but grievous words stir up anger.",
  },
  Saturn: {
    ref: "Proverbs 25:28",
    text: "He that hath no rule over his own spirit is like a city that is broken down, and without walls.",
  },
};
const FALLBACK_DAILY_PSALM_BY_RULER = {
  Sun: { chapter: 19, verse: 1 },
  Moon: { chapter: 63, verse: 6 },
  Mars: { chapter: 144, verse: 1 },
  Mercury: { chapter: 119, verse: 105 },
  Jupiter: { chapter: 112, verse: 3 },
  Venus: { chapter: 45, verse: 2 },
  Saturn: { chapter: 90, verse: 12 },
};
const LIFE_DOMAIN_FOCUS_KEYWORDS = [
  { pattern: /\b(study|learn|understand|message|speech|word|reason|clarity|think|mind)\b/i, domain: "mind" },
  { pattern: /\b(body|health|sleep|rest|strength|travel|journey|road|movement|discipline)\b/i, domain: "body" },
  { pattern: /\b(relationship|repair|peace|conflict|anger|friend|partner|love|reconcile)\b/i, domain: "relationships" },
  { pattern: /\b(money|wealth|trade|resource|budget|steward|provision|prosper)\b/i, domain: "stewardship" },
  { pattern: /\b(work|task|career|labor|courage|purpose|calling|vocation|lead)\b/i, domain: "vocation" },
  { pattern: /\b(home|house|household|order|routine|maintenance|boundary)\b/i, domain: "household" },
  { pattern: /\b(prayer|silence|reflect|contemplate|faith|spirit|mercy|devotion)\b/i, domain: "contemplation" },
];

function getLensDefinition(lens) {
  return LENS_DEFINITIONS[lens] || LENS_DEFINITIONS.base;
}

function getModeDefinition(mode) {
  return MODE_DEFINITIONS[mode] || MODE_DEFINITIONS.guidance;
}

function getPresentationDefinition(mode) {
  return PRESENTATION_DEFINITIONS[mode] || PRESENTATION_DEFINITIONS.guidance;
}

function getBaseDrawerSubtitleText() {
  if (uiState.presentationMode === "talismans") {
    return baseDrawerSubtitleText;
  }
  if (uiState.presentationMode === "historical_symbols") {
    return "Today's scripture, guidance, and historical-symbol context are available here.";
  }
  return "Today's scripture, guidance, and practice details are foregrounded here.";
}

function applyPresentationState() {
  const presentationDefinition = getPresentationDefinition(uiState.presentationMode);
  document.body.dataset.presentation = uiState.presentationMode;
  svg.attr("data-presentation", uiState.presentationMode);

  drawerElements.presentationButtons.forEach((button) => {
    const buttonPresentation = String(button.dataset.presentation || "").toLowerCase();
    const isActive = buttonPresentation === uiState.presentationMode;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  if (drawerElements.presentationStatus) {
    drawerElements.presentationStatus.textContent = presentationDefinition.status;
  }

  drawerElements.lensButtons.forEach((button) => {
    const buttonLens = String(button.dataset.lens || "").toLowerCase();
    const shouldHide = buttonLens === "esoteric" && !presentationDefinition.allowEsotericLens;
    button.hidden = shouldHide;
  });
}

function applyLensState() {
  const lensDefinition = getLensDefinition(uiState.lens);
  const modeDefinition = getModeDefinition(uiState.mode);
  uiState.focusedRing = modeDefinition.focusRing || lensDefinition.focusRing || null;
  document.body.dataset.lens = uiState.lens;
  document.body.dataset.mode = uiState.mode;
  svg.attr("data-lens", uiState.lens);
  svg.attr("data-mode", uiState.mode);
  applyPresentationState();

  drawerElements.lensButtons.forEach((button) => {
    const buttonLens = String(button.dataset.lens || "").toLowerCase();
    const isActive = buttonLens === uiState.lens;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  if (drawerElements.headerTitle) {
    drawerElements.headerTitle.textContent = lensDefinition.title;
  }

  if (drawerElements.subtitle) {
    drawerElements.subtitle.textContent = lensDefinition.subtitle();
  }

  if (drawerElements.lensStatus) {
    drawerElements.lensStatus.textContent = typeof lensDefinition.status === "function"
      ? lensDefinition.status()
      : lensDefinition.status;
  }

  drawerElements.sections.forEach((section) => {
    const supportedLenses = String(section.dataset.lenses || "")
      .split(/\s+/)
      .filter(Boolean);
    const isVisible = !supportedLenses.length || supportedLenses.includes(uiState.lens);
    section.hidden = !isVisible;
    section.classList.toggle("is-hidden", !isVisible);
  });
}

function setMode(nextMode) {
  const normalizedMode = String(nextMode || "").toLowerCase();
  if (!AVAILABLE_MODES.has(normalizedMode) || normalizedMode === uiState.mode) {
    return;
  }
  uiState.mode = normalizedMode;
  if (uiState.lens === "history") {
    historyLensOwnsMode = normalizedMode === "timeline";
  }
  if (normalizedMode === "reflection") {
    uiState.reflectionOpen = true;
  }
  applyLensState();
}

function applyDrawerState() {
  if (!drawerElements.drawer || !drawerElements.drawerBody || !drawerElements.drawerToggle) {
    return;
  }

  drawerElements.drawer.classList.toggle("is-collapsed", !uiState.drawerOpen);
  drawerElements.drawerBody.hidden = !uiState.drawerOpen;
  drawerElements.drawerToggle.setAttribute("aria-expanded", uiState.drawerOpen ? "true" : "false");
  drawerElements.drawerToggle.textContent = uiState.drawerOpen ? "Hide Details" : "Show Details";
}

function setLens(nextLens) {
  const normalizedLens = String(nextLens || "").toLowerCase();
  if (!AVAILABLE_LENSES.has(normalizedLens)) {
    return;
  }
  if (normalizedLens === uiState.lens) {
    if (normalizedLens === "history" && uiState.mode !== "timeline") {
      modeBeforeHistoryLens = uiState.mode;
      uiState.mode = "timeline";
      historyLensOwnsMode = true;
      applyLensState();
    }
    return;
  }

  const previousLens = uiState.lens;
  if (normalizedLens === "history") {
    if (previousLens !== "history" && uiState.mode !== "timeline") {
      modeBeforeHistoryLens = uiState.mode;
      historyLensOwnsMode = true;
    } else {
      modeBeforeHistoryLens = null;
      historyLensOwnsMode = false;
    }
    uiState.mode = "timeline";
  } else if (previousLens === "history") {
    if (historyLensOwnsMode && uiState.mode === "timeline" && modeBeforeHistoryLens) {
      uiState.mode = modeBeforeHistoryLens;
    }
    modeBeforeHistoryLens = null;
    historyLensOwnsMode = false;
  }

  uiState.lens = normalizedLens;
  applyLensState();
}

function setPresentationMode(nextMode) {
  const normalizedMode = String(nextMode || "").toLowerCase();
  if (!AVAILABLE_PRESENTATIONS.has(normalizedMode) || normalizedMode === uiState.presentationMode) {
    return;
  }

  uiState.presentationMode = normalizedMode;
  const presentationDefinition = getPresentationDefinition(normalizedMode);
  if (!presentationDefinition.allowEsotericLens && uiState.lens === "esoteric") {
    uiState.lens = "base";
  }
  applyLensState();
}

function setDrawerOpen(nextValue) {
  const normalized = Boolean(nextValue);
  if (normalized === uiState.drawerOpen) {
    return;
  }
  uiState.drawerOpen = normalized;
  applyDrawerState();
}

function updateLensFocusOverlay(radii) {
  lensFocusGroup.selectAll("*").remove();

  if (!uiState.focusedRing) {
    return;
  }

  const lensDefinition = getLensDefinition(uiState.lens);
  const focusRadius = {
    core: radii.core - 6,
    celestial: radii.celestial - 6,
    life: radii.celestial - 36,
    planetary: radii.planetary - 6,
    spirit: radii.spirit - 6,
    history: getProvidenceMapOrbitRadii(radii).outer - 6,
  }[uiState.focusedRing];

  if (!focusRadius) {
    return;
  }

  const focusColor = lensDefinition.focusColor || "#facc15";
  const focusLabel = lensDefinition.focusLabel || "";
  const overlay = lensFocusGroup.append("g").attr("class", "lens-focus");

  overlay
    .append("circle")
    .attr("class", "lens-focus-circle")
    .attr("r", focusRadius)
    .attr("fill", "none")
    .attr("stroke", hexToRgba(focusColor, 0.75))
    .attr("stroke-width", 1.35)
    .attr("stroke-dasharray", "5 7");

  if (focusLabel) {
    overlay
      .append("text")
      .attr("class", "lens-focus-label")
      .attr("y", -focusRadius - 14)
      .attr("fill", hexToRgba(focusColor, 0.92))
      .attr("text-anchor", "middle")
      .text(focusLabel);
  }
}

function updateCenterModeControl(radii) {
  const modeEntries = [
    "guidance",
    "practice",
    "mentor",
    "forecast",
    "timeline",
    "reflection",
  ].map((modeKey, index) => ({
    modeKey,
    index,
    ...getModeDefinition(modeKey),
  }));

  const innerRadius = 92;
  const outerRadius = Math.min(radii.celestial - 4, 128);
  const step = (Math.PI * 2) / modeEntries.length;
  const startRotation = degreesToRadians(-120);
  const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius).cornerRadius(8).padAngle(0.03);

  const segmentData = modeEntries.map((entry, index) => {
    const startAngle = startRotation + index * step;
    const endAngle = startRotation + (index + 1) * step;
    const midAngle = (startAngle + endAngle) / 2;
    const labelPoint = polarPoint(0, 0, (innerRadius + outerRadius) / 2 + 1, midAngle);
    return {
      ...entry,
      startAngle,
      endAngle,
      midAngle,
      labelPoint,
      isActive: entry.modeKey === uiState.mode,
    };
  });

  const segments = centerModeGroup
    .selectAll("g.center-mode-segment")
    .data(segmentData, (entry) => entry.modeKey)
    .join((enter) => {
      const group = enter.append("g").attr("class", "center-mode-segment");
      group.append("path").attr("class", "center-mode-wedge");
      group.append("path").attr("class", "center-mode-hit");
      group.append("text").attr("class", "center-mode-label");
      return group;
    })
    .classed("is-active", (entry) => entry.isActive)
    .classed("is-inactive", (entry) => !entry.isActive);

  const hitArc = d3.arc().innerRadius(innerRadius - 10).outerRadius(outerRadius + 10).padAngle(0.02);

  segments
    .select("path.center-mode-hit")
    .attr("d", (entry) => hitArc(entry))
    .attr("fill", "rgba(15, 23, 42, 0.001)")
    .attr("stroke", "none")
    .attr("role", "button")
    .attr("tabindex", 0)
    .attr("aria-label", (entry) => `${entry.title}: ${entry.description}`);

  segments
    .select("path.center-mode-wedge")
    .attr("d", (entry) => arc(entry))
    .attr("fill", (entry) => hexToRgba(entry.accentColor, entry.isActive ? 0.22 : 0.08))
    .attr("stroke", (entry) => hexToRgba(entry.accentColor, entry.isActive ? 0.88 : 0.38))
    .attr("stroke-width", (entry) => (entry.isActive ? 1.6 : 1));

  segments
    .select("text.center-mode-label")
    .attr("transform", (entry) => {
      const angle = radiansToDegrees(entry.midAngle);
      const flip = angle > 90 || angle < -90 ? 180 : 0;
      return `translate(${entry.labelPoint.x}, ${entry.labelPoint.y}) rotate(${angle + 90 + flip})`;
    })
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("fill", (entry) => hexToRgba(entry.accentColor, entry.isActive ? 0.96 : 0.82))
    .text((entry) => entry.shortLabel);

  segments.style("cursor", "pointer");
  segments
    .select("path.center-mode-hit")
    .on("click", (_event, entry) => setMode(entry.modeKey))
    .on("keydown", (event, entry) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setMode(entry.modeKey);
      }
    });

  bindTooltip(segments.select("path.center-mode-hit"), (entry) => `${entry.title} • ${entry.description}`);
}

function setupPresentationControls() {
  if (!drawerElements.presentationButtons.length) {
    return;
  }

  drawerElements.presentationButtons.forEach((button) => {
    const mode = String(button.dataset.presentation || "").toLowerCase();
    if (!AVAILABLE_PRESENTATIONS.has(mode)) {
      return;
    }
    button.addEventListener("click", () => {
      setPresentationMode(mode);
    });
  });

  applyPresentationState();
}

function setupLensControls() {
  if (!drawerElements.lensButtons.length) {
    return;
  }

  drawerElements.lensButtons.forEach((button) => {
    const lens = String(button.dataset.lens || "").toLowerCase();
    if (!AVAILABLE_LENSES.has(lens)) {
      return;
    }
    button.addEventListener("click", () => {
      setLens(lens);
    });
  });

  applyLensState();
}

function setupDrawerToggle() {
  if (!drawerElements.drawerToggle) {
    return;
  }

  drawerElements.drawerToggle.addEventListener("click", () => {
    setDrawerOpen(!uiState.drawerOpen);
  });

  applyDrawerState();
}

function copyTextToClipboard(text) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  return Promise.reject(new Error("Clipboard API unavailable"));
}

function setActionNotice(text) {
  actionNotice = {
    text,
    expiresAt: Date.now() + 2400,
  };
}

function getPericopeChatBaseUrl() {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search || "");
    const queryOverride = params.get("pericope_chat_url");
    if (queryOverride) {
      return queryOverride;
    }
  }

  const explicitUrl = document.body?.dataset?.pericopeChatUrl;
  if (explicitUrl) {
    return explicitUrl;
  }

  if (typeof window !== "undefined") {
    const host = String(window.location.hostname || "").toLowerCase();
    if (host === "pericopeai.com" || host.endsWith(".pericopeai.com")) {
      return `${window.location.origin}/chat`;
    }
  }

  return "https://pericopeai.com/chat";
}

function getPericopeBaseUrl() {
  try {
    const url = new URL(getPericopeChatBaseUrl());
    return url.origin;
  } catch (_error) {
    return "https://pericopeai.com";
  }
}

function buildPericopeSessionResumeUrl(sessionId) {
  const cleanSessionId = String(sessionId || "").trim();
  if (!cleanSessionId) {
    return "";
  }
  const url = new URL(`${getPericopeBaseUrl()}/chat`);
  url.searchParams.set("session_id", cleanSessionId);
  return url.toString();
}

function base64UrlEncodeUtf8(text) {
  if (typeof window === "undefined" || typeof window.btoa !== "function") {
    return "";
  }

  const bytes = new TextEncoder().encode(String(text || ""));
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function toInlineSnippet(text, maxLength = 180) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) {
    return "";
  }
  if (clean.length <= maxLength) {
    return clean;
  }
  return `${clean.slice(0, maxLength - 1).trimEnd()}…`;
}

function normalizeComparableText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function buildDailyActionLaunchKey(launch) {
  return [
    String(launch?.launchedAt || "").trim(),
    String(launch?.mode || "").trim(),
    String(launch?.promptId || launch?.prompt_id || "").trim(),
  ].join("|");
}

function getLatestLinkedLaunch(launches) {
  if (!Array.isArray(launches) || !launches.length) {
    return null;
  }

  for (let index = launches.length - 1; index >= 0; index -= 1) {
    const launch = launches[index];
    if (launch?.sessionId && launch?.sessionUrl) {
      return launch;
    }
  }

  return null;
}

function pruneEmptyFields(value) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => pruneEmptyFields(entry))
      .filter((entry) => {
        if (entry === null || entry === undefined) {
          return false;
        }
        if (typeof entry === "string") {
          return Boolean(entry.trim());
        }
        if (Array.isArray(entry)) {
          return entry.length > 0;
        }
        if (typeof entry === "object") {
          return Object.keys(entry).length > 0;
        }
        return true;
      });
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, entry]) => [key, pruneEmptyFields(entry)])
        .filter(([, entry]) => {
          if (entry === null || entry === undefined) {
            return false;
          }
          if (typeof entry === "string") {
            return Boolean(entry.trim());
          }
          if (Array.isArray(entry)) {
            return entry.length > 0;
          }
          if (typeof entry === "object") {
            return Object.keys(entry).length > 0;
          }
          return true;
        })
    );
  }

  return value;
}

function getActionLoopReflectionText(context) {
  const draft = String(drawerElements.reflectionInput?.value || context?.entry?.reflection || "").trim();
  if (draft) {
    return draft;
  }

  const closingParts = [
    context?.entry?.closingSummary,
    context?.entry?.closingDifficulty,
    context?.entry?.closingCarryForward,
  ]
    .map((part) => String(part || "").trim())
    .filter(Boolean);

  return closingParts.join(" ");
}

function hydrateClosingInputs(context) {
  if (
    !drawerElements.closingSummaryInput ||
    !drawerElements.closingGratitudeInput ||
    !drawerElements.closingDifficultyInput ||
    !drawerElements.closingCarryInput
  ) {
    return;
  }

  const entry = context?.entry || {};
  drawerElements.closingSummaryInput.value = String(entry.closingSummary || "").trim();
  drawerElements.closingGratitudeInput.value = String(entry.closingGratitude || "").trim();
  drawerElements.closingDifficultyInput.value = String(entry.closingDifficulty || "").trim();
  drawerElements.closingCarryInput.value = String(entry.closingCarryForward || "").trim();
}

function shouldLaunchReflectionPrompt(context, reflectionText) {
  return Boolean(reflectionText) && (
    uiState.reflectionOpen ||
    uiState.closingOpen ||
    uiState.mode === "reflection" ||
    Boolean(context?.entry?.reflection) ||
    Boolean(context?.entry?.closingSummary) ||
    Boolean(context?.entry?.closingCompletedAt)
  );
}

function buildPericopeGuidedMessage(context, reflectionText) {
  if (shouldLaunchReflectionPrompt(context, reflectionText)) {
    const usingClosing = !String(context?.entry?.reflection || "").trim()
      && (Boolean(context?.entry?.closingSummary) || Boolean(context?.entry?.closingCompletedAt));
    if (context?.ruleOfLife) {
      return usingClosing
        ? `Help me examine and close today's ${context.ruleOfLife.domain.toLowerCase()} through ${context.ruleOfLife.virtue.toLowerCase()} in light of this evening closeout.`
        : `Help me examine today's ${context.ruleOfLife.domain.toLowerCase()} through ${context.ruleOfLife.virtue.toLowerCase()} in light of this reflection.`;
    }
    return usingClosing
      ? "Help me examine and close today's guidance in light of this evening closeout."
      : "Help me examine today's guidance in light of this reflection.";
  }

  return context?.guidedPrompt || "How should I practice today's guidance?";
}

function buildPericopeFreeformMessage(context, reflectionText) {
  if (reflectionText) {
    return `I'm reviewing this day and want to talk it through: ${reflectionText}`;
  }
  return "";
}

function buildPericopePromptId(context, reflectionText) {
  const promptType = shouldLaunchReflectionPrompt(context, reflectionText)
    ? ((Boolean(context?.entry?.closingSummary) || Boolean(context?.entry?.closingCompletedAt)) && !String(context?.entry?.reflection || "").trim()
      ? "closing"
      : "reflection")
    : "practice";
  const domain = context?.ruleOfLife?.domain || context?.lifeDomainFocus || context?.dayText || "guidance";
  const virtue = context?.ruleOfLife?.virtue || context?.rulerText || "daily";
  return [promptType, domain, virtue].map(slugifyIdPart).filter(Boolean).join("-") || "solomonic-clock-guidance";
}

function buildPericopeClockContext(context, reflectionText, mode) {
  const normalizedMode = mode === "freeform" ? "freeform" : "guided";
  return pruneEmptyFields({
    as_of: context?.asOf || new Date().toISOString(),
    timezone: context?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    lens: uiState.lens,
    mode: normalizedMode,
    daily_guidance: {
      day: context?.dayDisplay,
      tone: context?.guidanceTone,
      activities: context?.guidanceActivities || [],
    },
    weekly_arc: {
      date: context?.weeklyEntry?.dateLabel,
      focus: context?.weeklyEntry?.focus,
      day_offset: selectedDayOffset,
      ruler: context?.weeklyEntry?.rulerText,
      pentacle: context?.weeklyEntry?.pentacleLabel,
      psalm_ref: context?.weeklyEntry?.psalmRef,
      wisdom_ref: context?.weeklyEntry?.wisdomRef,
      is_today: context?.weeklyEntry?.isToday,
    },
    daily_profile: {
      focus: context?.activeFocus,
      active_pentacle: context?.activePentacleLabel,
      life_domain_focus: context?.lifeDomainFocus,
      weakest_domain: context?.weakestDomain,
      weakest_domain_score: context?.weakestDomainScore,
    },
    rule_of_life: context?.ruleOfLife
      ? {
        virtue: context.ruleOfLife.virtue,
        domain: context.ruleOfLife.domain,
        morning: context.ruleOfLife.morning,
        midday: context.ruleOfLife.midday,
        evening: context.ruleOfLife.evening,
        scripture_ref: context.ruleOfLife.psalmRef || context.ruleOfLife.anchor,
      }
      : null,
    daily_opening: context?.entry?.openingCompletedAt || context?.entry?.openingIntention
      ? {
        completed_at: context.entry.openingCompletedAt,
        intention: context.entry.openingIntention,
        scripture_ref: context.entry.openingScriptureRef,
      }
      : null,
    daily_closing: context?.entry?.closingCompletedAt || context?.entry?.closingSummary
      ? {
        completed_at: context.entry.closingCompletedAt,
        summary: context.entry.closingSummary,
        gratitude: context.entry.closingGratitude,
        difficulty: context.entry.closingDifficulty,
        carry_forward: context.entry.closingCarryForward,
      }
      : null,
    content_bundle: {
      psalm: {
        ref: context?.psalmRef,
      },
      wisdom: {
        ref: context?.wisdomRef,
      },
      solomonic: {
        ref: context?.solomonicRef,
      },
    },
    reflection: reflectionText,
  });
}

function buildPericopeLaunchRequest(context, mode = "guided", options = {}) {
  if (!context) {
    return null;
  }

  const normalizedMode = mode === "freeform" ? "freeform" : "guided";
  const reflectionText = typeof options.reflectionText === "string"
    ? options.reflectionText
    : getActionLoopReflectionText(context);
  const message = typeof options.message === "string"
    ? options.message
    : normalizedMode === "guided"
      ? buildPericopeGuidedMessage(context, reflectionText)
      : buildPericopeFreeformMessage(context, reflectionText);
  const promptId = normalizedMode === "guided"
    ? (options.promptId || buildPericopePromptId(context, reflectionText))
    : "";
  const fullContext = buildPericopeClockContext(context, reflectionText, normalizedMode);
  if (options.extraContext && typeof options.extraContext === "object" && !Array.isArray(options.extraContext)) {
    Object.assign(fullContext, pruneEmptyFields(options.extraContext));
  }
  const launchContext = normalizedMode === "guided"
    ? fullContext
    : pruneEmptyFields({
      as_of: fullContext.as_of,
      timezone: fullContext.timezone,
      mode: fullContext.mode,
      daily_guidance: {
        day: fullContext.daily_guidance?.day,
      },
      daily_profile: {
        life_domain_focus: fullContext.daily_profile?.life_domain_focus,
      },
      reflection: fullContext.reflection,
    });
  const encodedContext = base64UrlEncodeUtf8(JSON.stringify(launchContext));
  const params = new URLSearchParams({
    mode: normalizedMode,
    source: "solomonic_clock",
  });
  if (message) {
    params.set("message", message);
  }

  if (promptId) {
    params.set("prompt_id", promptId);
  }
  if (encodedContext) {
    params.set("ctx", encodedContext);
  }

  return {
    url: `${getPericopeChatBaseUrl()}?${params.toString()}`,
    mode: normalizedMode,
    message,
    promptId,
    reflectionText,
    launchContext,
    extraContext: options.extraContext && typeof options.extraContext === "object" ? options.extraContext : null,
  };
}

function buildPericopeLaunchUrl(context, mode = "guided", options = {}) {
  return buildPericopeLaunchRequest(context, mode, options)?.url || "";
}

function recordPericopeLaunch(context, request) {
  if (!context?.dateKey || !request) {
    return;
  }

  appendDailyActionLaunch(
    context.dateKey,
    {
      mode: request.mode,
      promptId: request.promptId,
      message: request.message,
      clockDay: context.dayDisplay,
      bundleKind: request.extraContext?.bundle_focus?.kind || "",
      bundleRef: request.extraContext?.bundle_focus?.reference || "",
      reflectionIncluded: Boolean(request.reflectionText),
      source: "solomonic_clock",
    },
    buildDailyActionSnapshot(context)
  );
  schedulePericopeSessionSync(2400);
}

function launchPericopeChat(context, mode = "guided", options = {}) {
  const request = buildPericopeLaunchRequest(context, mode, options);
  const url = request?.url || "";
  if (!url || typeof window === "undefined") {
    return false;
  }

  const launched = window.open(url, "_blank", "noopener");
  if (launched) {
    launched.opener = null;
    recordPericopeLaunch(context, request);
    return true;
  }

  recordPericopeLaunch(context, request);
  window.location.assign(url);
  return true;
}

function buildBundleDiscussionMessage(kind, reference, context) {
  const ref = String(reference || "").trim();
  switch (kind) {
    case "psalm":
      return `Help me pray and understand ${ref || "today's Psalm"} in light of today's guidance and practice.`;
    case "wisdom":
      return `Help me understand ${ref || "today's wisdom reading"} and how it should shape this day.`;
    case "solomonic":
      return `Help me interpret ${ref || "today's Solomonic reading"} in light of today's guidance and practice.`;
    default:
      return context?.guidedPrompt || "How should I practice today's guidance?";
  }
}

function buildBundleDiscussionPromptId(kind, reference) {
  return [
    "bundle",
    kind,
    String(reference || "").replace(/^psalm\s+/i, "psalm-"),
  ].map(slugifyIdPart).filter(Boolean).join("-") || `bundle-${kind}-discussion`;
}

function launchBundleDiscussion(kind) {
  const context = currentActionLoopContext;
  const state = bundleExpansionState[kind];
  if (!context || !state?.previewRef) {
    return false;
  }

  const reference = state.previewRef;
  const excerpt = state.expanded ? state.expandedText : state.previewText;
  const launched = launchPericopeChat(
    context,
    "guided",
    {
      message: buildBundleDiscussionMessage(kind, reference, context),
      promptId: buildBundleDiscussionPromptId(kind, reference),
      reflectionText: "",
      extraContext: {
        bundle_focus: {
          kind,
          reference,
          excerpt: toInlineSnippet(excerpt),
        },
      },
    }
  );

  if (launched) {
    setActionNotice(`Opening ${kind} reading in Pericope...`);
  }
  return launched;
}

function setupDailyOpeningControls() {
  if (
    !drawerElements.dailyOpeningIntent ||
    !drawerElements.dailyOpeningSuggested ||
    !drawerElements.dailyOpeningSkip ||
    !drawerElements.dailyOpeningBegin ||
    !drawerElements.actionDailyOpening ||
    !drawerElements.dailyOpeningAnchorToggle
  ) {
    return;
  }

  drawerElements.actionDailyOpening.addEventListener("click", () => {
    uiState.dailyOpeningOpen = true;
    requestAnimationFrame(() => {
      drawerElements.dailyOpeningIntent?.focus();
    });
  });

  drawerElements.dailyOpeningSuggested.addEventListener("click", () => {
    const context = currentActionLoopContext;
    if (!context) {
      return;
    }
    dailyOpeningSuggestionOffset = lastDailyOpeningDateKey === context.dateKey
      ? dailyOpeningSuggestionOffset + 1
      : 0;
    drawerElements.dailyOpeningIntent.value = buildDailyOpeningSuggestedIntention(context, dailyOpeningSuggestionOffset);
    drawerElements.dailyOpeningIntent.focus();
  });

  drawerElements.dailyOpeningAnchorToggle.addEventListener("click", () => {
    const context = currentActionLoopContext;
    if (!context?.ruleOfLife?.psalmChapter) {
      return;
    }
    dailyOpeningAnchorExpanded = !dailyOpeningAnchorExpanded;
    lastDailyOpeningAnchorKey = null;
    updateDailyOpeningAnchorPreview(context);
  });

  drawerElements.dailyOpeningSkip.addEventListener("click", () => {
    const context = currentActionLoopContext;
    if (context) {
      setDailyOpeningDismissedDate(context.dateKey);
      setActionNotice("Daily Opening skipped for now. Reopen it anytime from the action bar.");
    }
    uiState.dailyOpeningOpen = false;
  });

  drawerElements.dailyOpeningBegin.addEventListener("click", () => {
    const context = currentActionLoopContext;
    if (!context) {
      return;
    }

    const intention = String(drawerElements.dailyOpeningIntent.value || "").trim()
      || buildDailyOpeningSuggestedIntention(context);
    patchDailyActionEntry(context.dateKey, {
      ...buildDailyActionSnapshot(context),
      openingCompletedAt: new Date().toISOString(),
      openingIntention: intention,
      openingScriptureRef: context.ruleOfLife?.psalmRef || context.psalmRef || context.wisdomRef,
    });
    setDailyOpeningDismissedDate("");
    uiState.dailyOpeningOpen = false;
    setMode("practice");
    setActionNotice(`Day opened for ${context.label}.`);
  });
}

function setupActionLoopControls() {
  if (
    !drawerElements.actionDailyOpening ||
    !drawerElements.actionAdopt ||
    !drawerElements.actionComplete ||
    !drawerElements.actionReflect ||
    !drawerElements.actionCloseDay ||
    !drawerElements.actionPericopeGuided ||
    !drawerElements.actionPericopeFreeform ||
    !drawerElements.reflectionInput ||
    !drawerElements.reflectionSave ||
    !drawerElements.reflectionClear ||
    !drawerElements.closingSummaryInput ||
    !drawerElements.closingGratitudeInput ||
    !drawerElements.closingDifficultyInput ||
    !drawerElements.closingCarryInput ||
    !drawerElements.closingSave ||
    !drawerElements.closingClear
  ) {
    return;
  }

  drawerElements.actionAdopt.addEventListener("click", () => {
    const context = currentActionLoopContext;
    if (!context) {
      return;
    }
    patchDailyActionEntry(context.dateKey, {
      ...buildDailyActionSnapshot(context),
      adoptedAt: new Date().toISOString(),
    });
    setActionNotice(`Practice adopted for ${context.label}.`);
    setMode("practice");
  });

  drawerElements.actionComplete.addEventListener("click", () => {
    const context = currentActionLoopContext;
    if (!context) {
      return;
    }
    patchDailyActionEntry(context.dateKey, {
      ...buildDailyActionSnapshot(context),
      completedAt: new Date().toISOString(),
    });
    setActionNotice(`Marked complete: ${context.label}.`);
  });

  drawerElements.actionReflect.addEventListener("click", () => {
    const wasReflectionMode = uiState.mode === "reflection";
    uiState.reflectionOpen = !uiState.reflectionOpen;
    if (uiState.reflectionOpen) {
      uiState.closingOpen = false;
    }
    if (uiState.reflectionOpen) {
      setMode("reflection");
      if (wasReflectionMode) {
        applyLensState();
      }
      requestAnimationFrame(() => {
        drawerElements.reflectionInput?.focus();
      });
    } else if (wasReflectionMode) {
      applyLensState();
    }
  });

  drawerElements.actionCloseDay.addEventListener("click", () => {
    uiState.closingOpen = !uiState.closingOpen;
    if (uiState.closingOpen) {
      uiState.reflectionOpen = false;
      hydrateClosingInputs(currentActionLoopContext);
      setMode("reflection");
      uiState.reflectionOpen = false;
      applyLensState();
      requestAnimationFrame(() => {
        drawerElements.closingSummaryInput?.focus();
      });
    } else if (uiState.mode === "reflection") {
      applyLensState();
    }
  });

  drawerElements.actionPericopeGuided.addEventListener("click", () => {
    const context = currentActionLoopContext;
    if (!context) {
      return;
    }

    const reflectionText = getActionLoopReflectionText(context);
    const usingReflection = shouldLaunchReflectionPrompt(context, reflectionText);
    const launched = launchPericopeChat(context, "guided");
    if (launched) {
      setActionNotice(usingReflection
        ? "Opening guided chat with your reflection..."
        : "Opening guided chat with today's guidance...");
    }
  });

  drawerElements.actionPericopeFreeform.addEventListener("click", () => {
    const context = currentActionLoopContext;
    if (!context) {
      return;
    }
    const launched = launchPericopeChat(context, "freeform");
    if (launched) {
      setActionNotice("Opening freeform chat in Pericope...");
    }
  });

  drawerElements.actionCopy?.addEventListener("click", async () => {
    const context = currentActionLoopContext;
    if (!context) {
      return;
    }
    const promptText = buildPericopeGuidedMessage(context, getActionLoopReflectionText(context));
    try {
      await copyTextToClipboard(promptText);
      setActionNotice("Question copied for Pericope.");
    } catch (_error) {
      setActionNotice("Clipboard unavailable. Use Ask Pericope instead.");
    }
  });

  drawerElements.reflectionSave.addEventListener("click", () => {
    const context = currentActionLoopContext;
    if (!context) {
      return;
    }
    patchDailyActionEntry(context.dateKey, {
      ...buildDailyActionSnapshot(context),
      reflection: String(drawerElements.reflectionInput.value || "").trim(),
      reflectionUpdatedAt: new Date().toISOString(),
    });
    uiState.reflectionOpen = false;
    setActionNotice(`Reflection saved for ${context.dateKey}.`);
  });

  drawerElements.reflectionClear.addEventListener("click", () => {
    const context = currentActionLoopContext;
    if (!context) {
      drawerElements.reflectionInput.value = "";
      return;
    }
    drawerElements.reflectionInput.value = "";
    patchDailyActionEntry(context.dateKey, {
      ...buildDailyActionSnapshot(context),
      reflection: "",
      reflectionUpdatedAt: new Date().toISOString(),
    });
    setActionNotice(`Reflection cleared for ${context.dateKey}.`);
  });

  drawerElements.closingSave.addEventListener("click", () => {
    const context = currentActionLoopContext;
    if (!context) {
      return;
    }

    const closingSummary = String(drawerElements.closingSummaryInput.value || "").trim()
      || `I closed the day by reviewing ${String(context.label || context.dayDisplay || "today").toLowerCase()}.`;
    const closingGratitude = String(drawerElements.closingGratitudeInput.value || "").trim();
    const closingDifficulty = String(drawerElements.closingDifficultyInput.value || "").trim();
    const closingCarryForward = String(drawerElements.closingCarryInput.value || "").trim();

    patchDailyActionEntry(context.dateKey, {
      ...buildDailyActionSnapshot(context),
      closingCompletedAt: new Date().toISOString(),
      closingSummary,
      closingGratitude,
      closingDifficulty,
      closingCarryForward,
      closingUpdatedAt: new Date().toISOString(),
    });
    uiState.closingOpen = false;
    setActionNotice(`Day closed for ${context.dateKey}.`);
  });

  drawerElements.closingClear.addEventListener("click", () => {
    const context = currentActionLoopContext;
    if (!context) {
      drawerElements.closingSummaryInput.value = "";
      drawerElements.closingGratitudeInput.value = "";
      drawerElements.closingDifficultyInput.value = "";
      drawerElements.closingCarryInput.value = "";
      return;
    }

    drawerElements.closingSummaryInput.value = "";
    drawerElements.closingGratitudeInput.value = "";
    drawerElements.closingDifficultyInput.value = "";
    drawerElements.closingCarryInput.value = "";
    patchDailyActionEntry(context.dateKey, {
      ...buildDailyActionSnapshot(context),
      closingCompletedAt: "",
      closingSummary: "",
      closingGratitude: "",
      closingDifficulty: "",
      closingCarryForward: "",
      closingUpdatedAt: new Date().toISOString(),
    });
    setActionNotice(`Daily closing cleared for ${context.dateKey}.`);
  });
}

function setupHistoryReviewControls() {
  if (
    !drawerElements.historyReviewNote ||
    !drawerElements.historyReviewAccept ||
    !drawerElements.historyReviewRevise ||
    !drawerElements.historyReviewPericope
  ) {
    return;
  }

  const persistWeeklyReview = (status) => {
    const reviewContext = currentWeeklyReviewContext;
    if (!reviewContext?.selectedEntry?.dateKey || !reviewContext.weeklyReview) {
      setActionNotice("No weekly review is ready yet.");
      return null;
    }

    const note = String(drawerElements.historyReviewNote.value || "").trim();
    if (status === "revised" && !note) {
      setActionNotice("Add a renewal note before saving a revision.");
      return null;
    }

    patchDailyActionEntry(reviewContext.selectedEntry.dateKey, {
      weeklyReviewStatus: status,
      weeklyReviewStatusAt: new Date().toISOString(),
      weeklyReviewNote: note,
      weeklyReviewEncouragement: reviewContext.weeklyReview.encouragement,
      weeklyReviewWarning: reviewContext.weeklyReview.warning,
      weeklyReviewCarryForward: reviewContext.weeklyReview.carryForward,
      weeklyReviewScriptureRef: reviewContext.weeklyReview.scriptureRef,
    });

    setActionNotice(status === "accepted" ? "Weekly direction received." : "Weekly revision saved.");
    return reviewContext;
  };

  drawerElements.historyReviewAccept.addEventListener("click", () => {
    persistWeeklyReview("accepted");
  });

  drawerElements.historyReviewRevise.addEventListener("click", () => {
    persistWeeklyReview("revised");
  });

  drawerElements.historyReviewPericope.addEventListener("click", () => {
    const reviewContext = currentWeeklyReviewContext;
    if (!reviewContext?.selectedEntry || !reviewContext.weeklyReview) {
      setActionNotice("No weekly review is ready yet.");
      return;
    }

    const launchContext = buildWeeklyReviewLaunchContext(reviewContext.selectedEntry, reviewContext.weeklyReview);
    const launched = launchPericopeChat(launchContext, "guided", {
      message: reviewContext.weeklyReview.prompt,
      promptId: `weekly-review-${reviewContext.selectedEntry.dateKey}`,
      extraContext: {
        weekly_review: {
          window: reviewContext.weeklySummary.windowLabel,
          encouragement: reviewContext.weeklyReview.encouragement,
          warning: reviewContext.weeklyReview.warning,
          carry_forward: reviewContext.weeklyReview.carryForward,
          scripture_ref: reviewContext.weeklyReview.scriptureRef,
          renewal_note: String(drawerElements.historyReviewNote.value || "").trim(),
        },
      },
    });

    if (launched) {
      setActionNotice("Opening weekly review in Pericope...");
    }
  });
}

function setupHistoryLaunchControls() {
  if (!drawerElements.historyCurrentResume) {
    return;
  }

  drawerElements.historyCurrentResume.addEventListener("click", () => {
    const now = new Date();
    const timeState = getTimeState(now);
    const referenceMap = buildReferenceLookupMap(timeState);
    const derived = deriveGuidance(timeState);
    const selectedEntry = buildHistoryTimelineEntry(now, selectedDayOffset, derived, referenceMap);
    const latestLinkedLaunch = selectedEntry?.latestLinkedLaunch;
    const resumeUrl = String(latestLinkedLaunch?.sessionUrl || "").trim();

    if (!resumeUrl || typeof window === "undefined") {
      setActionNotice("No linked Pericope conversation is available for this day yet.");
      return;
    }

    const launched = window.open(resumeUrl, "_blank", "noopener");
    if (launched) {
      launched.opener = null;
      setActionNotice("Opening linked Pericope conversation...");
      return;
    }

    window.location.assign(resumeUrl);
  });
}

function computeRingLayout(items) {
  if (!items || !items.length) {
    return [];
  }

  const step = (Math.PI * 2) / items.length;
  return items.map((item, index) => ({
    ...item,
    startAngle: index * step,
    endAngle: (index + 1) * step,
    index,
  }));
}

function radiansToDegrees(rad) {
  return (rad * 180) / Math.PI;
}

function drawSpiritTooltipText(entry) {
  if (uiState.lens === "esoteric") {
    return `Sector ${entry.sector} – ${entry.zodiac} ${entry.degrees} – ${entry.spirit} (${entry.rank})`;
  }
  return `${entry.zodiac} ${entry.degrees} – ${entry.spirit} (${entry.rank})`;
}

function drawCelestialTooltipText(entry) {
  return `${entry.name} – ${entry.virtue}`;
}

function drawPlanetaryTooltipText(entry) {
  if (uiState.lens === "esoteric") {
    const correspondences = PLANETARY_CORRESPONDENCES[entry.name] || {};
    return `${entry.name} – Angel: ${correspondences.angel || "—"} • Metal: ${correspondences.metal || "—"} • Color: ${correspondences.color || "—"}`;
  }
  if (uiState.lens === "ritual") {
    const themes = Array.isArray(entry.themes) && entry.themes.length
      ? entry.themes.join(" • ")
      : "Themes unavailable";
    return `${entry.day} – ${entry.name} • ${themes}`;
  }
  return `${entry.name} – ${entry.day} (${entry.pentacles.length} seals)`;
}

function slugifyIdPart(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildSealSymbolId(planet, pentacleIndex) {
  return `seal-${slugifyIdPart(planet)}-${String(pentacleIndex)}`;
}

function buildPentacleDataKey(planet, pentacleIndex) {
  return `${slugifyIdPart(planet)}_${String(pentacleIndex)}`;
}

function hashString(input) {
  let hash = 0;
  const text = String(input || "");
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function polarPoint(cx, cy, radius, angle) {
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
  };
}

function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function describeArcPath(radius, startDegrees, endDegrees) {
  const startAngle = degreesToRadians(startDegrees);
  const endAngle = degreesToRadians(endDegrees);
  const start = polarPoint(0, 0, radius, startAngle);
  const end = polarPoint(0, 0, radius, endAngle);
  const delta = ((endDegrees - startDegrees) + 360) % 360;
  const largeArc = delta > 180 ? 1 : 0;

  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

function buildAlternatingPolygonPath(cx, cy, points, outerRadius, innerRadius, rotation = -Math.PI / 2) {
  const vertices = [];
  const total = points * 2;
  for (let index = 0; index < total; index += 1) {
    const angle = rotation + (Math.PI * index) / points;
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    vertices.push(polarPoint(cx, cy, radius, angle));
  }
  return `${vertices.map((point, idx) => `${idx === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ")} Z`;
}

function buildRegularPolygonPath(cx, cy, sides, radius, rotation = -Math.PI / 2) {
  const vertices = [];
  for (let index = 0; index < sides; index += 1) {
    const angle = rotation + (Math.PI * 2 * index) / sides;
    vertices.push(polarPoint(cx, cy, radius, angle));
  }
  return `${vertices.map((point, idx) => `${idx === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ")} Z`;
}

function buildCrossPath(cx, cy, size, armWidth) {
  const half = size / 2;
  const arm = armWidth / 2;
  return [
    `M ${cx - arm} ${cy - half}`,
    `L ${cx + arm} ${cy - half}`,
    `L ${cx + arm} ${cy - arm}`,
    `L ${cx + half} ${cy - arm}`,
    `L ${cx + half} ${cy + arm}`,
    `L ${cx + arm} ${cy + arm}`,
    `L ${cx + arm} ${cy + half}`,
    `L ${cx - arm} ${cy + half}`,
    `L ${cx - arm} ${cy + arm}`,
    `L ${cx - half} ${cy + arm}`,
    `L ${cx - half} ${cy - arm}`,
    `L ${cx - arm} ${cy - arm}`,
    "Z",
  ].join(" ");
}

function buildCrescentPath(cx, cy, outerRadius, innerRadius, offsetX) {
  return [
    `M ${cx} ${cy - outerRadius}`,
    `A ${outerRadius} ${outerRadius} 0 1 1 ${cx} ${cy + outerRadius}`,
    `A ${innerRadius} ${innerRadius} 0 1 0 ${cx + offsetX} ${cy - innerRadius}`,
    "Z",
  ].join(" ");
}

function hexToRgba(hex, alpha) {
  const normalized = String(hex || "").replace("#", "");
  const expanded = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized;
  const value = Number.parseInt(expanded, 16);
  if (Number.isNaN(value)) {
    return `rgba(250, 204, 21, ${alpha})`;
  }
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function appendSealSymbol(planet, pentacleIndex) {
  const symbolId = buildSealSymbolId(planet, pentacleIndex);
  if (!sealDefs.select(`#${symbolId}`).empty()) {
    return symbolId;
  }

  const seed = hashString(`${planet}:${pentacleIndex}`);
  const spokeCount = 6 + (seed % 4);
  const starPoints = 5 + (seed % 3);
  const knotPoints = 7 + (seed % 4);
  const rotation = ((seed % 360) * Math.PI) / 180;
  const initial = String(planet || "?").slice(0, 1).toUpperCase();

  const symbol = sealDefs
    .append("symbol")
    .attr("id", symbolId)
    .attr("viewBox", `0 0 ${SEAL_SPRITE_SIZE} ${SEAL_SPRITE_SIZE}`)
    .attr("overflow", "visible");

  symbol
    .append("circle")
    .attr("class", "seal-outer")
    .attr("cx", SEAL_SPRITE_CENTER)
    .attr("cy", SEAL_SPRITE_CENTER)
    .attr("r", 43.5);

  symbol
    .append("circle")
    .attr("class", "seal-inner")
    .attr("cx", SEAL_SPRITE_CENTER)
    .attr("cy", SEAL_SPRITE_CENTER)
    .attr("r", 32);

  for (let index = 0; index < spokeCount; index += 1) {
    const angle = rotation + (Math.PI * 2 * index) / spokeCount;
    const inner = polarPoint(SEAL_SPRITE_CENTER, SEAL_SPRITE_CENTER, 14, angle);
    const outer = polarPoint(SEAL_SPRITE_CENTER, SEAL_SPRITE_CENTER, 42, angle);
    symbol
      .append("line")
      .attr("class", "seal-line")
      .attr("x1", inner.x)
      .attr("y1", inner.y)
      .attr("x2", outer.x)
      .attr("y2", outer.y);
  }

  symbol
    .append("path")
    .attr("class", "seal-star")
    .attr("d", buildAlternatingPolygonPath(SEAL_SPRITE_CENTER, SEAL_SPRITE_CENTER, starPoints, 27, 11, rotation));

  symbol
    .append("path")
    .attr("class", "seal-knot")
    .attr("d", buildAlternatingPolygonPath(SEAL_SPRITE_CENTER, SEAL_SPRITE_CENTER, knotPoints, 18, 8, rotation / 2));

  symbol
    .append("text")
    .attr("class", "seal-initial")
    .attr("x", SEAL_SPRITE_CENTER)
    .attr("y", 23)
    .attr("text-anchor", "middle")
    .text(initial);

  symbol
    .append("text")
    .attr("class", "seal-index")
    .attr("x", SEAL_SPRITE_CENTER)
    .attr("y", 86)
    .attr("text-anchor", "middle")
    .text(String(pentacleIndex));

  return symbolId;
}

function ensureSealSymbols(flatPentacles) {
  (flatPentacles || []).forEach((entry, index) => {
    const planet = entry?.planet || "unknown";
    const pentacleIndex = Number.isFinite(entry?.pentacle?.index)
      ? entry.pentacle.index
      : index + 1;
    appendSealSymbol(planet, pentacleIndex);
  });
}

function buildPlanetarySealGlyphData(groups, outerRadius) {
  const ringData = computeRingLayout(groups || []);
  const innerRadius = Math.max(0, outerRadius - RING_THICKNESS.planetary);
  const centroidArc = d3
    .arc()
    .innerRadius(innerRadius + 6)
    .outerRadius(outerRadius - 6);
  const glyphs = [];

  ringData.forEach((group) => {
    const pentacles = Array.isArray(group.pentacles) ? group.pentacles : [];
    const count = pentacles.length;
    if (!count) {
      return;
    }

    const segmentSpan = group.endAngle - group.startAngle;
    pentacles.forEach((pentacle, index) => {
      const sectionStart = group.startAngle + (segmentSpan * index) / count;
      const sectionEnd = group.startAngle + (segmentSpan * (index + 1)) / count;
      const [x, y] = centroidArc.centroid({
        startAngle: sectionStart,
        endAngle: sectionEnd,
      });
      const radius = Math.hypot(x, y);
      const sectionArcLength = radius * Math.max(0.02, sectionEnd - sectionStart);
      const size = Math.max(13, Math.min(28, sectionArcLength * 0.58));
      const pentacleIndex = Number.isFinite(pentacle?.index) ? pentacle.index : index + 1;
      const groupKey = slugifyIdPart(group.name || "");

      glyphs.push({
        key: `${String(group.name || "").toLowerCase()}-${pentacleIndex}`,
        planet: group.name || "Unknown",
        groupKey,
        pentacleIndex,
        focus: pentacle?.focus || "",
        x,
        y,
        size,
        symbolId: appendSealSymbol(group.name || "unknown", pentacleIndex),
      });
    });
  });

  return glyphs;
}

function drawPlanetarySealGlyphs(groups, outerRadius) {
  const glyphs = buildPlanetarySealGlyphData(groups, outerRadius);
  const selection = planetarySealGlyphGroup
    .selectAll("use.ring-seal-glyph")
    .data(glyphs, (entry) => entry.key)
    .join("use")
    .attr("class", "ring-seal-glyph")
    .attr("href", (entry) => `#${entry.symbolId}`)
    .attr("x", (entry) => entry.x - entry.size / 2)
    .attr("y", (entry) => entry.y - entry.size / 2)
    .attr("width", (entry) => entry.size)
    .attr("height", (entry) => entry.size);

  updatePlanetarySealGlyphVisibility();

  bindTooltip(
    selection,
    (entry) => `Historical seal of ${entry.planet} #${entry.pentacleIndex}${entry.focus ? ` — ${entry.focus}` : ""}`
  );
}

function updatePlanetarySealGlyphVisibility() {
  planetarySealGlyphGroup
    .selectAll("use.ring-seal-glyph")
    .classed("visible", uiState.presentationMode === "talismans");
}

function updateActivePlanetarySealGlyph(activePentacle) {
  const activeKey = getPentacleKey(activePentacle);
  planetarySealGlyphGroup
    .selectAll("use.ring-seal-glyph")
    .classed("active", (entry) => Boolean(activeKey) && entry.key === activeKey);
}

function updatePlanetaryRingPresentation(groups, outerRadius, activePentacle) {
  const key = `${uiState.presentationMode}|${getPentacleKey(activePentacle) || "none"}`;
  if (key === lastPlanetaryRingPresentationKey) {
    return;
  }
  lastPlanetaryRingPresentationKey = key;

  if (uiState.presentationMode !== "talismans") {
    planetarySealGlyphGroup.selectAll("*").remove();
    return;
  }

  drawPlanetarySealGlyphs(groups, outerRadius);
  updatePlanetarySealGlyphVisibility();
  updateActivePlanetarySealGlyph(activePentacle);
}

function formatPsalmReference(entry) {
  if (!entry) {
    return "";
  }
  const chapter = Number.parseInt(entry.number ?? entry.psalm, 10);
  if (Number.isNaN(chapter)) {
    return "";
  }
  const verseLabel = entry.verses ? `:${entry.verses}` : "";
  return `PS ${chapter}${verseLabel}`;
}

function renderCircularGlyphs(group, text, radius, color, startAngle = -105, endAngle = 105) {
  const glyphs = String(text || "")
    .split("")
    .filter(Boolean)
    .map((value, index, array) => {
      const divisor = Math.max(array.length - 1, 1);
      return {
        value,
        angle: startAngle + ((endAngle - startAngle) * index) / divisor,
      };
    });

  group
    .selectAll("text")
    .data(glyphs)
    .join("text")
    .attr("class", "dynamic-pentacle-scripture-glyph")
    .attr("fill", color)
    .attr(
      "transform",
      (entry) => `rotate(${entry.angle} 0 0) translate(0 ${-radius}) rotate(${entry.angle > 90 || entry.angle < -90 ? 180 : 0})`
    )
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .text((entry) => entry.value);
}

function renderRingSymbols(group, symbols, radius, color) {
  const entries = (symbols || []).map((value, index, array) => ({
    value,
    angle: -45 + (360 * index) / Math.max(array.length, 1),
  }));

  group
    .selectAll("text")
    .data(entries)
    .join("text")
    .attr("class", "dynamic-pentacle-symbol")
    .attr("fill", color)
    .attr("transform", (entry) => `rotate(${entry.angle} 0 0) translate(0 ${-radius})`)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .text((entry) => entry.value);
}

function renderPentacleGeometry(group, config) {
  const accent = config.color;
  const geometryLayer = group.append("g").attr("class", "dynamic-pentacle-geometry");

  if (config.centerShape === "hexagram") {
    geometryLayer
      .append("path")
      .attr("class", "dynamic-pentacle-shape")
      .attr("stroke", accent)
      .attr("d", buildAlternatingPolygonPath(0, 0, 6, 30, 13));
  } else if (config.centerShape === "pentagram") {
    geometryLayer
      .append("path")
      .attr("class", "dynamic-pentacle-shape")
      .attr("stroke", accent)
      .attr("d", buildAlternatingPolygonPath(0, 0, 5, 30, 12));
  } else if (config.centerShape === "square") {
    geometryLayer
      .append("path")
      .attr("class", "dynamic-pentacle-shape")
      .attr("stroke", accent)
      .attr("d", buildRegularPolygonPath(0, 0, 4, 28, Math.PI / 4));
  } else if (config.centerShape === "cross") {
    geometryLayer
      .append("path")
      .attr("class", "dynamic-pentacle-shape")
      .attr("stroke", accent)
      .attr("d", buildCrossPath(0, 0, 58, 16));
  } else if (config.centerShape === "crescent") {
    geometryLayer
      .append("path")
      .attr("class", "dynamic-pentacle-shape dynamic-pentacle-shape--filled")
      .attr("fill", hexToRgba(accent, 0.18))
      .attr("stroke", accent)
      .attr("d", buildCrescentPath(0, 0, 28, 23, 14));
  } else {
    geometryLayer
      .append("circle")
      .attr("class", "dynamic-pentacle-shape")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 28)
      .attr("stroke", accent);
    geometryLayer
      .append("circle")
      .attr("class", "dynamic-pentacle-shape")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 16)
      .attr("stroke", accent);
    geometryLayer
      .append("line")
      .attr("class", "dynamic-pentacle-shape")
      .attr("x1", -28)
      .attr("y1", 0)
      .attr("x2", 28)
      .attr("y2", 0)
      .attr("stroke", accent);
    geometryLayer
      .append("line")
      .attr("class", "dynamic-pentacle-shape")
      .attr("x1", 0)
      .attr("y1", -28)
      .attr("x2", 0)
      .attr("y2", 28)
      .attr("stroke", accent);
  }
}

function getPentacleRenderConfig(activePentacle, pentacleData, referenceMap) {
  if (!activePentacle) {
    return null;
  }

  const key = buildPentacleDataKey(activePentacle.planet, activePentacle.pentacle.index);
  const planetSlug = slugifyIdPart(activePentacle.planet);
  const planetStyle = pentacleData?.planetStyles?.[planetSlug] || {};
  const pentacleRecord = pentacleData?.pentacles?.[key] || {};
  const referenceRecord = referenceMap.get(getPentacleKey(activePentacle));
  const scriptureRef = formatPsalmReference(getPrimaryPsalmEntry(referenceRecord)) || "PSALM";

  return {
    key,
    planetSlug,
    color: planetStyle.color || "#f8fafc",
    centerShape: pentacleRecord.centerShape || planetStyle.centerShape || "circle_grid",
    symbols: pentacleRecord.symbols || planetStyle.symbols || [planetStyle.glyph || activePentacle.planet.slice(0, 1).toUpperCase()],
    glyph: planetStyle.glyph || activePentacle.planet.slice(0, 1).toUpperCase(),
    virtue: pentacleRecord.virtue || planetStyle.virtue || activePentacle.planet,
    scriptureRef,
  };
}

function renderDynamicPentacle(group, config) {
  group.selectAll("*").remove();
  group.attr("class", `dynamic-pentacle planet-${config.planetSlug}`);

  group
    .append("circle")
    .attr("class", "dynamic-pentacle-ring dynamic-pentacle-ring--outer")
    .attr("r", 74)
    .attr("stroke", hexToRgba(config.color, 0.95));

  group
    .append("circle")
    .attr("class", "dynamic-pentacle-ring dynamic-pentacle-ring--text")
    .attr("r", 62)
    .attr("stroke", hexToRgba(config.color, 0.8));

  group
    .append("circle")
    .attr("class", "dynamic-pentacle-ring dynamic-pentacle-ring--inner")
    .attr("r", 47)
    .attr("stroke", hexToRgba(config.color, 0.72));

  renderCircularGlyphs(
    group.append("g").attr("class", "dynamic-pentacle-scripture-ring"),
    config.scriptureRef,
    62,
    hexToRgba(config.color, 0.92)
  );

  renderRingSymbols(
    group.append("g").attr("class", "dynamic-pentacle-symbol-ring"),
    config.symbols,
    50,
    hexToRgba(config.color, 0.95)
  );

  renderPentacleGeometry(group, config);

  group
    .append("text")
    .attr("class", "dynamic-pentacle-planet-glyph")
    .attr("fill", hexToRgba(config.color, 0.96))
    .attr("x", 0)
    .attr("y", -6)
    .attr("text-anchor", "middle")
    .text(config.glyph);

  group
    .append("text")
    .attr("class", "dynamic-pentacle-virtue")
    .attr("fill", "#f8fafc")
    .attr("x", 0)
    .attr("y", 22)
    .attr("text-anchor", "middle")
    .text(String(config.virtue || "?").slice(0, 1).toUpperCase());
}

function renderGuidanceSealFocus(group, config) {
  group
    .append("circle")
    .attr("class", "active-seal-focus-ring")
    .attr("r", 70)
    .attr("stroke", hexToRgba(config.color, 0.42));

  group
    .append("circle")
    .attr("class", "active-seal-focus-ring")
    .attr("r", 52)
    .attr("stroke", hexToRgba(config.color, 0.3));

  group
    .append("text")
    .attr("class", "guidance-seal-ref")
    .attr("fill", hexToRgba(config.color, 0.96))
    .attr("x", 0)
    .attr("y", -4)
    .attr("text-anchor", "middle")
    .text(config.scriptureRef);

  group
    .append("text")
    .attr("class", "guidance-seal-virtue")
    .attr("fill", "#f8fafc")
    .attr("x", 0)
    .attr("y", 22)
    .attr("text-anchor", "middle")
    .text(String(config.virtue || "Guidance"));
}

function renderHistoricalSealFocus(group, config) {
  group
    .append("circle")
    .attr("class", "dynamic-pentacle-ring dynamic-pentacle-ring--outer")
    .attr("r", 74)
    .attr("stroke", hexToRgba(config.color, 0.78));

  group
    .append("circle")
    .attr("class", "dynamic-pentacle-ring dynamic-pentacle-ring--text")
    .attr("r", 60)
    .attr("stroke", hexToRgba(config.color, 0.62));

  renderCircularGlyphs(
    group.append("g").attr("class", "historical-seal-scripture-ring"),
    config.scriptureRef,
    60,
    hexToRgba(config.color, 0.84)
  );

  group
    .append("text")
    .attr("class", "dynamic-pentacle-planet-glyph")
    .attr("fill", hexToRgba(config.color, 0.96))
    .attr("x", 0)
    .attr("y", 2)
    .attr("text-anchor", "middle")
    .text(config.glyph);

  group
    .append("text")
    .attr("class", "guidance-seal-virtue")
    .attr("fill", "#f8fafc")
    .attr("x", 0)
    .attr("y", 24)
    .attr("text-anchor", "middle")
    .text(String(config.virtue || "Guidance"));
}

function updateActiveSealFocus(activePentacle, pentacleData, referenceMap) {
  const config = getPentacleRenderConfig(activePentacle, pentacleData, referenceMap);
  const nextKey = config ? `${uiState.presentationMode}:${config.key}` : null;

  if (nextKey === lastActiveSealFocusKey) {
    return;
  }
  lastActiveSealFocusKey = nextKey;

  activeSealFocusGroup.selectAll("*").remove();
  if (!config) {
    return;
  }

  const preview = activeSealFocusGroup
    .append("g")
    .attr("class", "active-seal-preview")
    .attr("transform", "translate(0, 0)");

  preview
    .append("circle")
    .attr("class", "active-seal-focus-halo")
    .attr("r", 86)
    .attr("stroke", hexToRgba(config.color, 0.38));

  const content = preview.append("g").attr("class", "active-seal-dynamic");
  if (uiState.presentationMode === "talismans") {
    renderDynamicPentacle(content, config);
  } else if (uiState.presentationMode === "historical_symbols") {
    renderHistoricalSealFocus(content, config);
  } else {
    renderGuidanceSealFocus(content, config);
  }

  preview
    .append("circle")
    .attr("class", "active-seal-focus-ring")
    .attr("r", 80)
    .attr("stroke", hexToRgba(config.color, 0.8));
}

function positionTooltip(event) {
  const [x, y] = d3.pointer(event, clockWrapper.node());
  tooltip.style("left", `${x}px`).style("top", `${y}px`);
}

function bindTooltip(selection, formatter) {
  selection
    .on("mouseenter", (event, d) => {
      tooltip.text(formatter(d)).classed("visible", true);
      positionTooltip(event);
    })
    .on("mousemove", (event) => {
      positionTooltip(event);
    })
    .on("mouseleave", () => {
      tooltip.classed("visible", false);
    });
}

function drawArcRing(layerName, items, outerRadius, color, tooltipFormatter) {
  const data = computeRingLayout(items);
  const innerRadius = Math.max(0, outerRadius - (RING_THICKNESS[layerName] || 70));
  const arc = d3
    .arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)
    .padAngle(layerName === "spirit" ? 0.002 : 0.01)
    .cornerRadius(layerName === "spirit" ? 2 : 4);

  const group = ringGroups[layerName];
  const selection = group
    .selectAll("path")
    .data(data)
    .join("path")
    .attr("class", `ring-path ring-${layerName}`)
    .attr("d", arc)
    .attr("fill", color)
    .attr("fill-opacity", layerName === "spirit" ? 0.55 : 0.38)
    .attr("stroke", "rgba(12, 19, 33, 0.9)")
    .attr("stroke-width", layerName === "spirit" ? 0.5 : 1.2);

  if (tooltipFormatter) {
    bindTooltip(selection, tooltipFormatter);
  }

  return data;
}

function drawCore(coreInfo, radius, color) {
  const group = ringGroups.core;
  group
    .selectAll("circle")
    .data([coreInfo])
    .join("circle")
    .attr("r", radius)
    .attr("fill", color)
    .attr("fill-opacity", 0.18)
    .attr("stroke", color)
    .attr("stroke-width", 2);

  centerGroup.raise();
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDayOfYear(now) {
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  return Math.floor((now - startOfYear) / MS_PER_DAY);
}

function getDayProgress(now) {
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return (now - startOfDay) / MS_PER_DAY;
}

function getWeekFraction(now) {
  const hoursIntoDay =
    now.getHours() + (now.getMinutes() + (now.getSeconds() + now.getMilliseconds() / 1000) / 60) / 60;
  return ((now.getDay() + hoursIntoDay / 24) / 7) % 1;
}

function getPlanetaryDayLabel(now) {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const planetaryRulers = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
  const index = now.getDay();
  return {
    dayText: dayNames[index],
    rulerText: planetaryRulers[index],
  };
}

function flattenPentacles(groups) {
  const flat = [];
  groups.forEach((group, groupIndex) => {
    (group.pentacles || []).forEach((pentacle, pentacleIndex) => {
      flat.push({
        groupIndex,
        pentacleIndex,
        planet: group.name,
        pentacle,
        group,
      });
    });
  });
  return flat;
}

function fractionToRotation(fraction, count) {
  if (!count || count <= 0) {
    return -Math.PI / 2;
  }
  const segment = (Math.PI * 2) / count;
  return -(fraction * Math.PI * 2) - Math.PI / 2 + segment / 2;
}

function highlightLayer(layerName, activeIndex) {
  const paths = ringGroups[layerName].selectAll("path");
  paths.classed("active", (_, index) => index === activeIndex);
}

function updateCenterLabels(coreName, timeState, referenceMap, now, derived, lifeState) {
  if (!timeState) {
    return;
  }

  const { dayLabel, clockText, active } = timeState;
  const hourRule = getPlanetaryHourRuler(now, dayLabel.rulerText);
  const pentacleKey = getPentacleKey(active.pentacle);
  const pentacleRecord = pentacleKey ? referenceMap.get(pentacleKey) : null;
  const primaryPsalm = getPrimaryPsalmEntry(pentacleRecord);
  const readablePsalm = formatReadablePsalmReference(primaryPsalm);
  const wisdom = WISDOM_CONTENT_BY_RULER[dayLabel.rulerText];
  const correspondences = PLANETARY_CORRESPONDENCES[dayLabel.rulerText] || {};
  const ritualThemes = Array.isArray(active.planetary?.themes) && active.planetary.themes.length
    ? active.planetary.themes.join(" • ")
    : null;
  const weeklyEntry = buildWeeklyArcEntry(now, selectedDayOffset, derived, referenceMap);
  const modePresentation = getModePresentation(timeState, referenceMap, now, derived, lifeState);

  centerDayLabel.text(`${dayLabel.dayText} – ${dayLabel.rulerText} • ${clockText}`);

  if (modePresentation) {
    centerTitleLabel.text(modePresentation.centerTitle);
    centerSpiritLabel.text(modePresentation.centerSpirit);
    centerPentacleLabel.text(modePresentation.centerPentacle);
    return;
  }

  if (uiState.lens === "scripture") {
    centerTitleLabel.text(readablePsalm || coreName);
    centerSpiritLabel.text(wisdom?.ref ? `Wisdom anchor • ${wisdom.ref}` : "Scripture lens");
    centerPentacleLabel.text(
      active.pentacle
        ? uiState.presentationMode === "guidance"
          ? `Mapped focus • ${toSnippet(active.pentacle.pentacle.focus, 72)}`
          : uiState.presentationMode === "historical_symbols"
            ? `Historical key • ${active.pentacle.planet} #${active.pentacle.pentacle.index} • ${toSnippet(active.pentacle.pentacle.focus, 72)}`
            : `Mapped via ${active.pentacle.planet} #${active.pentacle.pentacle.index} • ${toSnippet(active.pentacle.pentacle.focus, 72)}`
        : "No active pentacle mapping available."
    );
    return;
  }

  if (uiState.lens === "ritual") {
    centerTitleLabel.text(hourRule?.ruler ? `Hour of ${hourRule.ruler}` : coreName);
    centerSpiritLabel.text(ritualThemes ? `Themes • ${ritualThemes}` : "Ritual lens");
    centerPentacleLabel.text(
      active.pentacle?.pentacle?.focus
        ? `Practice focus • ${toSnippet(active.pentacle.pentacle.focus, 72)}`
        : "Practice focus unavailable."
    );
    return;
  }

  if (uiState.lens === "esoteric") {
    centerTitleLabel.text(
      [correspondences.angel, correspondences.metal].filter(Boolean).join(" • ") || coreName
    );
    centerSpiritLabel.text(
      active.spirit
        ? `${active.spirit.zodiac} ${active.spirit.degrees} • ${active.spirit.spirit} (${active.spirit.rank})`
        : "No active spirit sector."
    );
    centerPentacleLabel.text(
      [correspondences.color, active.pentacle ? `${active.pentacle.planet} #${active.pentacle.pentacle.index}` : ""]
        .filter(Boolean)
        .join(" • ") || "Esoteric lens"
    );
    return;
  }

  if (uiState.lens === "history") {
    centerTitleLabel.text(weeklyEntry.dateLabel);
    centerSpiritLabel.text(`${weeklyEntry.rulerText} • ${weeklyEntry.psalmRef}`);
    centerPentacleLabel.text(toSnippet(weeklyEntry.focus, 76));
    return;
  }

  centerTitleLabel.text(coreName);
  if (uiState.presentationMode === "guidance") {
    centerSpiritLabel.text(
      readablePsalm
        ? `Scripture anchor • ${readablePsalm}`
        : active.pentacle?.pentacle?.focus
          ? `Today's focus • ${toSnippet(active.pentacle.pentacle.focus, 72)}`
          : ""
    );
    centerPentacleLabel.text(
      active.pentacle?.pentacle?.focus
        ? toSnippet(active.pentacle.pentacle.focus, 92)
        : ""
    );
    return;
  }

  if (active.spirit) {
    centerSpiritLabel.text(
      `${active.spirit.zodiac} ${active.spirit.degrees} • ${active.spirit.spirit}`
    );
  } else {
    centerSpiritLabel.text("");
  }

  if (active.pentacle) {
    centerPentacleLabel.text(
      `Pentacle of ${active.pentacle.planet} #${active.pentacle.pentacle.index}: ${active.pentacle.pentacle.focus}`
    );
  } else {
    centerPentacleLabel.text("");
  }
}

function updateDailyGuidance(timeState) {
  if (!drawerElements.guidanceDay || !drawerElements.guidanceTone || !drawerElements.guidanceList) {
    return;
  }

  const dayText = timeState?.dayLabel?.dayText || "Unknown day";
  const rulerText = timeState?.dayLabel?.rulerText || "Unknown ruler";
  const key = `${dayText}-${rulerText}`;

  if (key === lastGuidanceKey) {
    return;
  }
  lastGuidanceKey = key;

  const guidance = PLANETARY_DAY_GUIDANCE[rulerText];
  drawerElements.guidanceDay.textContent = `${dayText} (${rulerText})`;
  drawerElements.guidanceTone.textContent =
    guidance?.tone || "Use this day for steady, intentional progress with focused attention.";

  drawerElements.guidanceList.innerHTML = "";
  const activities = guidance?.activities || ["Review priorities.", "Do one high-value task deeply.", "End with reflection."];
  activities.forEach((activity) => {
    const li = document.createElement("li");
    li.textContent = activity;
    drawerElements.guidanceList.appendChild(li);
  });
}

function buildWeeklyArcEntry(baseDate, offset, derived, referenceMap) {
  const target = new Date(baseDate);
  target.setHours(12, 0, 0, 0);
  target.setDate(target.getDate() + offset);

  const dayLabel = getPlanetaryDayLabel(target);
  const guidance = PLANETARY_DAY_GUIDANCE[dayLabel.rulerText];
  const wisdom = WISDOM_CONTENT_BY_RULER[dayLabel.rulerText];

  const weekFraction = derived.planetaryGroupCount ? getWeekFraction(target) : 0;
  const pentacleIndex = derived.totalPentacles
    ? Math.floor(weekFraction * derived.totalPentacles) % derived.totalPentacles
    : -1;
  const activePentacle = pentacleIndex >= 0 ? derived.flatPentacles[pentacleIndex] : null;
  const pentacleKey = getPentacleKey(activePentacle);
  const record = pentacleKey ? referenceMap.get(pentacleKey) : null;
  const primaryPsalm = getPrimaryPsalmEntry(record);

  const psalmRef = (() => {
    if (primaryPsalm) {
      const chapter = Number.parseInt(primaryPsalm.number ?? primaryPsalm.psalm, 10);
      const verseLabel = primaryPsalm.verses ? `:${primaryPsalm.verses}` : "";
      return `Psalm ${chapter}${verseLabel}`;
    }
    const fallback = FALLBACK_DAILY_PSALM_BY_RULER[dayLabel.rulerText] || { chapter: 1, verse: 1 };
    return `Psalm ${fallback.chapter}:${fallback.verse}`;
  })();

  return {
    isToday: offset === 0,
    dateLabel: target.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }),
    rulerText: dayLabel.rulerText,
    weekFraction,
    pentacleIndex,
    pentacleLabel: activePentacle
      ? `${activePentacle.planet} #${activePentacle.pentacle.index}`
      : "Unavailable",
    focus: activePentacle?.pentacle?.focus || "Focus unavailable",
    tone: guidance?.tone || "Steady, practical action is favored.",
    psalmRef,
    wisdomRef: wisdom?.ref || "Proverbs 16:3",
  };
}

function updateWeeklyArcPanel(now, derived, referenceMap) {
  if (
    !drawerElements.weeklyArcList ||
    !drawerElements.weeklyArcPrev ||
    !drawerElements.weeklyArcNext ||
    !drawerElements.weeklyArcToday
  ) {
    return;
  }

  const key = `${uiState.presentationMode}|${now.getFullYear()}-${now.getMonth()}-${now.getDate()}|${selectedDayOffset}`;
  if (key === lastWeeklyArcKey) {
    return;
  }
  lastWeeklyArcKey = key;

  drawerElements.weeklyArcToday.disabled = selectedDayOffset === 0;

  const entry = buildWeeklyArcEntry(now, selectedDayOffset, derived, referenceMap);

  drawerElements.weeklyArcList.innerHTML = "";
  const li = document.createElement("li");
  if (entry.isToday) {
    li.classList.add("today");
  }

  const dayLine = document.createElement("p");
  dayLine.classList.add("weekly-arc-day");
  dayLine.textContent = `${entry.dateLabel} (${entry.rulerText})${entry.isToday ? " • Today" : ""}`;
  li.appendChild(dayLine);

  if (uiState.presentationMode !== "guidance") {
    const pentacleLine = document.createElement("p");
    pentacleLine.classList.add("weekly-arc-pentacle");
    pentacleLine.textContent = uiState.presentationMode === "talismans"
      ? `Pentacle ${entry.pentacleLabel}`
      : `Historical key • ${entry.pentacleLabel}`;
    li.appendChild(pentacleLine);
  }

  const focusLine = document.createElement("p");
  focusLine.classList.add("weekly-arc-focus");
  focusLine.textContent = entry.focus;
  li.appendChild(focusLine);

  const citationLine = document.createElement("p");
  citationLine.classList.add("weekly-arc-citation");
  citationLine.textContent = `${entry.psalmRef} • ${entry.wisdomRef}`;
  li.appendChild(citationLine);

  drawerElements.weeklyArcList.appendChild(li);
}

function updateHistoryPanel(now, derived, referenceMap) {
  if (
    !drawerElements.historyWeeklyWindow ||
    !drawerElements.historyWeeklyNarrative ||
    !drawerElements.historyWeeklyMeta ||
    !drawerElements.historyPatternList ||
    !drawerElements.historyReviewStatus ||
    !drawerElements.historyReviewEncouragement ||
    !drawerElements.historyReviewWarning ||
    !drawerElements.historyReviewCarry ||
    !drawerElements.historyReviewScriptureRef ||
    !drawerElements.historyReviewScriptureText ||
    !drawerElements.historyReviewNote ||
    !drawerElements.historyCurrentDay ||
    !drawerElements.historyCurrentSummary ||
    !drawerElements.historyCurrentMeta ||
    !drawerElements.historyCurrentReflection ||
    !drawerElements.historyCurrentClosing ||
    !drawerElements.historyCurrentLaunches ||
    !drawerElements.historyLogList
  ) {
    return;
  }

  const selectedEntry = buildHistoryTimelineEntry(now, selectedDayOffset, derived, referenceMap);
  const recentEntries = getRecordedHistoryEntries(now, derived, referenceMap, 6);
  const weeklySummary = buildWeeklyHistorySummary(now, derived, referenceMap);
  const weeklyReview = buildWeeklyReview(weeklySummary, selectedEntry);
  const key = JSON.stringify({
    weekly: weeklySummary.key,
    review: [
      weeklyReview.encouragement,
      weeklyReview.warning,
      weeklyReview.carryForward,
      weeklyReview.scriptureRef,
      weeklyReview.scriptureText,
      selectedEntry.entry.weeklyReviewStatus || "",
      selectedEntry.entry.weeklyReviewStatusAt || "",
      selectedEntry.entry.weeklyReviewNote || "",
    ].join("|"),
    selected: {
      dateKey: selectedEntry.dateKey,
      updatedAt: selectedEntry.entry.updatedAt || "",
      adoptedAt: selectedEntry.entry.adoptedAt || "",
      completedAt: selectedEntry.entry.completedAt || "",
      reflectionUpdatedAt: selectedEntry.entry.reflectionUpdatedAt || "",
      closingUpdatedAt: selectedEntry.entry.closingUpdatedAt || "",
      launchCount: selectedEntry.launchCount,
    },
    recent: recentEntries.map((entry) => `${entry.dateKey}:${entry.entry.updatedAt || entry.entry.closingCompletedAt || entry.entry.completedAt || entry.entry.adoptedAt || ""}:${entry.launchCount}`),
  });

  if (key === lastHistoryPanelKey) {
    return;
  }
  lastHistoryPanelKey = key;
  lastHistoryWeeklyKey = weeklySummary.key;
  lastHistoryReviewKey = `${selectedEntry.dateKey}|${selectedEntry.entry.weeklyReviewStatus || ""}|${selectedEntry.entry.weeklyReviewStatusAt || ""}`;
  currentWeeklyReviewContext = {
    selectedEntry,
    weeklySummary,
    weeklyReview,
  };

  drawerElements.historyWeeklyWindow.textContent = weeklySummary.windowLabel;
  drawerElements.historyWeeklyNarrative.textContent = weeklySummary.narrative;

  drawerElements.historyWeeklyMeta.innerHTML = "";
  weeklySummary.metaItems.forEach((item) => {
    const li = document.createElement("li");
    li.className = "history-meta-pill is-recorded";
    li.textContent = item;
    drawerElements.historyWeeklyMeta.appendChild(li);
  });

  drawerElements.historyPatternList.innerHTML = "";
  if (weeklySummary.patterns.length) {
    weeklySummary.patterns.forEach((pattern) => {
      const li = document.createElement("li");
      li.className = "history-pattern-item";
      li.textContent = pattern;
      drawerElements.historyPatternList.appendChild(li);
    });
  } else {
    const li = document.createElement("li");
    li.className = "history-pattern-empty";
    li.textContent = "No strong repeated pattern yet. Keep opening and closing the day to make the week readable.";
    drawerElements.historyPatternList.appendChild(li);
  }

  drawerElements.historyReviewStatus.textContent = formatWeeklyReviewStatus(selectedEntry);
  drawerElements.historyReviewEncouragement.textContent = weeklyReview.encouragement;
  drawerElements.historyReviewWarning.textContent = weeklyReview.warning;
  drawerElements.historyReviewCarry.textContent = weeklyReview.carryForward;
  drawerElements.historyReviewScriptureRef.textContent = weeklyReview.scriptureRef;
  drawerElements.historyReviewScriptureText.textContent = sanitizeInlinePassageText(weeklyReview.scriptureText);
  if (
    document.activeElement !== drawerElements.historyReviewNote
    || historyReviewAutofillKey !== selectedEntry.dateKey
  ) {
    drawerElements.historyReviewNote.value = String(selectedEntry.entry.weeklyReviewNote || "").trim();
    historyReviewAutofillKey = selectedEntry.dateKey;
  }

  drawerElements.historyCurrentDay.textContent = `${selectedEntry.dateLabel} (${selectedEntry.rulerText})${selectedEntry.isToday ? " • Today" : ""}`;
  drawerElements.historyCurrentSummary.textContent = selectedEntry.hasRecord
    ? `${selectedEntry.titleLine}. ${selectedEntry.summaryLine}`
    : `No saved entry for this day yet. ${selectedEntry.rulerText} still leans toward ${selectedEntry.focus.toLowerCase()}.`;

  drawerElements.historyCurrentMeta.innerHTML = "";
  const metaItems = selectedEntry.statusBadges.length
    ? selectedEntry.statusBadges
    : ["No recorded action"];
  metaItems.forEach((badge) => {
    const li = document.createElement("li");
    li.textContent = badge;
    li.className = selectedEntry.hasRecord ? "history-meta-pill is-recorded" : "history-meta-pill";
    if (badge === "Completed") {
      li.classList.add("is-complete");
    } else if (badge === "Adopted") {
      li.classList.add("is-adopted");
    } else if (badge === "Reflected") {
      li.classList.add("is-reflected");
    } else if (badge === "Closed") {
      li.classList.add("is-closed");
    } else if (badge.includes("launch")) {
      li.classList.add("is-launch");
    }
    drawerElements.historyCurrentMeta.appendChild(li);
  });

  if (selectedEntry.reflectionSnippet) {
    drawerElements.historyCurrentReflection.hidden = false;
    drawerElements.historyCurrentReflection.textContent = `Reflection: ${selectedEntry.reflectionSnippet}`;
  } else {
    drawerElements.historyCurrentReflection.hidden = true;
    drawerElements.historyCurrentReflection.textContent = "—";
  }

  if (selectedEntry.closingSnippet) {
    drawerElements.historyCurrentClosing.hidden = false;
    drawerElements.historyCurrentClosing.textContent = `Closing: ${selectedEntry.closingSnippet}`;
  } else {
    drawerElements.historyCurrentClosing.hidden = true;
    drawerElements.historyCurrentClosing.textContent = "—";
  }

  const launchSummaryText = describeHistoryLaunches(selectedEntry);
  if (drawerElements.historyCurrentLaunchesSummary) {
    drawerElements.historyCurrentLaunchesSummary.textContent = launchSummaryText;
  } else if (drawerElements.historyCurrentLaunches) {
    drawerElements.historyCurrentLaunches.textContent = launchSummaryText;
  }

  if (drawerElements.historyCurrentLaunchActions) {
    drawerElements.historyCurrentLaunchActions.hidden = !selectedEntry.latestLinkedLaunch?.sessionUrl;
  }

  drawerElements.historyLogList.innerHTML = "";
  if (!recentEntries.length) {
    const empty = document.createElement("li");
    empty.className = "history-log-empty";
    empty.textContent = "No recorded entries yet. Open the day, adopt a practice, or save a closing note to start the trail.";
    drawerElements.historyLogList.appendChild(empty);
    return;
  }

  recentEntries.forEach((entry) => {
    const li = document.createElement("li");
    li.className = "history-log-item";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "history-log-button";
    button.addEventListener("click", () => {
      setSelectedDayOffset(entry.offset);
      setLens("history");
    });

    const top = document.createElement("div");
    top.className = "history-log-button-top";
    const day = document.createElement("span");
    day.className = "history-log-day";
    day.textContent = entry.dateLabel;
    const state = document.createElement("span");
    state.className = "history-log-state";
    state.textContent = entry.statusBadges.join(" • ") || "Saved";
    top.append(day, state);

    const summary = document.createElement("p");
    summary.className = "history-log-summary";
    summary.textContent = entry.summaryLine;

    button.append(top, summary);
    li.appendChild(button);
    drawerElements.historyLogList.appendChild(li);
  });
}

function getProvidenceTimelineEntries(baseDate, derived, referenceMap) {
  const pastWindow = 9;
  const futureWindow = 3;
  const entries = [];

  for (let offset = selectedDayOffset - pastWindow; offset <= selectedDayOffset + futureWindow; offset += 1) {
    entries.push(buildHistoryTimelineEntry(baseDate, offset, derived, referenceMap));
  }

  return entries;
}

function getProvidenceGuideCopy(entries, selectedEntry) {
  const recordedCount = entries.filter((entry) => entry.hasRecord).length;
  const ghostCount = entries.filter((entry) => entry.isGhost).length;

  if (!recordedCount) {
    return "No recorded days yet. The faint outer nodes mark the last week so you can start the trail by opening, reflecting on, or closing today.";
  }

  if (recordedCount < 3) {
    return `${recordedCount} saved ${recordedCount === 1 ? "day is" : "days are"} visible. Faint guide nodes fill the recent week so the map stays readable while the trail is still sparse.`;
  }

  if (ghostCount) {
    return `Brighter outer nodes are recorded days. Faint guide nodes keep the recent week legible while you browse ${selectedEntry.dateLabel}.`;
  }

  return "Select an outer node or a timeline card to revisit a recorded day. Brighter nodes indicate stronger completion and closure.";
}

function updateProvidenceTimeline(now, derived, referenceMap) {
  if (
    !drawerElements.providenceTimeline ||
    !drawerElements.providenceTimelineSummary ||
    !drawerElements.providenceMapGuide ||
    !drawerElements.providenceTimelineList ||
    !drawerElements.providencePrev ||
    !drawerElements.providenceNext ||
    !drawerElements.providenceToday
  ) {
    return;
  }

  const isVisible = uiState.lens === "history";
  drawerElements.providenceTimeline.hidden = !isVisible;
  if (!isVisible) {
    return;
  }

  const entries = getProvidenceTimelineEntries(now, derived, referenceMap);
  const selectedEntry = entries.find((entry) => entry.offset === selectedDayOffset)
    || buildHistoryTimelineEntry(now, selectedDayOffset, derived, referenceMap);
  const recordedCount = entries.filter((entry) => entry.hasRecord).length;
  const closedCount = entries.filter((entry) => entry.closed).length;
  const guideCopy = getProvidenceGuideCopy(entries, selectedEntry);
  const key = JSON.stringify({
    selectedOffset: selectedDayOffset,
    entries: entries.map((entry) => `${entry.dateKey}:${entry.statusBadges.join(",")}:${entry.summaryLine}:${entry.hasRecord ? 1 : 0}`),
  });

  if (key === lastProvidenceTimelineKey) {
    drawerElements.providenceToday.disabled = selectedDayOffset === 0;
    return;
  }
  lastProvidenceTimelineKey = key;

  drawerElements.providenceTimelineSummary.textContent = selectedEntry.hasRecord
    ? `${recordedCount} recorded ${recordedCount === 1 ? "day" : "days"} in view • ${closedCount} closed. Selected ${selectedEntry.dateLabel}: ${selectedEntry.summaryLine}`
    : `${recordedCount} recorded ${recordedCount === 1 ? "day" : "days"} in view. ${selectedEntry.dateLabel} has no saved record yet; ${selectedEntry.rulerText} still leans toward ${selectedEntry.displayFocus}.`;
  drawerElements.providenceMapGuide.textContent = guideCopy;

  drawerElements.providenceToday.disabled = selectedDayOffset === 0;
  drawerElements.providenceTimelineList.innerHTML = "";

  entries.forEach((entry) => {
    const li = document.createElement("li");
    li.className = [
      "providence-timeline-item",
      entry.offset === selectedDayOffset ? "is-selected" : "",
      entry.hasRecord ? "has-record" : "",
      entry.closed ? "is-closed" : "",
      entry.isToday ? "is-today" : "",
    ].filter(Boolean).join(" ");

    const button = document.createElement("button");
    button.type = "button";
    button.className = "providence-timeline-button";
    button.setAttribute("aria-pressed", entry.offset === selectedDayOffset ? "true" : "false");
    button.addEventListener("click", () => {
      setSelectedDayOffset(entry.offset);
      setLens("history");
    });

    const top = document.createElement("div");
    top.className = "providence-timeline-card-top";

    const date = document.createElement("p");
    date.className = "providence-timeline-date";
    date.textContent = `${entry.dateLabel}${entry.isToday ? " • Today" : ""}`;

    const ruler = document.createElement("p");
    ruler.className = "providence-timeline-ruler";
    ruler.textContent = `${entry.rulerText} • ${entry.scriptureRef || entry.psalmRef}`;

    top.append(date, ruler);

    const badges = document.createElement("ul");
    badges.className = "providence-timeline-badges";
    (entry.statusBadges.length ? entry.statusBadges : ["No record"]).forEach((badge) => {
      const badgeItem = document.createElement("li");
      badgeItem.className = "providence-timeline-badge";
      badgeItem.textContent = badge;
      badges.appendChild(badgeItem);
    });

    const summary = document.createElement("p");
    summary.className = "providence-timeline-card-summary";
    summary.textContent = entry.hasRecord
      ? entry.summaryLine
      : `No saved record yet. ${entry.displayFocus}`;

    const meta = document.createElement("p");
    meta.className = "providence-timeline-card-meta";
    meta.textContent = entry.hasRecord
      ? `${entry.titleLine} • ${entry.launchCount ? `${entry.launchCount} launch${entry.launchCount === 1 ? "" : "es"}` : "No launches"}`
      : `${entry.rulerText} guidance • ${entry.pentacleLabel}`;

    button.append(top, badges, summary, meta);
    li.appendChild(button);
    drawerElements.providenceTimelineList.appendChild(li);
  });

  const selectedCard = drawerElements.providenceTimelineList.querySelector(".providence-timeline-item.is-selected");
  selectedCard?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
}

function updateDailyProfile(timeState) {
  if (
    !drawerElements.profileDay ||
    !drawerElements.profilePentacle ||
    !drawerElements.profileFocus ||
    !drawerElements.profileCorrespondences ||
    !drawerElements.profileColor ||
    !drawerElements.profileMetal ||
    !drawerElements.profileAngel
  ) {
    return;
  }

  const dayText = timeState?.dayLabel?.dayText || "Unknown day";
  const rulerText = timeState?.dayLabel?.rulerText || "Unknown ruler";
  const activePentacle = timeState?.active?.pentacle || null;
  const pentacleId = activePentacle
    ? `${activePentacle.planet}-${activePentacle.pentacle.index}`
    : "none";
  const key = `${uiState.presentationMode}-${dayText}-${rulerText}-${pentacleId}`;
  if (key === lastProfileKey) {
    return;
  }
  lastProfileKey = key;

  const correspondences = PLANETARY_CORRESPONDENCES[rulerText] || {
    color: "Unspecified",
    metal: "Unspecified",
    angel: "Unspecified",
  };

  drawerElements.profileDay.textContent = `${dayText} ruled by ${rulerText}`;
  drawerElements.profilePentacle.hidden = uiState.presentationMode === "guidance";
  drawerElements.profileCorrespondences.hidden = uiState.presentationMode === "guidance";
  drawerElements.profilePentacle.textContent = activePentacle
    ? `Historical key: ${activePentacle.planet} #${activePentacle.pentacle.index}`
    : "Historical key unavailable.";
  drawerElements.profileFocus.textContent = activePentacle?.pentacle?.focus
    ? `Suggested focus: ${activePentacle.pentacle.focus}`
    : "Suggested focus: center attention on deliberate, disciplined action.";
  drawerElements.profileColor.textContent = correspondences.color;
  drawerElements.profileMetal.textContent = correspondences.metal;
  drawerElements.profileAngel.textContent = correspondences.angel;
}

function getLifeWheelSeedScores(lifeConfig) {
  const scores = {};
  (lifeConfig?.domains || []).forEach((domain) => {
    scores[domain.id] = Math.max(0, Math.min(100, Number(domain.seedScore) || 0));
  });
  return scores;
}

function loadLifeWheelScores(lifeConfig) {
  const seeds = getLifeWheelSeedScores(lifeConfig);
  const storageKey = String(lifeConfig?.storageKey || "").trim();

  if (!storageKey || typeof window === "undefined" || !window.localStorage) {
    return seeds;
  }

  try {
    const storedRaw = window.localStorage.getItem(storageKey);
    if (!storedRaw) {
      window.localStorage.setItem(storageKey, JSON.stringify(seeds));
      return seeds;
    }

    const stored = JSON.parse(storedRaw);
    const merged = { ...seeds };
    Object.keys(seeds).forEach((domainId) => {
      if (Object.prototype.hasOwnProperty.call(stored, domainId)) {
        merged[domainId] = Math.max(0, Math.min(100, Number(stored[domainId]) || seeds[domainId]));
      }
    });
    return merged;
  } catch (_error) {
    return seeds;
  }
}

function getLifeDomainShortLabel(domainId, fallbackName) {
  return {
    mind: "Mind",
    body: "Body",
    relationships: "Relations",
    stewardship: "Steward",
    vocation: "Vocation",
    household: "Home",
    contemplation: "Contempl.",
  }[domainId] || fallbackName || domainId;
}

function formatDateStorageKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateStorageKey(dateKey) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateKey || ""));
  if (!match) {
    return null;
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number.parseInt(yearText, 10);
  const monthIndex = Number.parseInt(monthText, 10) - 1;
  const day = Number.parseInt(dayText, 10);
  if (
    Number.isNaN(year) ||
    Number.isNaN(monthIndex) ||
    Number.isNaN(day)
  ) {
    return null;
  }

  return new Date(year, monthIndex, day, 12, 0, 0, 0);
}

function getNormalizedMidday(date) {
  const normalized = new Date(date);
  normalized.setHours(12, 0, 0, 0);
  return normalized;
}

function diffCalendarDays(baseDate, targetDate) {
  const baseMidday = getNormalizedMidday(baseDate).getTime();
  const targetMidday = getNormalizedMidday(targetDate).getTime();
  return Math.round((targetMidday - baseMidday) / MS_PER_DAY);
}

function randomBase64Url(byteLength = 18) {
  if (typeof window === "undefined" || !window.crypto?.getRandomValues) {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  const bytes = new Uint8Array(byteLength);
  window.crypto.getRandomValues(bytes);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function clearClockAuthRefreshTimer() {
  if (clockAuthRefreshTimer && typeof window !== "undefined") {
    window.clearTimeout(clockAuthRefreshTimer);
    clockAuthRefreshTimer = null;
  }
}

function prefersClockAuthBridge() {
  if (typeof window === "undefined") {
    return false;
  }
  const params = new URLSearchParams(window.location.search || "");
  const requested = String(params.get(CLOCK_AUTH_FORCE_BRIDGE_PARAM) || "").trim().toLowerCase();
  return requested === "1" || requested === "true" || requested === "yes";
}

function getClockAuthBridgeOrigin() {
  try {
    return new URL(CLOCK_AUTH_BRIDGE_URL).origin;
  } catch (_error) {
    return "https://pericopeai.com";
  }
}

function getClockAuthTokenExpiry(token) {
  if (typeof token !== "string" || !token.includes(".")) {
    return 0;
  }
  const parts = token.split(".");
  if (parts.length < 2) {
    return 0;
  }
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const normalized = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`;
    const payload = JSON.parse(window.atob(normalized));
    return Number(payload?.exp || 0) * 1000;
  } catch (_error) {
    return 0;
  }
}

function persistClockBridgeSession(profile, token) {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  const expiresAt = getClockAuthTokenExpiry(token);
  if (!profile?.sub || !token || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    window.localStorage.removeItem(CLOCK_AUTH_BRIDGE_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(
    CLOCK_AUTH_BRIDGE_STORAGE_KEY,
    JSON.stringify({
      profile: {
        sub: String(profile.sub || "").trim(),
        name: String(profile.name || profile.preferred_username || profile.email || "").trim(),
        email: String(profile.email || "").trim(),
      },
      token,
      expiresAt,
    })
  );
}

function clearClockBridgeSession() {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.removeItem(CLOCK_AUTH_BRIDGE_STORAGE_KEY);
  }
}

function restoreClockBridgeSession() {
  if (typeof window === "undefined" || !window.localStorage) {
    return false;
  }
  try {
    const raw = window.localStorage.getItem(CLOCK_AUTH_BRIDGE_STORAGE_KEY);
    if (!raw) {
      return false;
    }
    const parsed = JSON.parse(raw);
    const profile = parsed?.profile || null;
    const token = typeof parsed?.token === "string" ? parsed.token : "";
    const expiresAt = Number(parsed?.expiresAt || 0);
    if (!profile?.sub || !token || !Number.isFinite(expiresAt) || expiresAt <= Date.now() + 15_000) {
      clearClockBridgeSession();
      return false;
    }
    applyClockAuthProfile(profile, {
      token,
      bridge: true,
      error: "",
    });
    return true;
  } catch (_error) {
    clearClockBridgeSession();
    return false;
  }
}

function closeClockAuthPopup() {
  if (clockAuthPopup && !clockAuthPopup.closed) {
    clockAuthPopup.close();
  }
  clockAuthPopup = null;
}

function resetClockAuthToGuest(error = "") {
  clearClockAuthRefreshTimer();
  clearClockBridgeSession();
  setClockAuthState({
    mode: "guest",
    authenticated: false,
    token: null,
    profile: null,
    devFake: false,
    bridge: false,
    error,
  });
}

function handleClockBridgeMessage(event) {
  if (typeof window === "undefined") {
    return;
  }
  if (event.origin !== getClockAuthBridgeOrigin()) {
    return;
  }
  const data = event.data || {};
  if (data?.source !== CLOCK_AUTH_BRIDGE_MESSAGE_SOURCE) {
    return;
  }

  closeClockAuthPopup();

  if (data.type === "success") {
    const profile = data.profile || {};
    const token = typeof data.token === "string" ? data.token : "";
    if (!profile?.sub || !token) {
      resetClockAuthToGuest("Sign-in did not return a usable account session.");
      void bootstrapHistorySync();
      return;
    }
    persistClockBridgeSession(profile, token);
    applyClockAuthProfile(profile, {
      token,
      bridge: true,
      error: "",
    });
    clockAuthReady = true;
    void bootstrapHistorySync();
    return;
  }

  if (data.type === "logout") {
    resetClockAuthToGuest("");
    clockAuthReady = true;
    void bootstrapHistorySync();
    return;
  }

  if (data.type === "error") {
    resetClockAuthToGuest(
      `Sign-in could not be completed${data.message ? `: ${data.message}` : "."}`
    );
    clockAuthReady = true;
    void bootstrapHistorySync();
  }
}

function setupClockBridgeMessaging() {
  if (clockBridgeListenerInstalled || typeof window === "undefined") {
    return;
  }
  window.addEventListener("message", handleClockBridgeMessage);
  clockBridgeListenerInstalled = true;
}

function startClockBridgeLogin() {
  if (typeof window === "undefined") {
    return;
  }
  const bridgeUrl = new URL(CLOCK_AUTH_BRIDGE_URL);
  bridgeUrl.searchParams.set("opener_origin", window.location.origin);
  bridgeUrl.searchParams.set("source", "solomonic-clock");
  clockAuthPopup = window.open(
    bridgeUrl.toString(),
    "truevineos-clock-auth",
    "popup=yes,width=560,height=760,resizable=yes,scrollbars=yes"
  );
  if (!clockAuthPopup) {
    setClockAuthState({
      error: " Sign-in popup was blocked. Allow popups for this site and try again.",
    });
    return;
  }
  setClockAuthState({ error: "" });
  try {
    clockAuthPopup.focus();
  } catch (_error) {
    // ignore focus failures
  }
}

function startClockBridgeLogout() {
  if (typeof window === "undefined") {
    return;
  }
  const bridgeUrl = new URL(CLOCK_AUTH_BRIDGE_URL);
  bridgeUrl.searchParams.set("opener_origin", window.location.origin);
  bridgeUrl.searchParams.set("source", "solomonic-clock");
  bridgeUrl.searchParams.set("action", "logout");
  clockAuthPopup = window.open(
    bridgeUrl.toString(),
    "truevineos-clock-auth",
    "popup=yes,width=560,height=760,resizable=yes,scrollbars=yes"
  );
  if (clockAuthPopup) {
    try {
      clockAuthPopup.focus();
    } catch (_error) {
      // ignore focus failures
    }
  }
}

function getClockAuthRedirectUri() {
  if (typeof window === "undefined") {
    return undefined;
  }
  const url = new URL(window.location.href);
  if (url.pathname === "/web/clock_visualizer.html") {
    url.pathname = "/clock";
  }
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  url.searchParams.delete("session_state");
  return `${url.origin}${url.pathname}${url.search}${url.hash}`;
}

function removeClockAuthParamsFromUrl() {
  if (typeof window === "undefined") {
    return;
  }
  const url = new URL(window.location.href);
  const keys = ["code", "state", "session_state", "iss"];
  let mutated = false;
  keys.forEach((key) => {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      mutated = true;
    }
  });
  if (mutated) {
    window.history.replaceState(null, document.title, `${url.pathname}${url.search}${url.hash}`);
  }
}

function getClockDevFakeProfileFromUrl() {
  if (typeof window === "undefined" || !CLOCK_DEV_FAKE_AUTH_ENABLED) {
    return null;
  }
  const params = new URLSearchParams(window.location.search || "");
  const sub = String(params.get(CLOCK_DEV_AUTH_SUB_PARAM) || "").trim();
  if (!sub) {
    return null;
  }
  const name = String(params.get(CLOCK_DEV_AUTH_NAME_PARAM) || "").trim() || "Local Clock User";
  return {
    sub,
    name,
    email: "",
  };
}

function setClockAuthState(nextState) {
  clockAuthState = {
    ...clockAuthState,
    ...nextState,
  };
  updateAccountUi();
}

function getClockAuthDisplayName() {
  const profile = clockAuthState.profile || {};
  return String(profile.name || profile.email || profile.sub || "").trim();
}

function updateAccountUi() {
  if (!drawerElements.accountStatus) {
    return;
  }

  if (CLOCK_AUTH_DISABLED) {
    drawerElements.accountStatus.textContent = "Account sign-in is disabled here. History remains local to this browser.";
    if (drawerElements.accountSignIn) {
      drawerElements.accountSignIn.hidden = true;
    }
    if (drawerElements.accountSignOut) {
      drawerElements.accountSignOut.hidden = true;
    }
    return;
  }

  const authenticated = Boolean(clockAuthState.authenticated && clockAuthState.profile?.sub);
  const displayName = getClockAuthDisplayName();

  if (authenticated) {
    const accountKind = clockAuthState.devFake
      ? "Local dev account"
      : (clockAuthState.bridge ? "Signed in via Pericope" : "Signed in");
    drawerElements.accountStatus.textContent = displayName
      ? `${accountKind}: ${displayName}. History is bound to your account and can follow you across browsers.`
      : `${accountKind}. History is bound to your account and can follow you across browsers.`;
    if (drawerElements.accountSignIn) {
      drawerElements.accountSignIn.hidden = true;
    }
    if (drawerElements.accountSignOut) {
      drawerElements.accountSignOut.hidden = false;
    }
    return;
  }

  const errorText = clockAuthState.error ? ` ${clockAuthState.error}` : "";
  drawerElements.accountStatus.textContent = `Guest mode. History is saved in this browser until you sign in.${errorText}`;
  if (drawerElements.accountSignIn) {
    drawerElements.accountSignIn.hidden = false;
  }
  if (drawerElements.accountSignOut) {
    drawerElements.accountSignOut.hidden = true;
  }
}

function scheduleClockAuthRefresh() {
  clearClockAuthRefreshTimer();
  if (typeof window === "undefined" || !clockKeycloak?.tokenParsed?.exp) {
    return;
  }

  const expiresAt = Number(clockKeycloak.tokenParsed.exp || 0) * 1000;
  if (!Number.isFinite(expiresAt) || expiresAt <= 0) {
    return;
  }
  const timeoutMs = Math.max(expiresAt - Date.now() - 60_000, 5_000);
  clockAuthRefreshTimer = window.setTimeout(async () => {
    try {
      await clockKeycloak.updateToken(60);
      setClockAuthState({ token: clockKeycloak.token || null, error: "" });
      scheduleClockAuthRefresh();
      void bootstrapHistorySync();
    } catch (_error) {
      clearClockAuthRefreshTimer();
      setClockAuthState({
        mode: "guest",
        authenticated: false,
        token: null,
        profile: null,
        devFake: false,
        error: "Session refresh failed. Sign in again to keep account history syncing.",
      });
      void bootstrapHistorySync();
    }
  }, timeoutMs);
}

async function getClockAuthAccessToken() {
  if (!clockAuthState.authenticated) {
    return null;
  }

  if (clockAuthState.devFake) {
    return null;
  }

  if (clockAuthState.bridge) {
    const token = typeof clockAuthState.token === "string" ? clockAuthState.token : "";
    const expiresAt = getClockAuthTokenExpiry(token);
    if (token && expiresAt > Date.now() + 15_000) {
      return token;
    }
    resetClockAuthToGuest("Session expired. Sign in again to resume account history sync.");
    return null;
  }

  try {
    if (clockKeycloak?.authenticated) {
      await clockKeycloak.updateToken(30);
      const token = clockKeycloak.token || null;
      setClockAuthState({ token, error: "" });
      scheduleClockAuthRefresh();
      return token;
    }
  } catch (_error) {
    setClockAuthState({
      mode: "guest",
      authenticated: false,
      token: null,
      profile: null,
      devFake: false,
      error: "Session expired. Sign in again to resume account history sync.",
    });
  }

  return null;
}

function applyClockAuthProfile(profile, options = {}) {
  setClockAuthState({
    mode: options.devFake ? "user" : (profile?.sub ? "user" : "guest"),
    authenticated: Boolean(profile?.sub),
    token: options.token || null,
    profile: profile?.sub ? {
      sub: String(profile.sub || "").trim(),
      name: String(profile.name || profile.preferred_username || profile.email || "").trim(),
      email: String(profile.email || "").trim(),
    } : null,
    devFake: Boolean(options.devFake),
    bridge: Boolean(options.bridge),
    error: options.error || "",
  });
}

async function initialiseClockAuth() {
  updateAccountUi();
  setupClockBridgeMessaging();

  if (CLOCK_AUTH_DISABLED || typeof window === "undefined") {
    clockAuthReady = true;
    return false;
  }

  const devProfile = getClockDevFakeProfileFromUrl();
  if (devProfile) {
    applyClockAuthProfile(devProfile, { devFake: true });
    clockAuthReady = true;
    return true;
  }

  if (restoreClockBridgeSession()) {
    clockAuthReady = true;
    return true;
  }

  if (prefersClockAuthBridge()) {
    clockAuthReady = true;
    return false;
  }

  if (typeof window.Keycloak !== "function") {
    setClockAuthState({
      error: CLOCK_DEV_FAKE_AUTH_ENABLED ? "" : " Sign-in is temporarily unavailable in this browser.",
    });
    clockAuthReady = true;
    return false;
  }

  try {
    clockKeycloak = new window.Keycloak({
      url: CLOCK_AUTH_URL,
      realm: CLOCK_AUTH_REALM,
      clientId: CLOCK_AUTH_CLIENT_ID,
      storage: "localStorage",
    });

    const authenticated = await clockKeycloak.init({
      onLoad: "check-sso",
      pkceMethod: "S256",
      responseMode: "query",
      flow: "standard",
      checkLoginIframe: false,
      silentCheckSsoFallback: true,
      thirdPartyCookies: false,
      silentCheckSsoRedirectUri: `${window.location.origin}/web/keycloak-silent-check-sso.html`,
      redirectUri: getClockAuthRedirectUri(),
    });

    const hasToken = Boolean(clockKeycloak?.token);
    if (authenticated || hasToken) {
      removeClockAuthParamsFromUrl();
      scheduleClockAuthRefresh();
      applyClockAuthProfile(clockKeycloak.tokenParsed || {}, {
        token: clockKeycloak.token || null,
      });
      clockAuthReady = true;
      return true;
    }

    applyClockAuthProfile(null, {});
    clockAuthReady = true;
    return false;
  } catch (_error) {
    setClockAuthState({
      mode: "guest",
      authenticated: false,
      token: null,
      profile: null,
      devFake: false,
      error: " Sign-in could not be initialized; guest mode is still available.",
    });
    clearClockAuthRefreshTimer();
    clockAuthReady = true;
    return false;
  }
}

function startClockLogin() {
  if (CLOCK_AUTH_DISABLED || typeof window === "undefined") {
    return;
  }

  if (CLOCK_DEV_FAKE_AUTH_ENABLED) {
    const url = new URL(window.location.href);
    if (!url.searchParams.get(CLOCK_DEV_AUTH_SUB_PARAM)) {
      url.searchParams.set(CLOCK_DEV_AUTH_SUB_PARAM, "clock-dev-user");
    }
    if (!url.searchParams.get(CLOCK_DEV_AUTH_NAME_PARAM)) {
      url.searchParams.set(CLOCK_DEV_AUTH_NAME_PARAM, "Local Clock User");
    }
    window.location.assign(url.toString());
    return;
  }

  if (prefersClockAuthBridge()) {
    startClockBridgeLogin();
    return;
  }

  if (!clockKeycloak) {
    return;
  }

  void clockKeycloak.login({ redirectUri: getClockAuthRedirectUri() });
}

function startClockLogout() {
  if (typeof window === "undefined") {
    return;
  }

  if (CLOCK_DEV_FAKE_AUTH_ENABLED && clockAuthState.devFake) {
    const url = new URL(window.location.href);
    url.searchParams.delete(CLOCK_DEV_AUTH_SUB_PARAM);
    url.searchParams.delete(CLOCK_DEV_AUTH_NAME_PARAM);
    window.location.assign(url.toString());
    return;
  }

  if (clockAuthState.bridge || prefersClockAuthBridge()) {
    startClockBridgeLogout();
    resetClockAuthToGuest("");
    void bootstrapHistorySync();
    return;
  }

  if (!clockKeycloak) {
    return;
  }

  clearClockAuthRefreshTimer();
  void clockKeycloak.logout({ redirectUri: getClockAuthRedirectUri() });
}

function setupAccountControls() {
  drawerElements.accountSignIn?.addEventListener("click", () => {
    startClockLogin();
  });
  drawerElements.accountSignOut?.addEventListener("click", () => {
    startClockLogout();
  });
  updateAccountUi();
}

function getGuestHistorySyncIdentity() {
  if (historySyncIdentity) {
    return historySyncIdentity;
  }

  if (typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  let clientId = String(window.localStorage.getItem(HISTORY_CLIENT_ID_STORAGE_KEY) || "").trim();
  let clientKey = String(window.localStorage.getItem(HISTORY_CLIENT_KEY_STORAGE_KEY) || "").trim();

  if (!/^[A-Za-z0-9_-]{16,120}$/.test(clientId)) {
    clientId = `tvos_${randomBase64Url(12)}`;
    window.localStorage.setItem(HISTORY_CLIENT_ID_STORAGE_KEY, clientId);
  }

  if (clientKey.length < 24) {
    clientKey = randomBase64Url(24);
    window.localStorage.setItem(HISTORY_CLIENT_KEY_STORAGE_KEY, clientKey);
  }

  historySyncIdentity = { clientId, clientKey };
  return historySyncIdentity;
}

async function getHistorySyncAccess() {
  if (clockAuthState.authenticated && clockAuthState.profile?.sub) {
    const token = await getClockAuthAccessToken();
    if (token) {
      return {
        mode: "user",
        scopeKey: `user:${clockAuthState.profile.sub}`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        userId: clockAuthState.profile.sub,
      };
    }

    if (clockAuthState.devFake) {
      return {
        mode: "user",
        scopeKey: `user:${clockAuthState.profile.sub}`,
        headers: {
          [DEV_AUTH_SUB_HEADER]: clockAuthState.profile.sub,
          [DEV_AUTH_NAME_HEADER]: getClockAuthDisplayName() || "Local Clock User",
        },
        userId: clockAuthState.profile.sub,
      };
    }
  }

  const identity = getGuestHistorySyncIdentity();
  if (!identity) {
    return null;
  }

  return {
    mode: "guest",
    scopeKey: `guest:${identity.clientId}`,
    headers: {
      [HISTORY_CLIENT_HEADER]: identity.clientId,
      [HISTORY_KEY_HEADER]: identity.clientKey,
    },
    clientId: identity.clientId,
  };
}

function getDailyActionEntryTimestamp(entry) {
  if (!entry || typeof entry !== "object") {
    return "";
  }

  return [
    entry.updatedAt,
    entry.closingUpdatedAt,
    entry.closingCompletedAt,
    entry.lastLaunchAt,
    entry.reflectionUpdatedAt,
    entry.completedAt,
    entry.adoptedAt,
  ]
    .map((value) => String(value || "").trim())
    .find(Boolean) || "";
}

function serializeDailyActionState(state) {
  const normalized = normalizeDailyActionState(state);
  const ordered = {};
  Object.keys(normalized)
    .sort()
    .forEach((dateKey) => {
      ordered[dateKey] = normalized[dateKey];
    });
  return JSON.stringify(ordered);
}

function mergeDailyActionEntries(serverEntry, clientEntry) {
  const left = normalizeDailyActionEntry(serverEntry);
  const right = normalizeDailyActionEntry(clientEntry);
  const preferRight = getDailyActionEntryTimestamp(right) >= getDailyActionEntryTimestamp(left);
  const merged = preferRight ? { ...left, ...right } : { ...right, ...left };
  const launchesByKey = new Map();

  [left, right].forEach((entry) => {
    (entry.launches || []).forEach((launch) => {
      const key = [launch.launchedAt, launch.mode, launch.promptId].join("|");
      const mergedLaunch = {
        ...(launchesByKey.get(key) || {}),
        ...launch,
      };
      const normalized = normalizeDailyActionLaunch(mergedLaunch);
      if (normalized) {
        launchesByKey.set(key, normalized);
      }
    });
  });
  const launches = Array.from(launchesByKey.values());

  if (launches.length) {
    merged.launches = launches.slice(-MAX_DAILY_ACTION_LAUNCHES);
    merged.lastLaunchAt = merged.launches[merged.launches.length - 1].launchedAt || "";
  }

  return normalizeDailyActionEntry(merged);
}

function mergeDailyActionStates(localState, remoteState) {
  const left = normalizeDailyActionState(localState);
  const right = normalizeDailyActionState(remoteState);
  const merged = { ...left };

  Object.keys(right).forEach((dateKey) => {
    merged[dateKey] = mergeDailyActionEntries(left[dateKey], right[dateKey]);
  });

  return normalizeDailyActionState(merged);
}

function normalizeDailyActionLaunch(launch) {
  if (!launch || typeof launch !== "object") {
    return null;
  }

  return pruneEmptyFields({
    launchedAt: String(launch.launchedAt || launch.createdAt || "").trim(),
    mode: String(launch.mode || "").trim(),
    promptId: String(launch.promptId || launch.prompt_id || "").trim(),
    message: toInlineSnippet(launch.message || "", 180),
    clockDay: String(launch.clockDay || launch.clock_day || "").trim(),
    bundleKind: String(launch.bundleKind || launch.bundle_kind || "").trim(),
    bundleRef: String(launch.bundleRef || launch.bundle_ref || "").trim(),
    reflectionIncluded: Boolean(launch.reflectionIncluded),
    source: String(launch.source || "solomonic_clock").trim(),
    sessionId: String(launch.sessionId || launch.session_id || "").trim(),
    sessionUrl: String(launch.sessionUrl || launch.session_url || "").trim(),
    sessionPersona: String(launch.sessionPersona || launch.session_persona || "").trim(),
    sessionPreview: toInlineSnippet(launch.sessionPreview || launch.session_preview || "", 180),
    sessionStartedAt: String(launch.sessionStartedAt || launch.session_started_at || "").trim(),
    sessionLastActiveAt: String(launch.sessionLastActiveAt || launch.session_last_active_at || "").trim(),
    linkedAt: String(launch.linkedAt || launch.linked_at || "").trim(),
  });
}

function normalizeDailyActionEntry(entry) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    return {};
  }

  const weakestDomainScore = String(entry.weakestDomainScore ?? "").trim();
  const launches = Array.isArray(entry.launches)
    ? entry.launches
      .map((launch) => normalizeDailyActionLaunch(launch))
      .filter(Boolean)
      .slice(-MAX_DAILY_ACTION_LAUNCHES)
    : [];

  return pruneEmptyFields({
    adoptedAt: String(entry.adoptedAt || "").trim(),
    completedAt: String(entry.completedAt || "").trim(),
    openingCompletedAt: String(entry.openingCompletedAt || "").trim(),
    openingIntention: String(entry.openingIntention || "").trim(),
    openingScriptureRef: String(entry.openingScriptureRef || "").trim(),
    closingCompletedAt: String(entry.closingCompletedAt || "").trim(),
    closingSummary: String(entry.closingSummary || "").trim(),
    closingGratitude: String(entry.closingGratitude || "").trim(),
    closingDifficulty: String(entry.closingDifficulty || "").trim(),
    closingCarryForward: String(entry.closingCarryForward || "").trim(),
    closingUpdatedAt: String(entry.closingUpdatedAt || "").trim(),
    weeklyReviewStatus: String(entry.weeklyReviewStatus || "").trim(),
    weeklyReviewStatusAt: String(entry.weeklyReviewStatusAt || "").trim(),
    weeklyReviewNote: String(entry.weeklyReviewNote || "").trim(),
    weeklyReviewEncouragement: String(entry.weeklyReviewEncouragement || "").trim(),
    weeklyReviewWarning: String(entry.weeklyReviewWarning || "").trim(),
    weeklyReviewCarryForward: String(entry.weeklyReviewCarryForward || "").trim(),
    weeklyReviewScriptureRef: String(entry.weeklyReviewScriptureRef || "").trim(),
    reflection: String(entry.reflection || "").trim(),
    reflectionUpdatedAt: String(entry.reflectionUpdatedAt || "").trim(),
    updatedAt: String(entry.updatedAt || "").trim(),
    guidedPrompt: String(entry.guidedPrompt || "").trim(),
    label: String(entry.label || "").trim(),
    dayDisplay: String(entry.dayDisplay || "").trim(),
    rulerText: String(entry.rulerText || "").trim(),
    activeFocus: String(entry.activeFocus || "").trim(),
    activePentacleLabel: String(entry.activePentacleLabel || "").trim(),
    psalmRef: String(entry.psalmRef || "").trim(),
    wisdomRef: String(entry.wisdomRef || "").trim(),
    solomonicRef: String(entry.solomonicRef || "").trim(),
    lifeDomainFocus: String(entry.lifeDomainFocus || "").trim(),
    weakestDomain: String(entry.weakestDomain || "").trim(),
    weakestDomainScore: weakestDomainScore && Number.isFinite(Number(weakestDomainScore))
      ? Math.max(0, Math.min(100, Number(weakestDomainScore)))
      : null,
    ruleOfLife: entry.ruleOfLife && typeof entry.ruleOfLife === "object"
      ? pruneEmptyFields({
        virtue: String(entry.ruleOfLife.virtue || "").trim(),
        domain: String(entry.ruleOfLife.domain || "").trim(),
        morning: String(entry.ruleOfLife.morning || "").trim(),
        midday: String(entry.ruleOfLife.midday || "").trim(),
        evening: String(entry.ruleOfLife.evening || "").trim(),
        summary: String(entry.ruleOfLife.summary || "").trim(),
        repairNote: String(entry.ruleOfLife.repairNote || "").trim(),
        scriptureRef: String(
          entry.ruleOfLife.scriptureRef ||
          entry.ruleOfLife.scripture_ref ||
          entry.ruleOfLife.psalmRef ||
          ""
        ).trim(),
      })
      : null,
    launches,
    lastLaunchAt: launches.length ? launches[launches.length - 1].launchedAt : "",
  });
}

function normalizeDailyActionState(state) {
  if (!state || typeof state !== "object" || Array.isArray(state)) {
    return {};
  }

  const nextState = {};
  Object.entries(state).forEach(([dateKey, entry]) => {
    if (!parseDateStorageKey(dateKey)) {
      return;
    }
    nextState[dateKey] = normalizeDailyActionEntry(entry);
  });
  return nextState;
}

function loadDailyActionState() {
  if (dailyActionStateCache) {
    return dailyActionStateCache;
  }

  if (typeof window === "undefined" || !window.localStorage) {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(DAILY_ACTION_STORAGE_KEY);
    if (!raw) {
      dailyActionStateCache = {};
      return dailyActionStateCache;
    }
    const parsed = JSON.parse(raw);
    dailyActionStateCache = normalizeDailyActionState(parsed);
    return dailyActionStateCache;
  } catch (_error) {
    dailyActionStateCache = {};
    return dailyActionStateCache;
  }
}

function saveDailyActionState(state) {
  dailyActionStateCache = normalizeDailyActionState(state);

  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.setItem(DAILY_ACTION_STORAGE_KEY, JSON.stringify(dailyActionStateCache));
  } catch (_error) {
    // Ignore storage failures in standalone mode.
  }
}

function getDailyOpeningDismissedDate() {
  if (typeof window === "undefined" || !window.localStorage) {
    return "";
  }
  return String(window.localStorage.getItem(DAILY_OPENING_DISMISSED_STORAGE_KEY) || "").trim();
}

function setDailyOpeningDismissedDate(dateKey) {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  if (dateKey) {
    window.localStorage.setItem(DAILY_OPENING_DISMISSED_STORAGE_KEY, dateKey);
  } else {
    window.localStorage.removeItem(DAILY_OPENING_DISMISSED_STORAGE_KEY);
  }
}

async function fetchHistorySyncState(access) {
  if (typeof window === "undefined" || typeof window.fetch !== "function" || !access) {
    return null;
  }

  const response = await window.fetch(HISTORY_SYNC_API_PATH, {
    method: "GET",
    headers: access.headers,
    credentials: "same-origin",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`History sync GET failed: ${response.status}`);
  }

  const payload = await response.json();
  return normalizeDailyActionState(payload?.state || {});
}

async function pushHistorySyncState(access, state) {
  if (typeof window === "undefined" || typeof window.fetch !== "function" || !access) {
    return null;
  }

  const response = await window.fetch(HISTORY_SYNC_API_PATH, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...access.headers,
    },
    credentials: "same-origin",
    body: JSON.stringify({ state: normalizeDailyActionState(state) }),
  });

  if (!response.ok) {
    throw new Error(`History sync POST failed: ${response.status}`);
  }

  const payload = await response.json();
  return normalizeDailyActionState(payload?.state || {});
}

async function flushHistorySync() {
  const access = await getHistorySyncAccess();
  if (!access) {
    return;
  }

  historySyncScopeKey = access.scopeKey;
  const serialized = serializeDailyActionState(loadDailyActionState());
  if (historySyncReady && serialized === historySyncLastSerializedState) {
    return;
  }

  if (historySyncInFlight) {
    historySyncNeedsFlush = true;
    return historySyncInFlight;
  }

  historySyncNeedsFlush = false;
  const requestScopeKey = access.scopeKey;

  historySyncInFlight = pushHistorySyncState(access, dailyActionStateCache || {}).then((remoteState) => {
    if (remoteState && historySyncScopeKey === requestScopeKey) {
      saveDailyActionState(mergeDailyActionStates(dailyActionStateCache || {}, remoteState));
      historySyncLastSerializedState = serializeDailyActionState(dailyActionStateCache || {});
    }
  }).catch((_error) => {
    // Keep the local loop working even if the sync endpoint is unavailable.
  }).finally(() => {
    historySyncInFlight = null;
    if (historySyncNeedsFlush) {
      historySyncNeedsFlush = false;
      void flushHistorySync();
    }
  });

  return historySyncInFlight;
}

function scheduleHistorySync(delayMs = 700) {
  if (typeof window === "undefined") {
    return;
  }

  if (historySyncPendingTimer) {
    window.clearTimeout(historySyncPendingTimer);
  }

  historySyncPendingTimer = window.setTimeout(() => {
    historySyncPendingTimer = null;
    void flushHistorySync();
  }, delayMs);
}

async function bootstrapHistorySync() {
  const access = await getHistorySyncAccess();
  if (!access) {
    historySyncReady = true;
    return;
  }

  try {
    historySyncScopeKey = access.scopeKey;
    const remoteState = await fetchHistorySyncState(access);
    const merged = mergeDailyActionStates(loadDailyActionState(), remoteState || {});
    saveDailyActionState(merged);
    historySyncLastSerializedState = serializeDailyActionState(merged);
    await flushHistorySync();
  } catch (_error) {
    historySyncLastSerializedState = serializeDailyActionState(loadDailyActionState());
  } finally {
    historySyncReady = true;
  }

  schedulePericopeSessionSync(900);
}

function getDailyActionEntry(dateKey) {
  const state = loadDailyActionState();
  const entry = state[dateKey];
  return normalizeDailyActionEntry(entry);
}

function patchDailyActionEntry(dateKey, patch) {
  const state = loadDailyActionState();
  const current = state[dateKey] && typeof state[dateKey] === "object" ? state[dateKey] : {};
  state[dateKey] = normalizeDailyActionEntry({
    ...current,
    ...patch,
    updatedAt: patch?.updatedAt || new Date().toISOString(),
  });
  saveDailyActionState(state);
  scheduleHistorySync();
  return state[dateKey];
}

function patchDailyActionLaunch(dateKey, launchKey, patch = {}, entryPatch = {}) {
  const state = loadDailyActionState();
  const current = state[dateKey] && typeof state[dateKey] === "object" ? state[dateKey] : {};
  const launches = Array.isArray(current.launches) ? current.launches.slice() : [];
  let mutated = false;

  const nextLaunches = launches.map((launch) => {
    if (buildDailyActionLaunchKey(launch) !== launchKey) {
      return launch;
    }
    mutated = true;
    return normalizeDailyActionLaunch({
      ...launch,
      ...patch,
    });
  }).filter(Boolean);

  if (!mutated) {
    return normalizeDailyActionEntry(current);
  }

  state[dateKey] = normalizeDailyActionEntry({
    ...current,
    ...entryPatch,
    launches: nextLaunches,
    updatedAt: new Date().toISOString(),
  });
  saveDailyActionState(state);
  scheduleHistorySync();
  return state[dateKey];
}

function appendDailyActionLaunch(dateKey, launchPatch = {}, entryPatch = {}) {
  const state = loadDailyActionState();
  const current = state[dateKey] && typeof state[dateKey] === "object" ? state[dateKey] : {};
  const launches = Array.isArray(current.launches) ? current.launches.slice(-MAX_DAILY_ACTION_LAUNCHES + 1) : [];
  const normalizedLaunch = normalizeDailyActionLaunch({
    ...launchPatch,
    launchedAt: launchPatch?.launchedAt || new Date().toISOString(),
  });

  if (normalizedLaunch) {
    launches.push(normalizedLaunch);
  }

  state[dateKey] = normalizeDailyActionEntry({
    ...current,
    ...entryPatch,
    launches,
    updatedAt: new Date().toISOString(),
  });
  saveDailyActionState(state);
  scheduleHistorySync();
  return state[dateKey];
}

async function fetchPericopeHistorySessions(access, limit = 12) {
  if (
    typeof window === "undefined"
    || typeof window.fetch !== "function"
    || !access
    || access.mode !== "user"
    || !access.headers?.Authorization
  ) {
    return [];
  }

  const response = await window.fetch(
    `${PERICOPE_HISTORY_SESSIONS_API_PATH}?limit=${encodeURIComponent(Math.max(1, Math.min(20, limit)))}`,
    {
      method: "GET",
      headers: access.headers,
      credentials: "same-origin",
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(`Pericope history sessions GET failed: ${response.status}`);
  }

  const payload = await response.json();
  return Array.isArray(payload?.sessions) ? payload.sessions : [];
}

function collectPericopeSessionCandidates(state) {
  const candidateEntries = [];

  Object.entries(normalizeDailyActionState(state)).forEach(([dateKey, entry]) => {
    const launches = Array.isArray(entry.launches) ? entry.launches : [];
    launches.forEach((launch) => {
      if (!launch || launch.sessionId || launch.source !== "solomonic_clock") {
        return;
      }
      candidateEntries.push({
        dateKey,
        entry,
        launch,
        launchKey: buildDailyActionLaunchKey(launch),
      });
    });
  });

  return candidateEntries
    .sort((left, right) => String(right.launch.launchedAt || "").localeCompare(String(left.launch.launchedAt || "")))
    .slice(0, 12);
}

function buildPericopeSessionSyncSignature(entries) {
  return entries
    .map((entry) => `${entry.dateKey}:${entry.launchKey}`)
    .join("||");
}

function scorePericopeSessionMatch(launch, session) {
  if (!launch || !session || String(session.source || "").trim().toLowerCase() !== "solomonic_clock") {
    return -1;
  }

  let score = 0;
  const launchPromptId = String(launch.promptId || "").trim();
  const sessionPromptId = String(session.source_prompt_id || session.sourcePromptId || "").trim();
  if (launchPromptId && sessionPromptId && launchPromptId === sessionPromptId) {
    score += 8;
  }

  const launchMode = String(launch.mode || "").trim().toLowerCase();
  const sessionMode = String(session.mode || "").trim().toLowerCase();
  if (launchMode && sessionMode && launchMode === sessionMode) {
    score += 2;
  }

  const launchMessage = normalizeComparableText(launch.message);
  const sessionPreview = normalizeComparableText(session.preview);
  if (launchMessage && sessionPreview) {
    if (launchMessage === sessionPreview) {
      score += 6;
    } else if (launchMessage.startsWith(sessionPreview) || sessionPreview.startsWith(launchMessage)) {
      score += 4;
    } else if (launchMessage.includes(sessionPreview) || sessionPreview.includes(launchMessage)) {
      score += 2;
    }
  }

  const launchedAt = Date.parse(String(launch.launchedAt || ""));
  const sessionStartedAt = Date.parse(String(session.start_time || session.startTime || session.last_active || ""));
  if (Number.isFinite(launchedAt) && Number.isFinite(sessionStartedAt)) {
    const delta = Math.abs(sessionStartedAt - launchedAt);
    if (delta <= 1000 * 60 * 90) {
      score += Math.max(0, 4 - (delta / (1000 * 60 * 30)));
    } else {
      score -= 2;
    }
  }

  const launchDay = String(launch.clockDay || "").trim();
  const sessionDay = String(session.clock_context?.daily_guidance?.day || "").trim();
  if (launchDay && sessionDay && launchDay === sessionDay) {
    score += 1;
  }

  return score;
}

function findBestPericopeSessionMatch(launch, sessions, usedSessionIds = new Set()) {
  let best = null;
  let bestScore = -1;

  sessions.forEach((session) => {
    const sessionId = String(session?.session_id || session?.sessionId || "").trim();
    if (!sessionId || usedSessionIds.has(sessionId)) {
      return;
    }
    const score = scorePericopeSessionMatch(launch, session);
    if (score > bestScore) {
      best = session;
      bestScore = score;
    }
  });

  return bestScore >= 5 ? best : null;
}

async function reconcilePericopeSessionLinks(force = false) {
  const access = await getHistorySyncAccess();
  if (
    !access
    || access.mode !== "user"
    || !access.headers?.Authorization
  ) {
    return;
  }

  const candidates = collectPericopeSessionCandidates(loadDailyActionState());
  if (!candidates.length) {
    lastPericopeSessionSyncSignature = "";
    return;
  }

  const signature = buildPericopeSessionSyncSignature(candidates);
  if (!force && signature && signature === lastPericopeSessionSyncSignature) {
    return;
  }

  if (pericopeSessionSyncInFlight) {
    pericopeSessionSyncQueued = true;
    return pericopeSessionSyncInFlight;
  }

  lastPericopeSessionSyncSignature = signature;
  pericopeSessionSyncQueued = false;

  pericopeSessionSyncInFlight = fetchPericopeHistorySessions(access, Math.max(12, candidates.length + 4))
    .then((sessions) => {
      const usedSessionIds = new Set();
      candidates.forEach((candidate) => {
        const match = findBestPericopeSessionMatch(candidate.launch, sessions, usedSessionIds);
        const sessionId = String(match?.session_id || match?.sessionId || "").trim();
        if (!match || !sessionId) {
          return;
        }
        usedSessionIds.add(sessionId);
        patchDailyActionLaunch(candidate.dateKey, candidate.launchKey, {
          sessionId,
          sessionUrl: buildPericopeSessionResumeUrl(sessionId),
          sessionPersona: String(match.persona || "").trim(),
          sessionPreview: String(match.preview || "").trim(),
          sessionStartedAt: String(match.start_time || match.startTime || "").trim(),
          sessionLastActiveAt: String(match.last_active || match.lastActive || "").trim(),
          linkedAt: new Date().toISOString(),
        });
      });
    })
    .catch((_error) => {
      // Preserve the local action loop even if continuity lookup fails.
    })
    .finally(() => {
      pericopeSessionSyncInFlight = null;
      if (pericopeSessionSyncQueued) {
        pericopeSessionSyncQueued = false;
        void reconcilePericopeSessionLinks(true);
      }
    });

  return pericopeSessionSyncInFlight;
}

function schedulePericopeSessionSync(delayMs = 1200, force = false) {
  if (typeof window === "undefined") {
    return;
  }

  if (pericopeSessionSyncTimer) {
    window.clearTimeout(pericopeSessionSyncTimer);
  }

  pericopeSessionSyncTimer = window.setTimeout(() => {
    pericopeSessionSyncTimer = null;
    void reconcilePericopeSessionLinks(force);
  }, Math.max(0, delayMs));
}

function setupPericopeSessionSyncRefresh() {
  if (typeof window === "undefined") {
    return;
  }

  window.addEventListener("focus", () => {
    schedulePericopeSessionSync(450, true);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      schedulePericopeSessionSync(450, true);
    }
  });
}

function buildGuidedPromptFromContext(ruleOfLife, timeState) {
  if (ruleOfLife) {
    return `How should I practice ${ruleOfLife.virtue.toLowerCase()} in ${ruleOfLife.domain.toLowerCase()} today?`;
  }

  const rulerText = timeState?.dayLabel?.rulerText || "the day";
  const activeFocus = timeState?.active?.pentacle?.pentacle?.focus || "the present focus";
  return `How should I respond to ${activeFocus.toLowerCase()} under ${rulerText} today?`;
}

function resolveLifeWheelFocusDomain(timeState, lifeConfig) {
  const focusText = [
    timeState?.active?.pentacle?.pentacle?.focus || "",
    timeState?.active?.planetary?.themes?.join(" ") || "",
    timeState?.active?.spirit?.spirit || "",
    timeState?.active?.spirit?.zodiac || "",
  ]
    .join(" ")
    .trim();

  const keywordMatch = LIFE_DOMAIN_FOCUS_KEYWORDS.find((entry) => entry.pattern.test(focusText));
  if (keywordMatch) {
    return keywordMatch.domain;
  }

  const rulerText = timeState?.dayLabel?.rulerText || "";
  const planetFocus = lifeConfig?.planetFocus?.[rulerText];
  if (planetFocus) {
    return planetFocus;
  }

  return lifeConfig?.domains?.[0]?.id || "mind";
}

function getLifeWheelState(timeState, lifeConfig) {
  if (!lifeConfig || !Array.isArray(lifeConfig.domains) || !lifeConfig.domains.length) {
    return null;
  }

  const scores = loadLifeWheelScores(lifeConfig);
  const focusDomainId = resolveLifeWheelFocusDomain(timeState, lifeConfig);
  const domains = lifeConfig.domains.map((domain) => ({
    ...domain,
    score: scores[domain.id] ?? 50,
    shortLabel: getLifeDomainShortLabel(domain.id, domain.name),
  }));

  const weakestDomain = domains.reduce((lowest, candidate) => {
    if (!lowest || candidate.score < lowest.score) {
      return candidate;
    }
    return lowest;
  }, null);
  const focusedDomain = domains.find((domain) => domain.id === focusDomainId) || domains[0];

  return {
    domains,
    focusedDomain,
    weakestDomain,
  };
}

function updateLifeWheel(timeState, radii, lifeConfig) {
  const lifeState = getLifeWheelState(timeState, lifeConfig);
  if (!lifeState) {
    lifeWheelGroup.selectAll("*").remove();
    return null;
  }

  const key = [
    lifeState.focusedDomain?.id || "none",
    lifeState.weakestDomain?.id || "none",
    ...lifeState.domains.map((domain) => `${domain.id}:${domain.score}`),
  ].join("|");

  if (key === lastLifeWheelKey) {
    return lifeState;
  }
  lastLifeWheelKey = key;

  lifeWheelGroup.selectAll("*").remove();

  const outerRadius = radii.celestial - 6;
  const innerRadius = Math.max(0, radii.celestial - 70);
  const labelRadius = radii.celestial + 18;
  const rotationDegrees = -65;
  const segmentStep = (Math.PI * 2) / lifeState.domains.length;
  const pad = 0.03;

  const segmentData = lifeState.domains.map((domain, index) => {
    const startAngle = degreesToRadians(rotationDegrees) + index * segmentStep + pad / 2;
    const endAngle = degreesToRadians(rotationDegrees) + (index + 1) * segmentStep - pad / 2;
    const midAngle = (startAngle + endAngle) / 2;
    const scoreOuterRadius = innerRadius + ((outerRadius - innerRadius) * domain.score) / 100;
    const labelPoint = polarPoint(0, 0, labelRadius, midAngle);
    return {
      ...domain,
      startAngle,
      endAngle,
      midAngle,
      scoreOuterRadius,
      labelPoint,
      isFocused: domain.id === lifeState.focusedDomain?.id,
      isWeakest: domain.id === lifeState.weakestDomain?.id,
    };
  });

  const trackArc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius).cornerRadius(8);
  const fillArc = d3.arc().innerRadius(innerRadius).cornerRadius(8);
  const group = lifeWheelGroup.append("g").attr("class", "life-wheel");

  const segments = group
    .selectAll("g.life-wheel-segment")
    .data(segmentData, (domain) => domain.id)
    .join("g")
    .attr("class", (domain) => [
      "life-wheel-segment",
      domain.isFocused ? "is-focused" : "",
      domain.isWeakest ? "is-weakest" : "",
    ].filter(Boolean).join(" "));

  segments
    .append("path")
    .attr("class", "life-wheel-track")
    .attr("d", (domain) => trackArc(domain))
    .attr("fill", "rgba(15, 23, 42, 0.46)")
    .attr("stroke", (domain) => hexToRgba(domain.color, domain.isFocused ? 0.78 : 0.34))
    .attr("stroke-width", (domain) => (domain.isFocused ? 1.8 : 1));

  segments
    .append("path")
    .attr("class", "life-wheel-fill")
    .attr("d", (domain) => fillArc({
      ...domain,
      outerRadius: domain.scoreOuterRadius,
    }))
    .attr("fill", (domain) => hexToRgba(domain.color, domain.isFocused ? 0.52 : 0.34))
    .attr("stroke", (domain) => hexToRgba(domain.color, domain.isFocused ? 0.92 : 0.64))
    .attr("stroke-width", (domain) => (domain.isFocused ? 1.4 : 1));

  segments
    .filter((domain) => domain.isWeakest)
    .append("circle")
    .attr("class", "life-wheel-weakness-dot")
    .attr("cx", (domain) => polarPoint(0, 0, outerRadius + 6, domain.midAngle).x)
    .attr("cy", (domain) => polarPoint(0, 0, outerRadius + 6, domain.midAngle).y)
    .attr("r", 3.6)
    .attr("fill", "#fca5a5")
    .attr("stroke", "#0f172a")
    .attr("stroke-width", 1.1);

  const labels = group
    .selectAll("g.life-wheel-label")
    .data(segmentData, (domain) => domain.id)
    .join("g")
    .attr("class", "life-wheel-label")
    .attr("transform", (domain) => `translate(${domain.labelPoint.x}, ${domain.labelPoint.y})`);

  labels
    .append("text")
    .attr("class", "life-wheel-label-name")
    .attr("fill", (domain) => hexToRgba(domain.color, domain.isFocused ? 0.96 : 0.82))
    .attr("text-anchor", (domain) => (Math.abs(domain.labelPoint.x) < 14 ? "middle" : domain.labelPoint.x > 0 ? "start" : "end"))
    .attr("y", -2)
    .text((domain) => domain.shortLabel);

  labels
    .append("text")
    .attr("class", "life-wheel-label-score")
    .attr("fill", "#cbd5f5")
    .attr("text-anchor", (domain) => (Math.abs(domain.labelPoint.x) < 14 ? "middle" : domain.labelPoint.x > 0 ? "start" : "end"))
    .attr("y", 10)
    .text((domain) => `${domain.score}%`);

  bindTooltip(
    segments,
    (domain) => {
      const status = domain.isFocused
        ? "Current focus"
        : domain.isWeakest
          ? "Weakest domain"
          : "Life domain";
      return `${domain.name} • ${domain.score}% • ${domain.virtue} • ${status}`;
    }
  );

  return lifeState;
}

function updateHistoryPreview(now, derived, referenceMap, radii) {
  const entries = getProvidenceMapEntries(now, derived, referenceMap, radii);
  const orbitRadii = getProvidenceMapOrbitRadii(radii);
  const key = JSON.stringify({
    selectedOffset: selectedDayOffset,
    entries: entries.map((entry) => [
      entry.dateKey,
      entry.offset,
      entry.statusBadges.join(","),
      entry.summaryLine,
      entry.launchCount,
      entry.recordColor,
      entry.isSelected ? 1 : 0,
    ].join(":")),
  });

  if (key === lastProvidenceMapKey) {
    return;
  }
  lastProvidenceMapKey = key;

  historyPreviewGroup.selectAll("*").remove();

  const orbitLabelAngle = degreesToRadians(156);
  const orbitGroup = historyPreviewGroup.append("g").attr("class", "providence-map-orbits");
  [
    { label: "1 wk", radius: getProvidenceMapRadius(7, radii) },
    { label: "3 wk", radius: getProvidenceMapRadius(21, radii) },
    { label: "6 wk", radius: orbitRadii.outer },
  ].forEach((orbit, index) => {
    orbitGroup
      .append("circle")
      .attr("class", `providence-map-orbit providence-map-orbit--${index + 1}`)
      .attr("r", orbit.radius);

    const labelPoint = polarPoint(0, 0, orbit.radius, orbitLabelAngle);
    orbitGroup
      .append("text")
      .attr("class", "providence-map-orbit-label")
      .attr("x", labelPoint.x)
      .attr("y", labelPoint.y - 4)
      .attr("text-anchor", labelPoint.x >= 0 ? "start" : "end")
      .text(orbit.label);
  });

  if (entries.length > 1) {
    const line = d3
      .line()
      .x((entry) => entry.x)
      .y((entry) => entry.y)
      .curve(d3.curveCatmullRom.alpha(0.55));

    historyPreviewGroup
      .append("path")
      .attr("class", "providence-map-path")
      .attr("d", line(entries));
  }

  const nodesGroup = historyPreviewGroup.append("g").attr("class", "providence-map-nodes");
  const selection = nodesGroup
    .selectAll("g.history-node")
    .data(entries, (entry) => entry.dateKey)
    .join((enter) => {
      const group = enter.append("g").attr("class", "history-node providence-map-node");
      group.append("circle").attr("class", "history-node-hit").attr("pointer-events", "all");
      group.append("circle").attr("class", "history-node-halo").attr("pointer-events", "none");
      group.append("circle").attr("class", "history-node-ring").attr("pointer-events", "none");
      group.append("circle").attr("class", "history-node-dot").attr("pointer-events", "none");
      group.append("circle").attr("class", "history-node-launch").attr("pointer-events", "none");
      group.append("text").attr("class", "history-node-label").attr("text-anchor", "middle").attr("pointer-events", "none");
      group.append("text").attr("class", "history-node-caption").attr("text-anchor", "middle").attr("pointer-events", "none");
      return group;
    })
    .attr("transform", (entry) => `translate(${entry.x}, ${entry.y})`)
    .classed("is-selected", (entry) => entry.isSelected)
    .classed("is-today", (entry) => entry.isToday)
    .classed("has-record", (entry) => entry.hasRecord)
    .classed("is-closed", (entry) => entry.closed)
    .classed("is-complete", (entry) => entry.completed)
    .classed("has-reflection", (entry) => entry.hasReflection)
    .classed("is-ghost", (entry) => entry.isGhost)
    .attr("tabindex", 0)
    .attr("role", "button")
    .attr("aria-label", (entry) => `View ${entry.dateLabel}: ${entry.summaryLine}`)
    .style("cursor", "pointer")
    .on("click", (_event, entry) => {
      setSelectedDayOffset(entry.offset);
      setLens("history");
    })
    .on("keydown", (event, entry) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setSelectedDayOffset(entry.offset);
        setLens("history");
      }
    });

  selection
    .select("circle.history-node-hit")
    .attr("r", (entry) => Math.max(entry.haloRadius + 5.8, 14))
    .attr("fill", "rgba(15, 23, 42, 0.001)")
    .attr("stroke", "none");

  selection
    .select("circle.history-node-halo")
    .attr("r", (entry) => entry.haloRadius)
    .attr("fill", (entry) => hexToRgba(entry.recordColor || "#94a3b8", entry.isSelected ? 0.22 : entry.closed ? 0.16 : 0.08))
    .attr("opacity", (entry) => (entry.isGhost ? 0.22 : 0.94));

  selection
    .select("circle.history-node-ring")
    .attr("r", (entry) => entry.nodeRadius + 2.4)
    .attr("fill", "none")
    .attr("stroke", (entry) => (entry.hasRecord ? entry.recordColor : "rgba(148, 163, 184, 0.26)"))
    .attr("stroke-width", (entry) => (entry.isSelected ? 2.6 : entry.closed || entry.completed ? 2.1 : 1.5))
    .attr("stroke-dasharray", (entry) => {
      if (entry.closed && !entry.completed) {
        return "4 2.4";
      }
      if (entry.hasReflection && !entry.closed && !entry.completed) {
        return "2.4 2.6";
      }
      if (entry.isGhost) {
        return "3.2 3.2";
      }
      return null;
    })
    .attr("opacity", (entry) => (entry.isGhost ? 0.64 : 0.98));

  selection
    .select("circle.history-node-dot")
    .attr("r", (entry) => entry.nodeRadius)
    .attr("fill", (entry) => (entry.isGhost ? "rgba(148, 163, 184, 0.18)" : entry.rulerColor))
    .attr("stroke", "#0f172a")
    .attr("stroke-width", (entry) => (entry.isSelected ? 1.9 : 1.3));

  selection
    .select("circle.history-node-launch")
    .attr("cx", (entry) => polarPoint(0, 0, entry.nodeRadius + 5.2, entry.mapAngle + degreesToRadians(46)).x)
    .attr("cy", (entry) => polarPoint(0, 0, entry.nodeRadius + 5.2, entry.mapAngle + degreesToRadians(46)).y)
    .attr("r", (entry) => (entry.launchCount ? Math.min(3.6, 1.6 + entry.launchCount * 0.32) : 0))
    .attr("fill", (entry) => (entry.launchCount ? "#f8fafc" : "transparent"))
    .attr("stroke", (entry) => (entry.launchCount ? hexToRgba(entry.recordColor, 0.92) : "none"))
    .attr("stroke-width", 1.1);

  selection
    .select("text.history-node-label")
    .attr("y", (entry) => -(entry.haloRadius + 6))
    .attr("fill", (entry) => (entry.isSelected ? "#f8fafc" : "#cbd5f5"))
    .attr("font-size", (entry) => (entry.isSelected ? 11 : 10))
    .text((entry) => (entry.isSelected || entry.isToday ? entry.shortLabel : ""));

  selection
    .select("text.history-node-caption")
    .attr("y", (entry) => entry.haloRadius + 14)
    .attr("fill", (entry) => hexToRgba(entry.recordColor, entry.isSelected ? 0.92 : 0.64))
    .attr("font-size", 10)
    .text((entry) => (entry.isSelected ? (entry.statusBadges[0] || "Selected") : ""));

  const hitSelection = selection
    .select("circle.history-node-hit")
    .attr("aria-hidden", "true");

  bindTooltip(
    hitSelection,
    (entry) => {
      const parts = [`${entry.dateLabel} • ${entry.rulerText}`];
      if (entry.statusBadges.length) {
        parts.push(entry.statusBadges.join(" • "));
      }
      parts.push(entry.scriptureRef || entry.psalmRef);
      parts.push(entry.summaryLine);
      if (entry.reflectionSnippet) {
        parts.push(`Reflection: ${entry.reflectionSnippet}`);
      }
      if (entry.closingSnippet) {
        parts.push(`Closing: ${entry.closingSnippet}`);
      }
      parts.push("Click to focus this day");
      return parts.join(" • ");
    }
  );

  selection.each(function reorderIfSelected(entry) {
    if (entry.isSelected) {
      this.parentNode.appendChild(this);
    }
  });
}

function updateScriptureOverlay(timeState, referenceMap, now, radii) {
  scriptureOverlayGroup.selectAll("*").remove();

  if (uiState.lens !== "scripture" || !timeState?.dayLabel) {
    return;
  }

  const activePentacle = timeState.active?.pentacle || null;
  const pentacleKey = getPentacleKey(activePentacle);
  const pentacleRecord = pentacleKey ? referenceMap.get(pentacleKey) : null;
  const primaryPsalm = formatReadablePsalmReference(getPrimaryPsalmEntry(pentacleRecord)) || "Psalm Mapping";
  const wisdomRef = WISDOM_CONTENT_BY_RULER[timeState.dayLabel.rulerText]?.ref || "Wisdom Anchor";
  const bandColor = "#facc15";
  const outerRadius = radii.core + 34;
  const innerRadius = radii.core + 18;
  const topPathId = "scripture-overlay-arc-top";
  const bottomPathId = "scripture-overlay-arc-bottom";

  const defsSelection = scriptureOverlayGroup.append("defs");
  defsSelection
    .append("path")
    .attr("id", topPathId)
    .attr("d", describeArcPath(outerRadius, 206, 334));
  defsSelection
    .append("path")
    .attr("id", bottomPathId)
    .attr("d", describeArcPath(innerRadius, 26, 154));

  const bandLayer = scriptureOverlayGroup.append("g").attr("class", "scripture-overlay-band");
  const arc = d3.arc();

  bandLayer
    .append("path")
    .attr("class", "scripture-overlay-arc scripture-overlay-arc--primary")
    .attr("d", arc({
      innerRadius: outerRadius - 6,
      outerRadius: outerRadius + 6,
      startAngle: degreesToRadians(206),
      endAngle: degreesToRadians(334),
    }))
    .attr("fill", hexToRgba(bandColor, 0.12))
    .attr("stroke", hexToRgba(bandColor, 0.86))
    .attr("stroke-width", 1.2);

  bandLayer
    .append("path")
    .attr("class", "scripture-overlay-arc scripture-overlay-arc--secondary")
    .attr("d", arc({
      innerRadius: innerRadius - 5,
      outerRadius: innerRadius + 5,
      startAngle: degreesToRadians(26),
      endAngle: degreesToRadians(154),
    }))
    .attr("fill", "rgba(250, 204, 21, 0.07)")
    .attr("stroke", "rgba(253, 230, 138, 0.74)")
    .attr("stroke-width", 1.05);

  const markers = [
    { degrees: 206, radius: outerRadius, emphasis: true },
    { degrees: 334, radius: outerRadius, emphasis: true },
    { degrees: 26, radius: innerRadius, emphasis: false },
    { degrees: 154, radius: innerRadius, emphasis: false },
  ];

  scriptureOverlayGroup
    .append("g")
    .attr("class", "scripture-overlay-markers")
    .selectAll("circle")
    .data(markers)
    .join("circle")
    .attr("class", "scripture-overlay-marker")
    .attr("cx", (entry) => polarPoint(0, 0, entry.radius, degreesToRadians(entry.degrees)).x)
    .attr("cy", (entry) => polarPoint(0, 0, entry.radius, degreesToRadians(entry.degrees)).y)
    .attr("r", (entry) => (entry.emphasis ? 3.2 : 2.4))
    .attr("fill", (entry) => (entry.emphasis ? "#fef08a" : "#fde68a"))
    .attr("stroke", "#0f172a")
    .attr("stroke-width", 1.2);

  const textLayer = scriptureOverlayGroup.append("g").attr("class", "scripture-overlay-text-layer");

  const topText = textLayer
    .append("text")
    .attr("class", "scripture-overlay-text scripture-overlay-text--primary")
    .attr("fill", "#fef3c7");
  topText
    .append("textPath")
    .attr("href", `#${topPathId}`)
    .attr("startOffset", "50%")
    .attr("text-anchor", "middle")
    .text(`${primaryPsalm} • PRIMARY`);

  const bottomText = textLayer
    .append("text")
    .attr("class", "scripture-overlay-text scripture-overlay-text--secondary")
    .attr("fill", "#fde68a");
  bottomText
    .append("textPath")
    .attr("href", `#${bottomPathId}`)
    .attr("startOffset", "50%")
    .attr("text-anchor", "middle")
    .text(`${wisdomRef} • WISDOM`);

  const focusLabelPoint = polarPoint(0, 0, outerRadius + 16, degreesToRadians(-90));
  scriptureOverlayGroup
    .append("text")
    .attr("class", "scripture-overlay-caption")
    .attr("x", focusLabelPoint.x)
    .attr("y", focusLabelPoint.y)
    .attr("text-anchor", "middle")
    .text("Scripture Band");
}

function updateRitualOverlay(timeState, now, radii) {
  ritualOverlayGroup.selectAll("*").remove();

  if (uiState.lens !== "ritual" || !timeState?.dayLabel) {
    return;
  }

  const hourRule = getPlanetaryHourRuler(now, timeState.dayLabel.rulerText);
  const dayText = `${timeState.dayLabel.dayText.toUpperCase()} • ${timeState.dayLabel.rulerText.toUpperCase()} DAY`;
  const themeText = Array.isArray(timeState.active?.planetary?.themes) && timeState.active.planetary.themes.length
    ? timeState.active.planetary.themes.slice(0, 2).join(" • ").toUpperCase()
    : "TIMING";
  const hourText = `HOUR OF ${(hourRule?.ruler || "UNKNOWN").toUpperCase()} • ${themeText}`;
  const bandColor = "#60a5fa";
  const outerTextRadius = radii.planetary - 18;
  const innerTextRadius = radii.planetary - 50;
  const timingRadius = radii.planetary + 10;
  const topPathId = "ritual-overlay-arc-top";
  const bottomPathId = "ritual-overlay-arc-bottom";
  const defsSelection = ritualOverlayGroup.append("defs");

  defsSelection
    .append("path")
    .attr("id", topPathId)
    .attr("d", describeArcPath(outerTextRadius, 206, 334));
  defsSelection
    .append("path")
    .attr("id", bottomPathId)
    .attr("d", describeArcPath(innerTextRadius, 24, 156));

  const bandLayer = ritualOverlayGroup.append("g").attr("class", "ritual-overlay-band");
  const arc = d3.arc();

  bandLayer
    .append("path")
    .attr("class", "ritual-overlay-arc ritual-overlay-arc--primary")
    .attr("d", arc({
      innerRadius: outerTextRadius - 7,
      outerRadius: outerTextRadius + 7,
      startAngle: degreesToRadians(206),
      endAngle: degreesToRadians(334),
    }))
    .attr("fill", "rgba(96, 165, 250, 0.12)")
    .attr("stroke", "rgba(96, 165, 250, 0.82)")
    .attr("stroke-width", 1.2);

  bandLayer
    .append("path")
    .attr("class", "ritual-overlay-arc ritual-overlay-arc--secondary")
    .attr("d", arc({
      innerRadius: innerTextRadius - 6,
      outerRadius: innerTextRadius + 6,
      startAngle: degreesToRadians(24),
      endAngle: degreesToRadians(156),
    }))
    .attr("fill", "rgba(147, 197, 253, 0.1)")
    .attr("stroke", "rgba(191, 219, 254, 0.78)")
    .attr("stroke-width", 1.05);

  const timingLayer = ritualOverlayGroup.append("g").attr("class", "ritual-overlay-timing");
  const currentHourIndex = Number.isFinite(hourRule?.hourIndex) ? hourRule.hourIndex : 0;
  const hourSteps = d3.range(24).map((hourIndex) => {
    const degrees = -90 + hourIndex * 15;
    const isCurrent = hourIndex === currentHourIndex;
    const isNext = hourIndex === (currentHourIndex + 1) % 24;
    return {
      hourIndex,
      degrees,
      isCurrent,
      isNext,
      isMinor: !isCurrent && !isNext,
    };
  });

  timingLayer
    .selectAll("line")
    .data(hourSteps)
    .join("line")
    .attr("class", (entry) => {
      if (entry.isCurrent) {
        return "ritual-overlay-tick ritual-overlay-tick--current";
      }
      if (entry.isNext) {
        return "ritual-overlay-tick ritual-overlay-tick--next";
      }
      return "ritual-overlay-tick ritual-overlay-tick--minor";
    })
    .attr("x1", (entry) => polarPoint(0, 0, timingRadius - (entry.isMinor ? 2 : 5), degreesToRadians(entry.degrees)).x)
    .attr("y1", (entry) => polarPoint(0, 0, timingRadius - (entry.isMinor ? 2 : 5), degreesToRadians(entry.degrees)).y)
    .attr("x2", (entry) => polarPoint(0, 0, timingRadius + (entry.isCurrent ? 13 : entry.isNext ? 9 : 4), degreesToRadians(entry.degrees)).x)
    .attr("y2", (entry) => polarPoint(0, 0, timingRadius + (entry.isCurrent ? 13 : entry.isNext ? 9 : 4), degreesToRadians(entry.degrees)).y);

  timingLayer
    .selectAll("circle")
    .data(hourSteps.filter((entry) => entry.isCurrent || entry.isNext))
    .join("circle")
    .attr("class", (entry) => entry.isCurrent ? "ritual-overlay-hour-dot ritual-overlay-hour-dot--current" : "ritual-overlay-hour-dot ritual-overlay-hour-dot--next")
    .attr("cx", (entry) => polarPoint(0, 0, timingRadius + (entry.isCurrent ? 18 : 13), degreesToRadians(entry.degrees)).x)
    .attr("cy", (entry) => polarPoint(0, 0, timingRadius + (entry.isCurrent ? 18 : 13), degreesToRadians(entry.degrees)).y)
    .attr("r", (entry) => entry.isCurrent ? 4 : 3);

  ritualOverlayGroup
    .append("g")
    .attr("class", "ritual-overlay-markers")
    .selectAll("circle")
    .data([
      { degrees: 206, radius: outerTextRadius, emphasis: true },
      { degrees: 334, radius: outerTextRadius, emphasis: true },
      { degrees: 24, radius: innerTextRadius, emphasis: false },
      { degrees: 156, radius: innerTextRadius, emphasis: false },
    ])
    .join("circle")
    .attr("class", "ritual-overlay-marker")
    .attr("cx", (entry) => polarPoint(0, 0, entry.radius, degreesToRadians(entry.degrees)).x)
    .attr("cy", (entry) => polarPoint(0, 0, entry.radius, degreesToRadians(entry.degrees)).y)
    .attr("r", (entry) => (entry.emphasis ? 3.1 : 2.3))
    .attr("fill", (entry) => (entry.emphasis ? "#bfdbfe" : "#dbeafe"))
    .attr("stroke", "#0f172a")
    .attr("stroke-width", 1.15);

  const textLayer = ritualOverlayGroup.append("g").attr("class", "ritual-overlay-text-layer");

  textLayer
    .append("text")
    .attr("class", "ritual-overlay-text ritual-overlay-text--primary")
    .attr("fill", "#dbeafe")
    .append("textPath")
    .attr("href", `#${topPathId}`)
    .attr("startOffset", "50%")
    .attr("text-anchor", "middle")
    .text(dayText);

  textLayer
    .append("text")
    .attr("class", "ritual-overlay-text ritual-overlay-text--secondary")
    .attr("fill", "#bfdbfe")
    .append("textPath")
    .attr("href", `#${bottomPathId}`)
    .attr("startOffset", "50%")
    .attr("text-anchor", "middle")
    .text(hourText);

  const focusLabelPoint = polarPoint(0, 0, outerTextRadius + 18, degreesToRadians(-90));
  ritualOverlayGroup
    .append("text")
    .attr("class", "ritual-overlay-caption")
    .attr("x", focusLabelPoint.x)
    .attr("y", focusLabelPoint.y)
    .attr("text-anchor", "middle")
    .text("Ritual Window");

  const windowLabelPoint = polarPoint(0, 0, timingRadius + 28, degreesToRadians(90));
  ritualOverlayGroup
    .append("text")
    .attr("class", "ritual-overlay-caption ritual-overlay-caption--secondary")
    .attr("x", windowLabelPoint.x)
    .attr("y", windowLabelPoint.y)
    .attr("text-anchor", "middle")
    .text(`Now ${String(currentHourIndex).padStart(2, "0")}:00 • Next ${String((currentHourIndex + 1) % 24).padStart(2, "0")}:00`);
}

function updateEsotericOverlay(timeState, radii, derived) {
  esotericOverlayGroup.selectAll("*").remove();

  if (uiState.lens !== "esoteric" || !timeState?.dayLabel || !timeState?.active?.spirit) {
    return;
  }

  const activeSpirit = timeState.active.spirit;
  const correspondences = PLANETARY_CORRESPONDENCES[timeState.dayLabel.rulerText] || {};
  const activePentacle = timeState.active?.pentacle || null;
  const bandColor = "#c4b5fd";
  const outerTextRadius = radii.spirit - 16;
  const innerTextRadius = radii.spirit - 44;
  const beaconRadius = radii.spirit + 18;
  const segmentDegrees = derived?.spiritCount ? 360 / derived.spiritCount : 5;
  const ringRotationDegrees = derived?.spiritCount
    ? radiansToDegrees(fractionToRotation(timeState.fractions.spirit, derived.spiritCount))
    : -90;
  const activeCenterDegrees = ringRotationDegrees + ((timeState.indices.spirit + 0.5) * segmentDegrees);
  const activeRadians = degreesToRadians(activeCenterDegrees);
  const topPathId = "esoteric-overlay-arc-top";
  const bottomPathId = "esoteric-overlay-arc-bottom";
  const defsSelection = esotericOverlayGroup.append("defs");

  defsSelection
    .append("path")
    .attr("id", topPathId)
    .attr("d", describeArcPath(outerTextRadius, 214, 326));
  defsSelection
    .append("path")
    .attr("id", bottomPathId)
    .attr("d", describeArcPath(innerTextRadius, 34, 146));

  const bandLayer = esotericOverlayGroup.append("g").attr("class", "esoteric-overlay-band");
  const arc = d3.arc();

  bandLayer
    .append("path")
    .attr("class", "esoteric-overlay-arc esoteric-overlay-arc--primary")
    .attr("d", arc({
      innerRadius: outerTextRadius - 7,
      outerRadius: outerTextRadius + 7,
      startAngle: degreesToRadians(214),
      endAngle: degreesToRadians(326),
    }))
    .attr("fill", "rgba(196, 181, 253, 0.11)")
    .attr("stroke", "rgba(196, 181, 253, 0.84)")
    .attr("stroke-width", 1.2);

  bandLayer
    .append("path")
    .attr("class", "esoteric-overlay-arc esoteric-overlay-arc--secondary")
    .attr("d", arc({
      innerRadius: innerTextRadius - 6,
      outerRadius: innerTextRadius + 6,
      startAngle: degreesToRadians(34),
      endAngle: degreesToRadians(146),
    }))
    .attr("fill", "rgba(221, 214, 254, 0.09)")
    .attr("stroke", "rgba(233, 213, 255, 0.74)")
    .attr("stroke-width", 1.05);

  const markers = [
    { degrees: 214, radius: outerTextRadius, emphasis: true },
    { degrees: 326, radius: outerTextRadius, emphasis: true },
    { degrees: 34, radius: innerTextRadius, emphasis: false },
    { degrees: 146, radius: innerTextRadius, emphasis: false },
  ];

  esotericOverlayGroup
    .append("g")
    .attr("class", "esoteric-overlay-markers")
    .selectAll("circle")
    .data(markers)
    .join("circle")
    .attr("class", "esoteric-overlay-marker")
    .attr("cx", (entry) => polarPoint(0, 0, entry.radius, degreesToRadians(entry.degrees)).x)
    .attr("cy", (entry) => polarPoint(0, 0, entry.radius, degreesToRadians(entry.degrees)).y)
    .attr("r", (entry) => (entry.emphasis ? 3.1 : 2.3))
    .attr("fill", (entry) => (entry.emphasis ? "#ede9fe" : "#ddd6fe"))
    .attr("stroke", "#0f172a")
    .attr("stroke-width", 1.15);

  const textLayer = esotericOverlayGroup.append("g").attr("class", "esoteric-overlay-text-layer");
  const primaryText = `${String(activeSpirit.spirit || "Spirit").toUpperCase()} • ${String(activeSpirit.rank || "Rank").toUpperCase()} • SECTOR ${activeSpirit.sector}`;
  const secondaryParts = [
    `${String(activeSpirit.zodiac || "").toUpperCase()} ${String(activeSpirit.degrees || "").toUpperCase()}`.trim(),
    correspondences.angel ? `ANGEL ${String(correspondences.angel).toUpperCase()}` : "",
    correspondences.metal ? `METAL ${String(correspondences.metal).toUpperCase()}` : "",
  ].filter(Boolean);
  const secondaryText = secondaryParts.join(" • ");

  textLayer
    .append("text")
    .attr("class", "esoteric-overlay-text esoteric-overlay-text--primary")
    .attr("fill", "#ede9fe")
    .append("textPath")
    .attr("href", `#${topPathId}`)
    .attr("startOffset", "50%")
    .attr("text-anchor", "middle")
    .text(primaryText);

  textLayer
    .append("text")
    .attr("class", "esoteric-overlay-text esoteric-overlay-text--secondary")
    .attr("fill", "#ddd6fe")
    .append("textPath")
    .attr("href", `#${bottomPathId}`)
    .attr("startOffset", "50%")
    .attr("text-anchor", "middle")
    .text(secondaryText);

  const activeLineStart = polarPoint(0, 0, radii.spirit - 8, activeRadians);
  const activeLineEnd = polarPoint(0, 0, beaconRadius, activeRadians);
  const activeDot = polarPoint(0, 0, beaconRadius + 6, activeRadians);
  const activeLabel = polarPoint(0, 0, beaconRadius + 34, activeRadians);
  const labelAnchor = activeLabel.x >= 12 ? "start" : activeLabel.x <= -12 ? "end" : "middle";
  const pentacleLabel = activePentacle
    ? `${activePentacle.planet.toUpperCase()} ${activePentacle.pentacle.index}`
    : "ACTIVE PENTACLE";

  const beaconLayer = esotericOverlayGroup.append("g").attr("class", "esoteric-overlay-beacon");

  beaconLayer
    .append("line")
    .attr("class", "esoteric-overlay-beacon-line")
    .attr("x1", activeLineStart.x)
    .attr("y1", activeLineStart.y)
    .attr("x2", activeLineEnd.x)
    .attr("y2", activeLineEnd.y)
    .attr("stroke", hexToRgba(bandColor, 0.92))
    .attr("stroke-width", 1.8);

  beaconLayer
    .append("circle")
    .attr("class", "esoteric-overlay-beacon-dot")
    .attr("cx", activeDot.x)
    .attr("cy", activeDot.y)
    .attr("r", 4.2)
    .attr("fill", "#ede9fe")
    .attr("stroke", "#0f172a")
    .attr("stroke-width", 1.2);

  beaconLayer
    .append("text")
    .attr("class", "esoteric-overlay-caption esoteric-overlay-caption--beacon")
    .attr("x", activeLabel.x)
    .attr("y", activeLabel.y)
    .attr("text-anchor", labelAnchor)
    .text(pentacleLabel);

  const badgeEntries = [
    {
      text: `${String(activeSpirit.spirit || "Spirit").toUpperCase()} • ${String(activeSpirit.rank || "Rank").toUpperCase()}`,
      radius: radii.spirit - 92,
      angle: -144,
      color: "#e9d5ff",
    },
    {
      text: [correspondences.angel, correspondences.metal].filter(Boolean).join(" • ").toUpperCase() || "ANGEL • METAL",
      radius: radii.spirit - 92,
      angle: -36,
      color: "#ddd6fe",
    },
    {
      text: [
        correspondences.color ? String(correspondences.color).toUpperCase() : "",
        activePentacle ? `${activePentacle.planet.toUpperCase()} ${activePentacle.pentacle.index}` : "",
      ].filter(Boolean).join(" • ") || "COLOR • PENTACLE",
      radius: radii.spirit - 98,
      angle: 34,
      color: "#c4b5fd",
    },
  ];

  const badgeNodes = esotericOverlayGroup
    .append("g")
    .attr("class", "esoteric-overlay-badges")
    .selectAll("g")
    .data(badgeEntries)
    .join("g")
    .attr("class", "esoteric-overlay-badge")
    .attr("transform", (entry) => {
      const point = polarPoint(0, 0, entry.radius, degreesToRadians(entry.angle));
      return `translate(${point.x}, ${point.y})`;
    });

  badgeNodes
    .append("rect")
    .attr("class", "esoteric-overlay-badge-pill")
    .attr("x", (entry) => -(Math.max(92, entry.text.length * 5.8) / 2))
    .attr("y", -10)
    .attr("width", (entry) => Math.max(92, entry.text.length * 5.8))
    .attr("height", 20)
    .attr("rx", 10)
    .attr("fill", "rgba(15, 23, 42, 0.82)")
    .attr("stroke", (entry) => hexToRgba(entry.color, 0.88))
    .attr("stroke-width", 1.1);

  badgeNodes
    .append("text")
    .attr("class", "esoteric-overlay-badge-text")
    .attr("fill", (entry) => hexToRgba(entry.color, 0.96))
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .text((entry) => entry.text);

  const focusLabelPoint = polarPoint(0, 0, outerTextRadius + 18, degreesToRadians(-90));
  esotericOverlayGroup
    .append("text")
    .attr("class", "esoteric-overlay-caption")
    .attr("x", focusLabelPoint.x)
    .attr("y", focusLabelPoint.y)
    .attr("text-anchor", "middle")
    .text("Esoteric Band");
}

function setReadingDepth(nextDepth) {
  const normalized = String(nextDepth || "").toLowerCase();
  if (!READING_DEPTHS.has(normalized) || normalized === readingDepth) {
    return;
  }
  readingDepth = normalized;
  lastPsalmKey = null;
  lastBundleKey = null;
}

function setupReadingDepthControls() {
  if (!drawerElements.depthButtons.length) {
    return;
  }

  drawerElements.depthButtons.forEach((button) => {
    const buttonDepth = String(button.dataset.depth || "").toLowerCase();
    if (!READING_DEPTHS.has(buttonDepth)) {
      return;
    }

    const isActive = buttonDepth === readingDepth;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
    button.addEventListener("click", () => {
      setReadingDepth(buttonDepth);
      drawerElements.depthButtons.forEach((candidate) => {
        const candidateDepth = String(candidate.dataset.depth || "").toLowerCase();
        const active = candidateDepth === readingDepth;
        candidate.classList.toggle("active", active);
        candidate.setAttribute("aria-pressed", active ? "true" : "false");
      });
    });
  });
}

function setSelectedDayOffset(nextOffset) {
  const normalized = Number.parseInt(nextOffset, 10);
  if (Number.isNaN(normalized) || normalized === selectedDayOffset) {
    return;
  }
  selectedDayOffset = normalized;
  lastWeeklyArcKey = null;
  lastHistoryPanelKey = null;
  lastHistoryWeeklyKey = null;
  lastHistoryReviewKey = null;
  lastProvidenceTimelineKey = null;
  lastProvidenceMapKey = null;
}

function shiftSelectedDay(delta) {
  const step = Number.parseInt(delta, 10);
  if (Number.isNaN(step) || step === 0) {
    return;
  }
  setSelectedDayOffset(selectedDayOffset + step);
}

function withSelectedDayOffset(now) {
  if (!selectedDayOffset) {
    return now;
  }
  const shifted = new Date(now);
  shifted.setDate(shifted.getDate() + selectedDayOffset);
  return shifted;
}

function setupWeeklyArcControls() {
  if (!drawerElements.weeklyArcPrev || !drawerElements.weeklyArcNext || !drawerElements.weeklyArcToday) {
    return;
  }

  drawerElements.weeklyArcPrev.addEventListener("click", () => {
    shiftSelectedDay(-1);
  });
  drawerElements.weeklyArcNext.addEventListener("click", () => {
    shiftSelectedDay(1);
  });
  drawerElements.weeklyArcToday.addEventListener("click", () => {
    setSelectedDayOffset(0);
  });
}

function setupProvidenceTimelineControls() {
  if (!drawerElements.providencePrev || !drawerElements.providenceNext || !drawerElements.providenceToday) {
    return;
  }

  drawerElements.providencePrev.addEventListener("click", () => {
    shiftSelectedDay(-1);
    setLens("history");
  });
  drawerElements.providenceNext.addEventListener("click", () => {
    shiftSelectedDay(1);
    setLens("history");
  });
  drawerElements.providenceToday.addEventListener("click", () => {
    setSelectedDayOffset(0);
    setLens("history");
  });
}

function getBundleCardElements(kind) {
  switch (kind) {
    case "psalm":
      return {
        ref: drawerElements.bundlePsalmRef,
        text: drawerElements.bundlePsalmText,
        button: drawerElements.bundlePsalmExpand,
        discuss: drawerElements.bundlePsalmDiscuss,
      };
    case "wisdom":
      return {
        ref: drawerElements.bundleWisdomRef,
        text: drawerElements.bundleWisdomText,
        button: drawerElements.bundleWisdomExpand,
        discuss: drawerElements.bundleWisdomDiscuss,
      };
    case "solomonic":
      return {
        ref: drawerElements.bundleSolomonicRef,
        text: drawerElements.bundleSolomonicText,
        button: drawerElements.bundleSolomonicExpand,
        discuss: drawerElements.bundleSolomonicDiscuss,
      };
    default:
      return null;
  }
}

function parseScriptureReference(reference) {
  const match = String(reference || "").trim().match(/^(.+?)\s+(\d+)(?::([\d,\-\s]+))?$/);
  if (!match) {
    return null;
  }

  return {
    book: match[1].trim(),
    chapter: Number.parseInt(match[2], 10),
    verseSpec: match[3] ? match[3].trim() : "",
  };
}

function configureBundleExpansion(kind, { reference, text, request }) {
  const elements = getBundleCardElements(kind);
  if (!elements) {
    return;
  }

  bundleExpansionState[kind] = request
    ? {
      request,
      previewRef: reference,
      previewText: text,
      expanded: false,
      expandedText: "",
    }
    : null;

  if (!elements.button) {
    if (elements.discuss) {
      elements.discuss.hidden = !request;
      elements.discuss.disabled = !request;
    }
    return;
  }

  elements.button.hidden = !request;
  elements.button.disabled = !request;
  elements.button.textContent = request ? "Read Full Passage" : "Expansion Unavailable";
  if (elements.discuss) {
    elements.discuss.hidden = !request;
    elements.discuss.disabled = !request;
    elements.discuss.textContent = request ? "Discuss In Pericope" : "Discussion Unavailable";
  }
}

function updateBundlePreviewState(kind, { reference, text }) {
  const state = bundleExpansionState[kind];
  if (!state) {
    return;
  }

  if (reference) {
    state.previewRef = reference;
  }
  if (typeof text === "string") {
    state.previewText = kind === "wisdom"
      ? sanitizeInlinePassageText(text)
      : text;
  }
}

function restoreBundlePreview(kind) {
  const elements = getBundleCardElements(kind);
  const state = bundleExpansionState[kind];
  if (!elements || !state) {
    return;
  }

  if (elements.ref) {
    elements.ref.textContent = state.previewRef;
  }
  if (elements.text) {
    elements.text.classList.remove("loading", "error");
    elements.text.textContent = state.previewText;
  }
  if (elements.button) {
    elements.button.disabled = false;
    elements.button.textContent = "Read Full Passage";
  }
  if (elements.discuss) {
    elements.discuss.disabled = false;
    elements.discuss.textContent = "Discuss In Pericope";
  }

  state.expanded = false;
}

async function toggleBundleExpansion(kind) {
  const elements = getBundleCardElements(kind);
  const state = bundleExpansionState[kind];
  if (!elements?.text || !elements.button || !state?.request) {
    return;
  }

  if (state.expanded) {
    restoreBundlePreview(kind);
    return;
  }

  const requestState = state;
  const cacheKey = JSON.stringify(requestState.request);

  elements.button.disabled = true;
  elements.text.classList.remove("error");
  elements.text.classList.add("loading");
  elements.text.textContent = "Loading expanded passage…";

  try {
    let payload = bundleExpansionCache.get(cacheKey);
    if (!payload) {
      const response = await fetch(BOOK_PARTIAL_API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestState.request),
      });
      const responsePayload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(responsePayload?.error || `HTTP ${response.status}`);
      }
      payload = responsePayload;
      bundleExpansionCache.set(cacheKey, payload);
    }

    if (bundleExpansionState[kind] !== requestState) {
      return;
    }

    requestState.expanded = true;
    requestState.expandedText = kind === "wisdom"
      ? sanitizeInlinePassageText(payload?.content || "") || "No expanded text returned."
      : String(payload?.content || "").trim() || "No expanded text returned.";
    elements.text.classList.remove("loading", "error");
    elements.text.textContent = requestState.expandedText;
    elements.button.textContent = "Show Summary";
    elements.button.disabled = false;
  } catch (error) {
    console.error(`Failed to expand ${kind} bundle text`, error);
    if (bundleExpansionState[kind] !== requestState) {
      return;
    }

    requestState.expanded = false;
    elements.text.classList.remove("loading");
    elements.text.classList.add("error");
    elements.text.textContent = `${requestState.previewText}\n\nUnable to load expanded passage.`;
    elements.button.textContent = "Retry Expansion";
    elements.button.disabled = false;
  }
}

function setupBundleExpansionControls() {
  [
    ["psalm", drawerElements.bundlePsalmExpand, drawerElements.bundlePsalmDiscuss],
    ["wisdom", drawerElements.bundleWisdomExpand, drawerElements.bundleWisdomDiscuss],
    ["solomonic", drawerElements.bundleSolomonicExpand, drawerElements.bundleSolomonicDiscuss],
  ].forEach(([kind, button, discuss]) => {
    if (!button) {
      if (discuss) {
        discuss.addEventListener("click", () => {
          launchBundleDiscussion(kind);
        });
      }
      return;
    }
    button.addEventListener("click", () => {
      toggleBundleExpansion(kind);
    });
    if (discuss) {
      discuss.addEventListener("click", () => {
        launchBundleDiscussion(kind);
      });
    }
  });
}

function getPentacleKey(activePentacle) {
  if (!activePentacle) {
    return null;
  }
  return `${activePentacle.planet.toLowerCase()}-${activePentacle.pentacle.index}`;
}

function getPlanetaryHourRuler(now, dayRuler) {
  const startIndex = CHALDEAN_ORDER.indexOf(dayRuler);
  if (startIndex < 0) {
    return null;
  }
  const hourIndex = now.getHours();
  return {
    hourIndex,
    ruler: CHALDEAN_ORDER[(startIndex + hourIndex) % CHALDEAN_ORDER.length],
  };
}

function getNextPlanetaryHourRuler(now, dayRuler) {
  const startIndex = CHALDEAN_ORDER.indexOf(dayRuler);
  if (startIndex < 0) {
    return null;
  }
  const nextHourIndex = (now.getHours() + 1) % 24;
  return {
    hourIndex: nextHourIndex,
    ruler: CHALDEAN_ORDER[(startIndex + nextHourIndex) % CHALDEAN_ORDER.length],
  };
}

function getPrimaryPsalmEntry(record) {
  if (!record || !Array.isArray(record.psalms)) {
    return null;
  }
  return record.psalms.find((entry) => {
    const chapter = Number.parseInt(entry.number ?? entry.psalm, 10);
    return !Number.isNaN(chapter);
  }) || null;
}

function formatReadablePsalmReference(entry) {
  if (!entry) {
    return null;
  }

  const chapter = Number.parseInt(entry.number ?? entry.psalm, 10);
  if (Number.isNaN(chapter)) {
    return null;
  }

  const verseLabel = entry.verses ? `:${entry.verses}` : "";
  return `Psalm ${chapter}${verseLabel}`;
}

function toSnippet(text, maxLength = 220) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) {
    return "";
  }
  if (clean.length <= maxLength) {
    return clean;
  }
  return `${clean.slice(0, maxLength - 1).trim()}…`;
}

function sanitizeInlinePassageText(text) {
  return String(text || "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePsalmText(text) {
  const clean = String(text || "")
    .replace(/\(\s*Note:[\s\S]*$/i, "")
    .trim();
  return clean;
}

function canonicalizePsalmText(text) {
  return normalizePsalmText(text)
    .replace(/\s+/g, " ")
    .trim();
}

function parsePsalmChapterVerseMap(text) {
  const verseMap = new Map();
  const lines = String(text || "").split(/\r?\n/);
  let currentVerse = null;
  let currentParts = [];

  const flushCurrentVerse = () => {
    if (currentVerse === null) {
      return;
    }

    const normalized = currentParts
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (normalized) {
      verseMap.set(String(currentVerse), normalized);
    }
  };

  lines.forEach((rawLine) => {
    const line = String(rawLine || "").trim();
    if (!line || /^chapter\s+\d+\b/i.test(line)) {
      return;
    }

    const verseMatch = line.match(/^(\d+)\s+(.*)$/);
    if (verseMatch) {
      flushCurrentVerse();
      currentVerse = verseMatch[1];
      currentParts = [verseMatch[2].trim()];
      return;
    }

    if (currentVerse !== null) {
      currentParts.push(line);
    }
  });

  flushCurrentVerse();
  return verseMap;
}

function buildPsalmPassageFromVerseMap(chapter, verseMap, versesToFetch, depth) {
  const seenTexts = new Set();
  const lines = [];

  versesToFetch.forEach((verse) => {
    const text = canonicalizePsalmText(verseMap.get(String(verse)));
    if (!text || seenTexts.has(text)) {
      return;
    }
    seenTexts.add(text);
    lines.push(depth === "short" ? text : `Psalm ${chapter}:${verse} ${text}`);
  });

  return lines.join("\n\n");
}

function formatPsalmPreviewText(text, maxLength = 220) {
  const clean = normalizePsalmText(text)
    .replace(/\s+/g, " ")
    .trim();
  return toSnippet(clean, maxLength);
}

function withTerminalPunctuation(text) {
  const clean = String(text || "").trim();
  if (!clean) {
    return "";
  }
  return /[.!?]$/.test(clean) ? clean : `${clean}.`;
}

function fillDailyOpeningTemplate(template, replacements = {}) {
  return String(template || "")
    .replace(/\{([a-zA-Z0-9_]+)\}/g, (_match, key) => String(replacements[key] ?? "").trim())
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDailyOpeningVariant(text) {
  return String(text || "")
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/, "")
    .trim()
    .toLowerCase();
}

function pickDailyOpeningVariant(options, seedParts, recentValues = [], offset = 0) {
  const variants = (Array.isArray(options) ? options : [options])
    .map((option) => String(option || "").trim())
    .filter(Boolean);
  if (!variants.length) {
    return "";
  }

  const seed = (Array.isArray(seedParts) ? seedParts : [seedParts])
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join("|");
  const normalizedRecent = recentValues
    .map((value) => normalizeDailyOpeningVariant(value))
    .filter(Boolean);

  const ranked = variants
    .map((variant, index) => {
      const normalizedVariant = normalizeDailyOpeningVariant(variant);
      const recentIndex = normalizedRecent.findIndex((value) => value === normalizedVariant);
      const recentPenalty = recentIndex === -1 ? 0 : (normalizedRecent.length - recentIndex) * 1_000_000;
      return {
        variant,
        score: hashString(`${seed}|${variant}|${index}`) - recentPenalty,
      };
    })
    .sort((left, right) => right.score - left.score);

  const safeOffset = Math.max(0, Number.parseInt(offset, 10) || 0);
  return ranked[safeOffset % ranked.length]?.variant || ranked[0]?.variant || "";
}

function getRecentDailyOpeningIntentions(excludeDateKey, limit = 6) {
  const state = loadDailyActionState();
  return Object.keys(state)
    .filter((dateKey) => dateKey !== excludeDateKey)
    .sort()
    .reverse()
    .map((dateKey) => normalizeDailyActionEntry(state[dateKey]))
    .map((entry) => String(entry.openingIntention || "").trim())
    .filter(Boolean)
    .slice(0, limit);
}

function sentenceCase(text) {
  const clean = String(text || "").trim();
  if (!clean) {
    return "";
  }
  return `${clean.charAt(0).toUpperCase()}${clean.slice(1)}`;
}

function buildRuleOfLife(timeState, referenceMap, now, derived, lifeState) {
  const focused = lifeState?.focusedDomain;
  const weakest = lifeState?.weakestDomain;
  if (!focused) {
    return null;
  }

  const dayLabel = timeState?.dayLabel;
  const activePentacle = timeState?.active?.pentacle || null;
  const pentacleKey = getPentacleKey(activePentacle);
  const pentacleRecord = pentacleKey ? referenceMap.get(pentacleKey) : null;
  const primaryPsalm = getPrimaryPsalmEntry(pentacleRecord);
  const readablePsalm = formatReadablePsalmReference(primaryPsalm);
  const focusTemplates = RULE_OF_LIFE_LIBRARY[focused.id] || RULE_OF_LIFE_LIBRARY.mind;
  const weakestTemplates = RULE_OF_LIFE_LIBRARY[weakest?.id] || focusTemplates;
  const tone = RULE_OF_LIFE_DAY_TONES[dayLabel?.rulerText] || "with steadiness";
  const pentacleFocus = activePentacle?.pentacle?.focus
    ? sentenceCase(activePentacle.pentacle.focus.toLowerCase())
    : "";
  const psalmChapter = primaryPsalm
    ? Number.parseInt(primaryPsalm.number ?? primaryPsalm.psalm, 10)
    : Number.NaN;
  const psalmVerse = primaryPsalm
    ? expandVerseSpecification(primaryPsalm.verses || "")[0] || null
    : null;
  const repairLine = weakest
    ? `Repair ${weakest.name.toLowerCase()} before the day closes.`
    : "Keep the whole wheel in view before the day closes.";

  const morning = `${focusTemplates.morning} Begin ${tone}.`;
  const middayBase = weakest && weakest.id !== focused.id
    ? weakestTemplates.repair
    : focusTemplates.midday;
  const midday = `${middayBase}${pentacleFocus ? ` Let ${pentacleFocus.toLowerCase()} govern the hard moment.` : ""}`;
  const evening = `${focusTemplates.evening}${readablePsalm ? ` Close with ${readablePsalm}.` : ""}`;
  const summary = weakest
    ? `${dayLabel?.rulerText || "Today"} leans toward ${focused.name.toLowerCase()} through ${focused.virtue.toLowerCase()}. ${repairLine}`
    : `${dayLabel?.rulerText || "Today"} leans toward ${focused.name.toLowerCase()} through ${focused.virtue.toLowerCase()}.`;

  return {
    virtue: focused.virtue,
    domain: focused.name,
    focusedDomain: focused.name,
    weakestDomain: weakest?.name || null,
    weakestScore: weakest?.score ?? null,
    summary: withTerminalPunctuation(summary),
    morning: withTerminalPunctuation(morning),
    midday: withTerminalPunctuation(midday),
    evening: withTerminalPunctuation(evening),
    repairNote: repairLine,
    anchor: readablePsalm || (activePentacle?.pentacle?.focus ? sentenceCase(activePentacle.pentacle.focus) : ""),
    psalmRef: readablePsalm,
    psalmChapter: Number.isNaN(psalmChapter) ? null : psalmChapter,
    psalmVerse,
  };
}

function buildActionLoopContext(timeState, referenceMap, now, derived, lifeState) {
  const ruleOfLife = buildRuleOfLife(timeState, referenceMap, now, derived, lifeState);
  const dateKey = formatDateStorageKey(now);
  const guidedPrompt = buildGuidedPromptFromContext(ruleOfLife, timeState);
  const dayLabel = timeState?.dayLabel || null;
  const guidance = dayLabel ? PLANETARY_DAY_GUIDANCE[dayLabel.rulerText] : null;
  const weeklyEntry = buildWeeklyArcEntry(now, 0, derived, referenceMap);
  const activePentacle = timeState?.active?.pentacle || null;
  const pentacleKey = getPentacleKey(activePentacle);
  const pentacleRecord = pentacleKey ? referenceMap.get(pentacleKey) : null;
  const readablePsalm = formatReadablePsalmReference(getPrimaryPsalmEntry(pentacleRecord));
  const wisdom = dayLabel ? WISDOM_CONTENT_BY_RULER[dayLabel.rulerText] : null;
  const dayText = dayLabel?.dayText || "Today";
  const rulerText = dayLabel?.rulerText || "Guidance";
  const label = ruleOfLife
    ? `${ruleOfLife.domain} • ${ruleOfLife.virtue}`
    : `${dayText} • ${rulerText}`;

  return {
    dateKey,
    label,
    guidedPrompt,
    ruleOfLife,
    entry: getDailyActionEntry(dateKey),
    asOf: now.toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    dayText,
    rulerText,
    dayDisplay: `${dayText} (${rulerText})`,
    guidanceTone: guidance?.tone || weeklyEntry.tone,
    guidanceActivities: guidance?.activities || [],
    weeklyEntry,
    activeFocus: activePentacle?.pentacle?.focus || weeklyEntry.focus || "Focus unavailable",
    activePentacleLabel: activePentacle
      ? `${activePentacle.planet} Pentacle #${activePentacle.pentacle.index}`
      : "Unavailable",
    psalmRef: readablePsalm || weeklyEntry.psalmRef,
    wisdomRef: wisdom?.ref || weeklyEntry.wisdomRef,
    solomonicRef: activePentacle
      ? `Key of Solomon, Book II • ${activePentacle.planet} Pentacle #${activePentacle.pentacle.index}`
      : "Key of Solomon, Book II",
    lifeDomainFocus: lifeState?.focusedDomain?.name || ruleOfLife?.domain || null,
    weakestDomain: lifeState?.weakestDomain?.name || ruleOfLife?.weakestDomain || null,
    weakestDomainScore: lifeState?.weakestDomain?.score ?? ruleOfLife?.weakestScore ?? null,
  };
}

function buildDailyActionSnapshot(context) {
  if (!context) {
    return {};
  }

  return pruneEmptyFields({
    guidedPrompt: context.guidedPrompt,
    label: context.label,
    dayDisplay: context.dayDisplay,
    rulerText: context.rulerText,
    activeFocus: context.activeFocus,
    activePentacleLabel: context.activePentacleLabel,
    psalmRef: context.psalmRef,
    wisdomRef: context.wisdomRef,
    solomonicRef: context.solomonicRef,
    lifeDomainFocus: context.lifeDomainFocus,
    weakestDomain: context.weakestDomain,
    weakestDomainScore: context.weakestDomainScore,
    ruleOfLife: context.ruleOfLife
      ? {
        virtue: context.ruleOfLife.virtue,
        domain: context.ruleOfLife.domain,
        morning: context.ruleOfLife.morning,
        midday: context.ruleOfLife.midday,
        evening: context.ruleOfLife.evening,
        summary: context.ruleOfLife.summary,
        repairNote: context.ruleOfLife.repairNote,
        scriptureRef: context.ruleOfLife.psalmRef || context.ruleOfLife.anchor,
      }
      : null,
  });
}

function buildDailyOpeningSummary(context) {
  if (!context?.ruleOfLife) {
    return context?.guidanceTone || `Receive ${String(context?.rulerText || "today").toLowerCase()} with attention and steadiness.`;
  }

  const rule = context.ruleOfLife;
  const focusText = String(context.activeFocus || "").trim();
  const weakestText = String(context.weakestDomain || rule.weakestDomain || "").trim();
  const replacements = {
    ruler: String(context.rulerText || "Today"),
    domain: String(rule.domain || "the day").toLowerCase(),
    virtue: String(rule.virtue || "attention").toLowerCase(),
    focus: focusText.toLowerCase(),
    weakest: weakestText.toLowerCase(),
  };
  const seedParts = [
    context.dateKey,
    context.dayText,
    context.rulerText,
    rule.domain,
    rule.virtue,
    focusText,
    weakestText,
  ];
  const baseSummary = pickDailyOpeningVariant(
    DAILY_OPENING_SUMMARY_TEMPLATES.map((template) => fillDailyOpeningTemplate(template, replacements)),
    [...seedParts, "opening-summary"]
  );

  const supportingOptions = [];
  if (focusText) {
    supportingOptions.push(...DAILY_OPENING_FOCUS_CLAUSES.map((template) => fillDailyOpeningTemplate(template, replacements)));
  }
  if (weakestText && weakestText.toLowerCase() !== String(rule.domain || "").toLowerCase()) {
    supportingOptions.push(...DAILY_OPENING_REPAIR_CLAUSES.map((template) => fillDailyOpeningTemplate(template, replacements)));
  }

  const supportLine = supportingOptions.length
    ? pickDailyOpeningVariant(supportingOptions, [...seedParts, "opening-support"])
    : "";

  return withTerminalPunctuation([baseSummary, supportLine].filter(Boolean).join(". "));
}

function buildDailyOpeningSuggestedIntention(context, offset = 0) {
  if (!context) {
    return "";
  }

  const rule = context.ruleOfLife;
  if (rule) {
    const focusText = String(context.activeFocus || "").trim();
    const morningText = withTerminalPunctuation(String(rule.morning || context.activeFocus || "take one concrete step"));
    const replacements = {
      ruler: String(context.rulerText || "Today"),
      virtue: String(rule.virtue || "attention").toLowerCase(),
      domain: String(rule.domain || "the day").toLowerCase(),
      focus: focusText.toLowerCase(),
      morning: morningText,
    };
    const templates = DAILY_OPENING_INTENTION_TEMPLATES
      .filter((template) => focusText || !template.includes("{focus}"))
      .map((template) => fillDailyOpeningTemplate(template, replacements));
    const openLine = pickDailyOpeningVariant(
      templates,
      [
        context.dateKey,
        context.dayText,
        context.rulerText,
        rule.domain,
        rule.virtue,
        morningText,
      ],
      getRecentDailyOpeningIntentions(context.dateKey),
      offset
    );
    const closeLine = pickDailyOpeningVariant(
      DAILY_OPENING_INTENTION_CLOSES,
      [
        context.dateKey,
        context.rulerText,
        rule.domain,
        rule.virtue,
        "daily-opening-close",
      ],
      getRecentDailyOpeningIntentions(context.dateKey),
      offset
    );
    return [withTerminalPunctuation(openLine), closeLine]
      .filter(Boolean)
      .join(" ");
  }

  if (context.activeFocus) {
    return `Today I will move with ${String(context.rulerText || "wisdom").toLowerCase()} toward ${String(context.activeFocus).toLowerCase()}.`;
  }

  return "Today I will move deliberately, receive counsel, and practice what is given.";
}

function updateDailyOpening(context) {
  if (
    !drawerElements.dailyOpeningOverlay ||
    !drawerElements.dailyOpeningDay ||
    !drawerElements.dailyOpeningFocus ||
    !drawerElements.dailyOpeningSummary ||
    !drawerElements.dailyOpeningAnchorRef ||
    !drawerElements.dailyOpeningIntent ||
    !drawerElements.actionDailyOpening
  ) {
    return;
  }

  if (!context) {
    drawerElements.dailyOpeningOverlay.hidden = true;
    document.body.dataset.dailyOpening = "closed";
    setDailyOpeningAnchorPreview("Today's anchor", "—", { expandable: false, expanded: false });
    return;
  }

  const entry = context.entry || {};
  const opened = Boolean(entry.openingCompletedAt);
  if (lastDailyOpeningDateKey !== context.dateKey) {
    dailyOpeningAnchorExpanded = false;
    lastDailyOpeningAnchorKey = null;
    lastDailyOpeningDateKey = context.dateKey;
    dailyOpeningSuggestionOffset = 0;
  }
  const suggestedIntention = buildDailyOpeningSuggestedIntention(context, dailyOpeningSuggestionOffset);
  const openingSummary = buildDailyOpeningSummary(context);
  const anchorRef = context.ruleOfLife?.psalmRef || context.psalmRef || context.wisdomRef || "Today's anchor";

  drawerElements.dailyOpeningDay.textContent = `${context.dayText} — ${context.rulerText}`;
  drawerElements.dailyOpeningFocus.textContent = context.ruleOfLife
    ? `${context.ruleOfLife.domain} • ${context.ruleOfLife.virtue}`
    : context.label;
  drawerElements.dailyOpeningSummary.textContent = openingSummary;
  drawerElements.dailyOpeningAnchorRef.textContent = anchorRef;
  updateDailyOpeningAnchorPreview(context);

  const preferredIntention = String(entry.openingIntention || "").trim() || suggestedIntention;
  if (
    document.activeElement !== drawerElements.dailyOpeningIntent &&
    (dailyOpeningAutofillKey !== context.dateKey || !String(drawerElements.dailyOpeningIntent.value || "").trim())
  ) {
    drawerElements.dailyOpeningIntent.value = preferredIntention;
    dailyOpeningAutofillKey = context.dateKey;
  }

  drawerElements.actionDailyOpening.textContent = opened ? "Revisit Opening" : "Daily Opening";
  drawerElements.actionDailyOpening.setAttribute("aria-pressed", uiState.dailyOpeningOpen ? "true" : "false");

  if (!opened && !uiState.dailyOpeningOpen && getDailyOpeningDismissedDate() !== context.dateKey) {
    uiState.dailyOpeningOpen = true;
  }

  drawerElements.dailyOpeningOverlay.hidden = !uiState.dailyOpeningOpen;
  document.body.dataset.dailyOpening = uiState.dailyOpeningOpen ? "open" : "closed";
}

function getHistoryEntryStatusBadges(entry) {
  const badges = [];
  if (entry.opened) {
    badges.push("Opened");
  }
  if (entry.completed) {
    badges.push("Completed");
  } else if (entry.adopted) {
    badges.push("Adopted");
  }

  if (entry.hasReflection) {
    badges.push("Reflected");
  }

  if (entry.closed) {
    badges.push("Closed");
  }

  if (entry.launchCount) {
    badges.push(`${entry.launchCount} ${entry.launchCount === 1 ? "launch" : "launches"}`);
  }

  return badges;
}

function getHistoryEntryRecordColor(entry) {
  if (entry.closed && entry.completed) {
    return "#4ade80";
  }
  if (entry.closed) {
    return "#60a5fa";
  }
  if (entry.completed) {
    return "#4ade80";
  }
  if (entry.adopted) {
    return "#facc15";
  }
  if (entry.opened) {
    return "#f59e0b";
  }
  if (entry.hasReflection) {
    return "#a78bfa";
  }
  if (entry.launchCount) {
    return "#60a5fa";
  }
  return "#64748b";
}

function buildHistoryTimelineEntry(baseDate, offset, derived, referenceMap) {
  const weeklyEntry = buildWeeklyArcEntry(baseDate, offset, derived, referenceMap);
  const targetDate = new Date(baseDate);
  targetDate.setHours(12, 0, 0, 0);
  targetDate.setDate(targetDate.getDate() + offset);
  const dateKey = formatDateStorageKey(targetDate);
  const entry = getDailyActionEntry(dateKey);
  const reflection = String(entry.reflection || "").trim();
  const closingSummary = String(entry.closingSummary || "").trim();
  const closingGratitude = String(entry.closingGratitude || "").trim();
  const closingDifficulty = String(entry.closingDifficulty || "").trim();
  const closingCarryForward = String(entry.closingCarryForward || "").trim();
  const openingIntention = String(entry.openingIntention || "").trim();
  const launches = Array.isArray(entry.launches) ? entry.launches : [];
  const latestLaunch = launches.length ? launches[launches.length - 1] : null;
  const latestLinkedLaunch = getLatestLinkedLaunch(launches);
  const opened = Boolean(entry.openingCompletedAt);
  const closed = Boolean(entry.closingCompletedAt || closingSummary || closingCarryForward || closingGratitude || closingDifficulty);
  const adopted = Boolean(entry.adoptedAt);
  const completed = Boolean(entry.completedAt);
  const hasReflection = Boolean(reflection);
  const launchCount = launches.length;
  const linkedLaunchCount = launches.filter((launch) => Boolean(launch?.sessionId)).length;
  const hasRecord = opened || closed || adopted || completed || hasReflection || launchCount > 0;
  const rule = entry.ruleOfLife && typeof entry.ruleOfLife === "object" ? entry.ruleOfLife : null;
  const summaryLine = closingSummary
    || closingCarryForward
    || closingDifficulty
    || closingGratitude
    || rule?.summary
    || openingIntention
    || entry.activeFocus
    || weeklyEntry.focus;
  const titleLine = entry.label || (rule ? `${rule.domain} • ${rule.virtue}` : `${weeklyEntry.rulerText} guidance`);
  const statusBadges = getHistoryEntryStatusBadges({ opened, closed, adopted, completed, hasReflection, launchCount });
  const recordColor = getHistoryEntryRecordColor({ opened, closed, adopted, completed, hasReflection, launchCount });
  const launchSummary = latestLaunch
    ? `${latestLaunch.mode === "freeform" ? "Freeform" : "Guided"} • ${latestLaunch.promptId || "clock launch"}`
    : "";

  return {
    ...weeklyEntry,
    dateKey,
    entry,
    targetDate,
    offset,
    opened,
    closed,
    adopted,
    completed,
    hasReflection,
    hasRecord,
    launchCount,
    linkedLaunchCount,
    latestLaunch,
    latestLinkedLaunch,
    statusBadges,
    recordColor,
    titleLine,
    summaryLine,
    reflection,
    reflectionSnippet: toInlineSnippet(reflection, 180),
    closingSummary,
    closingGratitude,
    closingDifficulty,
    closingCarryForward,
    closingSnippet: toInlineSnippet(closingSummary || closingCarryForward || closingDifficulty || closingGratitude, 200),
    launchSummary,
    scriptureRef: rule?.scriptureRef || entry.psalmRef || weeklyEntry.psalmRef,
    displayFocus: entry.activeFocus || weeklyEntry.focus,
    ruleVirtue: rule?.virtue || "",
    ruleDomain: rule?.domain || "",
  };
}

function getProvidenceMapOrbitRadii(radii) {
  const inner = Math.max(radii.spirit - 62, radii.planetary + 26);
  const middle = Math.max(radii.spirit - 36, inner + 18);
  const outer = Math.max(radii.spirit - 12, middle + 18);
  return { inner, middle, outer };
}

function getProvidenceMapRadius(distanceDays, radii) {
  const orbitRadii = getProvidenceMapOrbitRadii(radii);
  const normalizedDistance = Math.max(0, Math.min(PROVIDENCE_MAP_MAX_DAYS, Number(distanceDays) || 0));
  const ratio = normalizedDistance / PROVIDENCE_MAP_MAX_DAYS;
  return orbitRadii.inner + (orbitRadii.outer - orbitRadii.inner) * ratio;
}

function getHistoryRulerColor(rulerText, alpha = 1) {
  return hexToRgba(HISTORY_RULER_COLORS[rulerText] || "#cbd5f5", alpha);
}

function getProvidenceMapEntries(baseDate, derived, referenceMap, radii) {
  const state = loadDailyActionState();
  const recordedEntries = Object.keys(state)
    .map((dateKey) => buildHistoryTimelineEntryFromDateKey(dateKey, baseDate, derived, referenceMap))
    .filter((entry) => entry && entry.hasRecord && Math.abs(entry.offset) <= PROVIDENCE_MAP_MAX_DAYS)
    .sort((left, right) => left.targetDate - right.targetDate)
    .slice(-PROVIDENCE_MAP_MAX_ENTRIES);
  const entryByDateKey = new Map(recordedEntries.map((entry) => [entry.dateKey, entry]));

  const selectedEntry = buildHistoryTimelineEntry(baseDate, selectedDayOffset, derived, referenceMap);
  if (
    selectedEntry
    && !entryByDateKey.has(selectedEntry.dateKey)
    && Math.abs(selectedEntry.offset) <= PROVIDENCE_MAP_MAX_DAYS
  ) {
    recordedEntries.push(selectedEntry);
    entryByDateKey.set(selectedEntry.dateKey, selectedEntry);
  }

  if (recordedEntries.length < PROVIDENCE_MAP_MIN_CONTEXT_ENTRIES) {
    for (let offset = selectedDayOffset - (PROVIDENCE_MAP_MIN_CONTEXT_ENTRIES - 1); offset <= selectedDayOffset; offset += 1) {
      if (Math.abs(offset) > PROVIDENCE_MAP_MAX_DAYS) {
        continue;
      }
      const entry = buildHistoryTimelineEntry(baseDate, offset, derived, referenceMap);
      if (!entry || entryByDateKey.has(entry.dateKey)) {
        continue;
      }
      recordedEntries.push(entry);
      entryByDateKey.set(entry.dateKey, entry);
    }
  }

  recordedEntries.sort((left, right) => left.targetDate - right.targetDate);

  return recordedEntries.map((entry) => {
    const distanceDays = Math.abs(entry.offset);
    const weekIndex = Math.floor(distanceDays / 7);
    const angleNudge = weekIndex
      ? degreesToRadians((weekIndex % 2 === 0 ? 1 : -1) * Math.min(weekIndex, 4) * 2.2)
      : 0;
    const angleRadians = (-((Number(entry.weekFraction) || 0) * Math.PI * 2)) - Math.PI / 2 + angleNudge;
    const orbitRadius = getProvidenceMapRadius(distanceDays, radii);
    const point = polarPoint(0, 0, orbitRadius, angleRadians);
    const nodeRadius = 4.8
      + (entry.closed ? 1.6 : 0)
      + (entry.completed ? 0.9 : 0)
      + (entry.hasReflection ? 0.5 : 0)
      + Math.min(entry.launchCount, 4) * 0.3;

    return {
      ...entry,
      distanceDays,
      mapAngle: angleRadians,
      mapRadius: orbitRadius,
      x: point.x,
      y: point.y,
      rulerColor: getHistoryRulerColor(entry.rulerText, entry.hasRecord ? 0.94 : 0.46),
      nodeRadius,
      haloRadius: nodeRadius + (entry.offset === selectedDayOffset ? 5.2 : entry.closed ? 2.8 : entry.hasReflection ? 1.8 : 0.8),
      shortLabel: entry.isToday ? "Today" : entry.dateLabel.replace(",", ""),
      isSelected: entry.offset === selectedDayOffset,
      isGhost: !entry.hasRecord,
    };
  });
}

function buildHistoryTimelineEntryFromDateKey(dateKey, baseDate, derived, referenceMap) {
  const targetDate = parseDateStorageKey(dateKey);
  if (!targetDate) {
    return null;
  }

  const offset = diffCalendarDays(baseDate, targetDate);
  return buildHistoryTimelineEntry(baseDate, offset, derived, referenceMap);
}

function getRecordedHistoryEntries(baseDate, derived, referenceMap, limit = 6) {
  const state = loadDailyActionState();
  return Object.keys(state)
    .sort()
    .reverse()
    .map((dateKey) => buildHistoryTimelineEntryFromDateKey(dateKey, baseDate, derived, referenceMap))
    .filter((entry) => entry && entry.hasRecord)
    .slice(0, limit);
}

function incrementCount(map, label) {
  const clean = String(label || "").trim();
  if (!clean) {
    return;
  }
  map.set(clean, (map.get(clean) || 0) + 1);
}

function pickTopCount(map) {
  let winner = null;
  map.forEach((count, label) => {
    if (!winner || count > winner.count || (count === winner.count && label < winner.label)) {
      winner = { label, count };
    }
  });
  return winner;
}

function getWeeklyHistoryEntries(baseDate, derived, referenceMap) {
  const entries = [];
  for (let offset = selectedDayOffset - 6; offset <= selectedDayOffset; offset += 1) {
    entries.push(buildHistoryTimelineEntry(baseDate, offset, derived, referenceMap));
  }
  return entries;
}

function buildWeeklyHistorySummary(baseDate, derived, referenceMap) {
  const entries = getWeeklyHistoryEntries(baseDate, derived, referenceMap);
  const recordedEntries = entries.filter((entry) => entry.hasRecord);
  const windowStart = entries[0];
  const windowEnd = entries[entries.length - 1];
  const windowLabel = `${windowStart.dateLabel} — ${windowEnd.dateLabel}`;

  if (!recordedEntries.length) {
    return {
      key: `${windowLabel}|empty`,
      windowLabel,
      narrative: "No recorded week yet. Open the day, act, and close it to begin a readable trail.",
      metaItems: [],
      patterns: [],
    };
  }

  const closedCount = recordedEntries.filter((entry) => entry.closed).length;
  const completedCount = recordedEntries.filter((entry) => entry.completed).length;
  const reflectedCount = recordedEntries.filter((entry) => entry.hasReflection).length;
  const adoptedCount = recordedEntries.filter((entry) => entry.adopted).length;
  const incompleteCount = recordedEntries.filter((entry) => entry.adopted && !entry.completed).length;
  const unclosedCount = recordedEntries.filter((entry) => !entry.closed).length;
  const launchCount = recordedEntries.reduce((sum, entry) => sum + entry.launchCount, 0);

  const virtueCounts = new Map();
  const domainCounts = new Map();
  const scriptureCounts = new Map();

  recordedEntries.forEach((entry) => {
    incrementCount(virtueCounts, entry.ruleVirtue);
    incrementCount(domainCounts, entry.ruleDomain);
    incrementCount(scriptureCounts, entry.scriptureRef);
  });

  const topVirtue = pickTopCount(virtueCounts);
  const topDomain = pickTopCount(domainCounts);
  const topScripture = pickTopCount(scriptureCounts);

  const narrativeParts = [
    `${recordedEntries.length} recorded ${recordedEntries.length === 1 ? "day" : "days"}`,
    `${closedCount} closed`,
  ];

  if (completedCount) {
    narrativeParts.push(`${completedCount} completed`);
  } else if (adoptedCount) {
    narrativeParts.push(`${adoptedCount} adopted`);
  }

  if (reflectedCount) {
    narrativeParts.push(`${reflectedCount} reflected`);
  }

  if (launchCount) {
    narrativeParts.push(`${launchCount} ${launchCount === 1 ? "launch" : "launches"}`);
  }

  let narrative = `${narrativeParts.join(", ")} this week.`;
  if (topVirtue) {
    narrative += ` ${topVirtue.label} was the clearest virtue emphasis.`;
  }
  if (topDomain) {
    narrative += ` ${topDomain.label} kept returning as the field of practice.`;
  }

  const patterns = [];
  if (topDomain && topDomain.count >= 2) {
    patterns.push(`${topDomain.label} appeared on ${topDomain.count} recorded days, so the same field of life kept asking for attention.`);
  }
  if (incompleteCount >= 2) {
    patterns.push(`${incompleteCount} adopted ${incompleteCount === 1 ? "day remained" : "days remained"} incomplete, which suggests resistance after intention was set.`);
  }
  if (unclosedCount >= 2) {
    patterns.push(`${unclosedCount} recorded ${unclosedCount === 1 ? "day was" : "days were"} left open without a full closing, so review may be trailing behind action.`);
  }
  if (launchCount >= 3) {
    patterns.push(`You leaned on Pericope ${launchCount} times this week, which signals a recurring need for guided conversation rather than isolated questions.`);
  }
  if (topScripture && topScripture.count >= 2) {
    patterns.push(`${topScripture.label} reappeared ${topScripture.count} times, so the same scriptural thread is staying near the center of the week.`);
  }
  if (!patterns.length && reflectedCount >= 2) {
    patterns.push(`Reflection held on ${reflectedCount} recorded days, which is enough to begin seeing a stable rhythm rather than isolated entries.`);
  }

  const metaItems = [
    `${recordedEntries.length} recorded`,
    `${closedCount} closed`,
  ];
  if (completedCount) {
    metaItems.push(`${completedCount} completed`);
  }
  if (reflectedCount) {
    metaItems.push(`${reflectedCount} reflected`);
  }
  if (launchCount) {
    metaItems.push(`${launchCount} ${launchCount === 1 ? "launch" : "launches"}`);
  }
  if (topVirtue) {
    metaItems.push(`Virtue • ${topVirtue.label}`);
  }
  if (topDomain) {
    metaItems.push(`Domain • ${topDomain.label}`);
  }

  return {
    key: JSON.stringify({
      windowLabel,
      recorded: recordedEntries.map((entry) => `${entry.dateKey}:${entry.entry.updatedAt || entry.entry.closingUpdatedAt || entry.entry.reflectionUpdatedAt || entry.entry.completedAt || entry.entry.adoptedAt || ""}:${entry.launchCount}`),
      topVirtue: topVirtue?.label || "",
      topDomain: topDomain?.label || "",
    }),
    windowLabel,
    narrative,
    metaItems,
    patterns: patterns.slice(0, 3),
    entries,
    recordedEntries,
    closedCount,
    completedCount,
    reflectedCount,
    adoptedCount,
    incompleteCount,
    unclosedCount,
    launchCount,
    topVirtue: topVirtue?.label || "",
    topVirtueCount: topVirtue?.count || 0,
    topDomain: topDomain?.label || "",
    topDomainCount: topDomain?.count || 0,
    topScripture: topScripture?.label || "",
    topScriptureCount: topScripture?.count || 0,
  };
}

function parsePsalmReferenceString(reference) {
  const match = String(reference || "").trim().match(/^Psalm\s+(\d+)(?::([\d,\-]+))?$/i);
  if (!match) {
    return null;
  }
  const chapter = Number.parseInt(match[1], 10);
  if (Number.isNaN(chapter) || chapter <= 0) {
    return null;
  }
  return {
    chapter,
    verseSpec: match[2] || "",
    verse: expandVerseSpecification(match[2] || "")[0] || null,
  };
}

function buildWeeklyReview(summary, selectedEntry) {
  const recordedEntries = Array.isArray(summary?.recordedEntries) ? summary.recordedEntries : [];
  const latestRecorded = recordedEntries[recordedEntries.length - 1] || selectedEntry;
  const anchorEntry = recordedEntries
    .slice()
    .reverse()
    .find((entry) => (
      (summary?.topDomain && entry.ruleDomain === summary.topDomain)
      || (summary?.topVirtue && entry.ruleVirtue === summary.topVirtue)
    )) || latestRecorded;

  const encouragement = summary?.topVirtue
    ? `The week held together most clearly when ${summary.topVirtue.toLowerCase()} was practiced in ${String(summary.topDomain || anchorEntry?.ruleDomain || "the active field").toLowerCase()}.`
    : summary?.reflectedCount >= 3
      ? `You kept returning to reflection instead of leaving the week to drift, which is a real grace to build on.`
      : `A readable rhythm is forming. Stay close to the places where the week felt most deliberate.`;

  let warning = "Do not let the next week become reactive where this one needed deliberate review.";
  if ((summary?.incompleteCount || 0) >= 2) {
    warning = "The week weakened after intention was set, so do not confuse naming a practice with actually carrying it through.";
  } else if ((summary?.unclosedCount || 0) >= 2) {
    warning = "Several recorded days stayed open, so review is trailing behind action and needs to be restored deliberately.";
  } else if ((summary?.topDomainCount || 0) >= 3 && summary?.topDomain) {
    warning = `${summary.topDomain} kept returning, so avoid treating that field of life as solved just because it is familiar.`;
  }

  const carrySeed = String(
    anchorEntry?.closingCarryForward
    || anchorEntry?.entry?.closingCarryForward
    || anchorEntry?.entry?.ruleOfLife?.morning
    || anchorEntry?.entry?.ruleOfLife?.summary
    || anchorEntry?.displayFocus
    || selectedEntry?.displayFocus
    || "repeat the clearest act of fidelity"
  ).trim();
  const loweredCarrySeed = carrySeed ? `${carrySeed.charAt(0).toLowerCase()}${carrySeed.slice(1)}` : "repeat the clearest act of fidelity";
  const carryForward = withTerminalPunctuation(
    summary?.topVirtue && (summary?.topDomain || anchorEntry?.ruleDomain)
      ? `Carry ${summary.topVirtue.toLowerCase()} into ${String(summary.topDomain || anchorEntry?.ruleDomain).toLowerCase()} by ${loweredCarrySeed}`
      : `Carry the clearest grace of this week forward by ${loweredCarrySeed}`
  );

  const scriptureRef = summary?.topScripture || anchorEntry?.scriptureRef || selectedEntry?.scriptureRef || "Today's scripture";
  const parsedPsalm = parsePsalmReferenceString(scriptureRef);
  const scriptureText = parsedPsalm
    ? formatPsalmPreviewText(getPsalmFallbackText(parsedPsalm.chapter, parsedPsalm.verse), 220)
    : `Keep ${scriptureRef} near the beginning of next week.`;

  const pericopePrompt = withTerminalPunctuation(
    `Review this week through ${String(summary?.topVirtue || anchorEntry?.ruleVirtue || "the week’s guidance").toLowerCase()}${summary?.topDomain || anchorEntry?.ruleDomain ? ` in ${String(summary?.topDomain || anchorEntry?.ruleDomain).toLowerCase()}` : ""}. Encourage what held, warn me about what repeated, and help me carry this forward: ${carryForward}`
  );

  return {
    encouragement: withTerminalPunctuation(encouragement),
    warning: withTerminalPunctuation(warning),
    carryForward,
    scriptureRef,
    scriptureText,
    prompt: pericopePrompt,
  };
}

function formatWeeklyReviewStatus(selectedEntry) {
  const status = String(selectedEntry?.entry?.weeklyReviewStatus || "").trim();
  const note = String(selectedEntry?.entry?.weeklyReviewNote || "").trim();
  if (status === "accepted") {
    return note
      ? `Direction received. Note: ${toInlineSnippet(note, 140)}`
      : "Direction received for this week.";
  }
  if (status === "revised") {
    return note
      ? `Direction revised. Note: ${toInlineSnippet(note, 140)}`
      : "Direction revised for this week.";
  }
  return "No weekly review saved yet.";
}

function buildWeeklyReviewLaunchContext(selectedEntry, review) {
  const ruleOfLife = selectedEntry?.entry?.ruleOfLife && typeof selectedEntry.entry.ruleOfLife === "object"
    ? {
      virtue: selectedEntry.entry.ruleOfLife.virtue || "",
      domain: selectedEntry.entry.ruleOfLife.domain || "",
      morning: selectedEntry.entry.ruleOfLife.morning || review.carryForward,
      midday: selectedEntry.entry.ruleOfLife.midday || review.warning,
      evening: selectedEntry.entry.ruleOfLife.evening || review.encouragement,
      psalmRef: selectedEntry.entry.ruleOfLife.scriptureRef || review.scriptureRef,
      anchor: selectedEntry.entry.ruleOfLife.scriptureRef || review.scriptureRef,
    }
    : {
      virtue: selectedEntry?.ruleVirtue || "Guidance",
      domain: selectedEntry?.ruleDomain || "Week",
      morning: review.carryForward,
      midday: review.warning,
      evening: review.encouragement,
      psalmRef: review.scriptureRef,
      anchor: review.scriptureRef,
    };

  return {
    asOf: selectedEntry?.targetDate?.toISOString?.() || new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    dayDisplay: `${selectedEntry?.dateLabel || "Selected day"} (${selectedEntry?.rulerText || "week"})`,
    dayText: selectedEntry?.dateLabel || "Selected day",
    rulerText: selectedEntry?.rulerText || "Week",
    label: `${ruleOfLife.domain} • ${ruleOfLife.virtue}`,
    guidanceTone: review.encouragement,
    guidanceActivities: [review.carryForward, review.warning],
    weeklyEntry: selectedEntry,
    activeFocus: selectedEntry?.displayFocus || review.carryForward,
    activePentacleLabel: selectedEntry?.pentacleLabel || "",
    lifeDomainFocus: ruleOfLife.domain,
    weakestDomain: "",
    weakestDomainScore: null,
    ruleOfLife,
    psalmRef: review.scriptureRef,
    wisdomRef: selectedEntry?.wisdomRef || "",
    solomonicRef: selectedEntry?.entry?.solomonicRef || selectedEntry?.solomonicRef || "",
    entry: selectedEntry?.entry || {},
    dateKey: selectedEntry?.dateKey || "",
    guidedPrompt: review.prompt,
  };
}

function describeHistoryLaunches(entry) {
  if (!entry?.launchCount) {
    return "No Pericope launches recorded yet.";
  }

  const latestLaunch = entry.latestLaunch;
  const latestLinkedLaunch = entry.latestLinkedLaunch;
  const latestSummary = latestLaunch
    ? `${latestLaunch.mode === "freeform" ? "freeform" : "guided"} • ${latestLaunch.promptId || "clock prompt"}`
    : "clock prompt";
  if (latestLinkedLaunch?.sessionId) {
    const personaLabel = String(latestLinkedLaunch.sessionPersona || "").trim();
    const personaText = personaLabel ? ` with ${personaLabel}` : "";
    return `${entry.launchCount} ${entry.launchCount === 1 ? "launch" : "launches"} recorded. ${entry.linkedLaunchCount || 0} linked to saved Pericope sessions. Latest: ${latestSummary}${personaText}.`;
  }
  return `${entry.launchCount} ${entry.launchCount === 1 ? "launch" : "launches"} recorded. Latest: ${latestSummary}. Waiting for linked session history.`;
}

function updateRuleOfLifePanels(rule) {
  const key = rule
    ? [rule.virtue, rule.domain, rule.morning, rule.midday, rule.evening].join("|")
    : "none";

  if (key === lastRuleOfLifeKey) {
    return;
  }
  lastRuleOfLifeKey = key;

  const showRule = Boolean(rule) && uiState.mode === "practice";

  if (drawerElements.surfaceRule) {
    drawerElements.surfaceRule.hidden = !showRule;
  }
  if (drawerElements.ruleSection) {
    drawerElements.ruleSection.hidden = !showRule;
  }

  if (!showRule) {
    updateRuleScripturePreview(null);
    return;
  }

  if (drawerElements.surfaceRuleVirtue) {
    drawerElements.surfaceRuleVirtue.textContent = rule.virtue;
  }
  if (drawerElements.surfaceRuleDomain) {
    drawerElements.surfaceRuleDomain.textContent = rule.domain;
  }
  if (drawerElements.surfaceRuleMorning) {
    drawerElements.surfaceRuleMorning.textContent = rule.morning;
  }
  if (drawerElements.surfaceRuleMidday) {
    drawerElements.surfaceRuleMidday.textContent = rule.midday;
  }
  if (drawerElements.surfaceRuleEvening) {
    drawerElements.surfaceRuleEvening.textContent = rule.evening;
  }

  if (drawerElements.ruleVirtue) {
    drawerElements.ruleVirtue.textContent = rule.virtue;
  }
  if (drawerElements.ruleDomain) {
    drawerElements.ruleDomain.textContent = rule.domain;
  }
  if (drawerElements.ruleMorning) {
    drawerElements.ruleMorning.textContent = rule.morning;
  }
  if (drawerElements.ruleMidday) {
    drawerElements.ruleMidday.textContent = rule.midday;
  }
  if (drawerElements.ruleEvening) {
    drawerElements.ruleEvening.textContent = rule.evening;
  }

  updateRuleScripturePreview(rule);
}

function setRuleScripturePreview(target, reference, text, { loading = false, error = false } = {}) {
  if (!target?.container || !target?.ref || !target?.text) {
    return;
  }

  target.container.hidden = false;
  target.ref.textContent = reference;
  target.text.textContent = text;
  target.text.classList.toggle("loading", loading);
  target.text.classList.toggle("error", error);
}

function clearRuleScripturePreview(target) {
  if (!target?.container || !target?.ref || !target?.text) {
    return;
  }

  target.container.hidden = true;
  target.ref.textContent = "—";
  target.text.textContent = "—";
  target.text.classList.remove("loading", "error");
}

function setDailyOpeningAnchorPreview(reference, text, {
  loading = false,
  error = false,
  expandable = false,
  expanded = false,
} = {}) {
  if (
    !drawerElements.dailyOpeningAnchorRef ||
    !drawerElements.dailyOpeningAnchorText ||
    !drawerElements.dailyOpeningAnchorToggle
  ) {
    return;
  }

  drawerElements.dailyOpeningAnchorRef.textContent = reference || "Today's anchor";
  drawerElements.dailyOpeningAnchorText.textContent = text || "No passage available.";
  drawerElements.dailyOpeningAnchorText.classList.toggle("loading", loading);
  drawerElements.dailyOpeningAnchorText.classList.toggle("error", error);
  drawerElements.dailyOpeningAnchorToggle.hidden = !expandable;
  drawerElements.dailyOpeningAnchorToggle.textContent = expanded ? "Show Less" : "Read More";
  drawerElements.dailyOpeningAnchorToggle.setAttribute("aria-expanded", expanded ? "true" : "false");
}

function updateDailyOpeningAnchorPreview(context) {
  if (
    !drawerElements.dailyOpeningAnchorRef ||
    !drawerElements.dailyOpeningAnchorText ||
    !drawerElements.dailyOpeningAnchorToggle
  ) {
    return;
  }

  const rule = context?.ruleOfLife || null;
  const anchorRef = rule?.psalmRef || context?.psalmRef || context?.wisdomRef || "Today's anchor";
  const wisdomText = context?.rulerText
    ? sanitizeInlinePassageText(WISDOM_CONTENT_BY_RULER[context.rulerText]?.text || "")
    : "";
  const hasPsalmAnchor = Boolean(rule?.psalmChapter && anchorRef);
  const key = [
    context?.dateKey || "none",
    anchorRef,
    rule?.psalmChapter || "none",
    rule?.psalmVerse || "none",
    dailyOpeningAnchorExpanded ? "expanded" : "preview",
  ].join("|");

  if (key === lastDailyOpeningAnchorKey) {
    return;
  }
  lastDailyOpeningAnchorKey = key;

  if (!hasPsalmAnchor) {
    setDailyOpeningAnchorPreview(anchorRef, wisdomText || anchorRef, {
      expandable: false,
      expanded: false,
    });
    return;
  }

  const requestId = ++currentDailyOpeningPsalmRequestId;
  setDailyOpeningAnchorPreview(
    anchorRef,
    dailyOpeningAnchorExpanded ? "Loading full passage…" : "Loading scripture anchor…",
    {
      loading: true,
      expandable: true,
      expanded: dailyOpeningAnchorExpanded,
    }
  );

  const previewPromise = dailyOpeningAnchorExpanded
    ? retrievePsalmPassage(rule.psalmChapter, rule.psalmVerse, "medium")
    : retrievePsalmText(rule.psalmChapter, rule.psalmVerse);

  previewPromise.then((text) => {
    if (requestId !== currentDailyOpeningPsalmRequestId) {
      return;
    }

    const passageText = dailyOpeningAnchorExpanded
      ? normalizePsalmText(text)
      : formatPsalmPreviewText(text, 260);
    setDailyOpeningAnchorPreview(anchorRef, passageText || "No passage returned.", {
      expandable: true,
      expanded: dailyOpeningAnchorExpanded,
    });
  }).catch((error) => {
    console.error("Failed to fetch daily opening scripture anchor", error);
    if (requestId !== currentDailyOpeningPsalmRequestId) {
      return;
    }

    setDailyOpeningAnchorPreview(anchorRef, "Unable to load scripture anchor.", {
      expandable: true,
      expanded: dailyOpeningAnchorExpanded,
      error: true,
    });
  });
}

function updateRuleScripturePreview(rule) {
  const previewTargets = [
    {
      container: drawerElements.surfaceRuleScripture,
      ref: drawerElements.surfaceRuleScriptureRef,
      text: drawerElements.surfaceRuleScriptureText,
      maxLength: 190,
    },
    {
      container: drawerElements.ruleScripture,
      ref: drawerElements.ruleScriptureRef,
      text: drawerElements.ruleScriptureText,
      maxLength: 340,
    },
  ];

  if (!rule?.psalmRef || !rule?.psalmChapter) {
    currentRulePsalmRequestId += 1;
    previewTargets.forEach(clearRuleScripturePreview);
    return;
  }

  const requestId = ++currentRulePsalmRequestId;
  previewTargets.forEach((target) => {
    setRuleScripturePreview(target, rule.psalmRef, "Loading psalm excerpt…", { loading: true });
  });

  retrievePsalmText(rule.psalmChapter, rule.psalmVerse).then((text) => {
    if (requestId !== currentRulePsalmRequestId) {
      return;
    }

    previewTargets.forEach((target) => {
      const preview = formatPsalmPreviewText(text, target.maxLength);
      setRuleScripturePreview(target, rule.psalmRef, preview || "No psalm text returned.");
    });
  }).catch((error) => {
    console.error("Failed to fetch rule-of-life psalm excerpt", error);
    if (requestId !== currentRulePsalmRequestId) {
      return;
    }

    previewTargets.forEach((target) => {
      setRuleScripturePreview(target, rule.psalmRef, "Unable to fetch psalm excerpt.", { error: true });
    });
  });
}

async function retrievePsalmPassage(chapter, verseSpec, depth = readingDepth) {
  if (depth === "long" || !verseSpec) {
    return normalizePsalmText(await retrievePsalmText(chapter));
  }

  const versesToFetch = selectVersesForDepth(verseSpec, depth);
  if (!versesToFetch.length) {
    return normalizePsalmText(await retrievePsalmText(chapter));
  }

  try {
    const chapterText = await retrievePsalmText(chapter);
    const verseMap = parsePsalmChapterVerseMap(chapterText);
    const passageFromChapter = buildPsalmPassageFromVerseMap(chapter, verseMap, versesToFetch, depth);
    if (passageFromChapter) {
      return passageFromChapter;
    }

    // Some mapped Psalm references resolve at the chapter level but do not preserve
    // the original verse numbering one-to-one. In those cases, prefer the resolved
    // chapter text instead of issuing failing per-verse requests that only add noise.
    if (chapterText) {
      return normalizePsalmText(chapterText);
    }
  } catch (_error) {
    // Fall through to individual verse fetches when chapter retrieval itself fails.
  }

  const results = await Promise.allSettled(
    versesToFetch.map(async (verse) => ({
      verse,
      text: await retrievePsalmText(chapter, verse),
    }))
  );

  const seenTexts = new Set();
  const combined = results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value)
    .map((entry) => ({
      verse: entry.verse,
      text: normalizePsalmText(entry.text),
      dedupeKey: canonicalizePsalmText(entry.text),
    }))
    .filter((entry) => Boolean(entry.text))
    .filter((entry) => {
      if (!entry.dedupeKey || seenTexts.has(entry.dedupeKey)) {
        return false;
      }
      seenTexts.add(entry.dedupeKey);
      return true;
    })
    .map((entry) => (
      depth === "short"
        ? entry.text
        : `Psalm ${chapter}:${entry.verse} ${entry.text}`
    ))
    .join("\n\n");

  return combined || normalizePsalmText(await retrievePsalmText(chapter));
}

function updateActionLoop(context) {
  if (
    !drawerElements.actionDailyOpening ||
    !drawerElements.actionAdopt ||
    !drawerElements.actionComplete ||
    !drawerElements.actionReflect ||
    !drawerElements.actionCloseDay ||
    !drawerElements.actionPericopeGuided ||
    !drawerElements.actionPericopeFreeform ||
    !drawerElements.actionStatus ||
    !drawerElements.reflectionSection ||
    !drawerElements.reflectionInput ||
    !drawerElements.closingSection ||
    !drawerElements.closingSummaryInput ||
    !drawerElements.closingGratitudeInput ||
    !drawerElements.closingDifficultyInput ||
    !drawerElements.closingCarryInput
  ) {
    return;
  }

  const entry = context?.entry || {};
  const opened = Boolean(entry.openingCompletedAt);
  const closed = Boolean(entry.closingCompletedAt || entry.closingSummary || entry.closingCarryForward);
  const adopted = Boolean(entry.adoptedAt);
  const completed = Boolean(entry.completedAt);
  const reflection = String(entry.reflection || "");
  const closingSummary = String(entry.closingSummary || "");
  const closingGratitude = String(entry.closingGratitude || "");
  const closingDifficulty = String(entry.closingDifficulty || "");
  const closingCarryForward = String(entry.closingCarryForward || "");
  const reflectionText = getActionLoopReflectionText(context);
  const rule = context?.ruleOfLife || null;
  const reflectionLaunchReady = shouldLaunchReflectionPrompt(context, reflectionText);
  const closingLaunchReady = !reflection && (closingSummary || closingCarryForward || closed);

  drawerElements.actionDailyOpening.textContent = opened ? "Revisit Opening" : "Daily Opening";
  drawerElements.actionDailyOpening.setAttribute("aria-pressed", uiState.dailyOpeningOpen ? "true" : "false");
  drawerElements.actionAdopt.textContent = adopted ? "Practice Chosen" : "Adopt Today’s Practice";
  drawerElements.actionComplete.textContent = completed ? "Completed Today" : "Mark Complete";
  drawerElements.actionCloseDay.textContent = closed ? "Revisit Closing" : "Close The Day";
  drawerElements.actionCloseDay.setAttribute("aria-pressed", uiState.closingOpen ? "true" : "false");
  drawerElements.actionPericopeGuided.textContent = reflectionLaunchReady
    ? (closingLaunchReady ? "Bring Closing To Pericope" : "Bring Reflection To Pericope")
    : "Start Guided Chat";
  drawerElements.actionPericopeFreeform.textContent = (reflection || closingSummary)
    ? "Ask Freely About This Day"
    : "Ask Freely";
  if (drawerElements.actionCopy) {
    drawerElements.actionCopy.textContent = "Copy Guided Prompt";
  }
  drawerElements.actionAdopt.disabled = adopted;
  drawerElements.actionComplete.disabled = !adopted || completed;
  drawerElements.actionReflect.setAttribute("aria-pressed", uiState.reflectionOpen ? "true" : "false");
  drawerElements.reflectionSection.hidden = !(uiState.reflectionOpen || (uiState.mode === "reflection" && !uiState.closingOpen));
  drawerElements.closingSection.hidden = !uiState.closingOpen;

  if (document.activeElement !== drawerElements.reflectionInput) {
    drawerElements.reflectionInput.value = reflection;
  }
  if (!uiState.closingOpen) {
    drawerElements.closingSummaryInput.value = closingSummary;
    drawerElements.closingGratitudeInput.value = closingGratitude;
    drawerElements.closingDifficultyInput.value = closingDifficulty;
    drawerElements.closingCarryInput.value = closingCarryForward;
  }

  if (actionNotice && actionNotice.expiresAt > Date.now()) {
    drawerElements.actionStatus.textContent = actionNotice.text;
    return;
  }
  actionNotice = null;

  if (!opened) {
    drawerElements.actionStatus.textContent = context.ruleOfLife
      ? `Begin with Daily Opening: ${context.ruleOfLife.summary}`
      : "Begin with Daily Opening before choosing a practice.";
    return;
  }

  if (completed) {
    drawerElements.actionStatus.textContent = reflection
      ? `Completed: ${context.label}. Bring the reflection to Pericope when you want counsel.`
      : `Completed: ${context.label}. Add an evening note or ask Pericope to close the loop.`;
    if (closed && closingSummary) {
      drawerElements.actionStatus.textContent = `Day closed: ${toSnippet(closingSummary, 104)}`;
    }
    return;
  }

  if (closed) {
    drawerElements.actionStatus.textContent = closingSummary
      ? `Day closed: ${toSnippet(closingSummary, 104)}`
      : "The day has been closed. Reopen the closing if you want to revise the examen.";
    return;
  }

  if (adopted) {
    drawerElements.actionStatus.textContent = rule
      ? `Active practice: ${rule.morning} Ask Pericope if you want help applying it.`
      : `A daily practice is active for ${context.dateKey}.`;
    return;
  }

  drawerElements.actionStatus.textContent = rule
    ? `Suggested next step: ${rule.morning} Ask Pericope to deepen it.`
    : "Choose one concrete practice to make the day actionable, or ask Pericope for guidance.";
}

function getModePresentation(timeState, referenceMap, now, derived, lifeState) {
  const mode = uiState.mode;
  if (mode === "guidance") {
    return null;
  }

  const dayLabel = timeState?.dayLabel;
  const activePentacle = timeState?.active?.pentacle || null;
  const pentacleKey = getPentacleKey(activePentacle);
  const pentacleRecord = pentacleKey ? referenceMap.get(pentacleKey) : null;
  const readablePsalm = formatReadablePsalmReference(getPrimaryPsalmEntry(pentacleRecord));
  const wisdom = dayLabel ? WISDOM_CONTENT_BY_RULER[dayLabel.rulerText] : null;
  const hourRule = dayLabel ? getPlanetaryHourRuler(now, dayLabel.rulerText) : null;
  const nextHourRule = dayLabel ? getNextPlanetaryHourRuler(now, dayLabel.rulerText) : null;
  const todayEntry = buildWeeklyArcEntry(now, selectedDayOffset, derived, referenceMap);
  const tomorrowEntry = buildWeeklyArcEntry(now, selectedDayOffset + 1, derived, referenceMap);
  const yesterdayEntry = buildWeeklyArcEntry(now, selectedDayOffset - 1, derived, referenceMap);
  const selectedHistoryEntry = buildHistoryTimelineEntry(now, selectedDayOffset, derived, referenceMap);

  if (mode === "practice") {
    const ruleOfLife = buildRuleOfLife(timeState, referenceMap, now, derived, lifeState);
    return {
      centerTitle: ruleOfLife ? "Rule of Life" : "Practice Mode",
      centerSpirit: ruleOfLife
        ? `${ruleOfLife.domain} • ${ruleOfLife.virtue}`
        : "Life Wheel determines the primary practice domain.",
      centerPentacle: ruleOfLife
        ? ruleOfLife.repairNote
        : "Turn today’s focus into a concrete action.",
      surfaceLabel: "Practice Mode",
      surfaceTitle: "Rule of Life",
      surfaceBody: ruleOfLife
        ? ruleOfLife.summary
        : "Practice mode turns the active day into one concrete task.",
      ruleOfLife,
    };
  }

  if (mode === "reflection") {
    const weakest = lifeState?.weakestDomain;
    const closingSummary = String(currentActionLoopContext?.entry?.closingSummary || "").trim();
    return {
      centerTitle: "Reflection",
      centerSpirit: weakest
        ? `Where did ${weakest.virtue.toLowerCase()} fail or appear in ${weakest.name.toLowerCase()} today?`
        : "Examine where your attention was most tested today.",
      centerPentacle: readablePsalm
        ? `Anchor • ${readablePsalm}`
        : "Review the day with honesty and precision.",
      surfaceLabel: "Reflection Mode",
      surfaceTitle: closingSummary ? "Daily Closing" : "Examine the Day",
      surfaceBody: closingSummary
        ? toSnippet(closingSummary, 116)
        : weakest
          ? `Ask what strengthened or weakened ${weakest.name.toLowerCase()} today, and record one honest note.`
          : "Reflection mode turns the center toward examination rather than action.",
    };
  }

  if (mode === "mentor") {
    return {
      centerTitle: "Mentor • Solomon",
      centerSpirit: wisdom?.ref ? `Counsel anchor • ${wisdom.ref}` : "Wisdom voice",
      centerPentacle: wisdom?.text
        ? toSnippet(wisdom.text, 84)
        : "The center speaks through a wisdom voice anchored to the ruling day.",
      surfaceLabel: "Mentor Mode",
      surfaceTitle: "Solomonic Counsel",
      surfaceBody: wisdom?.text
        ? toSnippet(wisdom.text, 116)
        : "Mentor mode frames the current moment through a single guiding voice.",
    };
  }

  if (mode === "forecast") {
    return {
      centerTitle: nextHourRule?.ruler ? `Forecast • ${nextHourRule.ruler}` : "Forecast",
      centerSpirit: nextHourRule
        ? `Next hour ${String(nextHourRule.hourIndex).padStart(2, "0")}:00 • ${nextHourRule.ruler}`
        : "Preview the next movement before acting.",
      centerPentacle: tomorrowEntry?.focus
        ? `Tomorrow • ${toSnippet(tomorrowEntry.focus, 72)}`
        : "Tomorrow’s guidance will appear here.",
      surfaceLabel: "Forecast Mode",
      surfaceTitle: nextHourRule?.ruler ? `Next: ${nextHourRule.ruler}` : "Forecast",
      surfaceBody: `${tomorrowEntry.rulerText} tomorrow • ${toSnippet(tomorrowEntry.focus, 96)}`,
    };
  }

  if (mode === "timeline") {
    return {
      centerTitle: `Timeline • ${selectedHistoryEntry.dateLabel}`,
      centerSpirit: selectedHistoryEntry.hasRecord
        ? `${selectedHistoryEntry.statusBadges.join(" • ") || "Saved"} • ${selectedHistoryEntry.scriptureRef || selectedHistoryEntry.psalmRef}`
        : `Yesterday ${yesterdayEntry.rulerText} • Tomorrow ${tomorrowEntry.rulerText}`,
      centerPentacle: selectedHistoryEntry.reflectionSnippet
        ? selectedHistoryEntry.reflectionSnippet
        : `Recorded focus • ${toSnippet(selectedHistoryEntry.summaryLine, 72)}`,
      surfaceLabel: "Timeline Mode",
      surfaceTitle: selectedHistoryEntry.dateLabel,
      surfaceBody: selectedHistoryEntry.hasRecord
        ? `${selectedHistoryEntry.titleLine}. ${toSnippet(selectedHistoryEntry.summaryLine, 88)}`
        : `Yesterday: ${toSnippet(yesterdayEntry.focus, 52)} • Tomorrow: ${toSnippet(tomorrowEntry.focus, 52)}`,
    };
  }

  return null;
}

function updateSurfacePanel(timeState, referenceMap, now, derived, lifeState) {
  if (!drawerElements.surfaceLensLabel || !drawerElements.surfaceLensTitle || !drawerElements.surfaceLensBody) {
    return;
  }

  const lensDefinition = getLensDefinition(uiState.lens);
  const dayLabel = timeState?.dayLabel;
  const activePentacle = timeState?.active?.pentacle || null;
  const activeSpirit = timeState?.active?.spirit || null;
  const activePlanetary = timeState?.active?.planetary || null;
  const pentacleKey = getPentacleKey(activePentacle);
  const pentacleRecord = pentacleKey ? referenceMap.get(pentacleKey) : null;
  const primaryPsalm = getPrimaryPsalmEntry(pentacleRecord);
  const readablePsalm = formatReadablePsalmReference(primaryPsalm);
  const hourRule = dayLabel ? getPlanetaryHourRuler(now, dayLabel.rulerText) : null;
  const wisdom = dayLabel ? WISDOM_CONTENT_BY_RULER[dayLabel.rulerText] : null;
  const correspondences = dayLabel ? (PLANETARY_CORRESPONDENCES[dayLabel.rulerText] || {}) : {};
  const weeklyEntry = buildWeeklyArcEntry(now, selectedDayOffset, derived, referenceMap);

  const modePresentation = getModePresentation(timeState, referenceMap, now, derived, lifeState);
  drawerElements.surfaceLensLabel.textContent = modePresentation
    ? `${lensDefinition.title} • ${modePresentation.surfaceLabel}`
    : lensDefinition.title;

  if (modePresentation) {
    drawerElements.surfaceLensTitle.textContent = modePresentation.surfaceTitle;
    drawerElements.surfaceLensBody.textContent = modePresentation.surfaceBody;
    updateRuleOfLifePanels(modePresentation.ruleOfLife || null);
    return;
  }

  updateRuleOfLifePanels(null);

  if (uiState.lens === "scripture") {
    drawerElements.surfaceLensTitle.textContent = wisdom?.ref
      ? "Wisdom Anchor"
      : readablePsalm
        ? "Psalm Pairing"
        : "Scripture Anchor";
    if (wisdom?.ref && readablePsalm) {
      drawerElements.surfaceLensBody.textContent = `Today's wisdom anchor: ${wisdom.ref}. Mapped psalm: ${readablePsalm}.`;
    } else if (wisdom?.ref) {
      drawerElements.surfaceLensBody.textContent = `Today's wisdom anchor: ${wisdom.ref}.`;
    } else if (readablePsalm) {
      drawerElements.surfaceLensBody.textContent = `Today's mapped psalm: ${readablePsalm}.`;
    } else {
      drawerElements.surfaceLensBody.textContent = "Today's scripture mapping appears here.";
    }
    return;
  }

  if (uiState.lens === "ritual") {
    drawerElements.surfaceLensTitle.textContent = hourRule?.ruler
      ? `Hour of ${hourRule.ruler}`
      : "Ritual Timing";
    drawerElements.surfaceLensBody.textContent = Array.isArray(activePlanetary?.themes) && activePlanetary.themes.length
      ? activePlanetary.themes.join(" • ")
      : "Day themes and practical timing are pulled forward here.";
    return;
  }

  if (uiState.lens === "esoteric") {
    drawerElements.surfaceLensTitle.textContent = [correspondences.angel, correspondences.metal]
      .filter(Boolean)
      .join(" • ") || "Esoteric Correspondences";
    drawerElements.surfaceLensBody.textContent = activeSpirit
      ? `${activeSpirit.spirit} rules the active sector in ${activeSpirit.zodiac} ${activeSpirit.degrees}.`
      : "Symbolic correspondences are foregrounded here.";
    return;
  }

  if (uiState.lens === "history") {
    const recentEntries = getRecordedHistoryEntries(now, derived, referenceMap, 7);
    const selectedHistoryEntry = buildHistoryTimelineEntry(now, selectedDayOffset, derived, referenceMap);
    drawerElements.surfaceLensTitle.textContent = recentEntries.length
      ? `Providence Map • ${selectedHistoryEntry.dateLabel}`
      : "Providence Map";
    drawerElements.surfaceLensBody.textContent = recentEntries.length
      ? `${recentEntries.length} recorded ${recentEntries.length === 1 ? "day" : "days"} in view. Select an outer node or timeline card to revisit ${selectedHistoryEntry.dateLabel.toLowerCase()}.`
      : "No recorded trail yet. Faint guide nodes mark the recent week so you can begin the map by opening and closing the day.";
    return;
  }

  if (lifeState?.focusedDomain && lifeState?.weakestDomain) {
    drawerElements.surfaceLensTitle.textContent = `${lifeState.focusedDomain.name} • ${lifeState.focusedDomain.virtue}`;
    drawerElements.surfaceLensBody.textContent = `Focus today leans toward ${lifeState.focusedDomain.name.toLowerCase()}. Weakest domain: ${lifeState.weakestDomain.name} (${lifeState.weakestDomain.score}%).`;
    return;
  }

  drawerElements.surfaceLensTitle.textContent = activePentacle
    ? uiState.presentationMode === "guidance"
      ? "Current Guidance"
      : `${activePentacle.planet} #${activePentacle.pentacle.index}`
    : "Current Guidance";
  drawerElements.surfaceLensBody.textContent = activePentacle?.pentacle?.focus
    ? toSnippet(activePentacle.pentacle.focus, 96)
    : "The clock surface summarizes the active day, scripture anchor, and present focus.";
}

function getLensAnnotations(timeState, referenceMap, now, radii) {
  const dayLabel = timeState?.dayLabel;
  const activePentacle = timeState?.active?.pentacle || null;
  const activeSpirit = timeState?.active?.spirit || null;
  const activePlanetary = timeState?.active?.planetary || null;
  const pentacleKey = getPentacleKey(activePentacle);
  const pentacleRecord = pentacleKey ? referenceMap.get(pentacleKey) : null;
  const primaryPsalm = formatReadablePsalmReference(getPrimaryPsalmEntry(pentacleRecord));
  const hourRule = dayLabel ? getPlanetaryHourRuler(now, dayLabel.rulerText) : null;
  const correspondences = dayLabel ? (PLANETARY_CORRESPONDENCES[dayLabel.rulerText] || {}) : {};

  if (uiState.lens === "scripture") {
    return [];
  }

  if (uiState.lens === "ritual") {
    return [];
  }

  if (uiState.lens === "esoteric") {
    return [];
  }

  if (uiState.lens === "history") {
    return [
      { text: "Past", radius: radii.spirit + 52, angle: -138, color: "#4ade80" },
      { text: "Today", radius: radii.spirit + 52, angle: -90, color: "#86efac" },
      { text: "Next", radius: radii.spirit + 52, angle: -42, color: "#bbf7d0" },
    ];
  }

  return [];
}

function updateLensAnnotations(timeState, referenceMap, now, radii) {
  const annotations = getLensAnnotations(timeState, referenceMap, now, radii);
  lensAnnotationGroup.selectAll("*").remove();

  if (!annotations.length) {
    return;
  }

  const nodes = lensAnnotationGroup
    .selectAll("g.lens-annotation")
    .data(annotations)
    .join("g")
    .attr("class", "lens-annotation")
    .attr("transform", (entry) => {
      const point = polarPoint(0, 0, entry.radius, (entry.angle * Math.PI) / 180);
      return `translate(${point.x}, ${point.y})`;
    });

  nodes
    .append("rect")
    .attr("class", "lens-annotation-pill")
    .attr("x", (entry) => -(Math.max(48, entry.text.length * 6.3) / 2))
    .attr("y", -10)
    .attr("width", (entry) => Math.max(48, entry.text.length * 6.3))
    .attr("height", 20)
    .attr("rx", 10)
    .attr("fill", "rgba(15, 23, 42, 0.82)")
    .attr("stroke", (entry) => hexToRgba(entry.color, 0.85))
    .attr("stroke-width", 1.1);

  nodes
    .append("text")
    .attr("class", "lens-annotation-text")
    .attr("fill", (entry) => hexToRgba(entry.color, 0.96))
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .text((entry) => entry.text);
}

function updateExplainabilityPanel(now, timeState, referenceMap, psalmMetadata) {
  if (!drawerElements.explainList) {
    return;
  }

  const dayText = timeState?.dayLabel?.dayText || "Unknown day";
  const rulerText = timeState?.dayLabel?.rulerText || "Unknown ruler";
  const activePentacle = timeState?.active?.pentacle || null;
  const activeSpirit = timeState?.active?.spirit || null;
  const pentacleKey = getPentacleKey(activePentacle);
  const hourRule = getPlanetaryHourRuler(now, rulerText);
  const record = pentacleKey ? referenceMap.get(pentacleKey) : null;
  const primaryPsalm = getPrimaryPsalmEntry(record);

  const key = [
    uiState.presentationMode,
    dayText,
    rulerText,
    pentacleKey || "none",
    activeSpirit?.sector || "none",
    hourRule?.ruler || "none",
    primaryPsalm?.number ?? primaryPsalm?.psalm ?? "none",
    primaryPsalm?.verses || "none",
  ].join("|");
  if (key === lastExplainabilityKey) {
    return;
  }
  lastExplainabilityKey = key;

  const reasons = [
    `${dayText} is ruled by ${rulerText}, so ${rulerText}-aligned intentions are prioritized.`,
  ];

  if (hourRule) {
    reasons.push(
      `Planetary hour proxy: local hour ${hourRule.hourIndex + 1} resolves to ${hourRule.ruler} in the Chaldean sequence.`
    );
  }

  if (activeSpirit && uiState.presentationMode !== "guidance") {
    reasons.push(
      `Active spirit sector: ${activeSpirit.zodiac} ${activeSpirit.degrees} (${activeSpirit.spirit}) informs the sign layer.`
    );
  }

  if (activePentacle && uiState.presentationMode === "talismans") {
    reasons.push(
      `Active pentacle rule: ${activePentacle.planet} #${activePentacle.pentacle.index} (${activePentacle.pentacle.focus}).`
    );
  } else if (activePentacle?.pentacle?.focus) {
    reasons.push(`Today's practical focus: ${activePentacle.pentacle.focus}.`);
  }

  if (primaryPsalm) {
    const chapter = Number.parseInt(primaryPsalm.number ?? primaryPsalm.psalm, 10);
    const verseLabel = primaryPsalm.verses ? `:${primaryPsalm.verses}` : "";
    reasons.push(`Primary scripture citation: Psalm ${chapter}${verseLabel}.`);
  } else {
    reasons.push("Primary scripture citation: fallback psalm is used when this pentacle has no direct Psalm note.");
  }

  drawerElements.explainList.innerHTML = "";
  reasons.forEach((reason) => {
    const li = document.createElement("li");
    li.textContent = reason;
    drawerElements.explainList.appendChild(li);
  });
}

function updateDailyContentBundle(timeState, referenceMap, psalmMetadata) {
  if (
    !drawerElements.bundlePsalmRef ||
    !drawerElements.bundlePsalmText ||
    !drawerElements.bundleWisdomRef ||
    !drawerElements.bundleWisdomText ||
    !drawerElements.bundleSolomonicItem ||
    !drawerElements.bundleSolomonicRef ||
    !drawerElements.bundleSolomonicText
  ) {
    return;
  }

  const dayText = timeState?.dayLabel?.dayText || "Unknown day";
  const rulerText = timeState?.dayLabel?.rulerText || "Unknown ruler";
  const activePentacle = timeState?.active?.pentacle || null;
  const pentacleKey = getPentacleKey(activePentacle);
  const record = pentacleKey ? referenceMap.get(pentacleKey) : null;
  const primaryPsalm = getPrimaryPsalmEntry(record);

  const key = `${uiState.presentationMode}|${dayText}|${rulerText}|${pentacleKey || "none"}|${primaryPsalm?.number ?? primaryPsalm?.psalm ?? "fallback"}|${primaryPsalm?.verses || "none"}|${readingDepth}`;
  if (key === lastBundleKey) {
    return;
  }
  lastBundleKey = key;

  const requestId = ++currentBundleRequestId;
  drawerElements.bundleSolomonicItem.hidden = uiState.presentationMode === "guidance";
  const wisdom = WISDOM_CONTENT_BY_RULER[rulerText] || {
    ref: "Proverbs 16:3",
    text: "Commit thy works unto the LORD, and thy thoughts shall be established.",
  };
  const sanitizedWisdomText = sanitizeInlinePassageText(wisdom.text);
  drawerElements.bundleWisdomRef.textContent = wisdom.ref;
  drawerElements.bundleWisdomText.textContent = sanitizedWisdomText;
  configureBundleExpansion("wisdom", {
    reference: wisdom.ref,
    text: sanitizedWisdomText,
    request: parseScriptureReference(wisdom.ref) ? { kind: "wisdom", reference: wisdom.ref } : null,
  });

  const solomonicReference = activePentacle
    ? `Key of Solomon, Book II • ${activePentacle.planet} Pentacle #${activePentacle.pentacle.index}`
    : "Key of Solomon, Book II";
  if (activePentacle) {
    drawerElements.bundleSolomonicRef.textContent = solomonicReference;
    drawerElements.bundleSolomonicText.textContent = activePentacle.pentacle.focus
      ? `Purpose: ${activePentacle.pentacle.focus}.`
      : "Purpose unavailable for this pentacle.";
  } else {
    drawerElements.bundleSolomonicRef.textContent = solomonicReference;
    drawerElements.bundleSolomonicText.textContent = "No active pentacle focus available.";
  }
  configureBundleExpansion("solomonic", {
    reference: solomonicReference,
    text: drawerElements.bundleSolomonicText.textContent,
    request: activePentacle
      ? {
        kind: "solomonic",
        planet: activePentacle.planet,
        pentacle: activePentacle.pentacle.index,
        reference: solomonicReference,
      }
      : null,
  });

  let chapter = Number.NaN;
  let verse = null;
  if (primaryPsalm) {
    chapter = Number.parseInt(primaryPsalm.number ?? primaryPsalm.psalm, 10);
    verse = expandVerseSpecification(primaryPsalm.verses || "")[0] || null;
  }
  if (Number.isNaN(chapter)) {
    const fallback = FALLBACK_DAILY_PSALM_BY_RULER[rulerText] || { chapter: 1, verse: 1 };
    chapter = fallback.chapter;
    verse = String(fallback.verse);
  }

  const verseLabel = primaryPsalm?.verses ? `:${primaryPsalm.verses}` : (verse ? `:${verse}` : "");
  const bundleVerseSpec = primaryPsalm?.verses || verse || "";
  const citedPsalmReference = `Psalm ${chapter}${verseLabel}`;
  const displayPsalmReference = readingDepth === "long"
    ? `Psalm ${chapter} • Full chapter`
    : citedPsalmReference;
  const loadingPsalmText = readingDepth === "long"
    ? "Loading chapter text…"
    : readingDepth === "medium"
      ? "Loading extended reading…"
      : "Loading verse text…";
  drawerElements.bundlePsalmRef.textContent = displayPsalmReference;
  setTranslationBadge(drawerElements.bundlePsalmRef, "");
  drawerElements.bundlePsalmText.classList.remove("error", "loading");
  drawerElements.bundlePsalmText.classList.add("loading");
  drawerElements.bundlePsalmText.textContent = loadingPsalmText;
  configureBundleExpansion("psalm", {
    reference: displayPsalmReference,
    text: loadingPsalmText,
    request: {
      kind: "psalm",
      chapter,
      reference: citedPsalmReference,
    },
  });

  retrievePsalmPassage(chapter, bundleVerseSpec, readingDepth).then((text) => {
    if (requestId !== currentBundleRequestId) {
      return;
    }
    const nextText = text || "No psalm text returned.";
    setTranslationBadge(
      drawerElements.bundlePsalmRef,
      getPsalmPassageTranslationNote(chapter, bundleVerseSpec, readingDepth)
    );
    updateBundlePreviewState("psalm", { text: nextText });
    if (!bundleExpansionState.psalm?.expanded) {
      drawerElements.bundlePsalmText.classList.remove("loading", "error");
      drawerElements.bundlePsalmText.textContent = nextText;
    }
  }).catch((error) => {
    console.error("Failed to fetch daily bundle psalm excerpt", error);
    if (requestId !== currentBundleRequestId) {
      return;
    }
    const errorText = "Unable to fetch psalm excerpt.";
    setTranslationBadge(drawerElements.bundlePsalmRef, "");
    updateBundlePreviewState("psalm", { text: errorText });
    if (!bundleExpansionState.psalm?.expanded) {
      drawerElements.bundlePsalmText.classList.remove("loading");
      drawerElements.bundlePsalmText.classList.add("error");
      drawerElements.bundlePsalmText.textContent = errorText;
    }
  });
}

function computeTimeState(now, layers, derived) {
  const yearLength = isLeapYear(now.getFullYear()) ? 366 : 365;
  const dayIndex = getDayOfYear(now);
  const dayProgress = getDayProgress(now);
  const yearFraction = (dayIndex + dayProgress) / yearLength;
  const spiritFraction = derived.spiritCount ? (yearFraction % 1) : 0;
  const weekFraction = derived.planetaryGroupCount ? getWeekFraction(now) : 0;
  const yearsSinceEpoch = now.getFullYear() - 2000 + yearFraction;
  const celestialFraction = derived.celestialCount ? ((yearsSinceEpoch % 9) / 9) : 0;

  const spiritIndex = derived.spiritCount
    ? Math.floor(spiritFraction * derived.spiritCount) % derived.spiritCount
    : -1;
  const planetaryIndex = derived.planetaryGroupCount
    ? Math.floor(weekFraction * derived.planetaryGroupCount) % derived.planetaryGroupCount
    : -1;
  const celestialIndex = derived.celestialCount
    ? Math.floor(celestialFraction * derived.celestialCount) % derived.celestialCount
    : -1;

  const pentacleIndex = derived.totalPentacles
    ? Math.floor(weekFraction * derived.totalPentacles) % derived.totalPentacles
    : -1;

  const clockText = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dayLabel = getPlanetaryDayLabel(now);

  return {
    fractions: {
      spirit: spiritFraction,
      planetary: weekFraction,
      celestial: celestialFraction,
    },
    indices: {
      spirit: spiritIndex,
      planetary: planetaryIndex,
      celestial: celestialIndex,
      pentacle: pentacleIndex,
    },
    active: {
      spirit: spiritIndex >= 0 ? layers.spirit.sectors[spiritIndex] : null,
      planetary: planetaryIndex >= 0 ? layers.planetary.groups[planetaryIndex] : null,
      celestial: celestialIndex >= 0 ? layers.celestial.seals[celestialIndex] : null,
      pentacle: pentacleIndex >= 0 ? derived.flatPentacles[pentacleIndex] : null,
    },
    clockText,
    dayLabel,
  };
}

function buildPentacleReferenceMap(psalmPayload) {
  const map = new Map();
  if (!psalmPayload || !Array.isArray(psalmPayload.pentacles)) {
    return map;
  }

  psalmPayload.pentacles.forEach(({ planet, pentacle, psalms, supplemental_references: supplementalReferences }) => {
    if (!planet || typeof pentacle !== "number") {
      return;
    }
    const key = `${planet.toLowerCase()}-${pentacle}`;
    map.set(key, {
      psalms: Array.isArray(psalms) ? psalms : [],
      supplementalReferences: Array.isArray(supplementalReferences) ? supplementalReferences : [],
    });
  });

  return map;
}

function buildBundledPsalmMap(scripturePayload) {
  bundledPsalmMap.clear();
  const psalms = scripturePayload?.psalms;
  if (!psalms || typeof psalms !== "object") {
    return bundledPsalmMap;
  }

  Object.entries(psalms).forEach(([key, entry]) => {
    if (!entry || typeof entry !== "object") {
      return;
    }
    const chapter = Number.parseInt(entry.psalm_number_vulgate ?? key, 10);
    if (Number.isNaN(chapter)) {
      return;
    }
    bundledPsalmMap.set(String(chapter), entry);
  });

  return bundledPsalmMap;
}

function splitBundledTranslationExcerpt(text) {
  const clean = String(text || "")
    .replace(/\n{2,}English translation:\s*\n+/i, "\n")
    .trim();
  if (!clean) {
    return { displayText: "", noteText: "" };
  }

  const commentaryMatch = clean.match(
    /\n{2,}(\((?:Note|Please note|Translation maintained|Translation of the Bible)[\s\S]*\)|(?:I have translated[\s\S]*|While trying to maintain[\s\S]*|This translation[\s\S]*|In a literal translation[\s\S]*|The number\s+"?\d+"?\s+may indicate[\s\S]*|A more natural rendering could[\s\S]*|The correct English sentence should be[\s\S]*))$/i
  );

  if (!commentaryMatch || commentaryMatch.index === undefined) {
    return { displayText: clean, noteText: "" };
  }

  const displayText = clean.slice(0, commentaryMatch.index).trim();
  const noteText = commentaryMatch[1]
    .replace(/^\(/, "")
    .replace(/\)$/, "")
    .replace(/\s+/g, " ")
    .trim();

  return { displayText, noteText };
}

function getBundledPsalmExcerpt(chapter) {
  const entry = bundledPsalmMap.get(String(chapter));
  if (!entry) {
    return null;
  }

  const excerpt = String(entry.translation_excerpt || entry.latin_excerpt || "").trim();
  if (!excerpt) {
    return null;
  }

  return splitBundledTranslationExcerpt(excerpt);
}

function getBundledPsalmText(chapter) {
  return getBundledPsalmExcerpt(chapter)?.displayText || null;
}

function getBundledPsalmNote(chapter) {
  return getBundledPsalmExcerpt(chapter)?.noteText || "";
}

function getPsalmTextMeta(chapter, verse = null) {
  return psalmTextMetaCache.get(`${chapter}:${verse ?? ""}`) || null;
}

function getPsalmPassageTranslationNote(chapter, verseSpec, depth = readingDepth) {
  if (depth === "long" || !verseSpec) {
    return getPsalmTextMeta(chapter)?.translationNote || "";
  }

  const versesToFetch = selectVersesForDepth(verseSpec, depth);
  for (const verse of versesToFetch) {
    const note = getPsalmTextMeta(chapter, verse)?.translationNote;
    if (note) {
      return note;
    }
  }

  return getPsalmTextMeta(chapter)?.translationNote || "";
}

function setTranslationBadge(container, noteText) {
  if (!container) {
    return;
  }

  const existing = container.querySelector(".translation-badge");
  const cleanNote = String(noteText || "").replace(/\s+/g, " ").trim();
  if (!cleanNote) {
    if (existing) {
      existing.remove();
    }
    return;
  }

  let badge = existing;
  if (!badge) {
    badge = document.createElement("span");
    badge.className = "translation-badge";
    badge.textContent = "Literal";
    badge.tabIndex = 0;
    container.append(" ");
    container.appendChild(badge);
  }

  badge.title = cleanNote;
  badge.setAttribute("aria-label", cleanNote);
}

function getPsalmFallbackText(chapter, verse) {
  const bundledText = getBundledPsalmText(chapter);
  if (bundledText) {
    return bundledText;
  }

  return verse
    ? `Psalm ${chapter}:${verse} is not bundled in this standalone clock yet.`
    : `Psalm ${chapter} is not bundled in this standalone clock yet.`;
}

function updatePsalmDrawer(activePentacle, referenceMap) {
  let pentacleKey = null;
  if (activePentacle) {
    pentacleKey = `${activePentacle.planet.toLowerCase()}-${activePentacle.pentacle.index}`;
  }
  const key = `${pentacleKey || "none"}|${readingDepth}`;

  if (key === lastPsalmKey) {
    return;
  }
  lastPsalmKey = key;
  const requestId = ++currentPsalmRequestId;

  if (!drawerElements.planet || !drawerElements.focus || !drawerElements.list) {
    return;
  }

  drawerElements.list.innerHTML = "";

  if (!activePentacle || !pentacleKey) {
    drawerElements.planet.textContent = "—";
    drawerElements.focus.textContent = "Select a pentacle to view its verses.";
    const li = document.createElement("li");
    li.textContent = "No pentacle selected.";
    drawerElements.list.appendChild(li);
    return;
  }

  drawerElements.planet.textContent = `Pentacle of ${activePentacle.planet} #${activePentacle.pentacle.index}`;
  drawerElements.focus.textContent = activePentacle.pentacle.focus || "Purpose unavailable";

  const record = referenceMap.get(pentacleKey);
  const psalms = record?.psalms || [];
  if (!psalms.length) {
    const li = document.createElement("li");
    li.textContent = "No psalms cited for this pentacle in the Key of Solomon notes.";
    drawerElements.list.appendChild(li);
    return;
  }

  psalms.forEach((entry) => {
    const li = document.createElement("li");
    const psalmNumber = Number.parseInt(entry.number ?? entry.psalm, 10);
    if (Number.isNaN(psalmNumber)) {
      li.textContent = "Psalm reference missing a numeric chapter value.";
      drawerElements.list.appendChild(li);
      return;
    }
    const verseLabel = entry.verses ? `:${entry.verses}` : "";
    li.textContent = `Psalm ${psalmNumber}${verseLabel}`;

    const modeLabel = document.createElement("span");
    if (readingDepth === "long") {
      modeLabel.textContent = "Reading mode: full chapter";
    } else if (readingDepth === "medium") {
      modeLabel.textContent = "Reading mode: 3-5 verses";
    } else {
      modeLabel.textContent = "Reading mode: single verse";
    }
    li.appendChild(modeLabel);

    const textBlock = document.createElement("div");
    textBlock.classList.add("psalm-text", "loading");
    textBlock.textContent = readingDepth === "long"
      ? "Loading chapter text…"
      : readingDepth === "medium"
        ? "Loading extended reading…"
        : "Loading verse text…";
    li.appendChild(textBlock);
    drawerElements.list.appendChild(li);

    retrievePsalmPassage(psalmNumber, entry.verses || "", readingDepth).then((text) => {
      if (currentPsalmRequestId !== requestId) {
        return;
      }
      textBlock.classList.remove("loading");
      textBlock.textContent = text || "No verse text returned by scripture service.";
      if (!text) {
        textBlock.classList.add("error");
      }
    }).catch((error) => {
      console.error("Failed to fetch psalm text", error);
      if (currentPsalmRequestId !== requestId) {
        return;
      }
      textBlock.classList.remove("loading");
      textBlock.classList.add("error");
      textBlock.textContent = "Unable to fetch psalm text.";
    });
  });
}

function selectVersesForDepth(spec, depth) {
  const base = expandVerseSpecification(spec);
  if (!base.length) {
    return [];
  }

  if (depth === "short") {
    return [base[0]];
  }

  if (depth !== "medium") {
    return base;
  }

  const medium = base.slice(0, 5);
  const firstVerse = Number.parseInt(base[0], 10);
  if (medium.length < 3 && !Number.isNaN(firstVerse)) {
    for (let offset = 1; medium.length < 3; offset += 1) {
      medium.push(String(firstVerse + offset));
    }
  }

  const deduped = [];
  const seen = new Set();
  medium.forEach((verse) => {
    if (!seen.has(verse)) {
      seen.add(verse);
      deduped.push(verse);
    }
  });
  return deduped.slice(0, 5);
}

function expandVerseSpecification(spec) {
  if (!spec) {
    return [];
  }

  const clean = String(spec).trim();
  if (!clean) {
    return [];
  }

  if (/^\d+(?:,\d+)+$/.test(clean)) {
    return clean
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  if (/^\d+(?:-\d+){2,}$/.test(clean)) {
    return clean
      .split("-")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  if (clean.includes("-")) {
    const [startRaw, endRaw] = clean.split("-").map((value) => value.replace(/[^0-9]/g, ""));
    const start = Number.parseInt(startRaw, 10);
    const end = Number.parseInt(endRaw, 10);
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
      return [];
    }
    return Array.from({ length: end - start + 1 }, (_, idx) => String(start + idx));
  }

  const numeric = clean.replace(/[^0-9]/g, "");
  return numeric ? [numeric] : [];
}

async function retrievePsalmText(chapter, verse) {
  const key = `${chapter}:${verse ?? ""}`;
  if (psalmTextCache.has(key)) {
    return psalmTextCache.get(key);
  }

  if (!ENABLE_REMOTE_SCRIPTURE_FETCH) {
    const fallbackText = getPsalmFallbackText(chapter, verse);
    psalmTextCache.set(key, fallbackText);
    psalmTextMetaCache.set(key, {
      source: getBundledPsalmText(chapter) ? "bundled" : "fallback",
      translationNote: getBundledPsalmNote(chapter),
    });
    return fallbackText;
  }

  try {
    const params = new URLSearchParams({ chapter: String(chapter) });
    if (verse) {
      params.set("verse", String(verse));
    }
    const response = await fetch(`${PSALM_API_ENDPOINT}?${params.toString()}`);

    if (response.ok) {
      const data = await response.json();

      const verseText = (
        data.text ||
        (Array.isArray(data.verses) ? data.verses.map((entry) => entry.text).join("\n") : "")
      ).trim();
      if (verseText) {
        psalmTextCache.set(key, verseText);
        psalmTextMetaCache.set(key, { source: "api", translationNote: "" });
        return verseText;
      }
    }
  } catch (_error) {
    // Fall through to bundled excerpts when the local psalm endpoint is unavailable.
  }

  const fallbackText = getPsalmFallbackText(chapter, verse);
  psalmTextCache.set(key, fallbackText);
  psalmTextMetaCache.set(key, {
    source: getBundledPsalmText(chapter) ? "bundled" : "fallback",
    translationNote: getBundledPsalmNote(chapter),
  });
  return fallbackText;
}

async function initialiseClock() {
  setupAccountControls();
  setupPresentationControls();
  setupLensControls();
  setupDrawerToggle();
  setupDailyOpeningControls();
  setupActionLoopControls();
  setupHistoryReviewControls();
  setupHistoryLaunchControls();
  setupReadingDepthControls();
  setupBundleExpansionControls();
  setupWeeklyArcControls();
  setupProvidenceTimelineControls();
  setupPericopeSessionSyncRefresh();
  const authPromise = initialiseClockAuth();
  const historySyncPromise = authPromise.then(() => bootstrapHistorySync());

  try {
    const [clockResponse, psalmResponse, pentacleResponse, lifeDomainResponse, scriptureResponse] = await Promise.all([
      fetch("../data/solomonic_clock_full.json"),
      fetch("../data/pentacle_psalms.json"),
      fetch("../data/pentacles.json"),
      fetch("../data/life_domains.json"),
      fetch("../data/scripture_mappings.json"),
    ]);

    if (!clockResponse.ok) {
      throw new Error(`HTTP ${clockResponse.status} while loading clock data`);
    }

    if (!psalmResponse.ok) {
      throw new Error(`HTTP ${psalmResponse.status} while loading psalm data`);
    }

    if (!pentacleResponse.ok) {
      throw new Error(`HTTP ${pentacleResponse.status} while loading pentacle data`);
    }

    if (!lifeDomainResponse.ok) {
      throw new Error(`HTTP ${lifeDomainResponse.status} while loading life domain data`);
    }

    if (!scriptureResponse.ok) {
      throw new Error(`HTTP ${scriptureResponse.status} while loading scripture mappings`);
    }

    const [clockData, psalmData, pentacleData, lifeDomainData, scriptureData] = await Promise.all([
      clockResponse.json(),
      psalmResponse.json(),
      pentacleResponse.json(),
      lifeDomainResponse.json(),
      scriptureResponse.json(),
    ]);
    const referenceMap = buildPentacleReferenceMap(psalmData);
    buildBundledPsalmMap(scriptureData);

    if (psalmData?.metadata?.psalm_numbering) {
      baseDrawerSubtitleText = `Live mapping for the active planetary pentacle (${psalmData.metadata.psalm_numbering}).`;
      applyLensState();
    }

    await historySyncPromise;
    renderClock(clockData, referenceMap, psalmData?.metadata || {}, pentacleData, lifeDomainData);
  } catch (error) {
    console.error("Failed to initialise clock", error);
    svg
      .append("text")
      .attr("x", WIDTH / 2)
      .attr("y", HEIGHT / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "#ef4444")
      .attr("font-size", "20px")
      .text("Unable to load True Vine OS data");
  }
}

function renderClock(data, referenceMap, psalmMetadata, pentacleData, lifeDomainData) {
  const { visual_parameters: visual, layers } = data;
  const colors = visual.color_scheme;
  const radii = visual.radius;

  drawCore(layers.core, radii.core - 12, colors.core);
  drawArcRing("celestial", layers.celestial.seals, radii.celestial, colors.celestial, drawCelestialTooltipText);
  drawArcRing("planetary", layers.planetary.groups, radii.planetary, colors.planetary, drawPlanetaryTooltipText);
  drawArcRing("spirit", layers.spirit.sectors, radii.spirit, colors.spirit, drawSpiritTooltipText);

  const derived = {
    spiritCount: layers.spirit.sectors.length,
    celestialCount: layers.celestial.seals.length,
    planetaryGroupCount: layers.planetary.groups.length,
  };
  derived.flatPentacles = flattenPentacles(layers.planetary.groups);
  derived.totalPentacles = derived.flatPentacles.length;
  ensureSealSymbols(derived.flatPentacles);

  function frame() {
    const now = new Date();
    const displayNow = withSelectedDayOffset(now);
    const timeState = computeTimeState(displayNow, layers, derived);

    const spiritRotation = fractionToRotation(timeState.fractions.spirit, derived.spiritCount);
    const planetaryRotation = fractionToRotation(timeState.fractions.planetary, derived.planetaryGroupCount);
    const celestialRotation = fractionToRotation(timeState.fractions.celestial, derived.celestialCount);

    ringGroups.spirit.attr("transform", `rotate(${radiansToDegrees(spiritRotation)})`);
    ringGroups.planetary.attr("transform", `rotate(${radiansToDegrees(planetaryRotation)})`);
    ringGroups.celestial.attr("transform", `rotate(${radiansToDegrees(celestialRotation)})`);

    highlightLayer("spirit", timeState.indices.spirit);
    highlightLayer("planetary", timeState.indices.planetary);
    highlightLayer("celestial", timeState.indices.celestial);
    updatePlanetaryRingPresentation(layers.planetary.groups, radii.planetary, timeState.active.pentacle);
    updateActiveSealFocus(timeState.active.pentacle, pentacleData, referenceMap);
    updateCenterModeControl(radii);
    updateScriptureOverlay(timeState, referenceMap, now, radii);
    updateRitualOverlay(timeState, now, radii);
    updateEsotericOverlay(timeState, radii, derived);
    const lifeState = updateLifeWheel(timeState, radii, lifeDomainData);
    updateHistoryPreview(now, derived, referenceMap, radii);
    updateLensFocusOverlay(radii);
    updateLensAnnotations(timeState, referenceMap, now, radii);

    updateCenterLabels(layers.core.name, timeState, referenceMap, now, derived, lifeState);
    updateSurfacePanel(timeState, referenceMap, now, derived, lifeState);
    currentActionLoopContext = buildActionLoopContext(timeState, referenceMap, displayNow, derived, lifeState);
    updateDailyOpening(currentActionLoopContext);
    updateActionLoop(currentActionLoopContext);
    updateDailyGuidance(timeState);
    updateWeeklyArcPanel(now, derived, referenceMap);
    updateHistoryPanel(now, derived, referenceMap);
    updateProvidenceTimeline(now, derived, referenceMap);
    updateDailyProfile(timeState);
    updateExplainabilityPanel(displayNow, timeState, referenceMap, psalmMetadata);
    updateDailyContentBundle(timeState, referenceMap, psalmMetadata);
    updatePsalmDrawer(timeState.active.pentacle, referenceMap);

    requestAnimationFrame(frame);
  }

  frame();
}

initialiseClock();
