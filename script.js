
/* Configura aquí la URL del Worker (backend) */
const API_BASE = "https://TU-WORKER.tu-subdominio.workers.dev"; // ← Cambia esto

/* Si quieres restringir el reinicio con token, déjalo como opcional:
   - El input #reset-token se enviará como header "X-Reset-Token"
*/

const els = {
  days: document.getElementById("days"),
  startDate: document.getElementById("start-date"),
  status: document.getElementById("status"),
  resetBtn: document.getElementById("reset-btn"),
  tokenInput: document.getElementById("reset-token"),
};

let state = {
  startDateISO: null,
  startDateUTCms: null,
};

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
  // convertir a tiempo UTC sin sesgos por zona
  const nowUTC = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds(),
    now.getUTCMilliseconds()
  );
  const diffMs = nowUTC - startMs;
  return Math.floor(diffMs / 86400000); // ms en un día
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
      method: "POST",
      headers,
      body: JSON.stringify({ reason: "manual_reset" }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
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

// 1) Cargar estado inicial
fetchState();

// 2) Actualizar visualmente cada 30 segundos (suficiente para días)
setInterval(tick, 30000);

// 3) Volver a pedir al servidor cada 10 minutos para sincronizar
setInterval
