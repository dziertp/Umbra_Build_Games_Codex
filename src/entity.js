// Umbra — la entidad de la partida.
// Elige tipo y habitación favorita al empezar, deambula por esa habitación con A*
// (modo 'idle') y emite eventos sutiles cada 20–40 s. Invisible salvo en debug (F3).
// Contrato de state.entity: ver AGENTS.md.
(function () {
  'use strict';

  const CFG = {
    speed: 40,          // u/s en modo idle
    diameter: 16,       // para la cuadrícula A*
    roam: 40,           // margen alrededor de la habitación favorita
    pause: [1, 4],      // segundos de espera entre paseos
    eventEvery: [20, 40],
    excluded: ['Vestíbulo', 'Hall'],
  };

  // Si Umbra.data.entities aún no existe, se usa este tipo provisional.
  const FALLBACK = { id: 'provisional', name: 'Entidad', evidence: ['emf'], description: 'Entidad provisional.', traits: {} };

  const grids = [];  // cuadrícula A* por piso (se construye al necesitarla)
  let debug = false;

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  function gridFor(state, floor) {
    if (!grids[floor]) grids[floor] = state.G.grid(CFG.diameter, { floor, closetOpen: false });
    return grids[floor];
  }

  function roomAt(state, floor, x, y) {
    let best = null;
    for (const r of state.G.floors[floor].rooms) {
      if (x >= r[1] && x < r[1] + r[3] && y >= r[2] && y < r[2] + r[4] && (!best || r[3] * r[4] < best[3] * best[4])) best = r;
    }
    return best;
  }

  // "la cocina", "el baño", "la sala de estar"
  function withArticle(name) {
    const lower = name.toLowerCase();
    return (lower.split(' ')[0].endsWith('a') ? 'la ' : 'el ') + lower;
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

  function subtleEvent(state, e) {
    const here = roomAt(state, e.floor, e.x, e.y) || e.room;
    let kind, text;
    if (state.floor === e.floor) {
      const where = withArticle(here[0]);
      const ofWhere = where.replace(/^el /, 'l '); // de + el = del
      [kind, text] = pick([
        ['thud', 'Algo cayó en ' + where + '.'],
        ['creak', 'Un crujido viene de' + (ofWhere === where ? ' ' : '') + ofWhere + '.'],
        ['door', 'Una puerta se movió cerca de' + (ofWhere === where ? ' ' : '') + ofWhere + '.'],
        ['whisper', 'Un susurro, apenas audible.'],
      ]);
    } else {
      kind = 'steps';
      text = e.floor > state.floor ? 'Escuchas pasos arriba.' : 'Escuchas pasos abajo.';
    }
    Umbra.emit('entity:event', { kind, text, floor: e.floor, room: here, x: e.x, y: e.y });
    Umbra.tell(text, 3);
  }

  Umbra.register({
    order: 10, // antes que tools.js (20): así tools.js respeta esta entidad
    start(state) {
      grids.length = 0;
      const types = Umbra.data.entities && Umbra.data.entities.length ? Umbra.data.entities : [FALLBACK];
      const rooms = state.G.floors.flatMap((D, floor) =>
        D.rooms.filter((r) => !CFG.excluded.includes(r[0])).map((room) => ({ floor, room })));
      const { floor, room } = pick(rooms);
      const e = { type: pick(types), floor, room, x: 0, y: 0, mode: 'idle', path: null, step: 0, wait: rand(...CFG.pause), nextEvent: rand(...CFG.eventEvery) };
      Object.assign(e, placeInRoom(state, e));
      state.entity = e; // reemplaza cualquier entidad provisional de otro sistema
    },
    onKey(ev, state) {
      if (ev.code !== 'F3') return false;
      ev.preventDefault();
      if (!ev.repeat) debug = !debug;
      state.debug = debug;
      return true;
    },
    update(dt, state) {
      const e = state.entity;
      if (!e) return;

      if (e.mode === 'idle') {
        if (e.path) {
          let move = CFG.speed * dt;
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
            e.wait = rand(...CFG.pause);
          }
        } else if ((e.wait -= dt) <= 0 && !planWalk(state, e)) {
          e.wait = 1;
        }
      }

      if ((e.nextEvent -= dt) <= 0) {
        subtleEvent(state, e);
        e.nextEvent = rand(...CFG.eventEvery);
      }
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
      ctx.fillText(
        'DEBUG · ' + e.type.name + ' · fav: ' + e.room[0] + ' (piso ' + e.floor + ') · ' + e.mode +
        ' · en: ' + (where ? where[0] : '—') + ' · evento en ' + Math.ceil(e.nextEvent) + ' s',
        4, 10);
      ctx.fillText('evidencias: ' + e.type.evidence.join(', '), 4, 20);
      if (e.floor === state.floor) {
        const [, rx, ry, rw, rh] = e.room;
        ctx.strokeStyle = '#ff5a5a';
        ctx.lineWidth = 1;
        ctx.strokeRect(Math.round(rx + ox) + 0.5, Math.round(ry + oy) + 0.5, rw - 1, rh - 1);
        if (e.path) {
          ctx.strokeStyle = '#e1b66e';
          ctx.beginPath();
          ctx.moveTo(e.x + ox, e.y + oy);
          for (let i = e.step; i < e.path.length; i++) ctx.lineTo(e.path[i].x + ox, e.path[i].y + oy);
          ctx.stroke();
        }
        ctx.fillStyle = '#ff5a5a';
        ctx.fillRect(Math.round(e.x + ox) - 4, Math.round(e.y + oy) - 4, 8, 8);
      }
      ctx.restore();
    },
  });
})();
