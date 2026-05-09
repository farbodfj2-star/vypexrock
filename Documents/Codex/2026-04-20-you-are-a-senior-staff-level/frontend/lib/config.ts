const PRODUCTION_API_ORIGIN = "https://vypexrock-api-production.up.railway.app";
const PRODUCTION_WS_ORIGIN = "wss://vypexrock-api-production.up.railway.app";

function defaultApiOrigin() {
  return process.env.NODE_ENV === "production" ? PRODUCTION_API_ORIGIN : "http://localhost:8000";
}

function defaultWsOrigin() {
  return process.env.NODE_ENV === "production" ? PRODUCTION_WS_ORIGIN : "ws://localhost:8000";
}

function rewriteLocalHost(urlValue: string) {
  if (typeof window === "undefined") {
    return urlValue;
  }

  try {
    const url = new URL(urlValue);
    if (["localhost", "127.0.0.1"].includes(url.hostname)) {
      url.hostname = window.location.hostname;
      if (window.location.protocol === "https:" && url.protocol === "http:") {
        url.protocol = "https:";
        url.port = "";
      }
      if (window.location.protocol === "https:" && url.protocol === "ws:") {
        url.protocol = "wss:";
        url.port = "";
      }
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return urlValue.replace(/\/$/, "");
  }
}

function normalizeApiUrl(value: string) {
  const trimmed = rewriteLocalHost(value);
  return trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;
}

function normalizeWsUrl(value: string) {
  const trimmed = rewriteLocalHost(value);
  if (trimmed.endsWith("/api/v1/market/ws/market")) return trimmed;
  if (trimmed.endsWith("/api/v1/ws/market")) return trimmed.replace("/api/v1/ws/market", "/api/v1/market/ws/market");
  return `${trimmed}/api/v1/market/ws/market`;
}

export const appConfig = {
  apiUrl: normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL ?? defaultApiOrigin()),
  wsUrl: normalizeWsUrl(process.env.NEXT_PUBLIC_WS_URL ?? defaultWsOrigin())
};
