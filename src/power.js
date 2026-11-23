// Umbra — electricidad: lámparas por habitación, interruptores y apagón.
// state.power = { on, lamps: [[bool por habitación del piso 0], [... piso 1]], switches }
// Eventos: 'power:off' (apagón: nada enciende), 'power:on' (fusibles: vuelve el estado previo).
// lighting.js lee state.power para dibujar las habitaciones encendidas.
(function () {
  'use strict';

  const SWITCH_REACH = 26; // distancia para usar un interruptor desde el umbral

  const PLAYER_R = 8;

  // ¿El segmento a→b cruza algún muro (incluye hojas de puerta y armario)?
  function blockedLine(ax, ay, bx, by, walls) {
    for (const w of walls) {
      const d = (bx - ax) * (w[3] - w[1]) - (by - ay) * (w[2] - w[0]);
      if (Math.abs(d) < 1e-9) continue;
      const t = ((w[0] - ax) * (w[3] - w[1]) - (w[1] - ay) * (w[2] - w[0])) / d;
      const u = ((w[0] - ax) * (by - ay) - (w[1] - ay) * (bx - ax)) / d;
      if (t > 0 && t < 1 && u >= 0 && u <= 1) return true;
    }
    return false;
  }

  // Celdas a las que el jugador puede llegar caminando desde el inicio de cada piso (BFS en la
  // cuadrícula A*). Se calcula una vez: el mapa no cambia durante la partida.
  const walkable = [];
  function walkableGrid(G, floor) {
    if (walkable[floor]) return walkable[floor];
    const g = G.grid(PLAYER_R * 2, { floor, closetOpen: false });
    const D = G.floors[floor];
    const start = D.spawn || G.floors[0].spawn;
    const seen = new Uint8Array(g.free.length);
    const si = Math.round((start.x - g.x) / g.step) + Math.round((start.y - g.y) / g.step) * g.cols;
    const queue = [si];
    if (g.free[si]) seen[si] = 1;
    while (queue.length) {
      const k = queue.pop();
      const i = k % g.cols;
      for (const n of [k - 1, k + 1, k - g.cols, k + g.cols]) {
        if (n < 0 || n >= g.free.length || seen[n] || !g.free[n]) continue;
        if ((n === k - 1 && i === 0) || (n === k + 1 && i === g.cols - 1)) continue;
        seen[n] = 1;
        queue.push(n);
      }
    }
    return (walkable[floor] = { g, seen });
  }

  // ¿Puede el jugador pararse en algún lugar conectado, a su alcance y con línea directa?
  function reachableFrom(G, m, floor, sx, sy) {
    const { g, seen } = walkableGrid(G, floor);
    const R = SWITCH_REACH - 2;
    for (let j = Math.floor((sy - R - g.y) / g.step); j <= Math.ceil((sy + R - g.y) / g.step); j++) {
      for (let i = Math.floor((sx - R - g.x) / g.step); i <= Math.ceil((sx + R - g.x) / g.step); i++) {
        if (i < 0 || j < 0 || i >= g.cols || j >= g.rows || !seen[j * g.cols + i]) continue;
        const px = g.x + i * g.step;
        const py = g.y + j * g.step;
        // Junto al armario o los fusibles, E es de ellos: esos lugares no cuentan.
        const D = G.floors[floor];
        if (near({ x: px, y: py }, D.closet, 40) || near({ x: px, y: py }, D.fuse, 30)) continue;
        if (Math.hypot(px - sx, py - sy) <= R && !blockedLine(px, py, sx, sy, m.walls)) return true;
      }
    }
    return false;
  }

  // Interruptor de cada habitación: siempre sobre un tramo real de muro (nunca en un vano), a
  // 9 u del extremo del tramo que da a una abertura (puerta o paso), por dentro. Si no sirve,
  // otros puntos del muro, y por último por fuera. Se queda con el primero alcanzable.
  function switchesFor(G, D, floor) {
    const m = G.model({ floor, closetOpen: false });
    const walls = D.walls.map((w) => (w[1] === w[3]
      ? { h: true, c: w[1], a: Math.min(w[0], w[2]), b: Math.max(w[0], w[2]) }
      : { h: false, c: w[0], a: Math.min(w[1], w[3]), b: Math.max(w[1], w[3]) }));
    const covered = (h, c, t) => walls.some((w) => w.h === h && w.c === c && t > w.a + 0.5 && t < w.b - 0.5);
    const inFurniture = (x, y) => D.furniture.some((f) => x > f[1] - 3 && x < f[1] + f[3] + 3 && y > f[2] - 3 && y < f[2] + f[4] + 3);
    return D.rooms.map((r, i) => {
      const [, rx, ry, rw, rh] = r;
      const edges = [
        { h: true, c: ry, lo: rx, hi: rx + rw, inward: 1 },
        { h: true, c: ry + rh, lo: rx, hi: rx + rw, inward: -1 },
        { h: false, c: rx, lo: ry, hi: ry + rh, inward: 1 },
        { h: false, c: rx + rw, lo: ry, hi: ry + rh, inward: -1 },
      ];
      const candidates = [];
      for (const e of edges) {
        for (const w of walls) {
          if (w.h !== e.h || w.c !== e.c) continue;
          const lo = Math.max(w.a, e.lo);
          const hi = Math.min(w.b, e.hi);
          if (hi - lo < 20) continue;
          // Un extremo da a una abertura si no está en la esquina y el muro no sigue.
          const openLo = lo > e.lo + 1 && !covered(e.h, e.c, lo - 2);
          const openHi = hi < e.hi - 1 && !covered(e.h, e.c, hi + 2);
          const along = [];
          if (openLo) along.push([lo + 9, 0]);
          if (openHi) along.push([hi - 9, 0]);
          along.push([lo + 12, 1], [hi - 12, 1], [(lo + hi) / 2, 2]);
          for (const [t, prio] of along) {
            for (const [side, extra] of [[e.inward, 0], [-e.inward, 3]]) {
              const off = e.c + side * 5;
              candidates.push({ x: e.h ? t : off, y: e.h ? off : t, prio: prio + extra, inside: side === e.inward });
            }
          }
        }
      }
      candidates.sort((a, b) => a.prio - b.prio);
      const ok = candidates.find((c) => !inFurniture(c.x, c.y) && reachableFrom(G, m, floor, c.x, c.y)) || candidates[0];
      return ok ? { room: i, x: ok.x, y: ok.y } : { room: i, x: rx + rw / 2, y: ry + 5 };
    });
  }

  function near(p, r, m) {
    return r && p.x > r[0] - m && p.x < r[0] + r[2] + m && p.y > r[1] - m && p.y < r[1] + r[3] + m;
  }

  // "de la cocina", "del comedor"
  function ofRoom(name) {
    const lower = name.toLowerCase();
    return (lower.split(' ')[0].endsWith('a') ? 'de la ' : 'del ') + lower;
  }

  // Interruptor que E accionaría ahora: el más cercano a menos de SWITCH_REACH, con línea
  // directa (sin muros ni hojas de puerta en medio). Cerca del armario o de los fusibles, E es de ellos.
  function switchInReach(state) {
    if (!state.power || !state.model) return null;
    const D = state.G.floors[state.floor];
    const p = state.player;
    if (near(p, D.closet, 40) || near(p, D.fuse, 30)) return null;
    let found = null;
    let best = SWITCH_REACH;
    for (const s of state.power.switches[state.floor]) {
      const d = Math.hypot(s.x - p.x, s.y - p.y);
      if (d < best && !blockedLine(p.x, p.y, s.x, s.y, state.model.walls)) { best = d; found = s; }
    }
    return found;
  }

  Umbra.on('power:off', (_, state) => {
    if (!state.power || !state.power.on) return;
    state.power.on = false;
  });

  Umbra.on('power:on', (_, state) => {
    if (!state.power) return;
    if (state.power.on) {
      Umbra.tell('Los fusibles están bien.');
      return;
    }
    state.power.on = true;
    Umbra.tell('Restableces la luz.');
  });

  Umbra.register({
    order: 8,
    start(state) {
      state.power = {
        on: true,
        lamps: state.G.floors.map((D) => D.rooms.map(() => false)),
        switches: state.G.floors.map((D, floor) => switchesFor(state.G, D, floor)),
      };
    },
    onKey(e, state) {
      if (e.code !== 'KeyE' || !state.power) return false;
      const D = state.G.floors[state.floor];
      const sw = switchInReach(state);
      if (!sw) return false;
      const target = sw.room;
      if (e.repeat) return true;
      if (!state.power.on) {
        Umbra.tell('El interruptor no responde. Revisa los fusibles del garaje.');
        return true;
      }
      const lamps = state.power.lamps[state.floor];
      lamps[target] = !lamps[target];
      Umbra.tell((lamps[target] ? 'Enciendes la luz ' : 'Apagas la luz ') + ofRoom(D.rooms[target][0]) + '.', 2);
      return true;
    },
    // Interruptores: punto pequeño en la pared (cálido si la lámpara está encendida).
    drawWorld(ctx, state) {
      if (!state.power) return;
      const lamps = state.power.lamps[state.floor];
      for (const s of state.power.switches[state.floor]) {
        const lit = state.power.on && lamps[s.room];
        ctx.fillStyle = lit ? '#e1b66e' : '#6b6358';
        ctx.fillRect(Math.round(s.x) - 1, Math.round(s.y) - 1, 3, 3);
      }
    },
    // Indicación "E · Luz" y resalte del interruptor al alcance (sobre la capa de oscuridad).
    drawUI(ctx, state) {
      if (state.scene !== 'play' || (state.journal && state.journal.open)) return;
      const sw = switchInReach(state);
      if (!sw) return;
      const { ox, oy } = state.view;
      const sx = Math.round(sw.x + ox);
      const sy = Math.round(sw.y + oy);
      const lit = state.power.on && state.power.lamps[state.floor][sw.room];
      ctx.save();
      ctx.fillStyle = '#07090c';
      ctx.fillRect(sx - 3, sy - 3, 7, 7);
      ctx.fillStyle = '#e1b66e';
      ctx.fillRect(sx - 2, sy - 2, 5, 5);
      ctx.fillStyle = lit ? '#fff2c8' : '#6b6358';
      ctx.fillRect(sx - 1, sy - 1, 3, 3);
      const label = 'E · Luz';
      ctx.font = '8px monospace';
      const tw = Math.ceil(ctx.measureText(label).width) + 6;
      const px = Math.round(state.player.x + ox - tw / 2);
      // Del lado opuesto al interruptor, para no taparlo.
      const py = Math.round(state.player.y + oy) + (sw.y < state.player.y ? 15 : -26);
      ctx.fillStyle = 'rgba(7,9,12,0.8)';
      ctx.fillRect(px, py, tw, 11);
      ctx.fillStyle = '#e1b66e';
      ctx.textAlign = 'left';
      ctx.fillText(label, px + 3, py + 8);
      ctx.restore();
    },
  });

  // Utilidad para otros sistemas (entity.js, lighting.js).
  Umbra.power = {
    anyLampOn(state) {
      return !!state.power && state.power.lamps.some((f) => f.some(Boolean));
    },
    litRooms(state, floor) {
      if (!state.power || !state.power.on) return [];
      const rooms = state.G.floors[floor].rooms;
      return state.power.lamps[floor].map((on, i) => (on ? rooms[i] : null)).filter(Boolean);
    },
  };
})();
