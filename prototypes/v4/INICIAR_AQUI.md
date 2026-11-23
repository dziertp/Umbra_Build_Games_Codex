# Umbra V4 — Iniciar y continuar el proyecto

Este paquete contiene el código fuente de la maqueta V4 de dos pisos, con la escalera desplazada 40 u, A1/A2, colisiones, trece recorridos y exportación CSV.

Versión publicada: V4.
Commit de origen: b58d2fe36e285345e4f20d78be4ccd179b16f431.

## Abrir rápidamente

Abre `dist/index.html` en un navegador moderno. Los scripts y estilos son locales; no hay dependencias npm que instalar para abrir la maqueta.

Para trabajar y conservar un origen de navegador estable para las mediciones, utiliza el servidor local descrito abajo.

## Windows con Python 3

1. Descomprime el ZIP completo.
2. Abre la carpeta `Umbra_V4`.
3. Ejecuta `iniciar_windows.bat`.
4. Mantén abierta esa ventana y abre http://127.0.0.1:8000/ en tu navegador.
5. Para detener el servidor, pulsa Ctrl+C en la ventana.

Si prefieres PowerShell, desde la carpeta `Umbra_V4` ejecuta:

```powershell
py -3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

Si no tienes el lanzador `py`, utiliza `python` en su lugar, siempre con Python 3 instalado.

## macOS / Linux

Desde la carpeta `Umbra_V4`:

```bash
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

Después abre http://127.0.0.1:8000/.

## Controles

- WASD o flechas: movimiento.
- Shift: correr.
- E: abrir/cerrar armarios o activar fusibles.
- Recorre los peldaños hasta el final para subir o bajar.
- Espacio: pausa de la prueba.
- R: preparar de nuevo el recorrido seleccionado.

Los botones de piso sirven para inspección libre; los recorridos cronometrados entre plantas deben pasar por la escalera.

## Editar los mapas

Los datos editables están en `map-source.json` y `upper-map-source.json`. Conserva la escalera `[513, 585, 78, 207]` en ambos pisos: las 40 u ya están aplicadas.

Después de modificar datos, desde esta carpeta ejecuta:

```powershell
py -3 build_map.py
```

En macOS/Linux utiliza `python3 build_map.py`.

Esto regenera `dist/map-data.js`. Para cambios de comportamiento/interfaz revisa `dist/geometry.js`, `dist/app.js`, `dist/index.html` y `dist/style.css`.

## Verificar el comportamiento

Con Node.js disponible, ejecuta desde esta carpeta:

```bash
node qa.cjs
```

Las pruebas cubren los trece recorridos con dos tamaños de colisión, carrera, refugios, pasos corregidos y cambios de piso. `qa-report.json` y `qa-layout-report.json` son resultados técnicos de la entrega, no el CSV de las mediciones humanas.

## Pasar el proyecto a otra IA

Adjunta este ZIP junto con la Parte 1, `Umbra_Contexto_Continuacion_Parte_2_V4.md`, las imágenes y `Umbra_mediciones_dos_pisos_V4.csv`.

Las imágenes, los audios y las mediciones humanas se entregan por separado. El jugador de esta maqueta sigue siendo una referencia geométrica. Oscuridad, iluminación, cacerías y herramientas de investigación aún no forman parte de V4.

## Contenido original

El código y los informes de V4 se conservaron tal como están en el commit indicado. `INICIAR_AQUI.md` e `iniciar_windows.bat` se añadieron únicamente como ayuda para esta exportación.
