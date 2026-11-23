# UMBRA — Plan de la jornada (lunes 23-11-2026)

**Versión 3.** Cierre del desarrollo a las **16:00**, equipo de tres personas y juego preparado para crecer (más entidades, evidencias y escenarios).

## Principio rector

**A las 12:30 debe existir una partida completa en la mansión:** menú → investigar → elegir la entidad en el diario → ganar o perder. Desde ahí, cada bloque agrega contenido o escenarios sobre algo que ya funciona.

Todo el contenido (mapas, entidades, evidencias, herramientas) va en **archivos de datos**, para poder sumar más sin tocar la lógica.

## Horarios oficiales

- 9:00 acreditación.
- 11:00–16:00 mentorías (por confirmar). Aprovecharlas para que mentores prueben el juego.
- **16:00 cierre del desarrollo. Desde ahí no se puede modificar nada.**
- 18:00 anuncio de ganadores.

## Reparto

| Integrante | Rol | Archivos principales |
| --- | --- | --- |
| **Dacier Tapia** (vibe coding) | Mundo y amenaza: geometría, render, oscuridad, entidad y cacerías, apagón, sistema de escenarios | `geometry.js`, `render.js`, `lighting.js`, `entity.js`, `maps.js` |
| **Isidora Vargas** (vibe coding) | Investigación e interfaz: herramientas, evidencias, diario, menú, selector de escenario, resultado, audio | `evidence.js`, `tools.js`, `journal.js`, `ui.js`, `audio.js` |
| **Anais Tapia** (arte y diseño) | Sprites, sonidos, entidades y evidencias con sus textos, bocetos de escenarios, pruebas, tabla de recursos | `assets/`, `src/data/entities.js`, `src/data/evidence.js`, `README.md` |

`main.js` es compartido: cambios pequeños y avisando. Commits frecuentes y `git pull` antes de cada tarea. Herramientas de IA: principalmente Claude, también Codex.

## Horario

| Hora | Dacier | Isidora | Anais |
| --- | --- | --- | --- |
| 9:00–9:30 | Acreditación. Repo público, LICENSE MIT, estructura, publicar en GitHub Pages | Portar `geometry.js` y mapas, reformatear sin cambiar lógica, `qa.cjs` pasa | Revisar fotos de Demonology; subir materiales previos a `prototypes/` y `docs/` |
| 9:30 | **Los tres (15 min): formato de datos de entidades, evidencias, herramientas y mapas; contratos entre módulos** | | |
| 9:45–11:00 | Jugador sobre el mapa + oscuridad con oclusión y linterna | Sistema de herramientas y evidencias leyendo los datos; diario básico | Primer grupo de entidades y evidencias con nombres propios; sprite del personaje (4 direcciones) |
| 11:00–12:30 | Luces por habitación; entidad con habitación favorita y deambulación | Menú, pantalla de resultado, conectar diario con final | Más entidades y evidencias en datos; suelos y muebles; ambiente y primeros sonidos |
| **12:30** | **Hito: partida completa jugable en la mansión. Primera prueba entre los tres** | | |
| 12:30–13:00 | Almuerzo + lista de problemas | | |
| 13:00–14:15 | Cacerías con A*, escondites A1/A2, muerte | Apagón y fusibles, eventos ambientales, audio integrado | Integrar arte y sonido; boceto de la gasolinería |
| 14:15–15:00 | **Expansión:** sistema de escenarios y gasolinería (si el núcleo está estable) | **Expansión:** selector de escenario; más entidades y evidencias; ajustes tras pruebas | **Pruebas con mentores u otros equipos**; anotar lo que confunde |
| **15:00** | **Se congelan las funcionalidades. Solo correcciones** | | |
| 15:00–15:40 | Corregir errores que bloqueen una partida | Corregir errores; instrucciones dentro del juego | README completo, tabla de recursos, probar el enlace en incógnito |
| **15:40** | **Entrega en Google Forms (20 min de margen)** | | |
| 16:00 | Cierre | | |

## Criterios de "listo"

- **Repo:** público, abre sin sesión, Pages funciona, `qa.cjs` pasa.
- **Oscuridad:** no se ve a través de muros; la linterna se entiende caminando y corriendo.
- **Investigación:** cada evidencia se puede encontrar, marcar en el diario y llevar a identificar la entidad.
- **Amenaza:** una cacería se puede sobrevivir escondiéndose o huyendo.
- **Escenarios:** agregar un mapa nuevo solo requiere su archivo de datos y registrarlo en el selector.
- **Entrega:** una persona ajena juega siguiendo solo el README.

## Si vamos atrasados

Se mueve al bloque siguiente (o a después de la jornada), en este orden:

1. Gasolinería y selector de escenario.
2. Ojos blancos en oscuridad total.
3. Eventos ambientales extra.
4. Sonido direccional (dejar sonido simple).
5. Arte final de suelos y muebles (dejar formas con paleta cuidada).

**Nunca se sacrifica:** menú con instrucciones, final de partida, README y créditos.

## Después de la jornada

- Escuela japonesa (mapa grande, probablemente con varios pisos).
- Objetos malditos, tropiezos, stamina, puertas dinámicas.
- Migración a **Godot 4** (ver Parte 3 del contexto, sección 9).

## Estructura del repo

```
umbra/
├── index.html
├── style.css
├── src/
│   ├── data/
│   │   ├── maps/mansion.js       (generado desde tools/)
│   │   ├── maps/gasolineria.js   (cuando exista)
│   │   ├── entities.js
│   │   ├── evidence.js
│   │   └── tools.js
│   ├── geometry.js               (portado de V4)
│   ├── maps.js                   (registro y carga de escenarios)
│   ├── render.js
│   ├── lighting.js
│   ├── player.js
│   ├── entity.js
│   ├── evidence.js
│   ├── tools.js
│   ├── journal.js
│   ├── ui.js
│   ├── audio.js
│   └── main.js
├── assets/sprites/  assets/audio/
├── tools/           (fuentes JSON de mapas, build_map.py, qa.cjs)
├── prototypes/v4/   (maqueta de medición, material previo)
├── docs/            (planos, contexto, referencias propias; material previo)
├── README.md
└── LICENSE          (MIT)
```

Scripts clásicos (no ES modules) para que el juego funcione también abriendo `index.html` con doble clic.
