# Detector

## Descripción

`Detector` es una aplicación web en Python que detecta ambulancias en imágenes usando la API de Roboflow. Está diseñada como prototipo de semáforo inteligente que puede reaccionar a emergencias y registrar eventos detectados.

## Características

- Servidor Flask con rutas API para detección, simulación y consulta de eventos.
- Integración con Roboflow para inferencia de objetos.
- Modo de simulación cuando no hay API key configurada.
- Registro de eventos en `eventos.json`.
- Interfaz web simple servida desde `index.html`.

## Requisitos

- Python 3.11 o superior
- Paquetes Python:
  - `flask`
  - `inference-sdk`
  - `mediapipe`
  - `numpy`
  - `opencv-python`
- Dependencias del sistema (especialmente para OpenCV / MediaPipe):
  - `libgl1-mesa-dev` o `libgl1-mesa-glx`
  - `libglib2.0-0`
  - `libsm6`
  - `libxext6`
  - `libxrender-dev`
  - `libgomp1`

## Instalación local

1. Clona el repositorio o descarga los archivos.
2. Abre una terminal en la carpeta del proyecto.
3. Crea y activa un entorno virtual:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

4. Instala dependencias Python:

```bash
pip install flask inference-sdk mediapipe numpy opencv-python
```

5. Si usas Linux, instala las dependencias del sistema necesarias:

```bash
sudo apt update
sudo apt install -y libgl1-mesa-dev libglib2.0-0 libsm6 libxext6 libxrender-dev libgomp1
```

## Instalación en Codespaces

En Codespaces o en otros entornos basados en Ubuntu, sigue estos pasos:

1. Abre el terminal integrado.
2. Instala los paquetes del sistema:

```bash
sudo apt update
sudo apt install -y libgl1-mesa-dev libglib2.0-0 libsm6 libxext6 libxrender-dev libgomp1
```

3. Crea y activa un entorno virtual:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

4. Instala las dependencias Python:

```bash
pip install flask inference-sdk mediapipe numpy opencv-python
```

## Configuración

La app utiliza la variable de entorno `ROBOFLOW_API_KEY` para la inferencia real con Roboflow.

- Si no se configura `ROBOFLOW_API_KEY`, la aplicación operará en modo simulación.

Ejemplo:

```bash
export ROBOFLOW_API_KEY="tu_api_key_aqui"
```

## Uso

Ejecuta el servidor:

```bash
python Detector.py
```

Abre tu navegador en:

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
- Para usar la cámara local, usa la URL del frontend que apunte a tu host local o a la dirección `http://169.254.18.91/...` según tu configuración.
- Si deseas usar Roboflow en producción, cambia la clave y valida la latencia de inferencia.
