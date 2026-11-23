// Umbra — oscuridad, visibilidad y linterna.
// Calcula un polígono de visibilidad desde el jugador lanzando rayos contra los
// muros (state.model.walls), y dibuja la oscuridad por niveles discretos:
//   fuera de la vista: negro total · dentro de la vista: penumbra casi negra
//   borde de linterna / halo y habitaciones con lámpara: luz tenue · centro de linterna / halo: luz plena
//   (la luna de las ventanas es penumbra teñida de azul; los muros a la vista se aclaran un poco)
// Tecla L: encender o apagar la linterna.
(function () {
  'use strict';

  const CFG = {
    range: 290,                 // alcance de la vista (cubre la pantalla de 480×270)
    cone: (60 * Math.PI) / 180, // apertura de la linterna
    coneInner: (44 * Math.PI) / 180,
    reach: 180,                 // alcance de la linterna
    reachInner: 118,
    halo: 34,                   // halo alrededor del jugador
    haloInner: 20,
    // Niveles de oscuridad (alfa sobre el color del vacío). Pocos, sin degradados.
    dark: '#07090c',
    black: 1,
    ambient: 0.93,
    dim: 0.55,
    lit: 0,
    warm: 'rgba(225,182,110,0.07)', // tinte cálido tenue dentro de la linterna
    lampWarm: 'rgba(225,182,110,0.05)', // tinte de las habitaciones encendidas
    // Luz de luna: penumbra teñida de azul (misma familia que 'ambient', no un nivel nuevo).
    moon: '#0a1624',
    moonAlpha: 0.9,
    moonDepth: 70,
    moonSpread: 10,
    wallBoost: 0.3, // los muros a la vista quitan un 30 % de la oscuridad que tengan
  };

  // Franjas de luna por piso: trapecio desde cada ventana hacia dentro, recortado a su habitación.
  const moonCache = [];
  function moonStrips(D, floor) {
    if (moonCache[floor]) return moonCache[floor];
    const inRoom = (x, y) => {
      let best = null;
      for (const r of D.rooms) {
        if (x >= r[1] && x < r[1] + r[3] && y >= r[2] && y < r[2] + r[4] && (!best || r[3] * r[4] < best[3] * best[4])) best = r;
      }
      return best;
    };
    const strips = [];
    for (const [x1, y1, x2, y2] of D.windows || []) {
      const len = Math.hypot(x2 - x1, y2 - y1) || 1;
      const tx = (x2 - x1) / len, ty = (y2 - y1) / len;
      let nx = -ty, ny = tx;
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      let room = inRoom(mx + nx * 6, my + ny * 6);
      if (!room) {
        nx = -nx; ny = -ny;
        room = inRoom(mx + nx * 6, my + ny * 6);
      }
      if (!room) continue;
      const dd = CFG.moonDepth, sp = CFG.moonSpread;
      strips.push({
        room,
        quad: [
          x1, y1,
          x2, y2,
          x2 + nx * dd + tx * sp, y2 + ny * dd + ty * sp,
          x1 + nx * dd - tx * sp, y1 + ny * dd - ty * sp,
        ],
      });
    }
    return (moonCache[floor] = strips);
  }

  // Área de una habitación sin las habitaciones contenidas en ella (despensa dentro de cocina).
  function roomPath(c, r, rooms, ox, oy) {
    c.beginPath();
    c.rect(r[1] + ox, r[2] + oy, r[3], r[4]);
    for (const o of rooms) {
      if (o !== r && o[1] >= r[1] && o[2] >= r[2] && o[1] + o[3] <= r[1] + r[3] && o[2] + o[4] <= r[2] + r[4]) {
        c.rect(o[1] + ox, o[2] + oy, o[3], o[4]);
      }
    }
  }

  const light = { on: true, poly: [] };

  let dark = null; // capa de oscuridad
  let mask = null; // máscara auxiliar por nivel
  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  // ---------- Polígono de visibilidad ----------
  // Intersección del rayo (ox,oy)+t·(dx,dy) con el segmento s; devuelve t o Infinity.
  function rayHit(ox, oy, dx, dy, s) {
    const sx = s[2] - s[0];
    const sy = s[3] - s[1];
    const den = dx * sy - dy * sx;
    if (Math.abs(den) < 1e-9) return Infinity;
    const ax = s[0] - ox;
    const ay = s[1] - oy;
    const t = (ax * sy - ay * sx) / den;
    const u = (ax * dy - ay * dx) / den;
    if (t < 0 || u < -1e-6 || u > 1 + 1e-6) return Infinity;
    return t;
  }

  function visibility(px, py, walls, R) {
    const x0 = px - R, y0 = py - R, x1 = px + R, y1 = py + R;
    const segs = [
      [x0, y0, x1, y0], [x1, y0, x1, y1], [x1, y1, x0, y1], [x0, y1, x0, y0],
    ];
    // Recorta cada muro al cuadro (Liang–Barsky): así sus extremos son vértices
    // válidos del polígono y no se pierden esquinas donde un muro cruza el borde.
    for (const w of walls) {
      const dx = w[2] - w[0];
      const dy = w[3] - w[1];
      let t0 = 0, t1 = 1, ok = true;
      for (const [p, q] of [[-dx, w[0] - x0], [dx, x1 - w[0]], [-dy, w[1] - y0], [dy, y1 - w[1]]]) {
        if (p === 0) { if (q < 0) { ok = false; break; } continue; }
        const r = q / p;
        if (p < 0) { if (r > t1) { ok = false; break; } if (r > t0) t0 = r; }
        else { if (r < t0) { ok = false; break; } if (r < t1) t1 = r; }
      }
      if (ok) segs.push([w[0] + dx * t0, w[1] + dy * t0, w[0] + dx * t1, w[1] + dy * t1]);
    }
    const angles = [];
    for (const s of segs) {
      for (const [ex, ey] of [[s[0], s[1]], [s[2], s[3]]]) {
        const a = Math.atan2(ey - py, ex - px);
        angles.push(a - 1e-4, a, a + 1e-4);
      }
    }
    angles.sort((a, b) => a - b);
    const poly = [];
    let prev = NaN;
    for (const a of angles) {
      if (a - prev < 1e-6) continue;
      prev = a;
      const dx = Math.cos(a);
      const dy = Math.sin(a);
      let best = Infinity;
      for (const s of segs) {
        const t = rayHit(px, py, dx, dy, s);
        if (t < best) best = t;
      }
      if (best === Infinity) continue;
      poly.push(px + dx * best, py + dy * best);
    }
    return poly;
  }

  // ---------- Dibujo ----------
  function polyPath(c, poly, ox, oy) {
    c.beginPath();
    c.moveTo(poly[0] + ox, poly[1] + oy);
    for (let i = 2; i < poly.length; i += 2) c.lineTo(poly[i] + ox, poly[i + 1] + oy);
    c.closePath();
  }

  // Formas de un nivel de luz (halo + cono), en coordenadas de pantalla.
  function shapes(c, x, y, facing, halo, cone, reach) {
    c.beginPath();
    c.arc(x, y, halo, 0, Math.PI * 2);
    c.fill();
    if (!light.on) return;
    c.beginPath();
    c.moveTo(x, y);
    c.arc(x, y, reach, facing - cone / 2, facing + cone / 2);
    c.closePath();
    c.fill();
  }

  // Aplica un nivel: donde la máscara está pintada, la oscuridad pasa a `alpha`.
  function applyLevel(drawShapes, alpha, color = CFG.dark) {
    const m = mask.getContext('2d');
    m.globalCompositeOperation = 'source-over';
    m.clearRect(0, 0, mask.width, mask.height);
    m.save();
    m.fillStyle = '#fff';
    drawShapes(m);
    m.restore();
    const d = dark.getContext('2d');
    d.globalCompositeOperation = 'destination-out';
    d.globalAlpha = 1;
    d.drawImage(mask, 0, 0);
    if (alpha > 0) {
      m.globalCompositeOperation = 'source-in';
      m.globalAlpha = alpha;
      m.fillStyle = color;
      m.fillRect(0, 0, mask.width, mask.height);
      m.globalAlpha = 1;
      d.globalCompositeOperation = 'source-over';
      d.drawImage(mask, 0, 0);
    }
    d.globalCompositeOperation = 'source-over';
  }

  light.visibility = visibility; // expuesto para pruebas y para otros sistemas (p. ej. la entidad)
  Umbra.lighting = light;

  Umbra.register({
    order: 5,
    start() {
      light.on = true;
    },
    onKey(e) {
      if (e.code !== 'KeyL') return false;
      if (!e.repeat) light.on = !light.on;
      return true;
    },
    update(dt, state) {
      const p = state.player;
      light.poly = state.model ? visibility(p.x, p.y, state.model.walls, CFG.range) : [];
    },
    drawLight(ctx, state) {
      const { w, h, ox, oy } = state.view;
      if (!dark || dark.width !== w || dark.height !== h) {
        dark = canvas(w, h);
        mask = canvas(w, h);
      }
      const d = dark.getContext('2d');
      d.globalCompositeOperation = 'source-over';
      d.globalAlpha = CFG.black;
      d.fillStyle = CFG.dark;
      d.fillRect(0, 0, w, h);
      d.globalAlpha = 1;

      const poly = light.poly;
      const p = state.player;
      const x = p.x + ox;
      const y = p.y + oy;
      if (poly.length >= 6) {
        const clipped = (draw) => (c) => {
          polyPath(c, poly, ox, oy);
          c.clip();
          draw(c);
        };
        const D = state.G.floors[state.floor];
        const lamps = Umbra.power ? Umbra.power.litRooms(state, state.floor) : [];
        const drawLamps = (c) => {
          for (const r of lamps) {
            roomPath(c, r, D.rooms, ox, oy);
            c.fill('evenodd');
          }
        };
        // 1) penumbra en todo lo visible
        applyLevel(clipped((c) => c.fill()), CFG.ambient);
        // 2) luna: penumbra azul junto a las ventanas
        applyLevel(clipped((c) => {
          for (const s of moonStrips(D, state.floor)) {
            c.save();
            c.beginPath();
            c.rect(s.room[1] + ox, s.room[2] + oy, s.room[3], s.room[4]);
            c.clip();
            c.beginPath();
            c.moveTo(s.quad[0] + ox, s.quad[1] + oy);
            for (let i = 2; i < 8; i += 2) c.lineTo(s.quad[i] + ox, s.quad[i + 1] + oy);
            c.closePath();
            c.fill();
            c.restore();
          }
        }), CFG.moonAlpha, CFG.moon);
        // 3) habitaciones con la lámpara encendida: nivel tenue
        if (lamps.length) applyLevel(clipped(drawLamps), CFG.dim);
        // 4) linterna y halo
        applyLevel(clipped((c) => shapes(c, x, y, p.facing, CFG.halo, CFG.cone, CFG.reach)), CFG.dim);
        applyLevel(clipped((c) => shapes(c, x, y, p.facing, CFG.haloInner, CFG.coneInner, CFG.reachInner)), CFG.lit);
        // 5) muros e interruptores a la vista: algo más claros para orientarse sin linterna
        const m = mask.getContext('2d');
        m.globalCompositeOperation = 'source-over';
        m.clearRect(0, 0, w, h);
        m.save();
        polyPath(m, poly, ox, oy);
        m.clip();
        m.strokeStyle = '#fff';
        m.fillStyle = '#fff';
        for (const s of state.model.walls) {
          m.lineWidth = s[4];
          m.beginPath();
          m.moveTo(s[0] + ox, s[1] + oy);
          m.lineTo(s[2] + ox, s[3] + oy);
          m.stroke();
        }
        if (state.power) {
          for (const sw of state.power.switches[state.floor]) m.fillRect(Math.round(sw.x + ox) - 1, Math.round(sw.y + oy) - 1, 3, 3);
        }
        m.restore();
        d.globalCompositeOperation = 'destination-out';
        d.globalAlpha = CFG.wallBoost;
        d.drawImage(mask, 0, 0);
        d.globalAlpha = 1;
        d.globalCompositeOperation = 'source-over';

        ctx.save();
        polyPath(ctx, poly, ox, oy);
        ctx.clip();
        if (lamps.length) {
          ctx.fillStyle = CFG.lampWarm;
          drawLamps(ctx);
        }
        if (light.on) {
          ctx.fillStyle = CFG.warm;
          shapes(ctx, x, y, p.facing, 0, CFG.cone, CFG.reach);
        }
        ctx.restore();
      }
      ctx.drawImage(dark, 0, 0);
    },
  });
})();
