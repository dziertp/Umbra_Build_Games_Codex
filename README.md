# Umbra

## Descripción

Umbra es un juego de terror e investigación paranormal en 2D, con vista superior y estética pixel art.

El jugador es un investigador paranormal que llega de noche a la Mansión Umbra, una casa abandonada de dos pisos. En el campamento, junto a su camión, elige hasta 4 objetos del panel de equipo (la linterna incluida) y entra a la casa. Adentro debe encontrar la habitación de la entidad, detectar sus evidencias con las herramientas, registrarlas en el diario e identificar de qué entidad se trata.

La oscuridad es parte del juego: solo se ve lo que alcanza la luz, los muros tapan la vista, las lámparas se encienden en los interruptores junto a las puertas y la entidad puede cortar la electricidad, que se restablece en los fusibles del garaje. Cuando la entidad caza, hay que huir (correr gasta stamina) o esconderse en un armario. Un retrato del investigador reacciona a lo que pasa en la partida.

**Objetivo:** identificar correctamente a la entidad en el diario y volver al camión para terminar la investigación, sin que la entidad te atrape. Objetivos secundarios en la pizarra del campamento: detectar 2 evidencias y sobrevivir a una cacería.

**Contenido:** 1 escenario (Mansión Umbra, dos pisos, con campamento exterior), 4 entidades, 8 evidencias y 9 objetos de equipo.

## Cómo jugar o ejecutar

