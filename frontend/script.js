const API_BASE = "https://TU-WORKER.tu-subdominio.workers.dev"; // ← Cambia esto
const els = {
  days: document.getElementById("days"),
  startDate: document.getElementById("start-date"),
  status: document.getElementById("status"),
  resetBtn: document.getElementById("reset-btn"),
  tokenInput: document.getElementById("reset-token"),
};
let state = { startDateISO: null, startDateUTCms: null };
async function fetchState() {
  try {
    const res = await fetch(`${API_BASE}/state`, { method: "GET" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.startDateISO = data.startDateISO;
    state.startDateUTCms = Date.parse(data.startDateISO);
    const days = calcDaysFromUTCNow(state.startDateUTCms);
    els.days.textContent = String(days);
    els.startDate.textContent = `Inicio: ${new Date(state.startDateISO).toLocaleString("es-CL", { timeZone: "UTC" })} (UTC)`;
    setStatus("Estado actualizado correctamente.", true);
  } catch (err) {
    console.error(err);
    setStatus("Error al obtener el estado del contador.", false);
  }
}
function calcDaysFromUTCNow(startMs) {
  const now = new Date();
  const nowUTC = Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
    now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds()
  );
  const diffMs = nowUTC - startMs;
  return Math.floor(diffMs / 86400000);
}
function tick() {
  if (!state.startDateUTCms) return;
  const days = calcDaysFromUTCNow(state.startDateUTCms);
  els.days.textContent = String(days);
}
async function resetCounter() {
  const confirmReset = confirm("¿Seguro que quieres reiniciar el contador global?");
  if (!confirmReset) return;
  setStatus("Reiniciando…", true);
  try {
    const headers = { "Content-Type": "application/json" };
    const token = els.tokenInput.value?.trim();
    if (token) headers["X-Reset-Token"] = token;
    const res = await fetch(`${API_BASE}/reset`, {
      method: "POST", headers, body: JSON.stringify({ reason: "manual_reset" })
    });
    if (!res.ok) { const text = await res.text(); throw new Error(`HTTP ${res.status}: ${text}`); }
    await fetchState();
    setStatus("Contador reiniciado correctamente.", true);
  } catch (err) {
    console.error(err);
    setStatus("No se pudo reiniciar el contador.", false);
  }
}
function setStatus(msg, ok) {
  els.status.textContent = msg;
  els.status.classList.remove("ok", "err");
  els.status.classList.add(ok ? "ok" : "err");
}
els.resetBtn.addEventListener("click", resetCounter);
fetchState();
setInterval(tick, 30000);
setInterval(fetchState, 10 * 60 * 1000);
