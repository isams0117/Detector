# Detector

## Descripción

`Detector` es una aplicación web en Python que detecta ambulancias en imágenes usando la API de Roboflow. Está diseñada para un prototipo de semáforo inteligente que puede reaccionar a emergencias y registrar los eventos detectados.

## Características

- Servidor Flask con rutas API para detección, simulación y consulta de eventos.
- Integración con Roboflow para inferencia de objetos.
- Modo de simulación cuando no hay API key configurada.
- Registro de eventos en `eventos.json`.
- Interfaz web simple servida desde `index.html`.

## Requisitos

- Python 3.11 o superior
- Paquetes:
  - `flask`
  - `inference-sdk`

## Instalación

1. Clona el repositorio o descarga los archivos.
2. Crea un entorno virtual (recomendado):

```bash
python -m venv .venv
source .venv/bin/activate
```

3. Instala las dependencias:

```bash
pip install flask inference-sdk
```

## Configuración

La app utiliza la variable de entorno `ROBOFLOW_API_KEY` para la inferencia real con Roboflow.

- Si no se configura `ROBOFLOW_API_KEY`, la aplicación opera en modo simulación.
- La ruta del modelo está definida en `Detector.py` como `ambulance-detection-funys/1`.

Ejemplo de exportación de variable de entorno:

```bash
export ROBOFLOW_API_KEY="tu_api_key_aqui"
```

## Uso

Ejecuta el servidor:

```bash
python Detector.py
```

El servidor quedará disponible en:

- `http://localhost:5000`

## Endpoints

- `GET /` — Sirve `index.html`.
- `POST /detectar` — Envía una imagen en base64 y recibe las detecciones.
  - Body JSON: `{ "image": "<base64>" }`
- `POST /simular` — Genera una detección simulada de ambulancia.
- `GET /eventos` — Devuelve el historial de eventos guardados en `eventos.json`.

## Archivo de eventos

- `eventos.json` almacena el historial de incidentes detectados.
- Cada evento contiene `timestamp`, `tipo_vehiculo`, `confianza` y `accion`.

## Notas

- El proyecto está diseñado como prototipo para demostración y pruebas.
- Si deseas usar Roboflow en producción, cambia la clave y valida la latencia de la inferencia.
- `index.html` es la interfaz web que consume las APIs del servidor.
