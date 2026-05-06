// ══════════════════════════════════════════════════════════════════
// ESTADO
// ══════════════════════════════════════════════════════════════════
const state = {
  camaraActiva: false,
  enEmergencia: false,
  emergenciaHasta: 0, // timestamp en ms
  emergenciaDuracion: 7000, // 7 segundos
  frameCount: 0,
  emergencias: 0,
  startTime: null,
  intervalInfer: null,
  intervalUI: null,
};

// ══════════════════════════════════════════════════════════════════
// ELEMENTOS DOM
// ══════════════════════════════════════════════════════════════════
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const btnStart = document.getElementById("btnStart");
const btnSim = document.getElementById("btnSimular");
const overlay = document.getElementById("emergencyOverlay");
const luzRojo = document.getElementById("luzRojo");
const luzAmar = document.getElementById("luzAmarillo");
const luzVerde = document.getElementById("luzVerde");
const estadoVal = document.getElementById("estadoValor");
const countdown = document.getElementById("countdown");
const statusDot = document.getElementById("statusDot");
const statusTxt = document.getElementById("statusText");
const logList = document.getElementById("logList");

// Stats
const statEmerg = document.getElementById("statEmergencias");
const statFrames = document.getElementById("statFrames");
const statConf = document.getElementById("statConfianza");
const statUptime = document.getElementById("statUptime");

const TOKEN = "at.ajnrs4a10uoujxk0e0ahf48tdzgxczmg-3ns8pe40td-09g4lla-qfylev7sm";
let player = null;

// FUNCIÓN PARA CAMBIAR DE CÁMARA EN HIKCONNECT
// FUNCIÓN PARA CAMBIAR DE CÁMARA EN HIKCONNECT
async function cambiarCamara() {
  const sn = document.getElementById("camaraSelect").value;
  // 1. URL corregida con el formato exacto que pediste
  const urlLive = `ezopen://12345abc@open.ezviz.com/${sn}/1.hd.live`;

  try {
    // 2. Destruir el reproductor anterior para evitar conflictos de streaming
    if (player) {
      player.destroy();
      player = null;
    }

    // 3. Crear nueva instancia con los parámetros correctos
    player = new EZUIKit.EZUIKitPlayer({
      id: "video-container",
      accessToken: TOKEN,
      url: urlLive,
      template: "pcLive", // Template correcto para envivo
      width: 1280,
      height: 500,
      audio: false,
      env: {
        domain: "https://iusopen.ezvizlife.com" // Dominio de transmisión obligatorio
      },
      handleSuccess: () => {
        console.log("EZUIKit reproduciendo correctamente");
      },
      handleError: (err) => {
        console.error("EZUIKit error:", err);
      }
    });

    state.camaraActiva = true;
    state.startTime = Date.now();
    setStatus("SISTEMA HIK-ONLINE", true);
    btnSim.disabled = false;

  } catch (error) {
    console.error("Error al reproducir cámara:", error);
    setStatus("ERROR DE CÁMARA", false);
  }
}

// FUNCIÓN PARA ENVIAR FRAMES AL SERVIDOR CADA 2 SEGUNDOS
async function enviarFrame() {
  // Buscamos el elemento video que EZUIKit crea dinámicamente
  const videoInterno = document.querySelector("#video-container video");
  if (!videoInterno || videoInterno.readyState < 2) return;

  const tmp = document.createElement("canvas");
  tmp.width = videoInterno.videoWidth;
  tmp.height = videoInterno.videoHeight;
  tmp.getContext("2d").drawImage(videoInterno, 0, 0);

  const b64 = tmp.toDataURL("image/jpeg", 0.8).split(",")[1];

  try {
    const res = await fetch("/detectar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: b64, camara: document.getElementById("camaraSelect").value }),
    });
    const data = await res.json();

    // Usamos tu función procesarDetecciones original para dibujar los cuadros
    procesarDetecciones(data, tmp.width, tmp.height);
  } catch (e) {
    console.error("Error en comunicación con Flask:", e);
  }
}

btnStart.addEventListener("click", async () => {
  await cambiarCamara();
  btnSim.disabled = false;
});

// NO iniciar automáticamente la cámara al cargar
// cambiarCamara();

setInterval(enviarFrame, 2000);

// ══════════════════════════════════════════════════════════════════
// BOTÓN SIMULAR
// ══════════════════════════════════════════════════════════════════
btnSim.addEventListener("click", async () => {
  btnSim.disabled = true;
  setTimeout(() => (btnSim.disabled = false), 8000);

  const res = await fetch("/simular", { method: "POST" });
  const data = await res.json();
  procesarDetecciones(data, canvas.width || 640, canvas.height || 480);
});

