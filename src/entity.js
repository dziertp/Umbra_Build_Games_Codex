// Umbra — la entidad de la partida.
// Elige tipo y habitación favorita al empezar, deambula por esa habitación con A*
// (modo 'idle'), emite eventos sutiles, corta la luz y caza al jugador.
// Modos: 'idle' → 'warn' (2–3 s de aviso) → 'hunt' (20–30 s) → 'idle'.
// Eventos: entity:event, hunt:start, hunt:end, hunt:step (pasos; no si es `quiet`), player:caught.
// Debug: F3 muestra la entidad, su ruta y temporizadores; con F3 activo, H fuerza una cacería.
// Contrato de state.entity: ver AGENTS.md.
(function () {
  'use strict';

  const CFG = {
    speed: 40,           // u/s en modo idle
    diameter: 16,        // para la cuadrícula A*
    roam: 40,            // margen alrededor de la habitación favorita
    pause: [1, 4],       // segundos de espera entre paseos
    eventEvery: [20, 40],
    firstEvent: [15, 25], // primera pista, contada desde que el jugador entra por primera vez
    cutEvery: [45, 90],  // cada cuánto intenta cortar la luz (si hay alguna encendida)
    excluded: ['Vestíbulo', 'Hall'],
    // Cacería
    huntEvery: [60, 90],
    firstHuntMin: 45,
    huntRetry: [15, 25],  // si la tirada falla, vuelve a intentar antes
    warn: [2, 3],
    huntLength: [20, 30],
    huntSpeed: [85, 95],  // más rápida que caminar (72), más lenta que correr (102): hay que cortar camino y esconderse
    sight: 320,           // alcance de la vista de la entidad
    catchDist: 14,
    replan: 0.35,         // s entre recálculos de ruta al perseguir
    searchRadius: 90,
    hiddenLinger: 8,      // s que se queda rondando si el jugador se escondió
    stepEvery: 0.45,
  };

  // Si Umbra.data.entities aún no existe, se usa este tipo provisional.
  const FALLBACK = { id: 'provisional', name: 'Entidad', evidence: ['emf'], description: 'Entidad provisional.', traits: {} };

  // Silueta pixel art (12×20): o = cuerpo, e = ojos.
  const SPRITE = [
    '....oooo....', '...oooooo...', '..oooooooo..', '..oeooooeo..', '..oooooooo..', '...oooooo...',
    '....oooo....', '..oooooooo..', '.oooooooooo.', 'oooooooooooo', 'oo.oooooo.oo', 'oo.oooooo.oo',
    'o..oooooo..o', 'o..oooooo..o', '...oooooo...', '...oooooo...', '..oooooooo..', '..oo.oo.oo..',
    '.oo..oo..oo.', '.o...o....o.',
  ];

  const grids = [];  // cuadrícula A* por piso (se construye al necesitarla)
  let debug = false;
  let lastPlayerFloor = 0;

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const traits = (e) => e.type.traits || {};

  // Cuadrícula A* por piso y estado del armario (abierto, la entidad puede entrar).
  function gridFor(state, floor) {
    const open = !!(state.closetOpen && state.closetOpen[floor]);
    const k = floor * 2 + (open ? 1 : 0);
    if (!grids[k]) {
      const g = state.G.grid(CFG.diameter, { floor, closetOpen: open });
      // La entidad no sale de la casa: fuera de las habitaciones (porche, campamento, terraza) no hay celdas libres.
      for (let j = 0; j < g.rows; j++) {
        for (let i = 0; i < g.cols; i++) {
          const n = j * g.cols + i;
          if (g.free[n] && state.G.outdoors(floor, g.x + i * g.step, g.y + j * g.step)) g.free[n] = 0;
        }
      }
      grids[k] = g;
    }
    return grids[k];
  }

  function roomAt(state, floor, x, y) {
    let best = null;
    for (const r of state.G.floors[floor].rooms) {
      if (x >= r[1] && x < r[1] + r[3] && y >= r[2] && y < r[2] + r[4] && (!best || r[3] * r[4] < best[3] * best[4])) best = r;
    }
    return best;
  }

  function lineBlocked(ax, ay, bx, by, walls) {
    for (const w of walls) {
      const d = (bx - ax) * (w[3] - w[1]) - (by - ay) * (w[2] - w[0]);
      if (Math.abs(d) < 1e-9) continue;
      const t = ((w[0] - ax) * (w[3] - w[1]) - (w[1] - ay) * (w[2] - w[0])) / d;
      const u = ((w[0] - ax) * (by - ay) - (w[1] - ay) * (bx - ax)) / d;
      if (t > 0 && t < 1 && u >= 0 && u <= 1) return true;
    }
    return false;
  }

  function isLit(state, floor, x, y) {
    if (!Umbra.power) return false;
    const r = roomAt(state, floor, x, y);
    return !!r && Umbra.power.litRooms(state, floor).includes(r);
  }

  function playerOutdoors(state) {
    return state.G.outdoors(state.floor, state.player.x, state.player.y);
  }

  // Protección del armario (diseño V4): el jugador está dentro de A1/A2 y el armario está cerrado.
  function playerHidden(state) {
    const c = state.G.floors[state.floor].closet;
    const p = state.player;
    return !!c && !state.closetOpen[state.floor] && p.x > c[0] && p.x < c[0] + c[2] && p.y > c[1] && p.y < c[1] + c[3];
  }

  // Punto de la escalera por el que se sale de `floor` y por el que se llega al otro piso.
  function stairExit(state, floor) {
    const s = state.G.floors[floor].stairs;
    return { x: s[0] + s[2] / 2, y: floor === 0 ? 614 : 762 };
  }
  function stairArrival(state, floor) {
    const s = state.G.floors[floor].stairs;
    return { x: s[0] + s[2] / 2, y: floor === 1 ? 560 : 814 };
  }

  // "la cocina", "el baño", "la sala de estar"
  function withArticle(name) {
    const lower = name.toLowerCase();
    return (lower.split(' ')[0].endsWith('a') ? 'la ' : 'el ') + lower;
  }

  function setPath(state, e, target) {
    const g = gridFor(state, e.floor);
    const p = state.G.path(g, e, target);
    if (p && p.points.length > 1) {
      e.path = p.points;
      e.step = 1;
      e.pathGrid = g;
      return true;
    }
    e.path = null;
    return false;
  }

  // Avanza por la ruta; devuelve true al llegar al final.
  function follow(e, speed, dt) {
    if (!e.path) return true;
    let move = speed * dt;
    while (move > 0 && e.step < e.path.length) {
      const t = e.path[e.step];
      const d = Math.hypot(t.x - e.x, t.y - e.y);
      if (d <= move) {
        e.x = t.x;
        e.y = t.y;
        move -= d;
        e.step++;
      } else {
        e.x += ((t.x - e.x) / d) * move;
        e.y += ((t.y - e.y) / d) * move;
        move = 0;
      }
    }
    if (e.step >= e.path.length) {
      e.path = null;
      return true;
    }
    return false;
  }

  // Elige un destino libre dentro (o cerca) de la habitación favorita y calcula la ruta.
  function planWalk(state, e) {
    const g = gridFor(state, e.floor);
    const [, rx, ry, rw, rh] = e.room;
    for (let tries = 0; tries < 8; tries++) {
      const target = {
        x: rand(rx - CFG.roam, rx + rw + CFG.roam),
        y: rand(ry - CFG.roam, ry + rh + CFG.roam),
      };
      const p = state.G.path(g, e, target);
      // Descarta rutas que rodean por fuera del margen (destino al otro lado de un muro).
      const m = CFG.roam + 4;
      const inside = p && p.points.every((q) => q.x >= rx - m && q.x <= rx + rw + m && q.y >= ry - m && q.y <= ry + rh + m);
      if (inside && p.points.length > 1) {
        e.path = p.points;
        e.step = 1;
        e.pathGrid = g;
        return true;
      }
    }
    return false;
  }

  function placeInRoom(state, e) {
    const g = gridFor(state, e.floor);
    const [, rx, ry, rw, rh] = e.room;
    for (let tries = 0; tries < 50; tries++) {
      const x = rand(rx + 10, rx + rw - 10);
      const y = rand(ry + 10, ry + rh - 10);
      const i = Math.round((x - g.x) / g.step);
      const j = Math.round((y - g.y) / g.step);
      if (g.free[j * g.cols + i]) return { x: g.x + i * g.step, y: g.y + j * g.step };
    }
    return { x: rx + rw / 2, y: ry + rh / 2 };
  }

  // firstClue: la primera pista siempre nombra la habitación favorita (o dice pasos arriba/abajo).
  function subtleEvent(state, e, firstClue) {
    const here = firstClue ? e.room : roomAt(state, e.floor, e.x, e.y) || e.room;
    let kind, text;
    if (state.floor === e.floor) {
      const where = withArticle(here[0]);
      const ofWhere = where.replace(/^el /, 'l '); // de + el = del
      const options = [
        ['thud', 'Algo cayó en ' + where + '.'],
        ['creak', 'Un crujido viene de' + (ofWhere === where ? ' ' : '') + ofWhere + '.'],
        ['door', 'Una puerta se movió cerca de' + (ofWhere === where ? ' ' : '') + ofWhere + '.'],
      ];
      if (!firstClue) options.push(['whisper', 'Un susurro, apenas audible.']);
      [kind, text] = pick(options);
    } else {
      kind = 'steps';
      text = e.floor > state.floor ? 'Escuchas pasos arriba.' : 'Escuchas pasos abajo.';
    }
    Umbra.emit('entity:event', { kind, text, floor: e.floor, room: here, x: e.x, y: e.y });
    Umbra.tell(text, 3);
  }

  // ---------- Cacería ----------
  // Parpadeo: cada estado dura un instante (no cambia en cada fotograma).
  function updateFlicker(e, dt, lampChance, torchChance) {
    if (e.flicker && (e.flicker.t -= dt) > 0) return;
    e.flicker = { lamps: Math.random() < lampChance, torch: Math.random() < torchChance, t: rand(0.06, 0.16) };
  }

  function scheduleHunt(e, first) {
    const k = traits(e).huntEarly ? 0.65 : 1;
    const t = rand(...CFG.huntEvery) * k;
    e.nextHunt = first ? Math.max(CFG.firstHuntMin, t) : t;
  }

  // Al vencer el temporizador: ¿caza ahora? Los traits cambian la probabilidad.
  function huntRoll(state, e) {
    const t = traits(e);
    let chance = 0.6;
    if (t.huntEarly) chance += 0.2;
    if (t.prefersDark) chance += isLit(state, state.floor, state.player.x, state.player.y) ? -0.25 : 0.3;
    return Math.random() < chance;
  }

  function beginWarn(state, e) {
    e.mode = 'warn';
    e.warnLeft = rand(...CFG.warn);
    e.path = null;
    Umbra.tell('Algo se acerca…', 3);
  }

  function beginHunt(state, e) {
    e.mode = 'hunt';
    e.huntLeft = rand(...CFG.huntLength);
    e.huntSpeed = rand(...CFG.huntSpeed) * (traits(e).speed || 1);
    e.visible = true;
    e.blink = rand(0.3, 0.9);
    e.replan = 0;
    e.stepT = 0;
    e.lingering = false;
    // Sabe dónde empezó el jugador. Si está en otro piso, primero va a la escalera.
    e.target = null;
    e.lastSeen = { x: state.player.x, y: state.player.y, floor: state.floor };
    lastPlayerFloor = state.floor;
    Umbra.emit('hunt:start', { type: e.type });
  }

  function endHunt(state, e) {
    e.mode = 'idle';
    e.floor = e.homeFloor;
    Object.assign(e, placeInRoom(state, e));
    e.path = null;
    e.wait = rand(...CFG.pause);
    e.flicker = null;
    e.visible = false;
    scheduleHunt(e, false);
    Umbra.emit('hunt:end', { type: e.type });
    Umbra.tell('El silencio vuelve.', 2.5);
  }

  function caught(state, e) {
    e.mode = 'idle';
    e.flicker = null;
    state.keys.clear();
    Umbra.emit('hunt:end', { type: e.type, caught: true });
    Umbra.emit('player:caught', { type: e.type });
    // Respaldo: si nadie cambió de escena al recibir player:caught, muestra la derrota aquí.
    if (state.scene === 'play') {
      const inv = state.investigation || (state.investigation = { startedAt: performance.now() });
      inv.result = {
        correct: false,
        caught: true,
        fallback: true, // la dibuja drawResult de este archivo
        entityName: e.type.name,
        seconds: Math.floor((performance.now() - (inv.startedAt || performance.now())) / 1000),
      };
      state.scene = 'result';
    }
  }

  // Elige hacia dónde ir durante la cacería.
  function huntTarget(state, e) {
    const p = state.player;
    const hidden = playerHidden(state);
    const outside = playerOutdoors(state);
    const sameFloor = state.floor === e.floor;
    let sees = false;
    if (!hidden && !outside && sameFloor) {
      const d = Math.hypot(p.x - e.x, p.y - e.y);
      sees = traits(e).wallhack || (d < CFG.sight && !lineBlocked(e.x, e.y, p.x, p.y, state.model.walls));
    }
    // El jugador cambió de piso: la entidad lo sigue si lo estaba viendo (o lo rastrea).
    if (state.floor !== lastPlayerFloor) {
      if (e.floor === lastPlayerFloor && (e.sawPlayer || traits(e).wallhack)) {
        e.lastSeen = { ...stairExit(state, e.floor), floor: e.floor, stairs: true };
      }
      lastPlayerFloor = state.floor;
    }
    e.sawPlayer = sees;
    if (sees) {
      e.lastSeen = { x: p.x, y: p.y, floor: state.floor };
      e.lingering = false;
      return { x: p.x, y: p.y, chase: true };
    }
    if ((hidden || outside) && !e.lingering && sameFloor) {
      // No lo encuentra (escondido o fuera de la casa): ronda dentro un rato y se va.
      e.lingering = true;
      e.huntLeft = Math.min(e.huntLeft, CFG.hiddenLinger);
    }
    // Al principio de la cacería, si el jugador está en otro piso: ir a la escalera.
    if (e.lastSeen.floor !== e.floor) e.lastSeen = { ...stairExit(state, e.floor), floor: e.floor, stairs: true };
    return null;
  }

  function updateHunt(dt, state, e) {
    // Parpadeo visible / invisible.
    if ((e.blink -= dt) <= 0) {
      e.visible = !e.visible;
      e.blink = e.visible ? rand(0.3, 0.9) : rand(0.15, 0.5);
    }
    // La linterna parpadea durante la cacería.
    updateFlicker(e, dt, 0, 0.18);

    if ((e.huntLeft -= dt) <= 0) {
      endHunt(state, e);
      return;
    }

    const target = huntTarget(state, e);
    let speed = e.huntSpeed;
    if (traits(e).slowInLight && isLit(state, e.floor, e.x, e.y)) speed *= 0.75;

    if (target) {
      if ((e.replan -= dt) <= 0 || !e.path) {
        setPath(state, e, target);
        e.replan = CFG.replan;
      }
      follow(e, speed, dt);
    } else {
      // Sin verlo: va a la última posición conocida y después busca alrededor.
      if (!e.path) {
        const ls = e.lastSeen;
        const atLast = Math.hypot(ls.x - e.x, ls.y - e.y) < 6;
        if (atLast && ls.stairs) {
          // Sube o baja la escalera tras el jugador.
          e.floor = 1 - e.floor;
          Object.assign(e, stairArrival(state, e.floor));
          e.lastSeen = { x: e.x, y: e.y, floor: e.floor, searched: true };
        } else if (atLast || ls.searched) {
          ls.searched = true;
          const a = rand(0, Math.PI * 2);
          const r = rand(20, CFG.searchRadius);
          setPath(state, e, { x: ls.x + Math.cos(a) * r, y: ls.y + Math.sin(a) * r });
        } else {
          setPath(state, e, ls);
          if (!e.path) ls.searched = true;
        }
      }
      if (follow(e, speed * (e.lastSeen.searched ? 0.6 : 1), dt)) e.path = null;
    }

    // Pasos (eventos para audio; las entidades `quiet` no hacen ruido).
    if (!traits(e).quiet && (e.stepT -= dt) <= 0) {
      e.stepT = CFG.stepEvery;
      Umbra.emit('hunt:step', { x: e.x, y: e.y, floor: e.floor });
    }

    // ¿Atrapó al jugador?
    const p = state.player;
    if (e.floor === state.floor && !playerHidden(state) && !playerOutdoors(state) && Math.hypot(p.x - e.x, p.y - e.y) < CFG.catchDist) {
      caught(state, e);
    }
  }

  // ---------- Sprites de Anais (assets/entities/sprites/<id>_4_vistas_12x20.png) ----------
  // Hoja de 48×20: frente, espalda, perfil izquierdo, perfil derecho (cuadros de 12×20).
  const VIEWS = { down: 0, up: 1, left: 2, right: 3 };
  // Ojos de cada hoja por vista [col, fila] (de espalda no se ven); sin entrada, ojos genéricos.
  const SPRITE_EYES = {
    brasa_velada: [[[4, 4], [7, 4]], [], [[3, 4]], [[8, 4]]],
    enramado: [[[4, 3], [7, 3]], [], [[4, 3]], [[7, 3]]],
    hilvanado: [[[5, 4]], [], [[3, 4]], [[8, 4]]],
    pliegasombra: [[[4, 4], [7, 4]], [], [[3, 4]], [[8, 4]]],
  };
  const GENERIC_EYES = [[[3, 3], [8, 3]], [], [[3, 3]], [[8, 3]]];
  const sprites = {}; // nombre de archivo → { img, ok }

  function spriteKey(type) {
    return String(type.id || '').replace(/-/g, '_');
  }
  function loadSprite(type) {
    const key = spriteKey(type);
    if (!key || sprites[key]) return;
    const entry = (sprites[key] = { img: new Image(), ok: false });
    entry.img.onload = () => { entry.ok = true; };
    entry.img.src = 'assets/entities/sprites/' + key + '_4_vistas_12x20.png';
  }
  function spriteFor(e) {
    const entry = sprites[spriteKey(e.type)];
    return entry && entry.ok ? entry.img : null;
  }
  // Vista según hacia dónde se movió la entidad en el último fotograma.
  function updateFacing(e) {
    const dx = e.x - (e.lastX ?? e.x);
    const dy = e.y - (e.lastY ?? e.y);
    if (Math.abs(dx) + Math.abs(dy) > 0.01) {
      e.view = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    }
    e.lastX = e.x;
    e.lastY = e.y;
  }

  // ---------- Dibujo ----------
  function drawSprite(ctx, x, y, color, eyes) {
    const x0 = Math.round(x) - 6;
    const y0 = Math.round(y) - 14;
    for (let j = 0; j < SPRITE.length; j++) {
      const row = SPRITE[j];
      for (let i = 0; i < row.length; i++) {
        const c = row[i];
        if (c === '.') continue;
        if (c === 'e' && eyes) ctx.fillStyle = eyes;
        else if (c === 'o' || c === 'e') ctx.fillStyle = color;
        else continue;
        ctx.fillRect(x0 + i, y0 + j, 1, 1);
      }
    }
  }

  Umbra.register({
    order: 10, // antes que tools.js (20): así tools.js respeta esta entidad
    start(state) {
      grids.length = 0;
      const types = Umbra.data.entities && Umbra.data.entities.length ? Umbra.data.entities : [FALLBACK];
      const rooms = state.G.floors.flatMap((D, floor) =>
        D.rooms.filter((r) => !CFG.excluded.includes(r[0])).map((room) => ({ floor, room })));
      const { floor, room } = pick(rooms);
      const e = {
        type: pick(types), floor, homeFloor: floor, room, x: 0, y: 0, mode: 'idle',
        path: null, step: 0, wait: rand(...CFG.pause),
        nextEvent: rand(...CFG.eventEvery), nextCut: rand(...CFG.cutEvery),
        nextHunt: 0, visible: false, flicker: null,
      };
      scheduleHunt(e, true);
      Object.assign(e, placeInRoom(state, e));
      e.view = 'down';
      loadSprite(e.type);
      state.entity = e; // reemplaza cualquier entidad provisional de otro sistema
      lastPlayerFloor = state.floor;
    },
    onKey(ev, state) {
      if (ev.code === 'F3') {
        ev.preventDefault();
        if (!ev.repeat) debug = !debug;
        state.debug = debug;
        return true;
      }
      if (ev.code === 'KeyH' && debug && state.entity) {
        if (!ev.repeat && state.entity.mode === 'idle') beginWarn(state, state.entity);
        return true;
      }
      return false;
    },
    update(dt, state) {
      const e = state.entity;
      if (!e) return;
      // Si se abrió o cerró un armario, la ruta vieja puede atravesar sus puertas: recalcular.
      if (e.path && e.pathGrid && e.pathGrid !== gridFor(state, e.floor)) e.path = null;

      if (e.mode === 'warn') {
        // Las lámparas y la linterna parpadean antes de la cacería.
        updateFlicker(e, dt, 0.45, 0.35);
        if ((e.warnLeft -= dt) <= 0) beginHunt(state, e);
        return;
      }
      if (e.mode === 'hunt') {
        updateHunt(dt, state, e);
        updateFacing(e);
        return;
      }

      // ---- idle ----
      if (follow(e, CFG.speed, dt) && !e.path && (e.wait -= dt) <= 0) {
        if (planWalk(state, e)) e.wait = rand(...CFG.pause);
        else e.wait = 1;
      }

      // El tiempo afuera (campamento, porche) no cuenta: eventos, apagón y cacería esperan.
      if (playerOutdoors(state)) return;
      if (!e.entered) {
        // Primera vez dentro de la casa: primera pista garantizada en 15–25 s.
        e.entered = true;
        e.firstClue = true;
        e.nextEvent = rand(...CFG.firstEvent);
      }

      if ((e.nextEvent -= dt) <= 0) {
        subtleEvent(state, e, e.firstClue);
        e.firstClue = false;
        e.nextEvent = rand(...CFG.eventEvery);
      }

      // Apagón provocado por la entidad.
      if ((e.nextCut -= dt) <= 0) {
        e.nextCut = rand(...CFG.cutEvery);
        if (state.power && state.power.on && Umbra.power.anyLampOn(state)) {
          Umbra.emit('power:off');
          Umbra.emit('entity:event', { kind: 'power', text: 'Se cortó la luz.', floor: e.floor, room: e.room, x: e.x, y: e.y });
          Umbra.tell('Se cortó la luz.', 3);
        }
      }

      if ((e.nextHunt -= dt) <= 0) {
        if (huntRoll(state, e)) beginWarn(state, e);
        else e.nextHunt = rand(...CFG.huntRetry);
      }
    },
    // Silueta oscura (bajo la capa de luz: se ve donde hay luz).
    drawWorld(ctx, state) {
      const e = state.entity;
      if (!e || e.mode !== 'hunt' || !e.visible || e.floor !== state.floor) return;
      const img = spriteFor(e);
      if (img) ctx.drawImage(img, VIEWS[e.view || 'down'] * 12, 0, 12, 20, Math.round(e.x) - 6, Math.round(e.y) - 14, 12, 20);
      else drawSprite(ctx, e.x, e.y, '#0b0a0d', '#0b0a0d');
    },
    // Ojos pálidos sobre la oscuridad, solo si el jugador tiene línea directa.
    drawLight(ctx, state) {
      const e = state.entity;
      if (!e || e.mode !== 'hunt' || !e.visible || e.floor !== state.floor) return;
      const p = state.player;
      if (lineBlocked(p.x, p.y, e.x, e.y, state.model.walls)) return;
      const x0 = Math.round(e.x + state.view.ox) - 6;
      const y0 = Math.round(e.y + state.view.oy) - 14;
      const eyes = (spriteFor(e) && SPRITE_EYES[spriteKey(e.type)]) || GENERIC_EYES;
      ctx.fillStyle = '#e8e3d8';
      for (const [cx, cy] of eyes[VIEWS[e.view || 'down']]) ctx.fillRect(x0 + cx, y0 + cy, 1, 1);
    },
    drawUI(ctx, state) {
      const e = state.entity;
      if (!debug || !e) return;
      const { ox, oy } = state.view;
      ctx.save();
      ctx.font = '8px monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ff5a5a';
      const where = roomAt(state, e.floor, e.x, e.y);
      const timer = e.mode === 'idle' ? 'cacería en ' + Math.ceil(e.nextHunt) + ' s'
        : e.mode === 'warn' ? 'aviso ' + e.warnLeft.toFixed(1) + ' s'
          : 'cazando ' + Math.ceil(e.huntLeft) + ' s' + (e.sawPlayer ? ' · te ve' : '') + (playerHidden(state) ? ' · escondido' : '');
      ctx.fillText(
        'DEBUG · ' + e.type.name + ' · ' + e.mode + ' · ' + timer + ' · fav: ' + e.room[0] + ' (piso ' + e.homeFloor + ')' +
        ' · en: ' + (where ? where[0] : '—') + ' (piso ' + e.floor + ')',
        84, 10, state.view.w - 88);
      const t = Object.keys(traits(e)).filter((k) => traits(e)[k]).map((k) => k + (traits(e)[k] === true ? '' : '=' + traits(e)[k]));
      ctx.fillText('evidencias: ' + e.type.evidence.join(', ') + (t.length ? ' · traits: ' + t.join(', ') : '') + ' · H: forzar cacería', 84, 20, state.view.w - 88);
      if (e.floor === state.floor) {
        if (e.mode === 'idle') {
          const [, rx, ry, rw, rh] = e.room;
          ctx.strokeStyle = '#ff5a5a';
          ctx.lineWidth = 1;
          ctx.strokeRect(Math.round(rx + ox) + 0.5, Math.round(ry + oy) + 0.5, rw - 1, rh - 1);
        }
        if (e.path) {
          ctx.strokeStyle = '#e1b66e';
          ctx.beginPath();
          ctx.moveTo(e.x + ox, e.y + oy);
          for (let i = e.step; i < e.path.length; i++) ctx.lineTo(e.path[i].x + ox, e.path[i].y + oy);
          ctx.stroke();
        }
        if (e.mode === 'hunt' && e.lastSeen && e.lastSeen.floor === e.floor) {
          ctx.strokeStyle = '#9eb8cd';
          ctx.strokeRect(Math.round(e.lastSeen.x + ox) - 3.5, Math.round(e.lastSeen.y + oy) - 3.5, 7, 7);
        }
        ctx.fillStyle = '#ff5a5a';
        ctx.fillRect(Math.round(e.x + ox) - 4, Math.round(e.y + oy) - 4, 8, 8);
      }
      ctx.restore();
    },
    // Pantalla de derrota de respaldo (solo si nadie manejó player:caught).
    drawResult(ctx, state) {
      const r = state.investigation && state.investigation.result;
      if (!r || !r.fallback) return; // si ui.js manejó player:caught, su pantalla manda
      const { w, h } = state.view;
      const time = Math.floor(r.seconds / 60) + ':' + String(r.seconds % 60).padStart(2, '0');
      ctx.save();
      ctx.fillStyle = '#07090c';
      ctx.fillRect(0, 0, w, h);
      const e = state.entity;
      const img = e && spriteFor(e);
      if (img) ctx.drawImage(img, 0, 0, 12, 20, Math.round(w / 2) - 6, 64, 12, 20);
      else drawSprite(ctx, w / 2, 78, '#1b1a20', '#e8e3d8');
      ctx.textAlign = 'center';
      ctx.font = 'bold 24px monospace';
      ctx.fillStyle = '#b8473a';
      ctx.fillText('Te atrapó', w / 2, 125);
      ctx.font = '12px monospace';
      ctx.fillStyle = '#ded7c7';
      ctx.fillText('La entidad era: ' + r.entityName, w / 2, 155);
      ctx.fillText('Tiempo de partida: ' + time, w / 2, 173);
      ctx.fillStyle = '#9eb8cd';
      ctx.fillText('Enter para volver al menú', w / 2, 205);
      ctx.restore();
    },
  });
})();
