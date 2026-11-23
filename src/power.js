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

  // ¿Hay algún lugar donde el jugador quepa, a su alcance y con línea directa al interruptor?
  function reachable(G, m, sx, sy) {
    for (let r = 10; r < SWITCH_REACH - 2; r += 4) {
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        const px = sx + Math.cos(a) * r;
        const py = sy + Math.sin(a) * r;
        if (!G.blocked(px, py, PLAYER_R, m) && !blockedLine(px, py, sx, sy, m.walls)) return true;
      }
    }
    return false;
  }

  // Interruptor de cada habitación: en la pared junto a una puerta. Prueba ambos extremos
  // de cada puerta, primero por dentro y luego por fuera, y se queda con el primero alcanzable
  // (así no queda detrás de la hoja abierta de la puerta).
  function switchesFor(G, D, floor) {
    const m = G.model({ floor, closetOpen: false });
    return D.rooms.map((r, i) => {
      const [, rx, ry, rw, rh] = r;
      const candidates = [];
      for (const d of D.doors || []) {
        if (d[0] === 'v') {
          const [, x, y1, y2] = d;
          const side = x === rx ? 1 : x === rx + rw ? -1 : 0;
          if (!side || y1 < ry || y2 > ry + rh) continue;
          const ys = [y2 + 9, y1 - 9].filter((y) => y >= ry + 8 && y <= ry + rh - 8);
          for (const s of [side, -side]) for (const y of ys) candidates.push({ x: x + s * 5, y });
        } else {
          const [, y, x1, x2] = d;
          const side = y === ry ? 1 : y === ry + rh ? -1 : 0;
          if (!side || x1 < rx || x2 > rx + rw) continue;
          const xs = [x2 + 9, x1 - 9].filter((x) => x >= rx + 8 && x <= rx + rw - 8);
          for (const s of [side, -side]) for (const x of xs) candidates.push({ x, y: y + s * 5 });
        }
      }
      const ok = candidates.find((c) => reachable(G, m, c.x, c.y)) || candidates[0];
      return ok ? { room: i, x: ok.x, y: ok.y } : { room: i, x: rx + rw / 2, y: ry + 5 }; // sin puerta: pared superior
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