// ══════════════════════════════════════════════════════════════════
// PROCESAR RESPUESTA
// ══════════════════════════════════════════════════════════════════
function procesarDetecciones(data, w, h) {
  const preds = data.predicciones || [];

  // Dibujar bounding boxes
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const p of preds) {
    const x1 = p.x - p.width / 2;
    const y1 = p.y - p.height / 2;

    ctx.strokeStyle = p.emergencia ? "#ff3355" : "#00d4ff";
    ctx.lineWidth = p.emergencia ? 3 : 2;
    ctx.strokeRect(x1, y1, p.width, p.height);

    // Etiqueta
    const label = `${p.clase} ${(p.confianza * 100).toFixed(0)}%`;
    ctx.fillStyle = p.emergencia ? "#ff3355" : "#00d4ff";
    ctx.fillRect(x1, y1 - 26, ctx.measureText(label).width + 12, 26);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px Rajdhani, sans-serif";
    ctx.fillText(label, x1 + 6, y1 - 8);

    if (p.emergencia) {
      statConf.textContent = (p.confianza * 100).toFixed(0) + "%";
    }
  }

  // Activar emergencia
  if (data.hay_emergencia) {
    activarEmergencia();
    if (data.evento) agregarLog(data.evento);
  }
}

// ══════════════════════════════════════════════════════════════════
// SEMÁFORO
// ══════════════════════════════════════════════════════════════════
function activarEmergencia() {
  if (state.enEmergencia) return; // ya activo
  state.enEmergencia = true;
  state.emergenciaHasta = Date.now() + state.emergenciaDuracion;
  state.emergencias++;
  statEmerg.textContent = state.emergencias;

  // Luces
  luzRojo.classList.remove("on");
  luzVerde.classList.add("on");
  overlay.classList.add("visible");
  estadoVal.style.color = "var(--green)";
  estadoVal.textContent = "EMERGENCIA";
}

function desactivarEmergencia() {
  state.enEmergencia = false;
  luzVerde.classList.remove("on");
  luzRojo.classList.add("on");
  overlay.classList.remove("visible");
  estadoVal.style.color = "var(--red)";
  estadoVal.textContent = "NORMAL";
  countdown.textContent = "";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// ══════════════════════════════════════════════════════════════════
// LOOP DE UI (cada 100ms)
// ══════════════════════════════════════════════════════════════════
function actualizarUI() {
  // Countdown semáforo
  if (state.enEmergencia) {
    const restante = Math.max(0, state.emergenciaHasta - Date.now());
    countdown.textContent = `Vuelve a rojo en ${(restante / 1000).toFixed(1)}s`;
    if (restante <= 0) desactivarEmergencia();
  }

  // Uptime
  if (state.startTime) {
    const secs = Math.floor((Date.now() - state.startTime) / 1000);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    statUptime.textContent = m > 0 ? `${m}m ${s}s` : `${s}s`;
  }
}

// ══════════════════════════════════════════════════════════════════
// LOG
// ══════════════════════════════════════════════════════════════════
function agregarLog(evento) {
  // Quitar placeholder
  const empty = logList.querySelector(".log-empty");
  if (empty) empty.remove();

  const hora = new Date(evento.timestamp).toLocaleTimeString("es-MX");
  const item = document.createElement("div");
  item.className = "log-item emergencia";
  item.innerHTML = `
    <span class="log-time">${hora}</span>
    <span class="log-clase">🚑 ${evento.tipo_vehiculo}</span>
    <span class="log-conf">${((evento.confianza || 0) * 100).toFixed(0)}%</span>
    <span class="log-accion">SEMÁFORO VERDE ✓</span>
  `;
  logList.prepend(item);
}

// ══════════════════════════════════════════════════════════════════
// STATUS PILL
// ══════════════════════════════════════════════════════════════════
function setStatus(txt, active) {
  statusTxt.textContent = txt;
  statusDot.className = "status-dot" + (active ? " active" : "");
}

// Iniciar el loop de UI inmediatamente (no depende de la cámara)
state.intervalUI = setInterval(actualizarUI, 100);

// Cargar eventos previos al inicio
fetch("/eventos")
  .then((r) => r.json())
  .then((evs) => {
    evs.slice(-5).forEach(agregarLog);
  });

// Exponer procesarDetecciones globalmente para pruebas desde consola
window.simularDesdeConsola = async () => {
  const res = await fetch("/simular", { method: "POST" });
  const data = await res.json();
  procesarDetecciones(data, 640, 480);
};