- **Versión jugable en línea:** https://dziertp.github.io/Umbra_Build_Games_Codex/
- **Requisitos:** un navegador moderno (Chrome, Edge, Firefox o Safari actualizados), en Windows, macOS o Linux. No requiere instalar nada para jugar.
- **Instalación:** no hay dependencias. Solo descarga el repositorio:
  ```bash
  git clone https://github.com/dziertp/Umbra_Build_Games_Codex.git
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

| Acción | Tecla |
| --- | --- |
| Moverse | WASD o flechas |
| Correr (gasta stamina) | Mantener Shift |
| Interactuar: panel de equipo, pizarra, camión, interruptores, armarios, fusibles | E |
| Elegir objeto del inventario | 1 · 2 · 3 · 4 |
| Usar el objeto equipado (incluida la linterna) | F |
| Encender o apagar la linterna (si la llevas) | L |
| Abrir o cerrar el diario | J o Tab (Q/E cambian de pestaña; clic tacha una entidad, Enter o clic derecho la elige) |
| Silenciar o activar el sonido | M |
| Mostrar u ocultar la ayuda de controles | K |
| Volver al menú | Esc |
| Subir o bajar de piso | Caminar por la escalera hasta el final del tramo |

En el panel de equipo y en el diario también se puede usar el mouse.

**Cómo se juega una partida:**
1. En el campamento, presiona E en el panel de equipo y toma la linterna y hasta 3 herramientas.
2. Entra a la casa. Los eventos ("algo cayó en la cocina…") indican dónde está la entidad.
3. En su habitación, usa las herramientas (F). Las evidencias detectadas se marcan solas en el diario.
4. Abre el diario (J), revisa qué entidades calzan con las evidencias y elige una.
5. Si empieza una cacería ("Algo se acerca…"), huye o escóndete en un armario y ciérralo (E).
6. Vuelve al camión y presiona E para terminar la investigación.

## Integrantes

- **Dacier Tapia** — programación con IA: mundo, oscuridad, entidad, cacerías y sistema de escenarios.
- **Isidora Vargas** — programación con IA: herramientas, evidencias, diario, interfaz y audio.
- **Anais Tapia** — arte, audio, diseño de entidades y evidencias, diseño de escenarios, pruebas de juego y documentación.

## Trabajo con Codex

Trabajamos con **Codex** y **Claude** como asistentes de programación, cada integrante en un área con archivos propios para no pisarnos. Las reglas comunes para las IA están en `AGENTS.md` (y `CLAUDE.md`): JavaScript sin motor ni compilación, contenido en archivos de datos y pruebas antes de cada commit.

**Antes de la jornada** diseñamos la casa con planos y una maqueta web de recorridos (V4), con la que medimos tiempos de desplazamiento y ajustamos velocidades, tamaños de colisión y la ubicación de la escalera y los refugios (`prototypes/v4/`, `docs/`).

**Durante la jornada:**
- Portamos la geometría, las colisiones y la búsqueda de rutas (A*) de la maqueta, manteniendo sus pruebas automáticas (`node tools/qa.cjs`).
- Construimos la oscuridad con línea de visión (los muros tapan la luz), la linterna como objeto, las lámparas por habitación, la luz de luna y el apagón con fusibles.
- Creamos la entidad: deambula por su habitación favorita, provoca eventos con pistas, corta la luz y caza al jugador con rutas A*; sus rasgos cambian su comportamiento.
- Diseñamos el sistema de investigación: 9 objetos de equipo, 8 evidencias, el diario con pestañas y el final de partida. Las entidades, evidencias y herramientas son datos, así que agregar contenido no requiere tocar la lógica.
- Agregamos el campamento base, el panel de equipo en primera persona, el inventario, la stamina, el retrato que reacciona, el arte pixel art del escenario y el audio.

**Qué mejoramos a partir de pruebas:** cada cambio se verificó con pruebas automáticas en el navegador (bots que recorren la casa, huyen de la entidad o se esconden) y con capturas. Con esas pruebas corregimos, entre otros: la entidad que se alejaba de su habitación rodeando por el pasillo, interruptores que se podían activar a través de las paredes o que quedaban en el hueco de una puerta, la entidad que atravesaba un armario recién cerrado, y la velocidad de cacería, que ajustamos dos veces para que huir solo corriendo no bastara y esconderse tuviera sentido.

## Detalles de verificación en vivo

Elementos pedidos por la organización durante la jornada, para verificar que el juego se programó en vivo:

| Detalle | Dónde está |
| --- | --- |
| Un completo italiano | Objeto del panel de equipo del campamento ("No sirve de mucho, pero por si te da hambre"). Se equipa y se usa con F. |
| Referencia a 31 minutos | Un diario viejo en el suelo del living: acércate y presiona E para leer el titular. |
| "Queda una pura misión" | Aparece en la pizarra de objetivos y como consejo cuando queda un solo objetivo pendiente. |
| El número 23 | En el buzón del campamento y en el título del diario ("Expediente N.º 23"). |
| Codex | Cuadro "CODEX" en el hall de la mansión y "Hecho en vivo con Codex" en el menú. |

## Código de honor

Declaramos que el trabajo presentado se realizó durante la jornada del lunes 23 de noviembre de 2026. Los materiales desarrollados previamente, propios o de terceros, están disponibles en los enlaces públicos de la tabla.

## Recursos de terceros y materiales desarrollados previamente

Incluye todo lo que no se creó durante la jornada (propio o ajeno), todo recurso externo y todo lo generado con IA.

| Recurso | Tipo | Autor | Enlace público | Licencia | Cambios realizados |
| --- | --- | --- | --- | --- | --- |
| Maqueta de recorridos Umbra V4 | Material previo propio (código) | Equipo Umbra, con asistencia de IA | `prototypes/v4/` | MIT | Se reutilizaron los datos de los mapas, `geometry.js` y las pruebas; se reformateó el código. La interfaz de medición no forma parte del juego. |
| Planos estructurales, capturas y mediciones de recorridos | Material previo propio (diseño) | Equipo Umbra | `docs/planos/`, `docs/recorridos/` | MIT | Referencia de diseño. Durante la jornada se agregó el campamento exterior, muebles y decoración, y se abrió el porche. |
| Documentos de contexto y plan de la jornada | Material previo propio (documentación) | Equipo Umbra, con asistencia de IA (Claude) | `docs/contexto/` | MIT | Ninguno. |
| Conceptos pixel art de cuatro entidades (cuatro vistas cada una) | Imagen generada y ajustada con IA para Umbra | Anais Tapia, con OpenAI API (`gpt-image-2`) | `assets/entities/concept_sheets/` · [registro de diseño](docs/contexto/Entidades_Anais_v1.md) | OpenAI Services Agreement: salida asignada al cliente; fuera de MIT | Redibujadas para acercarse al pixel art de los prototipos; fondo negro opaco, no sprites integrados. |
| Conceptos pixel art de ocho iconos para evidencias | Arte original dibujado a píxel para Umbra | Anais Tapia, con asistencia de Codex | `assets/evidence/icons_12x12/` · `assets/evidence/evidencias_8_iconos_12x12.png` · [guía](docs/contexto/Iconos_Evidencias_Anais_v1.md) | MIT | Ocho iconos PNG RGBA de 12 × 12 px y una hoja 4 × 2; integrados en el diario. |
| Props decorativos pixel art para la mansión (8 objetos) | Arte original en pixel art | Anais Tapia, con asistencia de Codex | `assets/scenarios/props_16x16/` · [hoja de objetos](assets/scenarios/props_mansion_8_objetos_16x16.png) · [guía](docs/arte/Props_Mansion_Anais_v1.md) | MIT | Ocho PNG RGBA transparentes de 16 × 16 px y hoja 4 × 2; integrados como decoración en la mansión. |
| Prototipos pixel art 12 × 20 px de cuatro entidades | Sprites originales dibujados por código con asistencia de IA | Anais Tapia, con asistencia de Codex | `assets/entities/sprites/` · [registro de diseño](docs/contexto/Entidades_Anais_v1.md) | OpenAI Terms of Use: salidas asignadas al cliente; fuera de MIT | Hojas transparentes con cuatro vistas de La Pliegasombra, El Hilvanado, La Brasa Velada y El Enramado; integradas como sprite de la entidad durante la cacería. |
| Imágenes de referencia de personajes (Hannah, Turner, Chloe) | Material previo propio (imagen) | [completar: autor / herramienta de IA] | `docs/personajes/` | [completar] | [completar] |
| Claude (Anthropic) y Codex (OpenAI) | Herramientas de IA | Anthropic, OpenAI | https://claude.ai · https://openai.com/codex | Según sus términos de uso | Asistencia en código, pruebas, arte por código (sprites, retrato, herramientas, escenario) y documentación. |
| Ambiente y efectos sintetizados | Audio generado en tiempo real | Equipo Umbra, con asistencia de Codex | [src/audio.js](src/audio.js) | MIT | Síntesis con Web Audio API. |
| Pasos (steps) | Efecto de sonido (MP3) | Amekiano (Freesound), publicado por freesound_community | [Pixabay](https://pixabay.com/sound-effects/household-pasos-steps-40285/) | [Pixabay Content License](https://pixabay.com/service/license-summary/) | Bucle, volumen y velocidad ajustados durante el juego. |
| Select Button UI | Efecto de sonido (MP3) | Emilianodleon | [Pixabay](https://pixabay.com/sound-effects/film-special-effects-select-button-ui-395763/) | [Pixabay Content License](https://pixabay.com/service/license-summary/) | Volumen ajustado para los interruptores. |
| Terror | Música del menú (MP3) | u_thxw0i7h4n | [Pixabay](https://pixabay.com/sound-effects/horror-terror-213743/) | [Pixabay Content License](https://pixabay.com/service/license-summary/) | Bucle con fundidos y volumen ajustable durante la reproducción. |
| Propuesta de tablero pixel art de objetivos | Diseño de interfaz creado para Umbra con asistencia de IA | Anais Tapia, con Codex | [mockup](docs/arte/Tablero_Objetivos_Anais_v1.png) · [registro de diseño](docs/arte/Tablero_Objetivos_Anais_v1.md) | Material creado para Umbra; fuera de MIT | Concepto de tablero de investigación en madera y papel, con cuatro objetivos; no está integrado al juego. |

**Inspiración (no se incorporó material de estos juegos):** Phasmophobia (Kinetic Games) y Demonology (Roblox) en jugabilidad (la estructura del diario y el sistema de evidencias se basan en Demonology; nombres, textos y arte son propios); Hotline Miami, Undertale y Pokémon en lo visual; Resident Evil 7 y Village en la estructura del escenario.

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
