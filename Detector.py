"""
🚦 SEMÁFORO INTELIGENTE — Servidor Web
Hackathon Ciudades del Futuro | Chihuahua

Instalar:
    pip install flask inference-sdk

Correr:
    python Detector.py
"""

from flask import Flask, request, jsonify, send_from_directory
from datetime import datetime
import json, os, base64, time

# ── Roboflow ──────────────────────────────────────────────────────────────────
try:
    from inference_sdk import InferenceHTTPClient
    SDK_OK = True
except ImportError:
    SDK_OK = False

# ══════════════════════════════════════════════════════════════════════════════
# ⚙️  CONFIGURACIÓN
# ══════════════════════════════════════════════════════════════════════════════

ROBOFLOW_API_KEY  = os.environ.get("ROBOFLOW_API_KEY", "t44UTYWW8KCYOpYP05AA")
ROBOFLOW_MODEL_ID = "ambulance-detection-funys/1" 
CONFIANZA_MINIMA  = 0.25   
CLASES_EMERGENCIA = {"ambulance", "Ambulance", "AMBULANCE"}
LOG_FILE          = "eventos.json"

# ══════════════════════════════════════════════════════════════════════════════
app = Flask(__name__)

# Cliente Roboflow (singleton)
_client = None
def get_client():
    global _client
    if _client is None and SDK_OK and ROBOFLOW_API_KEY != "t44UTYWW8KCYOpYP05AA":
        _client = InferenceHTTPClient(
            api_url="https://serverless.roboflow.com",
            api_key=ROBOFLOW_API_KEY,
        )
    return _client


# ══════════════════════════════════════════════════════════════════════════════
# LÓGICA DE EVENTOS
# ══════════════════════════════════════════════════════════════════════════════

def guardar_evento(clase: str, confianza: float):
    evento = {
        "timestamp":     datetime.now().isoformat(),
        "tipo_vehiculo": clase,
        "confianza":     round(confianza, 3),
        "accion":        "SEMAFORO_VERDE_ACTIVADO",
    }
    historial = []
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE) as f:
            historial = json.load(f)
    historial.append(evento)
    with open(LOG_FILE, "w") as f:
        json.dump(historial, f, indent=2, ensure_ascii=False)
    return evento


def leer_eventos():
    if not os.path.exists(LOG_FILE):
        return []
    with open(LOG_FILE) as f:
        return json.load(f)


# ══════════════════════════════════════════════════════════════════════════════
# RUTAS API
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/detectar", methods=["POST"])
def detectar():
    """
    Recibe un frame en base64, lo manda a Roboflow y regresa las detecciones.
    Body JSON: { "image": "<base64>" }
    """
    data   = request.get_json()
    img_b64 = data.get("image", "")

    # Quitar encabezado data:image/...;base64, si viene del browser
    if "," in img_b64:
        img_b64 = img_b64.split(",")[1]

    client = get_client()

    # ── Sin API key: modo simulación ──────────────────────────────────────
    if client is None:
        return jsonify({"predicciones": [], "simulacion": True})

    # ── Inferencia real ───────────────────────────────────────────────────
    try:
        resultado = client.infer(img_b64, model_id=ROBOFLOW_MODEL_ID)
        predicciones = []
        hay_emergencia = False

        for pred in resultado.get("predictions", []):
            conf  = float(pred["confidence"])
            if conf < CONFIANZA_MINIMA:
                continue
            clase = pred["class"]
            es_emergencia = clase in CLASES_EMERGENCIA

            predicciones.append({
                "clase":        clase,
                "confianza":    round(conf, 3),
                "x":            pred["x"],
                "y":            pred["y"],
                "width":        pred["width"],
                "height":       pred["height"],
                "emergencia":   es_emergencia,
            })
            if es_emergencia:
                hay_emergencia = True

        # Guardar log si hay emergencia
        evento = None
        if hay_emergencia:
            p = next(p for p in predicciones if p["emergencia"])
            evento = guardar_evento(p["clase"], p["confianza"])

        return jsonify({
            "predicciones":   predicciones,
            "hay_emergencia": hay_emergencia,
            "evento":         evento,
            "simulacion":     False,
        })

    except Exception as e:
        return jsonify({"error": str(e), "predicciones": []}), 500


@app.route("/simular", methods=["POST"])
def simular():
    """Simula una detección de ambulancia para el demo."""
    evento = guardar_evento("Ambulance (simulación)", 0.97)
    return jsonify({
        "predicciones": [{
            "clase":      "Ambulance",
            "confianza":  0.97,
            "x": 320, "y": 240, "width": 200, "height": 150,
            "emergencia": True,
        }],
        "hay_emergencia": True,
        "evento":         evento,
        "simulacion":     True,
    })


@app.route("/eventos")
def eventos():
    return jsonify(leer_eventos())


@app.route("/")
def index():
    return send_from_directory(".", "index.html")


# ══════════════════════════════════════════════════════════════════════════════
# FRONTEND HTML (embebido para un solo archivo)
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("=" * 55)
    print("  🚦 SEMÁFORO INTELIGENTE — Chihuahua")
    print("=" * 55)
    key_ok = ROBOFLOW_API_KEY != "TU_API_KEY_AQUI"
    print(f"  API Key:  {'✅ configurada' if key_ok else '⚠️  falta (modo simulación)'}")
    print(f"  Modelo:   {ROBOFLOW_MODEL_ID}")
    print(f"  URL:      http://localhost:5000")
    print("=" * 55 + "\n")
    app.run(host="0.0.0.0", port=5000, debug=False)