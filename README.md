# Umbra

> En desarrollo durante la jornada. Los campos marcados con `[completar]` se llenan durante el día.

## Descripción

Umbra es un juego de terror e investigación paranormal en 2D, con vista superior y estética pixel art.

El jugador es un investigador que entra de noche a un lugar abandonado. Con una linterna y herramientas especializadas debe encontrar evidencias de la presencia que lo habita, registrarlas en su diario e identificar de qué entidad se trata. La oscuridad es parte del juego: solo se ve lo que alcanza la luz, los muros tapan la vista y la entidad puede cortar la electricidad o salir a cazar. Para sobrevivir hay que esconderse o restablecer la luz en la caja de fusibles.

**Objetivo:** identificar correctamente a la entidad antes de que te atrape.

**Escenarios:** Mansión Umbra (dos pisos). [completar si se incluyen: Gasolinería]

## Cómo jugar o ejecutar

- **Versión jugable en línea:** [completar: enlace de GitHub Pages]
- **Requisitos:** un navegador moderno (Chrome, Edge, Firefox o Safari actualizados), en Windows, macOS o Linux. No requiere instalar nada para jugar.
- **Instalación:** no hay dependencias. Solo descarga el repositorio:
  ```bash
  git clone [completar: URL del repositorio]
  ```
  O usa el botón **Code → Download ZIP** de GitHub y descomprímelo.
- **Iniciar el juego:**
  - **Opción 1:** abre el enlace en línea.
  - **Opción 2:** abre `index.html` con doble clic.
  - **Opción 3 (servidor local):** desde la carpeta del repositorio ejecuta
    ```bash
    python3 -m http.server 8000
    ```
    (en Windows: `py -3 -m http.server 8000`) y abre http://localhost:8000 en el navegador.
- **Para desarrolladores (opcional):** con Python 3, `python3 tools/build_map.py` regenera los datos del mapa; con Node.js, `node tools/qa.cjs` ejecuta las pruebas automáticas.

## Controles

- **Movimiento:** WASD o flechas. Mantén **Shift** para correr.
- **Linterna:** [completar]
- **Acciones:**
  - **E:** interactuar (escondites, fusibles, interruptores).
  - [completar: teclas para elegir y usar herramientas]
  - [completar: tecla para abrir el diario]
- **Subir o bajar:** camina por la escalera hasta el final del tramo.
- **Pausa, reiniciar o volver al menú:** [completar]

## Integrantes

- **Dacier Tapia** — programación con IA: mundo, oscuridad, entidad, cacerías y sistema de escenarios.
- **Isidora Vargas** — programación con IA: herramientas, evidencias, diario, interfaz y audio.
- **Anais Tapia** — arte, audio, diseño de entidades y evidencias, diseño de escenarios, pruebas de juego y documentación.

## Trabajo con Codex

[completar al final del día]

Usamos principalmente **Claude** y también **Codex** para escribir, probar y mejorar el código.

Antes de la jornada diseñamos la casa con planos y una maqueta web de recorridos (V4), con la que medimos tiempos de desplazamiento y ajustamos velocidades, tamaños de colisión y la ubicación de la escalera y los refugios. Durante la jornada:

- Portamos la geometría y las colisiones de esa maqueta al juego, manteniendo sus pruebas automáticas.
- [completar: oscuridad, entidades, diario, escenarios, etc.]
- [completar: qué probamos con otras personas y qué cambiamos a partir de eso]

## Código de honor

Declaramos que el trabajo presentado se realizó durante la jornada del lunes 23 de noviembre de 2026. Los materiales desarrollados previamente, propios o de terceros, están disponibles en los enlaces públicos de la tabla.

## Recursos de terceros y materiales desarrollados previamente

Incluye todo lo que no se creó durante la jornada (propio o ajeno), todo recurso externo y todo lo generado con IA.

| Recurso | Tipo | Autor | Enlace público | Licencia | Cambios realizados |
| --- | --- | --- | --- | --- | --- |
| Maqueta de recorridos Umbra V4 | Material previo propio (código) | Equipo Umbra, con asistencia de IA | `prototypes/v4/` | MIT | Se reutilizaron los datos de los mapas, `geometry.js` y las pruebas; se reformateó el código. La interfaz de medición no forma parte del juego. |
| Planos estructurales, capturas y mediciones de recorridos | Material previo propio (diseño) | Equipo Umbra | `docs/planos/`, `docs/recorridos/` | MIT | Referencia de diseño para la geometría de la mansión. [completar: ajustes realizados durante la jornada] |
| Documentos de contexto y plan de la jornada | Material previo propio (documentación) | Equipo Umbra, con asistencia de IA (Claude) | `docs/contexto/` | MIT | Ninguno. |
| Imágenes de referencia de personajes (Hannah, Turner, Chloe) | Material previo propio (imagen) | [completar: autor / herramienta de IA] | `docs/personajes/` | [completar] | [completar] |
| Audios preliminares de ambiente y tropiezo | Material previo propio (audio) | [completar: autor / herramienta] | [completar: subir a `docs/audio/` si se usan] | [completar] | [completar] |
| Claude (Anthropic) y Codex (OpenAI) | Herramientas de IA | Anthropic, OpenAI | https://claude.ai · https://openai.com/codex | Según sus términos de uso | Asistencia en código, pruebas y documentación. |
| [completar: recursos externos añadidos durante el día] | | | | | |

**Inspiración (no se incorporó material de estos juegos):** Phasmophobia (Kinetic Games) y Demonology (Roblox) en jugabilidad; Hotline Miami, Undertale y Pokémon en lo visual; Resident Evil 7 y Village en la estructura del escenario.

## Estructura del repositorio

```
index.html, style.css   juego (se abre directo en el navegador)
src/                    código del juego (scripts clásicos, sin compilación)
src/data/               datos generados y contenido (mapas, entidades, evidencias)
assets/                 sprites y audio
tools/                  fuentes de mapas, build_map.py y pruebas automáticas (qa.cjs)
prototypes/v4/          maqueta de recorridos previa a la jornada (material previo)
docs/                   planos, mediciones, contexto y referencias (material previo)
```

## Licencia

El código de Umbra se publica bajo licencia **MIT** (ver `LICENSE`).
Los recursos de terceros conservan sus propias licencias, indicadas en la tabla anterior.
