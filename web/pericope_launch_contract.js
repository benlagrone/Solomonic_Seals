export const CLOCK_PERICOPE_SOURCE = "solomonic_clock";

export function base64UrlEncodeUtf8(text) {
  const value = String(text || "");
  if (typeof btoa === "function" && typeof TextEncoder !== "undefined") {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  if (typeof Buffer !== "undefined") {
    return Buffer.from(value, "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  return "";
}

export function base64UrlDecodeUtf8(encoded) {
  const value = String(encoded || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  if (typeof atob === "function" && typeof TextDecoder !== "undefined") {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  if (typeof Buffer !== "undefined") {
    return Buffer.from(padded, "base64").toString("utf8");
  }

  return "";
}

export function buildClockPericopeLaunchUrl({
  baseUrl,
  mode,
  message,
  promptId,
  clockContext,
}) {
  const normalizedMode = mode === "freeform" ? "freeform" : "guided";
  const params = new URLSearchParams({
    mode: normalizedMode,
    source: CLOCK_PERICOPE_SOURCE,
  });
  const cleanMessage = String(message || "").trim();
  const cleanPromptId = String(promptId || "").trim();
  const context = clockContext && typeof clockContext === "object" ? clockContext : null;
  const encodedContext = context ? base64UrlEncodeUtf8(JSON.stringify(context)) : "";

  if (cleanMessage) {
    params.set("message", cleanMessage);
  }
  if (cleanPromptId) {
    params.set("prompt_id", cleanPromptId);
  }
  if (encodedContext) {
    params.set("ctx", encodedContext);
  }

  return `${String(baseUrl || "https://pericopeai.com/chat").trim()}?${params.toString()}`;
}

export function parseClockPericopeLaunchUrl(url) {
  const parsed = new URL(String(url || ""), "https://pericopeai.com");
  const encodedContext = parsed.searchParams.get("ctx") || "";
  return {
    mode: parsed.searchParams.get("mode") || "",
    source: parsed.searchParams.get("source") || "",
    message: parsed.searchParams.get("message") || "",
    promptId: parsed.searchParams.get("prompt_id") || "",
    clockContext: encodedContext
      ? JSON.parse(base64UrlDecodeUtf8(encodedContext))
      : null,
  };
}
