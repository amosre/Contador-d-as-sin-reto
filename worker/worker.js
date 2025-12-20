/**
 * Cloudflare Worker – contador global de días
 * Endpoints:
 *   GET  /state  → devuelve { startDateISO, daysElapsed }
 *   POST /reset  → actualiza startDate al día actual (UTC) [opcional token]
 *
 * Almacenamiento: KV (COUNTER_KV) con clave "startDateISO"
 * Seguridad: CORS limitado a ORIGEN permitido; token opcional para /reset.
 */
function todayMidnightUTCISO() {
  const now = new Date();
  const iso = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)).toISOString();
  return iso;
}
function daysBetweenUTC(startISO) {
  const startMs = Date.parse(startISO);
  const now = new Date();
  const nowUTCms = Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
    now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds()
  );
  const diffMs = nowUTCms - startMs;
  return Math.floor(diffMs / 86400000);
}
function corsHeaders(origin, allowedOrigin) {
  const allow = allowedOrigin === "*" ? "*" : allowedOrigin;
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Reset-Token",
    "Access-Control-Max-Age": "86400",
  };
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const headers = corsHeaders(origin, env.ALLOWED_ORIGIN);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }
    if (url.pathname === "/state" && request.method === "GET") {
      let startDateISO = await env.COUNTER_KV.get("startDateISO");
      if (!startDateISO) {
        startDateISO = todayMidnightUTCISO();
        await env.COUNTER_KV.put("startDateISO", startDateISO);
      }
      const daysElapsed = daysBetweenUTC(startDateISO);
      const body = JSON.stringify({ startDateISO, daysElapsed }, null, 2);
      return new Response(body, { status: 200, headers: { ...headers, "Content-Type": "application/json" } });
    }
    if (url.pathname === "/reset" && request.method === "POST") {
      const expected = (env.RESET_TOKEN || "").trim();
      const received = (request.headers.get("X-Reset-Token") || "").trim();
      if (expected && expected !== received) {
        return new Response("Unauthorized: invalid token", { status: 401, headers });
      }
      const newISO = todayMidnightUTCISO();
      await env.COUNTER_KV.put("startDateISO", newISO);
      const daysElapsed = daysBetweenUTC(newISO);
      const body = JSON.stringify({ startDateISO: newISO, daysElapsed }, null, 2);
      return new Response(body, { status: 200, headers: { ...headers, "Content-Type": "application/json" } });
    }
    return new Response("Not Found", { status: 404, headers });
  }
};
