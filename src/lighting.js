// Umbra — oscuridad, visibilidad y linterna.
// Calcula un polígono de visibilidad desde el jugador lanzando rayos contra los
// muros (state.model.walls), y dibuja la oscuridad por niveles discretos:
//   fuera de la vista: negro total · dentro de la vista: penumbra casi negra
//   borde de linterna / halo: luz tenue · centro de linterna / halo: luz plena
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
  };

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
  function applyLevel(drawShapes, alpha) {
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
      m.fillStyle = CFG.dark;
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
        applyLevel(clipped((c) => c.fill()), CFG.ambient);
        applyLevel(clipped((c) => shapes(c, x, y, p.facing, CFG.halo, CFG.cone, CFG.reach)), CFG.dim);
        applyLevel(clipped((c) => shapes(c, x, y, p.facing, CFG.haloInner, CFG.coneInner, CFG.reachInner)), CFG.lit);
        if (light.on) {
          ctx.save();
          polyPath(ctx, poly, ox, oy);
          ctx.clip();
          ctx.fillStyle = CFG.warm;
          shapes(ctx, x, y, p.facing, 0, CFG.cone, CFG.reach);
          ctx.restore();
        }
      }
      ctx.drawImage(dark, 0, 0);
    },
  });
})();
