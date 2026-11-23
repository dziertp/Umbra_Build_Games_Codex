# Instrucciones para agentes de IA (Codex, Claude)

Umbra es un juego de terror e investigación paranormal en 2D, vista superior, pixel art. Se desarrolla en la hackathon Build Games with Codex el **lunes 23-11-2026**. **El desarrollo cierra a las 16:00**; desde las 15:00 solo se corrigen errores.

Contexto completo en `docs/contexto/` (Partes 1, 2 y 3 y el plan del día). Léelo si necesitas decisiones de diseño.

## Reglas técnicas

- **JavaScript plano + Canvas 2D, sin motor y sin compilación.** No agregues npm, bundlers ni frameworks.
- **Scripts clásicos, no ES modules** (`import`/`export` prohibidos): el juego debe funcionar abriendo `index.html` con doble clic. Cada archivo nuevo se agrega con `<script src>` en `index.html`, antes de `src/main.js`.
- Todo se cuelga del objeto global `Umbra` (definido en `src/core.js`). No crees otras variables globales.
- **El contenido va en datos, no en la lógica.** Entidades, evidencias, herramientas y mapas viven en `src/data/`. Agregar una entidad o evidencia nueva no debe requerir tocar la lógica.
- La geometría y las colisiones están en `src/geometry.js` (`globalThis.UmbraGeometry`, también en `Umbra.state.G`). Los mapas se editan en `tools/maps/*.json` y se regeneran con `python3 tools/build_map.py`. La geometría **se puede ajustar** si mejora el juego.
- Resolución interna 480×270 escalada sin suavizado. Mantén la estética pixel art: pocos colores, nada de degradados realistas.
- Paleta: negro y grises oscuros, marrones apagados, azul lunar para ventanas, amarillo tenue para luces cálidas.
- Texto del juego en **español**.

## Cómo se conecta un sistema

Cada sistema es un archivo que se registra en `src/core.js`:

```js
(function () {
  'use strict';
  Umbra.register({
    order: 10,                       // menor = antes
    start(state) {},                 // al empezar la partida
    update(dt, state) {},            // cada fotograma
    onKey(e, state) { return false },// true = consume la tecla
    drawWorld(ctx, state) {},        // coordenadas de mundo, bajo el jugador
    drawLight(ctx, state) {},        // capa de oscuridad, coordenadas de pantalla
    drawUI(ctx, state) {},           // interfaz, coordenadas de pantalla
  });
})();
```

`state` tiene: `scene`, `floor` (0 planta baja, 1 segundo piso), `player {x, y, facing}`, `keys`, `model` (colisiones del piso actual), `view {w, h, ox, oy}` (pantalla = mundo + ox/oy), `closetOpen`, `G` (geometría). Datos del piso actual: `Umbra.state.G.floors[state.floor]` (habitaciones en `.rooms` como `[nombre, x, y, ancho, alto, color]`).

Utilidades: `Umbra.tell(texto, segundos)` muestra un mensaje; `Umbra.emit(nombre, datos)` / `Umbra.on(nombre, fn)` para eventos entre sistemas.

### Formato de datos de contenido (acordado)

```js
// src/data/evidence.js
Umbra.data.evidence = [{ id: 'emf', name: '…', tool: 'emf', description: '…' }];
// src/data/tools.js
Umbra.data.tools = [{ id: 'emf', name: '…', key: 'Digit1', evidence: ['emf'] }];
// src/data/entities.js
Umbra.data.entities = [{ id: '…', name: '…', evidence: ['emf', '…'], description: '…', traits: {} }];
```

Varias entidades pueden compartir evidencias; se distinguen por `traits` (comportamiento).

### La entidad de la partida (acordado)

Al empezar la partida, `src/entity.js` elige una entidad al azar y su habitación favorita, y deja:

```js
state.entity = {
  type,      // el objeto de Umbra.data.entities elegido
  floor,     // piso de su habitación favorita (0 o 1)
  room,      // [nombre, x, y, ancho, alto, color] de esa habitación
  x, y,      // posición actual de la entidad (mundo)
  mode,      // 'idle' | 'hunt' ...
};
```

Las herramientas detectan evidencias cuando el jugador está en `state.entity.room` (mismo `floor`) y la evidencia está en `state.entity.type.evidence`. Mientras `entity.js` no exista, el sistema de herramientas puede crear un `state.entity` provisional en su `start()` si no hay uno.

## Reparto de archivos (evita conflictos)

| Área | Responsable | Archivos |
| --- | --- | --- |
| Mundo y amenaza | Dacier (con Claude) | `src/geometry.js`, `src/lighting.js`, `src/entity.js`, `src/render.js`, `tools/` |
| Investigación e interfaz | Isidora (con Codex) | `src/evidence.js`, `src/tools.js`, `src/journal.js`, `src/ui.js`, `src/audio.js` |
| Contenido y arte | Anais | `src/data/entities.js`, `src/data/evidence.js`, `src/data/tools.js`, `assets/` |
| Compartidos | avisar antes de editar | `src/main.js`, `src/core.js`, `index.html`, `README.md` |

No edites archivos de otra área sin que te lo pidan.

## Antes de terminar cada tarea

1. `node tools/qa.cjs` debe pasar.
2. Abre `index.html` en el navegador y juega la parte que cambiaste. Revisa la consola: sin errores.
3. Commits pequeños con mensaje claro en español. **Varios agentes trabajan en la misma carpeta:** agrega solo tus archivos (`git add <archivo>`, nunca `git add -A` ni `git add .`) y actualiza con `git pull --rebase --autostash` antes de `git push`.
4. Si agregas un recurso externo (imagen, sonido, fuente, librería) o generado con IA, regístralo en la tabla de `README.md` con autor, enlace, licencia y cambios.
5. Explica qué cambiaste y cómo lo comprobaste. Si algo no se pudo verificar, dilo.

No subas contraseñas ni claves de API.
