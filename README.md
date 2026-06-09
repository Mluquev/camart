# camart

Demo con p5.js y ml5.js que detecta un rostro, dibuja puntos de referencia y resalta una sonrisa. El arranque de cámara está preparado para funcionar con webcam externa o cámara integrada usando auto-selección con fallback.

## Cómo funciona

El archivo principal es [script.js](script.js). Ahí se carga el modelo de rostro, se inicia la cámara, se analizan los puntos faciales y se dibuja la interfaz sobre el canvas.

### Partes del código

- `preload()`: intenta cargar `ml5.faceMesh` antes de arrancar la app.
- `setup()`: crea el canvas, verifica que el modelo exista y llama al inicio de la cámara.
- `startCamera()`: busca una cámara disponible, abre el stream, espera a que el vídeo esté listo y activa la detección facial.
- `pickVideoInput()`: revisa los dispositivos de vídeo y ordena las cámaras por prioridad. Primero intenta favorecer webcams externas, luego cámaras integradas y, por último, cualquier otra disponible.
- `scoreVideoInput()`: asigna una prioridad numérica a cada cámara según su nombre.
- `waitForVideoReady()`: espera a que el elemento de vídeo tenga metadatos y pueda usarse sin carreras de inicialización.
- `draw()`: dibuja el vídeo, calcula si los ojos están abiertos y si hay sonrisa, y pinta el estado en pantalla.
- `gotFaces()`: recibe los resultados de `faceMesh` y los guarda para el siguiente frame.
- `getPoint()`, `distance()`, `eyeOpenRatio()`: funciones auxiliares para leer puntos faciales y medir distancias.
- `drawLandmark()`, `drawStatus()`: pintan marcadores visuales y mensajes de estado.

## Flujo de cámara

1. El navegador pide permisos de cámara.
2. `pickVideoInput()` selecciona el dispositivo con mejor prioridad.
3. `startCamera()` abre el stream con `deviceId` en modo `ideal`, para no romper si ese dispositivo exacto no está disponible.
4. Cuando el vídeo está listo, `faceMesh.detectStart()` empieza a devolver detecciones.

## Resultado

- Si hay webcam externa, se prioriza.
- Si no hay webcam externa, se usa la cámara integrada.
- Si el navegador no deja acceder a la cámara, el mensaje de estado explica el problema.