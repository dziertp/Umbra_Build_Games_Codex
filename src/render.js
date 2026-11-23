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
    piano: '#19171b', pianoTop: '#2a272d', keys: '#8a8478',
    box: '#4f4232', boxTop: '#5c4d3a', tape: '#6b5d45',
    glass: '#3c4a55',
    spine: ['#5a2e2a', '#2e3f5a', '#5a4f2e', '#3e4a32'],
    // Decoración (sin colisión)
    frame: '#5a4632', canvasArt: ['#2c3a3a', '#3d2f2a', '#33303d'],
    web: '#5c5d60', paper: '#8a8576', paperLine: '#6a6658',
    pot: '#4a3626', leaf: '#5f5a3a', leafDry: '#6e5a3a',
    stain: '#1a1613',
    runner: '#3a2c22', runnerBorder: '#4a3a2c', runnerLine: '#2c2119',
    // Campamento exterior
    grass: '#1c261b', grassDark: '#162015', grassTuft: '#26331f', hedge: '#121c12', hedgeTop: '#1b2a1a',
    asphalt: '#222426', asphaltMark: '#3e3c34', walk: '#36373a', walkLine: '#2c2d30',
    truck: '#2f3b42', truckRoof: '#3a4850', truckLine: '#222b30', wheel: '#0c0c0e', headlight: '#8a8478',
    peg: '#5a4a36', pegHole: '#3e3226', toolShape: '#1e1916',
    board: '#7d7f7c', boardFrame: '#3a3a3c', ink: ['#2e4a6a', '#7c2b22', '#2d3a2a'],
    pole: '#2a2a2e', lampHead: '#e1b66e',
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
    [/piano/i, 'piano'],
    [/reloj/i, 'clock'],
    [/caja/i, 'box'],
    [/librero|estanter/i, 'shelf'],
    [/vitrina/i, 'cabinet'],
    [/aparador|cómoda|tocador/i, 'drawers'],
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
    } else if (style === 'piano') {
      box(g, x, y, w, h, C.piano, C.pianoTop);
      const ky = y + h - 7;
      g.fillStyle = C.keys;
      g.fillRect(x + 3, ky, w - 6, 4);
      g.fillStyle = C.piano;
      for (let kx = x + 5; kx < x + w - 4; kx += 4) g.fillRect(kx, ky, 1, 2);
    } else if (style === 'clock') {
      box(g, x, y, w, h, C.furn, C.furnTop);
      g.fillStyle = C.paper;
      g.fillRect(x + Math.round(w / 2) - 3, y + 3, 6, 6);
      g.fillStyle = C.edge;
      g.fillRect(x + Math.round(w / 2), y + 4, 1, 3);
    } else if (style === 'box') {
      // Pila de cajas: una o dos según el tamaño.
      const n = w > 32 ? 2 : 1;
      const bw = Math.floor(w / n);
      for (let i = 0; i < n; i++) {
        box(g, x + i * bw, y, bw - (n > 1 ? 1 : 0), h, C.box, C.boxTop);
        g.fillStyle = C.tape;
        g.fillRect(x + i * bw + Math.floor(bw / 2) - 1, y + 1, 2, h - 2);
      }
    } else if (style === 'shelf') {
      box(g, x, y, w, h, C.furn, C.furnTop);
      // Lomos de libros en filas.
      const vertical = h > w;
      const len = vertical ? h : w;
      for (let k = 3, i = 0; k < len - 3; k += 3, i++) {
        g.fillStyle = C.spine[(i * 7 + (k >> 2)) % C.spine.length];
        if (vertical) g.fillRect(x + 3, y + k, w - 6, 2);
        else g.fillRect(x + k, y + 3, 2, h - 6);
      }
    } else if (style === 'cabinet') {
      box(g, x, y, w, h, C.furn, C.furnTop);
      g.fillStyle = C.glass;
      g.fillRect(x + 3, y + 3, w - 6, h - 6);
      g.fillStyle = C.edge;
      g.fillRect(x + Math.round(w / 2), y + 3, 1, h - 6);
    } else if (style === 'drawers') {
      box(g, x, y, w, h, C.furn, C.furnTop);
      g.fillStyle = C.edge;
      if (w >= h) for (let dx = x + Math.round(w / 3); dx < x + w - 3; dx += Math.round(w / 3)) g.fillRect(dx, y + 2, 1, h - 4);
      else for (let dy = y + Math.round(h / 3); dy < y + h - 3; dy += Math.round(h / 3)) g.fillRect(x + 2, dy, w - 4, 1);
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

  // ---------- Decoración sin colisión (D.decor: [tipo, x, y, ancho, alto]) ----------
  const FLOOR_DECOR = new Set(['runner', 'stain', 'papers', 'books', 'plant']);

  function decor(g, d, rooms) {
    const [type, x, y, w, h] = d;
    const seed = Math.abs(Math.round(x * 7 + y * 13));
    if (type === 'runner') {
      g.fillStyle = C.runnerBorder;
      g.fillRect(x, y, w, h);
      g.fillStyle = C.runner;
      g.fillRect(x + 2, y + 2, w - 4, h - 4);
      g.fillStyle = C.runnerLine;
      if (w > h) g.fillRect(x + 4, y + Math.floor(h / 2), w - 8, 1);
      else g.fillRect(x + Math.floor(w / 2), y + 4, 1, h - 8);
    } else if (type === 'stain') {
      g.fillStyle = C.stain;
      g.fillRect(x + 2, y, w - 4, h);
      g.fillRect(x, y + 2, w, h - 4);
      g.fillRect(x + w, y + Math.floor(h / 2), 2, 1);
    } else if (type === 'papers') {
      for (let i = 0; i < 3; i++) {
        const px = x + ((seed + i * 5) % 9) - 4;
        const py = y + ((seed + i * 3) % 7) - 3;
        g.fillStyle = C.paperLine;
        g.fillRect(px, py, 5, 6);
        g.fillStyle = C.paper;
        g.fillRect(px, py, 4, 5);
        g.fillStyle = C.paperLine;
        g.fillRect(px + 1, py + 2, 2, 1);
      }
    } else if (type === 'books') {
      for (let i = 0; i < 3; i++) {
        const px = x + i * 4 - 4 + (i === 1 ? 1 : 0);
        const py = y + (i % 2) * 3;
        g.fillStyle = C.edge;
        g.fillRect(px - 1, py - 1, 6, 5);
        g.fillStyle = C.spine[(seed + i) % C.spine.length];
        g.fillRect(px, py, 4, 3);
      }
    } else if (type === 'plant') {
      // Planta seca en maceta.
      g.fillStyle = C.edge;
      g.fillRect(x - 4, y - 1, 8, 6);
      g.fillStyle = C.pot;
      g.fillRect(x - 3, y, 6, 4);
      g.fillStyle = C.leafDry;
      g.fillRect(x - 1, y - 5, 1, 4);
      g.fillRect(x + 1, y - 4, 1, 3);
      g.fillStyle = C.leaf;
      g.fillRect(x - 3, y - 4, 2, 1);
      g.fillRect(x + 2, y - 6, 2, 1);
      g.fillRect(x, y - 7, 1, 2);
    } else if (type === 'painting') {
      g.fillStyle = C.frame;
      g.fillRect(x, y, w, h);
      g.fillStyle = C.canvasArt[seed % C.canvasArt.length];
      if (w > h) g.fillRect(x + 1, y + 1, w - 2, Math.max(1, h - 2));
      else g.fillRect(x + 1, y + 1, Math.max(1, w - 2), h - 2);
    } else if (type === 'web') {
      // Telaraña en la esquina de habitación más cercana (se orienta sola).
      let cx = x, cy = y, sx = 1, sy = 1, best = Infinity;
      for (const r of rooms || []) {
        for (const [px, py, dx, dy] of [[r[1], r[2], 1, 1], [r[1] + r[3], r[2], -1, 1], [r[1], r[2] + r[4], 1, -1], [r[1] + r[3], r[2] + r[4], -1, -1]]) {
          const dd = Math.hypot(px - (x + w / 2), py - (y + h / 2));
          if (dd < best) { best = dd; cx = px + dx * 4; cy = py + dy * 4; sx = dx; sy = dy; }
        }
      }
      const n = Math.min(w, h);
      g.fillStyle = C.web;
      const dot = (i, j) => g.fillRect(cx + sx * i - (sx < 0 ? 1 : 0), cy + sy * j - (sy < 0 ? 1 : 0), 1, 1);
      for (let i = 0; i < n; i++) {
        dot(i, 0);
        dot(0, i);
        if (i % 2 === 0) dot(i, i);
      }
      for (let i = 0; i <= 5; i++) dot(5 - i, i);
      for (let i = 0; i <= 8; i += 2) dot(8 - i, i);
    }
  }

  // ---------- Campamento base (D.base) ----------
  function drawBase(g, b) {
    const [ax, ay, aw, ah] = b.area;
    // Pasto con matas.
    g.fillStyle = C.grass;
    g.fillRect(ax, ay, aw, ah);
    g.fillStyle = C.grassDark;
    for (let i = 0; i < (aw * ah) / 120; i++) g.fillRect(ax + ((i * 37) % aw), ay + ((i * 53 + i * i) % ah), 2, 1);
    g.fillStyle = C.grassTuft;
    for (let i = 0; i < (aw * ah) / 400; i++) g.fillRect(ax + ((i * 71) % aw), ay + ((i * 29 + i * 3) % ah), 1, 2);
    // Entrada de autos (asfalto) con marcas de estacionamiento.
    const [dx, dy, dw, dh] = b.driveway;
    g.fillStyle = C.asphalt;
    g.fillRect(dx, dy, dw, dh);
    g.fillStyle = C.asphaltMark;
    for (let y = dy + 8; y < dy + dh - 6; y += 14) g.fillRect(dx + dw - 40, y, 1, 7);
    g.fillRect(dx + 72, dy + 8, 1, dh - 16);
    // Vereda bajo el porche.
    const [sx, sy, sw, sh] = b.sidewalk;
    g.fillStyle = C.walk;
    g.fillRect(sx, sy, sw, sh);
    g.fillStyle = C.walkLine;
    g.fillRect(sx, sy + sh - 1, sw, 1);
    for (let x = sx + 20; x < sx + sw; x += 20) g.fillRect(x, sy, 1, sh);
    // Seto en el borde (los límites del campamento), salvo hacia el porche.
    g.fillStyle = C.hedge;
    g.fillRect(ax, ay + sh, 4, ah - sh);
    g.fillRect(ax + aw - 4, ay + sh, 4, ah - sh);
    g.fillRect(ax, ay + ah - 4, aw, 4);
    g.fillStyle = C.hedgeTop;
    for (let y = ay + sh + 2; y < ay + ah - 4; y += 5) {
      g.fillRect(ax + 1, y, 2, 2);
      g.fillRect(ax + aw - 3, y + 2, 2, 2);
    }
    for (let x = ax + 2; x < ax + aw - 2; x += 5) g.fillRect(x, ay + ah - 3, 2, 2);

    // Camión de equipo (vista superior; cabina hacia la calle, abajo).
    const [tx, ty, tw, th] = b.truck;
    g.fillStyle = C.shadow;
    g.fillRect(tx + 2, ty + 2, tw, th);
    g.fillStyle = C.wheel;
    for (const wy of [ty + 14, ty + th - 26]) {
      g.fillRect(tx - 2, wy, 3, 12);
      g.fillRect(tx + tw - 1, wy, 3, 12);
    }
    g.fillStyle = C.edge;
    g.fillRect(tx, ty, tw, th);
    g.fillStyle = C.truck;
    g.fillRect(tx + 1, ty + 1, tw - 2, th - 2);
    g.fillStyle = C.truckRoof;
    g.fillRect(tx + 4, ty + 4, tw - 8, th - 34);
    g.fillStyle = C.truckLine;
    for (let y = ty + 10; y < ty + th - 34; y += 8) g.fillRect(tx + 6, y, tw - 12, 1);
    g.fillRect(tx + Math.floor(tw / 2), ty + 1, 1, 6); // puertas traseras
    g.fillStyle = C.glass;
    g.fillRect(tx + 4, ty + th - 24, tw - 8, 9); // parabrisas
    g.fillStyle = C.headlight;
    g.fillRect(tx + 3, ty + th - 3, 5, 2);
    g.fillRect(tx + tw - 8, ty + th - 3, 5, 2);

    // Panel perforado con siluetas de herramientas (frente hacia abajo).
    const [bx, by, bw, bh] = b.board;
    g.fillStyle = C.shadow;
    g.fillRect(bx + 1, by + 1, bw, bh);
    g.fillStyle = C.furn;
    g.fillRect(bx, by, bw, bh);
    g.fillStyle = C.peg;
    g.fillRect(bx + 1, by + 1, bw - 2, bh - 2);
    g.fillStyle = C.pegHole;
    for (let y = by + 2; y < by + bh - 1; y += 3) for (let x = bx + 2; x < bx + bw - 1; x += 3) g.fillRect(x, y, 1, 1);
    g.fillStyle = C.toolShape;
    const tools = [[4, 3, 6, 6], [13, 2, 3, 8], [20, 3, 8, 5], [31, 2, 2, 8], [36, 4, 7, 4], [46, 2, 5, 7], [55, 3, 9, 5], [67, 2, 4, 8]];
    for (const [ox, oy, w, h] of tools) if (ox + w < bw - 1) g.fillRect(bx + ox, by + oy, w, Math.min(h, bh - oy - 1));

    // Pizarra de objetivos (frente hacia la izquierda).
    const [ox, oy, ow, oh] = b.objectives;
    g.fillStyle = C.shadow;
    g.fillRect(ox + 1, oy + 1, ow, oh);
    g.fillStyle = C.boardFrame;
    g.fillRect(ox, oy, ow, oh);
    g.fillStyle = C.board;
    g.fillRect(ox + 1, oy + 1, ow - 3, oh - 2);
    for (let i = 0; i < 6; i++) {
      g.fillStyle = C.ink[i % C.ink.length];
      g.fillRect(ox + 2 + (i % 2) * 3, oy + 4 + i * 7, 4 - (i % 2), 1);
    }

    // Faroles: base, brazo y cabeza (la luz del camión no tiene poste).
    for (const l of b.lamps || []) {
      if (!l.pole) continue;
      const [px, py, pw, ph] = l.pole;
      g.fillStyle = C.shadow;
      g.fillRect(px + 1, py + 1, pw, ph);
      g.fillStyle = C.pole;
      g.fillRect(px, py, pw, ph);
      g.fillRect(px + pw, py + 1, 6, 1);
      g.fillStyle = C.lampHead;
      g.fillRect(px + pw + 5, py, 3, 3);
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
    const area = D.base && D.base.area;
    for (const f of D.floors || []) {
      if (area && f[0] === area[0] && f[1] === area[1] && f[2] === area[2] && f[3] === area[3]) continue;
      fillPattern(g, f[0], f[1], f[2], f[3], 'stone');
    }
    if (D.base) drawBase(g, D.base);
    for (const r of D.rooms) fillPattern(g, r[1], r[2], r[3], r[4], styleFor(FLOOR_STYLE, r[0], 'wood'));
    for (const r of D.rooms) {
      const rs = styleFor(RUGS, r[0], null);
      if (rs) rug(g, r, rs);
    }
    for (const d of D.decor || []) if (FLOOR_DECOR.has(d[0])) decor(g, d, D.rooms);
    for (const f of D.furniture) furniture(g, f);
    for (const d of D.decor || []) if (!FLOOR_DECOR.has(d[0])) decor(g, d, D.rooms);
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
    let r = roomAtPlayer(state);
    const b = state.G.floors[state.floor].base;
    const p = state.player;
    if (!r && b && p.x >= b.area[0] && p.x < b.area[0] + b.area[2] && p.y >= b.area[1] && p.y < b.area[1] + b.area[3]) r = ['Campamento'];
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
