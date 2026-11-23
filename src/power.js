// Umbra — electricidad: lámparas por habitación, interruptores y apagón.
// state.power = { on, lamps: [[bool por habitación del piso 0], [... piso 1]], switches }
// Eventos: 'power:off' (apagón: nada enciende), 'power:on' (fusibles: vuelve el estado previo).
// lighting.js lee state.power para dibujar las habitaciones encendidas.
(function () {
  'use strict';

  const SWITCH_REACH = 26; // distancia para usar un interruptor desde el umbral

  // Habitación más pequeña que contiene el punto (la despensa está dentro de la cocina).
  function roomIndexAt(rooms, x, y) {
    let best = -1;
    for (let i = 0; i < rooms.length; i++) {
      const [, rx, ry, rw, rh] = rooms[i];
      if (x >= rx && x < rx + rw && y >= ry && y < ry + rh && (best < 0 || rw * rh < rooms[best][3] * rooms[best][4])) best = i;
    }
    return best;
  }

  // Interruptor de cada habitación: en la pared, junto a una puerta, por dentro.
  function switchesFor(D) {
    return D.rooms.map((r, i) => {
      const [, rx, ry, rw, rh] = r;
      for (const d of D.doors || []) {
        if (d[0] === 'v') {
          const [, x, y1, y2] = d;
          const side = x === rx ? 1 : x === rx + rw ? -1 : 0;
          if (!side || y1 < ry || y2 > ry + rh) continue;
          const y = y2 + 9 <= ry + rh - 8 ? y2 + 9 : y1 - 9 >= ry + 8 ? y1 - 9 : null;
          if (y !== null) return { room: i, x: x + side * 5, y };
        } else {
          const [, y, x1, x2] = d;
          const side = y === ry ? 1 : y === ry + rh ? -1 : 0;
          if (!side || x1 < rx || x2 > rx + rw) continue;
          const x = x2 + 9 <= rx + rw - 8 ? x2 + 9 : x1 - 9 >= rx + 8 ? x1 - 9 : null;
          if (x !== null) return { room: i, x, y: y + side * 5 };
        }
      }
      return { room: i, x: rx + rw / 2, y: ry + 5 }; // sin puerta propia: pared superior
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
        switches: state.G.floors.map(switchesFor),
      };
    },
    onKey(e, state) {
      if (e.code !== 'KeyE' || !state.power) return false;
      const D = state.G.floors[state.floor];
      const p = state.player;
      // El armario y la caja de fusibles los atiende main.js.
      if (near(p, D.closet, 40) || near(p, D.fuse, 30)) return false;
      let target = -1;
      let best = SWITCH_REACH;
      for (const s of state.power.switches[state.floor]) {
        const d = Math.hypot(s.x - p.x, s.y - p.y);
        if (d < best) { best = d; target = s.room; }
      }
      if (target < 0) target = roomIndexAt(D.rooms, p.x, p.y);
      if (target < 0) return false;
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
