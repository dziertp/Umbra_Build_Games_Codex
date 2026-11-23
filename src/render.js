// Umbra — dibujo del escenario y del jugador (pixel art hecho en código).
//   Umbra.render.map(ctx, state)     suelos, muebles, escalera, armario, ventanas y muros
//   Umbra.render.player(ctx, state)  sprite del investigador (4 direcciones, 2 cuadros al caminar)
// Firma: en oscuridad total (sin linterna, lámpara ni luna) solo se ven sus ojos.
// Suelos y muebles estáticos se dibujan una vez por piso en un lienzo aparte.
(function () {
  'use strict';

  const C = {
    void: '#07090c',
    wall: '#9aa3ad',
    window: '#81aac8',
    stairs: '#4a4038',
    stairStep: '#5e5247',
    fuse: '#e1b66e',
    fuseEdge: '#5a4a2e',
    door: '#cfac73',
    // Suelos
    wood: '#2b241f', woodLine: '#221c18', woodJoint: '#1c1713', woodGrain: '#302822',
    tile: '#2e3335', tileAlt: '#2a2f31', grout: '#212527',
    concrete: '#2a2a2b', concreteMark: '#242425',
    stone: '#232527', stoneLine: '#1c1e20',
    rug: '#3a2626', rugBorder: '#4c3330', rugLine: '#2c1d1d',
    rugBed: '#2d2c24', rugBedBorder: '#3d3b30', rugBedLine: '#24231c',
    // Muebles
    shadow: '#0e0c0b', edge: '#15110e',
    furn: '#3a2e25', furnTop: '#46382d',
    counter: '#45413b', counterTop: '#524d46',
    fabric: '#3a3040', fabricTop: '#463b4d',
    porcelain: '#7d8186', porcelainIn: '#5d6166',
    pillow: '#8a8478', blanket: '#3a3f52',
    car: '#2c3238', carGlass: '#3c4a55',
    closet: '#3a2e25', closetLine: '#211a15', closetOpen: '#0b0a09',
  };

  // Material del suelo según el nombre de la habitación (datos del mapa).
  const FLOOR_STYLE = [
    [/baño|cocina|despensa/i, 'tile'],
    [/garaje/i, 'concrete'],
  ];
  const RUGS = [
    [/living|sala de estar/i, 'rug'],
    [/dormitorio/i, 'rugBed'],
  ];
  // Aspecto de cada mueble según su nombre.
  const FURNITURE_STYLE = [
    [/cama/i, 'bed'],
    [/sofá|sillón/i, 'fabric'],
    [/lavamanos|sanitario/i, 'porcelain'],
    [/mesón|isla/i, 'counter'],
    [/vehículo/i, 'car'],
  ];

  // ---------- Sprite del investigador (16×20) ----------
  // k contorno · h pelo · s piel · e ojos · c abrigo · C abrigo claro · t camisa · b mochila · B correa · p pantalón · o zapatos
  const PAL = {
    k: '#0d0b0e', h: '#241e23', H: '#342b31', s: '#d6c0a6', e: '#0d0b0e',
    c: '#2c2c35', C: '#3b3b46', t: '#55525a', b: '#5a4232', B: '#3e2d22', p: '#2a2a31', o: '#141217',
  };
  const mirror = (rows) => rows.map((r) => r + r.split('').reverse().join(''));
  const FRONT = mirror([
    '....kkkk', '..kkhhhh', '.khhhhHh', '.khhhhhh', 'khhhhhhh', 'khhshhhs', '.khsesss', '.khsesss',
    '..ksssss', '..kcBctt', '.kccBctt', '.kcccctt', '.kCccctt', '.ksccccc', '..kppppp', '..kppppp',
    '..kpppk.', '..kpppk.', '..koook.', '..kkkkk.',
  ]);
  const BACK = mirror([
    '....kkkk', '..kkhhhh', '.khhhhhh', '.khhHhhh', 'khhhhhhh', 'khhhhhhh', '.khhhhhh', '.khhhhhh',
    '..khhhhh', '..kcBbbb', '.kccbbbb', '.kccbBBB', '.kCcbbbb', '.kscbbbb', '..kppppp', '..kppppp',
    '..kpppk.', '..kpppk.', '..koook.', '..kkkkk.',
  ]);
  const SIDE_TOP = [
    '.....kkkkk......', '...kkhhhhhkk....', '..khhhhHhhhhk...', '.khhhhhhhhhhhk..', 'khhhhhhhhhhhhhk.',
    'khhhhhhhhshhssk.', '.khhhhhhsssesk..', '.khhhhhssssesk..', '..khhhsssssssk..', '..kbbkcccck.....',
    '.kbbbbkccccck...', '.kbBbbkccccck...', '.kbbbbkcccsck...', '..kbbkcccccsk...', '....kppppppk....',
    '....kppppppk....',
  ];
  const SIDE_STAND = ['....kppkppk.....', '....kppkppk.....', '....kookook.....', '....kkkkkkk.....'];
  const SIDE_STRIDE = ['...kppk.kppk....', '..kppk...kppk...', '..kook...kook...', '..kkk.....kkk...'];
  // Pierna levantada (vista de frente/espalda): sube un píxel la mitad indicada.
  function liftLeg(rows, half) {
    const out = rows.slice();
    const a = half === 0 ? 0 : 8;
    for (let j = 16; j < 20; j++) {
      const src = j < 19 ? rows[j + 1] : '................';
      out[j] = out[j].slice(0, a) + src.slice(a, a + 8) + out[j].slice(a + 8);
    }
    return out;
  }
  const flip = (rows) => rows.map((r) => r.split('').reverse().join(''));
  const SPRITES = {
    down: [FRONT, liftLeg(FRONT, 0), liftLeg(FRONT, 1)],
    up: [BACK, liftLeg(BACK, 0), liftLeg(BACK, 1)],
    right: [SIDE_TOP.concat(SIDE_STAND), SIDE_TOP.concat(SIDE_STRIDE), SIDE_TOP.concat(SIDE_STAND)],
  };
  SPRITES.left = SPRITES.right.map(flip);
  // Ojos (columna, fila, ancho) por dirección, para la firma en la oscuridad.
  const EYES = {
    down: [[4, 6, 2], [10, 6, 2]],
    up: [[4, 6, 2], [10, 6, 2]],
    right: [[9, 6, 2], [12, 6, 1]],
    left: [[4, 6, 1], [5, 6, 2]],
  };
  EYES.left = [[3, 6, 1], [5, 6, 2]];

  // Sprites prerenderizados en lienzos pequeños.
  const spriteCache = {};
  function spriteCanvas(dir, frame) {
    const key = dir + frame;
    if (spriteCache[key]) return spriteCache[key];
    const rows = SPRITES[dir][frame];
    const c = document.createElement('canvas');
    c.width = 16;
    c.height = 20;
    const g = c.getContext('2d');
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const col = PAL[row[i]];
        if (!col) continue;
        g.fillStyle = col;
        g.fillRect(i, j, 1, 1);
      }
    });
    return (spriteCache[key] = c);
  }

  function direction(facing) {
    const a = Math.atan2(Math.sin(facing), Math.cos(facing));
    if (a > -Math.PI / 4 && a <= Math.PI / 4) return 'right';
    if (a > Math.PI / 4 && a <= (3 * Math.PI) / 4) return 'down';
    if (a <= -Math.PI / 4 && a > (-3 * Math.PI) / 4) return 'up';
    return 'left';
  }

  // Animación: avanza un cuadro cada 7 u recorridas.
  const anim = { x: 0, y: 0, dist: 0, still: 0 };
  function animFrame(p) {
    const d = Math.hypot(p.x - anim.x, p.y - anim.y);
    anim.x = p.x;
    anim.y = p.y;
    if (d > 0.01 && d < 20) {
      anim.dist += d;
      anim.still = 0;
    } else {
      anim.still++;
    }
    if (anim.still > 3) return 0;
    return 1 + (Math.floor(anim.dist / 7) % 2);
  }

  // ---------- Suelos y muebles (lienzo por piso) ----------
  const floorCache = [];

  function styleFor(table, name, fallback) {
    for (const [re, style] of table) if (re.test(name)) return style;
    return fallback;
  }

  function fillPattern(g, x, y, w, h, style) {
    g.save();
    g.beginPath();
    g.rect(x, y, w, h);
    g.clip();
    if (style === 'tile') {
      for (let ty = Math.floor(y / 8) * 8; ty < y + h; ty += 8) {
        for (let tx = Math.floor(x / 8) * 8; tx < x + w; tx += 8) {
          g.fillStyle = ((tx + ty) / 8) % 2 ? C.tile : C.tileAlt;
          g.fillRect(tx, ty, 8, 8);
          g.fillStyle = C.grout;
          g.fillRect(tx, ty, 8, 1);
          g.fillRect(tx, ty, 1, 8);
        }
      }
    } else if (style === 'concrete') {
      g.fillStyle = C.concrete;
      g.fillRect(x, y, w, h);
      g.fillStyle = C.concreteMark;
      for (let ty = Math.floor(y / 40) * 40; ty < y + h; ty += 40) g.fillRect(x, ty, w, 1);
      for (let i = 0; i < (w * h) / 900; i++) g.fillRect(x + ((i * 53) % w), y + ((i * 97 + i * i) % h), 2, 1);
    } else if (style === 'stone') {
      g.fillStyle = C.stone;
      g.fillRect(x, y, w, h);
      g.fillStyle = C.stoneLine;
      for (let ty = Math.floor(y / 16) * 16; ty < y + h; ty += 16) {
        g.fillRect(x, ty, w, 1);
        const off = (ty / 16) % 2 ? 0 : 12;
        for (let tx = Math.floor(x / 24) * 24 + off; tx < x + w; tx += 24) g.fillRect(tx, ty, 1, 16);
      }
    } else {
      // Tablones de madera: franjas de 6 u con juntas escalonadas y alguna veta.
      g.fillStyle = C.wood;
      g.fillRect(x, y, w, h);
      for (let ty = Math.floor(y / 6) * 6; ty < y + h; ty += 6) {
        g.fillStyle = C.woodLine;
        g.fillRect(x, ty, w, 1);
        const row = ty / 6;
        // Tablones largos (≈ 70–110 u) con juntas a distancias irregulares por fila.
        g.fillStyle = C.woodJoint;
        let tx = Math.floor(x / 90) * 90 + ((row * 53) % 90);
        for (let k = 0; tx < x + w; k++) {
          g.fillRect(tx, ty + 1, 1, 5);
          tx += 70 + ((row * 31 + k * 17) % 41);
        }
        g.fillStyle = C.woodGrain;
        if (row % 3 === 0) g.fillRect(x + ((row * 29) % Math.max(1, w - 12)), ty + 3, 8, 1);
      }
    }
    g.restore();
  }

  function rug(g, r, style) {
    const [, rx, ry, rw, rh] = r;
    const mx = Math.max(18, Math.round(rw * 0.2));
    const my = Math.max(18, Math.round(rh * 0.2));
    const x = rx + mx, y = ry + my, w = rw - mx * 2, h = rh - my * 2;
    if (w < 20 || h < 20) return;
    const field = style === 'rugBed' ? C.rugBed : C.rug;
    const border = style === 'rugBed' ? C.rugBedBorder : C.rugBorder;
    const line = style === 'rugBed' ? C.rugBedLine : C.rugLine;
    g.fillStyle = border;
    g.fillRect(x, y, w, h);
    g.fillStyle = field;
    g.fillRect(x + 3, y + 3, w - 6, h - 6);
    g.fillStyle = line;
    g.fillRect(x + 6, y + 6, w - 12, 1);
    g.fillRect(x + 6, y + h - 7, w - 12, 1);
    g.fillRect(x + 6, y + 6, 1, h - 12);
    g.fillRect(x + w - 7, y + 6, 1, h - 12);
    // Flecos
    g.fillStyle = border;
    for (let fx = x + 2; fx < x + w - 2; fx += 3) {
      g.fillRect(fx, y - 2, 1, 2);
      g.fillRect(fx, y + h, 1, 2);
    }
  }

  // Caja con sombra y borde de 1 px, y una línea clara arriba.
  function box(g, x, y, w, h, body, top) {
    g.fillStyle = C.shadow;
    g.fillRect(x + 1, y + 1, w, h);
    g.fillStyle = C.edge;
    g.fillRect(x, y, w, h);
    g.fillStyle = body;
    g.fillRect(x + 1, y + 1, w - 2, h - 2);
    if (top) {
      g.fillStyle = top;
      g.fillRect(x + 1, y + 1, w - 2, 1);
    }
  }

  function furniture(g, f) {
    const [name, x, y, w, h] = f;
    const style = styleFor(FURNITURE_STYLE, name, 'wood');
    if (style === 'bed') {
      box(g, x, y, w, h, C.furn, C.furnTop);
      g.fillStyle = C.blanket;
      g.fillRect(x + 2, y + Math.round(h * 0.3), w - 4, h - Math.round(h * 0.3) - 2);
      g.fillStyle = C.pillow;
      const pw = w > 100 ? (w - 10) / 2 : w - 8;
      g.fillRect(x + 4, y + 4, pw, 9);
      if (w > 100) g.fillRect(x + 6 + pw, y + 4, pw, 9);
      g.fillStyle = C.edge;
      g.fillRect(x + 2, y + Math.round(h * 0.3), w - 4, 1);
    } else if (style === 'fabric') {
      box(g, x, y, w, h, C.fabric, C.fabricTop);
      g.fillStyle = C.edge;
      if (w > h) for (let cx = x + Math.round(w / 3); cx < x + w - 4; cx += Math.round(w / 3)) g.fillRect(cx, y + 4, 1, h - 6);
      else for (let cy = y + Math.round(h / 3); cy < y + h - 4; cy += Math.round(h / 3)) g.fillRect(x + 4, cy, w - 6, 1);
    } else if (style === 'porcelain') {
      box(g, x, y, w, h, C.porcelain, null);
      g.fillStyle = C.porcelainIn;
      g.fillRect(x + 3, y + 3, w - 6, h - 6);
    } else if (style === 'counter') {
      box(g, x, y, w, h, C.counter, C.counterTop);
    } else if (style === 'car') {
      box(g, x, y, w, h, C.car, null);
      g.fillStyle = C.carGlass;
      g.fillRect(x + 6, y + Math.round(h * 0.22), w - 12, Math.round(h * 0.16));
      g.fillRect(x + 6, y + Math.round(h * 0.7), w - 12, Math.round(h * 0.1));
    } else {
      box(g, x, y, w, h, C.furn, C.furnTop);
      if (w > 20 && h > 20) {
        g.fillStyle = C.edge;
        g.fillRect(x + 3, y + 3, w - 6, 1);
      }
    }
  }

  function buildFloor(state, floor) {
    const D = state.G.floors[floor];
    const [bx, by, bw, bh] = D.bounds;
    const c = document.createElement('canvas');
    c.width = bw;
    c.height = bh;
    const g = c.getContext('2d');
    g.translate(-bx, -by);
    // Exterior pisable (terraza, porche): piedra.
    for (const f of D.floors || []) fillPattern(g, f[0], f[1], f[2], f[3], 'stone');
    for (const r of D.rooms) fillPattern(g, r[1], r[2], r[3], r[4], styleFor(FLOOR_STYLE, r[0], 'wood'));
    for (const r of D.rooms) {
      const rs = styleFor(RUGS, r[0], null);
      if (rs) rug(g, r, rs);
    }
    for (const f of D.furniture) furniture(g, f);
    for (const ci of D.circles || []) {
      g.fillStyle = C.shadow;
      g.beginPath();
      g.arc(ci[0] + 1, ci[1] + 1, ci[2], 0, Math.PI * 2);
      g.fill();
      g.fillStyle = C.edge;
      g.beginPath();
      g.arc(ci[0], ci[1], ci[2], 0, Math.PI * 2);
      g.fill();
      g.fillStyle = C.furn;
      g.beginPath();
      g.arc(ci[0], ci[1], ci[2] - 1, 0, Math.PI * 2);
      g.fill();
    }
    return { canvas: c, x: bx, y: by };
  }

  function line(ctx, s, color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(s[0], s[1]);
    ctx.lineTo(s[2], s[3]);
    ctx.stroke();
  }

  // ---------- API ----------
  function map(ctx, state) {
    const floor = state.floor;
    const D = state.G.floors[floor];
    if (!floorCache[floor]) floorCache[floor] = buildFloor(state, floor);
    const fc = floorCache[floor];
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(fc.canvas, fc.x, fc.y);
    for (const w of D.windows || []) line(ctx, w, C.window, 3);
    const [sx, sy, sw, sh] = D.stairs;
    ctx.fillStyle = C.stairs;
    ctx.fillRect(sx, sy, sw, sh);
    ctx.fillStyle = C.stairStep;
    for (let y = sy + 6; y < sy + sh; y += 12) ctx.fillRect(sx + 2, y, sw - 4, 2);
    if (D.closet) {
      const [x, y, w, h] = D.closet;
      const open = state.closetOpen[floor];
      ctx.fillStyle = C.shadow;
      ctx.fillRect(x + 1, y + 1, w, h);
      ctx.fillStyle = open ? C.closetOpen : C.closet;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = C.closetLine;
      if (!open) {
        ctx.fillRect(x + w / 2, y + 2, 1, h - 4);
        ctx.fillRect(x + w / 2 - 4, y + h / 2, 2, 3);
        ctx.fillRect(x + w / 2 + 3, y + h / 2, 2, 3);
      }
      if (open) {
        ctx.strokeStyle = C.door;
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      }
    }
    if (D.fuse) {
      const [x, y, w, h] = D.fuse;
      ctx.fillStyle = C.fuseEdge;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = C.fuse;
      ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
      ctx.fillStyle = C.fuseEdge;
      for (let i = y + 5; i < y + h - 3; i += 6) ctx.fillRect(x + 4, i, w - 8, 2);
    }
    for (const s of state.model.walls) line(ctx, s, C.wall, s[4]);
  }

  // Sprite con los pies cerca de p.y + 6 (la colisión sigue siendo el círculo de 16 u).
  function player(ctx, state) {
    const p = state.player;
    const dir = direction(p.facing);
    const frame = animFrame(p);
    const x = Math.round(p.x) - 8;
    const y = Math.round(p.y) - 14;
    ctx.fillStyle = 'rgba(5,6,8,0.55)';
    ctx.fillRect(x + 3, y + 19, 10, 2);
    ctx.drawImage(spriteCanvas(dir, frame), x, y);
  }

  // Firma: en oscuridad total, solo los ojos (rayas blancas) sobre la capa de oscuridad.
  function eyes(ctx, state) {
    const L = Umbra.lighting;
    if (!L || !L.playerInDarkness || !L.playerInDarkness(state)) return;
    const p = state.player;
    const dir = direction(p.facing);
    const x = Math.round(p.x + state.view.ox) - 8;
    const y = Math.round(p.y + state.view.oy) - 14;
    ctx.fillStyle = '#f2efe6';
    for (const [ex, ey, w] of EYES[dir]) ctx.fillRect(x + ex, y + ey, w, 1);
  }

  // ---------- Nombre de la habitación ----------
  // Al entrar a otra habitación, su nombre aparece abajo a la derecha ~2 s, con fundido
  // en 4 pasos (sin degradado suave). Queda sobre la franja de mensajes y lejos del panel
  // de herramientas (abajo a la izquierda).
  const ROOM_LABEL = { fadeIn: 0.3, hold: 1.6, fadeOut: 0.4 };
  const roomLabel = { key: null, name: '', t: Infinity };

  function roomAtPlayer(state) {
    const p = state.player;
    let best = null;
    for (const r of state.G.floors[state.floor].rooms) {
      if (p.x >= r[1] && p.x < r[1] + r[3] && p.y >= r[2] && p.y < r[2] + r[4] && (!best || r[3] * r[4] < best[3] * best[4])) best = r;
    }
    return best;
  }

  function updateRoomLabel(dt, state) {
    const r = roomAtPlayer(state);
    const key = r ? state.floor + ':' + r[0] : roomLabel.key;
    if (r && key !== roomLabel.key) {
      roomLabel.key = key;
      roomLabel.name = r[0];
      roomLabel.t = 0;
    } else {
      roomLabel.t += dt;
    }
  }

  function drawRoomLabel(ctx, state) {
    const { fadeIn, hold, fadeOut } = ROOM_LABEL;
    const t = roomLabel.t;
    if (t >= fadeIn + hold + fadeOut || !roomLabel.name) return;
    let a = t < fadeIn ? t / fadeIn : t < fadeIn + hold ? 1 : 1 - (t - fadeIn - hold) / fadeOut;
    a = Math.ceil(a * 4) / 4; // 4 niveles
    if (a <= 0) return;
    const { w, h } = state.view;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = 'bold 9px monospace';
    const label = roomLabel.name.toUpperCase();
    const tw = Math.ceil(ctx.measureText(label).width);
    const bw = tw + 20;
    const bx = w - bw - 6;
    const by = h - 41;
    ctx.fillStyle = '#07090c';
    ctx.fillRect(bx, by, bw, 15);
    ctx.fillStyle = '#3a3328';
    ctx.fillRect(bx, by, bw, 1);
    ctx.fillRect(bx, by + 14, bw, 1);
    ctx.fillStyle = '#e1b66e';
    ctx.fillRect(bx + 4, by + 7, 3, 1);
    ctx.fillRect(bx + bw - 7, by + 7, 3, 1);
    ctx.fillStyle = '#d8d2c4';
    ctx.textAlign = 'left';
    ctx.fillText(label, bx + 10, by + 11);
    ctx.restore();
  }

  Umbra.render = { map, player, sprite: spriteCanvas };

  Umbra.register({
    order: 6, // después de lighting.js (5): los ojos van sobre la oscuridad
    start() {
      floorCache.length = 0;
      roomLabel.key = null;
      roomLabel.t = Infinity;
    },
    update(dt, state) {
      updateRoomLabel(dt, state);
    },
    drawLight(ctx, state) {
      eyes(ctx, state);
    },
    drawUI(ctx, state) {
      drawRoomLabel(ctx, state);
    },
  });
})();
