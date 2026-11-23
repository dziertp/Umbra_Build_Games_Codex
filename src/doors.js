// Umbra — puertas que se abren y se cierran.
// state.doorsClosed[piso][i] (true = cerrada) para cada D.doors[i]; todas empiezan abiertas.
// G.model recibe ese estado (main.js → rebuild): una puerta cerrada bloquea el paso, la vista y la luz.
// E: abre/cierra. Prioridad: armario y fusibles (main.js) > puerta si estás en el vano o a < 14 u
// de su centro > interruptor al alcance (power.js) > puerta a < 26 u.
// La entidad planea rutas con las puertas abiertas; al topar con una cerrada se detiene 0,6 s y la abre.
// Eventos: 'door:open' / 'door:close' { floor, index, by: 'player' | 'entity' }.
(function () {
  'use strict';

  const NEAR = 14;
  const REACH = 26;
  const BODY = 8; // radio del jugador y de la entidad
  const ENTITY_WAIT = 0.6;

  function doorsOf(state, floor) {
    return state.G.floors[floor].doors || [];
  }
  function center(d) {
    return d[0] === 'v' ? { x: d[1], y: (d[2] + d[3]) / 2 } : { x: (d[2] + d[3]) / 2, y: d[1] };
  }
  function segment(d) {
    return d[0] === 'v' ? [d[1], d[2], d[1], d[3]] : [d[2], d[1], d[3], d[1]];
  }
  function distToSeg(px, py, s) {
    const dx = s[2] - s[0], dy = s[3] - s[1];
    const L = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((px - s[0]) * dx + (py - s[1]) * dy) / L));
    return Math.hypot(px - s[0] - t * dx, py - s[1] - t * dy);
  }
  // ¿El punto está dentro del vano (entre los marcos, a ambos lados de la línea)?
  function inGap(d, x, y) {
    if (d[0] === 'v') return Math.abs(x - d[1]) < BODY + 2 && y > d[2] && y < d[3];
    return Math.abs(y - d[1]) < BODY + 2 && x > d[2] && x < d[3];
  }
  function near(p, r, m) {
    return r && p.x > r[0] - m && p.x < r[0] + r[2] + m && p.y > r[1] - m && p.y < r[1] + r[3] + m;
  }

  function isClosed(state, floor, i) {
    return !!(state.doorsClosed && state.doorsClosed[floor] && state.doorsClosed[floor][i]);
  }

  function setDoor(state, floor, i, closed, by) {
    state.doorsClosed[floor][i] = closed;
    if (floor === state.floor && Umbra.rebuild) Umbra.rebuild();
    Umbra.emit(closed ? 'door:close' : 'door:open', { floor, index: i, by });
  }

  // Puerta que E accionaría ahora (o null), con la prioridad descrita arriba.
  function target(state) {
    if (!state.doorsClosed || state.scene !== 'play') return null;
    const D = state.G.floors[state.floor];
    const p = state.player;
    if (near(p, D.closet, 40) || near(p, D.fuse, 30)) return null;
    let best = null;
    let bd = Infinity;
    doorsOf(state, state.floor).forEach((d, i) => {
      const c = center(d);
      const dist = inGap(d, p.x, p.y) ? 0 : Math.hypot(c.x - p.x, c.y - p.y);
      if (dist < bd) {
        bd = dist;
        best = i;
      }
    });
    if (best === null) return null;
    if (bd <= NEAR) return best;
    if (Umbra.power && Umbra.power.switchInReach && Umbra.power.switchInReach(state)) return null;
    return bd <= REACH ? best : null;
  }

  // ¿Alguien ocupa el vano? (no se puede cerrar)
  function blocked(state, floor, d) {
    const s = segment(d);
    const p = state.player;
    if (state.floor === floor && distToSeg(p.x, p.y, s) < BODY + 1.5) return true;
    const e = state.entity;
    return !!e && e.floor === floor && distToSeg(e.x, e.y, s) < BODY + 1.5;
  }

  // La entidad: si su ruta cruza una puerta cerrada justo delante, espera y la abre.
  function entityDoors(dt, state) {
    const e = state.entity;
    if (!e || !state.doorsClosed) return;
    if (e.doorWait > 0) {
      e.doorWait -= dt;
      if (e.doorWait <= 0 && e.doorIndex != null) {
        if (isClosed(state, e.floor, e.doorIndex)) setDoor(state, e.floor, e.doorIndex, false, 'entity');
        e.doorIndex = null;
      }
      return;
    }
    if (!e.path) return;
    const list = doorsOf(state, e.floor);
    let ax = e.x, ay = e.y;
    for (let k = e.step; k < Math.min(e.path.length, e.step + 5); k++) {
      const b = e.path[k];
      for (let i = 0; i < list.length; i++) {
        if (!isClosed(state, e.floor, i)) continue;
        const s = segment(list[i]);
        if (segCross(ax, ay, b.x, b.y, s) && distToSeg(e.x, e.y, s) < 12) {
          e.doorWait = ENTITY_WAIT;
          e.doorIndex = i;
          return;
        }
      }
      ax = b.x;
      ay = b.y;
    }
  }
  function segCross(ax, ay, bx, by, s) {
    const d = (bx - ax) * (s[3] - s[1]) - (by - ay) * (s[2] - s[0]);
    if (Math.abs(d) < 1e-9) return false;
    const t = ((s[0] - ax) * (s[3] - s[1]) - (s[1] - ay) * (s[2] - s[0])) / d;
    const u = ((s[0] - ax) * (by - ay) - (s[1] - ay) * (bx - ax)) / d;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  }

  // Evento ocasional fuera de cacería: la entidad mueve una puerta de su habitación.
  let pendingMsg = null;
  Umbra.on('entity:event', (ev, state) => {
    if (!ev || ev.kind !== 'door' || !state || !state.doorsClosed || !state.entity) return;
    const e = state.entity;
    const r = e.room;
    const list = doorsOf(state, e.floor);
    const candidates = [];
    list.forEach((d, i) => {
      const c = center(d);
      const onEdge = (c.x >= r[1] - 1 && c.x <= r[1] + r[3] + 1 && c.y >= r[2] - 1 && c.y <= r[2] + r[4] + 1);
      if (onEdge && !blocked(state, e.floor, d)) candidates.push(i);
    });
    if (!candidates.length) return;
    const i = candidates[Math.floor(Math.random() * candidates.length)];
    const close = !isClosed(state, e.floor, i);
    setDoor(state, e.floor, i, close, 'entity');
    pendingMsg = close ? 'Una puerta se cerró sola…' : 'Una puerta se abrió sola…';
  });

  Umbra.doors = { target, isClosed };

  Umbra.register({
    order: 7, // antes que power.js (8): la puerta puede ganarle al interruptor
    start(state) {
      state.doorsClosed = state.G.floors.map((D) => (D.doors || []).map(() => false));
      pendingMsg = null;
    },
    onKey(e, state) {
      if (e.code !== 'KeyE' || state.paused) return false;
      const i = target(state);
      if (i === null) return false;
      if (e.repeat) return true;
      const d = doorsOf(state, state.floor)[i];
      const closing = !isClosed(state, state.floor, i);
      if (closing && blocked(state, state.floor, d)) {
        Umbra.tell('Algo bloquea la puerta.', 1.5);
        return true;
      }
      setDoor(state, state.floor, i, closing, 'player');
      return true;
    },
    update(dt, state) {
      entityDoors(dt, state);
      if (pendingMsg) {
        Umbra.tell(pendingMsg, 3);
        pendingMsg = null;
      }
    },
    drawUI(ctx, state) {
      if (state.paused || (state.journal && state.journal.open)) return;
      const i = target(state);
      if (i === null) return;
      const label = isClosed(state, state.floor, i) ? 'E · Abrir puerta' : 'E · Cerrar puerta';
      const { ox, oy } = state.view;
      ctx.save();
      ctx.font = '8px monospace';
      const tw = Math.ceil(ctx.measureText(label).width) + 6;
      const px = Math.round(state.player.x + ox - tw / 2);
      const py = Math.round(state.player.y + oy) - 26;
      ctx.fillStyle = 'rgba(7,9,12,0.8)';
      ctx.fillRect(px, py, tw, 11);
      ctx.fillStyle = '#e1b66e';
      ctx.textAlign = 'left';
      ctx.fillText(label, px + 3, py + 8);
      ctx.restore();
    },
  });
})();
