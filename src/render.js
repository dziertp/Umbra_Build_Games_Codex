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
    [/perchero/i, 'rack'],
    [/lámpara/i, 'floorlamp'],
    [/planta/i, 'plantpot'],
    [/baúl/i, 'chest'],
    [/bidón/i, 'drum'],
    [/neumático/i, 'tires'],
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
    } else if (style === 'rack') {
      // Perchero: base redonda, poste y ganchos con un abrigo.
      const cx = x + Math.floor(w / 2), cy = y + Math.floor(h / 2);
      g.fillStyle = C.shadow;
      g.fillRect(x + 2, y + 2, w - 2, h - 2);
      g.fillStyle = C.edge;
      g.fillRect(x + 1, y + 1, w - 2, h - 2);
      g.fillStyle = C.furn;
      g.fillRect(x + 2, y + 2, w - 4, h - 4);
      g.fillStyle = C.furnTop;
      g.fillRect(cx - 1, cy - 1, 2, 2);
      g.fillStyle = C.blanket;
      g.fillRect(cx - 4, cy - 2, 3, 5);
    } else if (style === 'floorlamp') {
      // Lámpara de pie: pantalla redonda (cálida apagada) vista desde arriba.
      g.fillStyle = C.shadow;
      g.fillRect(x + 2, y + 2, w - 2, h - 2);
      g.fillStyle = C.edge;
      g.fillRect(x + 1, y, w - 2, h);
      g.fillRect(x, y + 1, w, h - 2);
      g.fillStyle = C.tape;
      g.fillRect(x + 2, y + 1, w - 4, h - 2);
      g.fillRect(x + 1, y + 2, w - 2, h - 4);
      g.fillStyle = C.pot;
      g.fillRect(x + Math.floor(w / 2) - 1, y + Math.floor(h / 2) - 1, 2, 2);
    } else if (style === 'plantpot') {
      // Planta seca en maceta grande.
      g.fillStyle = C.shadow;
      g.fillRect(x + 2, y + 2, w - 2, h - 2);
      g.fillStyle = C.edge;
      g.fillRect(x + 1, y + 1, w - 2, h - 2);
      g.fillStyle = C.pot;
      g.fillRect(x + 2, y + 2, w - 4, h - 4);
      g.fillStyle = C.leaf;
      g.fillRect(x + 3, y + 3, 2, 2);
      g.fillRect(x + w - 5, y + 4, 2, 2);
      g.fillRect(x + Math.floor(w / 2) - 1, y + 1, 2, 3);
      g.fillStyle = C.leafDry;
      g.fillRect(x + 4, y + h - 5, 2, 2);
      g.fillRect(x + w - 6, y + h - 4, 2, 1);
    } else if (style === 'chest') {
      box(g, x, y, w, h, C.furn, C.furnTop);
      g.fillStyle = C.pole;
      g.fillRect(x + 4, y + 1, 2, h - 2);
      g.fillRect(x + w - 6, y + 1, 2, h - 2);
      g.fillStyle = C.lampHead;
      g.fillRect(x + Math.floor(w / 2) - 1, y + h - 4, 2, 2);
    } else if (style === 'drum') {
      box(g, x, y, w, h, '#33402f', '#3e4c39');
      g.fillStyle = C.edge;
      g.fillRect(x + 1, y + Math.floor(h / 3), w - 2, 1);
      g.fillRect(x + 1, y + Math.floor((2 * h) / 3), w - 2, 1);
    } else if (style === 'tires') {
      // Pila de neumáticos: dos aros oscuros.
      const r = Math.floor(Math.min(w, h) / 2) - 1;
      for (const [cx, cy] of [[x + r + 1, y + r + 1], [x + w - r - 2, y + h - r - 2]]) {
        g.fillStyle = C.wheel;
        g.beginPath();
        g.arc(cx, cy, r, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = C.concrete;
        g.beginPath();
        g.arc(cx, cy, Math.max(2, r - 5), 0, Math.PI * 2);
        g.fill();
      }
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

  // ---------- Fuente de píxeles 3×5 (carteles, titulares) ----------
  const GLYPHS = {
    0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111',
    M: '101111111101101', I: '111010010010111', N: '111101101101101', U: '101101101101111',
    T: '111010010010010', O: '111101101101111', S: '111100111001111', C: '111100100100111',
    D: '110101101101110', E: '111100111100111', X: '101101010101101',
  };
  function pixText(g, str, x, y, color) {
    g.fillStyle = color;
    let cx = Math.round(x);
    for (const ch of String(str).toUpperCase()) {
      const gl = GLYPHS[ch];
      if (gl) for (let k = 0; k < 15; k++) if (gl[k] === '1') g.fillRect(cx + (k % 3), Math.round(y) + Math.floor(k / 3), 1, 1);
      cx += 4;
    }
  }

  // ---------- Decoración sin colisión (D.decor: [tipo, x, y, ancho, alto]) ----------
  const FLOOR_DECOR = new Set(['runner', 'stain', 'papers', 'books', 'plant', 'lawnedge', 'planter', 'bench', 'mailbox', 'crate', 'cone', 'cable', 'tripod', 'newspaper', 'nightstand', 'tvshelf', 'candelabra']);

  function decor(g, d, rooms) {
    const [type, x, y, w, h] = d;
    const seed = Math.abs(Math.round(x * 7 + y * 13));
    // Objetos del campamento (sin colisión).
    if (type === 'lawnedge') {
      g.fillStyle = '#2c3a28';
      g.fillRect(x, y, w, h);
      return;
    } else if (type === 'planter') {
      g.fillStyle = C.shadow; g.fillRect(x + 1, y + 1, w, h);
      g.fillStyle = C.edge; g.fillRect(x, y, w, h);
      g.fillStyle = '#5a4a3a'; g.fillRect(x + 1, y + 1, w - 2, h - 2);
      g.fillStyle = C.leaf; g.fillRect(x + 3, y + 3, w - 6, h - 6);
      g.fillStyle = '#4a7a3a'; g.fillRect(x + 4, y + 2, 2, 2); g.fillRect(x + w - 5, y + 4, 2, 2);
      return;
    } else if (type === 'bench') {
      g.fillStyle = C.shadow; g.fillRect(x + 1, y + 1, w, h);
      g.fillStyle = C.edge; g.fillRect(x, y, w, h);
      g.fillStyle = C.furn; g.fillRect(x + 1, y + 1, w - 2, h - 2);
      g.fillStyle = C.edge; g.fillRect(x + 1, y + Math.floor(h / 2), w - 2, 1);
      return;
    } else if (type === 'mailbox') {
      g.fillStyle = C.pole; g.fillRect(x + 4, y + h, 2, 4);
      g.fillStyle = C.edge; g.fillRect(x - 1, y - 1, w + 2, h + 2);
      g.fillStyle = '#3a4a5a'; g.fillRect(x, y, w, h);
      g.fillStyle = '#b8473a'; g.fillRect(x + w, y - 3, 1, 3);
      pixText(g, '23', x + 1, y + Math.floor((h - 5) / 2), '#f2efe6'); // número 23
      return;
    } else if (type === 'nightstand') {
      g.fillStyle = C.shadow; g.fillRect(x + 1, y + 1, w, h);
      g.fillStyle = C.edge; g.fillRect(x, y, w, h);
      g.fillStyle = C.furn; g.fillRect(x + 1, y + 1, w - 2, h - 2);
      g.fillStyle = C.tape; g.fillRect(x + 4, y + 4, w - 8, h - 8); // pantalla de la lamparita
      g.fillStyle = C.pot; g.fillRect(x + Math.floor(w / 2) - 1, y + Math.floor(h / 2) - 1, 2, 2);
      return;
    } else if (type === 'tvshelf') {
      // Repisa con televisor antiguo (pantalla curva, antena).
      g.fillStyle = C.shadow; g.fillRect(x + 1, y + 1, w, h);
      g.fillStyle = C.edge; g.fillRect(x, y, w, h);
      g.fillStyle = C.furn; g.fillRect(x + 1, y + 1, w - 2, h - 2);
      const tx = x + Math.floor(w / 2) - 9;
      g.fillStyle = C.edge; g.fillRect(tx - 1, y + 1, 20, h - 2);
      g.fillStyle = '#4a4a50'; g.fillRect(tx, y + 2, 18, h - 4);
      g.fillStyle = '#26323a'; g.fillRect(tx + 2, y + 3, 11, h - 6);
      g.fillStyle = '#5a7a8a'; g.fillRect(tx + 3, y + 4, 2, 1);
      g.fillStyle = '#8a8a90'; g.fillRect(tx + 15, y + 4, 1, 1); g.fillRect(tx + 15, y + 7, 1, 1);
      g.fillStyle = C.pole; g.fillRect(tx + 5, y - 2, 1, 3); g.fillRect(tx + 12, y - 3, 1, 4);
      return;
    } else if (type === 'candelabra') {
      // Candelabro de tres velas.
      g.fillStyle = '#7a6430'; g.fillRect(x - 5, y + 1, 11, 2); g.fillRect(x, y - 1, 1, 3);
      g.fillStyle = '#e8e0c8'; g.fillRect(x - 5, y - 3, 1, 4); g.fillRect(x, y - 5, 1, 4); g.fillRect(x + 5, y - 3, 1, 4);
      g.fillStyle = '#f2d36a'; g.fillRect(x - 5, y - 4, 1, 1); g.fillRect(x, y - 6, 1, 1); g.fillRect(x + 5, y - 4, 1, 1);
      return;
    } else if (type === 'newspaper') {
      // Diario viejo con titular legible.
      g.fillStyle = C.shadow; g.fillRect(x + 1, y + 1, w, h);
      g.fillStyle = '#8f887a'; g.fillRect(x, y, w, h);
      g.fillStyle = '#a8a090'; g.fillRect(x + 1, y + 1, w - 2, h - 2);
      pixText(g, d[5] || '', x + 3, y + 3, '#1a1816');
      g.fillStyle = '#6a6658';
      for (let ly = y + 11; ly < y + h - 2; ly += 3) { g.fillRect(x + 3, ly, Math.floor(w / 2) - 4, 1); g.fillRect(x + Math.floor(w / 2) + 1, ly, Math.floor(w / 2) - 4, 1); }
      return;
    } else if (type === 'sign') {
      // Cuadro con letras claras.
      g.fillStyle = C.edge; g.fillRect(x - 1, y - 1, w + 2, h + 2);
      g.fillStyle = C.frame; g.fillRect(x, y, w, h);
      g.fillStyle = '#1a1c20'; g.fillRect(x + 1, y + 1, w - 2, h - 2);
      pixText(g, d[5] || '', x + Math.floor((w - (String(d[5]).length * 4 - 1)) / 2), y + Math.floor((h - 5) / 2), '#e8e3d8');
      return;
    } else if (type === 'crate') {
      g.fillStyle = C.shadow; g.fillRect(x + 1, y + 1, w, h);
      g.fillStyle = C.edge; g.fillRect(x, y, w, h);
      g.fillStyle = '#3a4038'; g.fillRect(x + 1, y + 1, w - 2, h - 2);
      g.fillStyle = '#c9a86a'; g.fillRect(x + 2, y + 2, 3, 1);
      g.fillStyle = C.edge; g.fillRect(x + 1, y + Math.floor(h / 2), w - 2, 1);
      return;
    } else if (type === 'cone') {
      g.fillStyle = C.shadow; g.fillRect(x - 3, y + 2, 8, 2);
      g.fillStyle = '#d8702a'; g.fillRect(x - 3, y - 3, 7, 6);
      g.fillStyle = '#f2efe6'; g.fillRect(x - 2, y - 1, 5, 1);
      g.fillStyle = '#b85a20'; g.fillRect(x - 1, y - 3, 3, 1);
      return;
    } else if (type === 'cable') {
      // Cable ondulado de (x, y) a (x + w, y + h).
      g.fillStyle = '#121214';
      const n = Math.max(Math.abs(w), Math.abs(h));
      for (let i = 0; i <= n; i++) {
        const k = i / n;
        g.fillRect(Math.round(x + w * k), Math.round(y + h * k + Math.sin(k * 9) * 3), 1, 1);
      }
      return;
    } else if (type === 'tripod') {
      g.fillStyle = C.pole;
      for (const [dx, dy] of [[-5, 4], [5, 4], [0, -5]]) {
        for (let i = 0; i <= 5; i++) g.fillRect(x + Math.round((dx * i) / 5), y + Math.round((dy * i) / 5), 1, 1);
      }
      g.fillStyle = C.edge; g.fillRect(x - 2, y - 2, 4, 4);
      g.fillStyle = C.glass; g.fillRect(x - 1, y - 1, 2, 2);
      return;
    }
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

    // El panel de equipo (estantería con herramientas) se dibuja en vivo: drawShelf().

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

  // ---------- Props de Anais (assets/scenarios/props_16x16/<nombre>_16x16.png) ----------
  // Decor ["prop", x, y, ancho, alto, nombre]. Se dibujan en vivo, sobre suelos y muebles
  // (velas en veladores, libros en escritorios), así aparecen aunque la imagen cargue tarde.
  const propImages = {};
  function propImage(name) {
    let img = propImages[name];
    if (!img) {
      img = propImages[name] = new Image();
      img.src = 'assets/scenarios/props_16x16/' + name + '_16x16.png';
    }
    return img.complete && img.naturalWidth ? img : null;
  }
  function drawProps(ctx, D) {
    for (const d of D.decor || []) {
      if (d[0] !== 'prop') continue;
      const img = propImage(d[5]);
      if (img) ctx.drawImage(img, Math.round(d[1]), Math.round(d[2]), d[3] || img.width, d[4] || img.height);
    }
  }

  // Panel de equipo: estantería de madera vista desde arriba, con dos repisas y las
  // herramientas que siguen en ella (las que el jugador lleva desaparecen).
  function drawShelf(ctx, state) {
    const b = state.G.floors[0].base;
    if (!b || !b.board || !Umbra.art) return;
    const [bx, , bw] = b.board;
    const by = b.board[1] + b.board[3] - 36; // sube hacia la vereda (la colisión no cambia)
    ctx.fillStyle = C.shadow;
    ctx.fillRect(bx + 2, by + 2, bw, 36);
    ctx.fillStyle = C.edge;
    ctx.fillRect(bx, by, bw, 36);
    ctx.fillStyle = C.furn;
    ctx.fillRect(bx + 1, by + 1, bw - 2, 34);
    ctx.fillStyle = C.furnTop;
    ctx.fillRect(bx + 1, by + 17, bw - 2, 2); // repisa del medio
    ctx.fillRect(bx + 1, by + 1, bw - 2, 1);
    const held = new Set(((state.tools && state.tools.slots) || []).filter(Boolean).map((t) => t.id));
    const ids = ((Umbra.data && Umbra.data.tools) || []).map((t) => t.id);
    const perRow = Math.ceil(ids.length / 2);
    const step = Math.floor((bw - 4) / perRow);
    ids.forEach((id, i) => {
      if (held.has(id)) return;
      const row = i < perRow ? 0 : 1;
      const col = row ? i - perRow : i;
      const x = bx + 2 + col * step + Math.floor((step - 16) / 2);
      ctx.save();
      ctx.beginPath();
      ctx.rect(bx + 2 + col * step, by + 1 + row * 18, step, 16);
      ctx.clip();
      Umbra.art.tool(ctx, id, x, by + 1 + row * 18, 1);
      ctx.restore();
    });
  }

  // Puertas de madera: abiertas, la hoja girada desde la bisagra (con manilla); cerradas, cubren el vano.
  function drawDoors(ctx, state) {
    const D = state.G.floors[state.floor];
    for (const s of state.model.walls) {
      if (!s[5]) continue;
      const [x1, y1, x2, y2] = s;
      const horiz = Math.abs(y2 - y1) < Math.abs(x2 - x1);
      const lx = Math.min(x1, x2), ly = Math.min(y1, y2);
      const len = Math.round(Math.hypot(x2 - x1, y2 - y1));
      const th = 3;
      const rx = horiz ? lx : x1 - 1.5, ry = horiz ? y1 - 1.5 : ly;
      const rw = horiz ? len : th, rh = horiz ? th : len;
      ctx.fillStyle = C.edge;
      ctx.fillRect(Math.round(rx) - 1, Math.round(ry) - 1, rw + 2, rh + 2);
      ctx.fillStyle = s[5] === 'door' ? '#5a4632' : '#4a3a2a';
      ctx.fillRect(Math.round(rx), Math.round(ry), rw, rh);
      ctx.fillStyle = '#6b563e';
      if (horiz) ctx.fillRect(Math.round(rx) + 1, Math.round(ry), rw - 2, 1);
      else ctx.fillRect(Math.round(rx), Math.round(ry) + 1, 1, rh - 2);
      // Bisagra en el extremo de la hoja (abierta) o en el marco (cerrada), manilla al otro lado.
      ctx.fillStyle = '#8a8a90';
      ctx.fillRect(Math.round(x1) - 1, Math.round(y1) - 1, 2, 2);
      ctx.fillStyle = '#e1b66e';
      const hx = x1 + (x2 - x1) * 0.8, hy = y1 + (y2 - y1) * 0.8;
      ctx.fillRect(Math.round(hx) - (horiz ? 0 : 1), Math.round(hy) - (horiz ? 1 : 0), 1, 1);
      // Marcos del vano.
      const d = s[6] != null && D.doors ? D.doors[s[6]] : null;
      if (d) {
        ctx.fillStyle = C.wall;
        if (d[0] === 'v') { ctx.fillRect(d[1] - 2, d[2] - 1, 4, 2); ctx.fillRect(d[1] - 2, d[3] - 1, 4, 2); }
        else { ctx.fillRect(d[2] - 1, d[1] - 2, 2, 4); ctx.fillRect(d[3] - 1, d[1] - 2, 2, 4); }
      }
    }
  }

  // ---------- API ----------
  function map(ctx, state) {
    const floor = state.floor;
    const D = state.G.floors[floor];
    if (!floorCache[floor]) floorCache[floor] = buildFloor(state, floor);
    const fc = floorCache[floor];
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(fc.canvas, fc.x, fc.y);
    drawProps(ctx, D);
    if (floor === 0) drawShelf(ctx, state);
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
    for (const s of state.model.walls) if (!s[5]) line(ctx, s, C.wall, s[4]);
    drawDoors(ctx, state);
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

  // ---------- HUD: retrato del investigador y herramienta en la mano ----------
  // Arriba a la izquierda (lejos del panel de lectura y del inventario, abajo).
  const hud = { t: 0, alertUntil: -1, reliefUntil: -1 };
  Umbra.on('entity:event', () => { hud.alertUntil = hud.t + 3; });
  Umbra.on('hunt:end', (d) => { if (!d || !d.caught) hud.reliefUntil = hud.t + 3; });

  function playerHidden(state) {
    const c = state.G.floors[state.floor].closet;
    const p = state.player;
    return !!c && !state.closetOpen[state.floor] && p.x > c[0] && p.x < c[0] + c[2] && p.y > c[1] && p.y < c[1] + c[3];
  }

  function mood(state) {
    const e = state.entity;
    const hunting = e && (e.mode === 'hunt' || e.mode === 'warn');
    const hidden = playerHidden(state);
    if (hunting && !hidden) return 'scared';
    if (hidden || hud.t < hud.reliefUntil) return 'relief';
    if (Umbra.lighting && Umbra.lighting.playerInDarkness && Umbra.lighting.playerInDarkness(state)) return 'dark';
    if (state.stamina && state.stamina.value < 0.3) return 'tired';
    if (hud.t < hud.alertUntil) return 'alert';
    return 'calm';
  }

  function frame(ctx, x, y, w, h) {
    ctx.fillStyle = '#07090c';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#3a3328';
    ctx.fillRect(x, y, w, 1);
    ctx.fillRect(x, y + h - 1, w, 1);
    ctx.fillRect(x, y, 1, h);
    ctx.fillRect(x + w - 1, y, 1, h);
    ctx.fillStyle = '#e1b66e';
    ctx.fillRect(x, y, 2, 1);
    ctx.fillRect(x, y, 1, 2);
    ctx.fillRect(x + w - 2, y + h - 1, 2, 1);
    ctx.fillRect(x + w - 1, y + h - 2, 1, 2);
  }

  function drawHud(ctx, state) {
    if (!Umbra.art || state.scene !== 'play') return;
    frame(ctx, 4, 4, 36, 36);
    Umbra.art.portrait(ctx, 6, 6, mood(state), hud.t);
    frame(ctx, 42, 4, 36, 36);
    const tools = state.tools;
    const held = tools && tools.slots && tools.selected >= 0 ? tools.slots[tools.selected] : null;
    if (held) Umbra.art.tool(ctx, held.id, 44, 6, 2);
    else {
      ctx.fillStyle = '#3a3328';
      ctx.fillRect(56, 21, 8, 1); // mano vacía
    }
  }

  // ---------- Techo de la casa (visto desde afuera) ----------
  // Cubre la planta baja (unión de habitaciones, garaje incluido) mientras el jugador está afuera;
  // se desvanece en ~0,3 s al entrar. Recortado antes de la puerta principal: el porche queda visible.
  const roof = { alpha: 0, cache: null };
  const ROOF_CUT_Y = 1011; // borde inferior sobre la puerta principal

  function roofRects(D) {
    return D.rooms.map((r) => {
      const x = r[1] - 4, y = r[2] - 4, w = r[3] + 8;
      const h = Math.min(r[2] + r[4] + 4, ROOF_CUT_Y) - y;
      return [x, y, w, h];
    });
  }

  function buildRoof(state) {
    const D = state.G.floors[0];
    const rects = roofRects(D);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y, w, h] of rects) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + w); y1 = Math.max(y1, y + h); }
    x0 -= 4; y0 -= 12; x1 += 4; y1 += 4;
    const c = document.createElement('canvas');
    c.width = x1 - x0;
    c.height = y1 - y0;
    const g = c.getContext('2d');
    g.translate(-x0, -y0);
    const path = (dx, dy, grow) => {
      g.beginPath();
      for (const [x, y, w, h] of rects) g.rect(x + dx - grow, y + dy - grow, w + grow * 2, h + grow * 2);
    };
    // Sombra de 2 px hacia el campamento y canaleta (borde).
    g.fillStyle = 'rgba(0,0,0,0.6)'; path(2, 2, 0); g.fill();
    g.fillStyle = '#5a5e64'; path(0, 0, 1); g.fill();
    g.save(); path(0, 0, 0); g.clip();
    // Tejas en hileras (rojo oscuro apagado), juntas escalonadas, alguna rota o con musgo.
    g.fillStyle = '#4a2a26'; g.fillRect(x0, y0, x1 - x0, y1 - y0);
    for (let y = y0; y < y1; y += 5) {
      g.fillStyle = '#3a201d'; g.fillRect(x0, y + 4, x1 - x0, 1);
      g.fillStyle = '#5a3530'; g.fillRect(x0, y, x1 - x0, 1);
      g.fillStyle = '#2e1a18';
      const off = ((y - y0) / 5) % 2 ? 4 : 0;
      for (let x = x0 + off; x < x1; x += 8) g.fillRect(x, y + 1, 1, 3);
    }
    for (let i = 0; i < 140; i++) {
      const px = x0 + ((i * 97 + i * i * 13) % (x1 - x0));
      const py = y0 + ((i * 61 + i * i * 7) % (y1 - y0));
      g.fillStyle = i % 3 === 0 ? '#3a4a2a' : i % 3 === 1 ? '#1a100e' : '#4e5a32';
      g.fillRect(px, py, i % 3 === 1 ? 3 : 2, i % 3 === 1 ? 2 : 1);
    }
    // Cumbreras a lo largo del eje mayor de cada ala grande.
    for (const [x, y, w, h] of rects) {
      if (w * h < 20000) continue;
      g.fillStyle = '#2a1816';
      if (w >= h) g.fillRect(x + 6, y + Math.floor(h / 2) - 1, w - 12, 3);
      else g.fillRect(x + Math.floor(w / 2) - 1, y + 6, 3, h - 12);
      g.fillStyle = '#6a4038';
      if (w >= h) g.fillRect(x + 6, y + Math.floor(h / 2) - 1, w - 12, 1);
      else g.fillRect(x + Math.floor(w / 2) - 1, y + 6, 1, h - 12);
    }
    g.restore();
    // Chimenea de ladrillo.
    const cx = 300, cy = 600;
    g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(cx + 2, cy + 2, 18, 16);
    g.fillStyle = '#2a1a16'; g.fillRect(cx - 1, cy - 1, 20, 18);
    g.fillStyle = '#6a3a2a'; g.fillRect(cx, cy, 18, 16);
    g.fillStyle = '#4a2a20';
    for (let y = cy + 3; y < cy + 16; y += 4) { g.fillRect(cx, y, 18, 1); for (let x = cx + ((y / 4) % 2 ? 2 : 6); x < cx + 18; x += 8) g.fillRect(x, y - 3, 1, 3); }
    g.fillStyle = '#121010'; g.fillRect(cx + 4, cy + 4, 10, 8);
    return { canvas: c, x: x0, y: y0 };
  }

  function drawRoof(ctx, state) {
    if (state.floor !== 0 || roof.alpha <= 0) return;
    if (!roof.cache) roof.cache = buildRoof(state);
    const { ox, oy } = state.view;
    const rc = roof.cache;
    const a = Math.ceil(roof.alpha * 4) / 4;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.drawImage(rc.canvas, rc.x + ox, rc.y + oy);
    // Luz sobre el techo: luna tenue en todo y más cálido bajo los faroles.
    const D = state.G.floors[0];
    ctx.beginPath();
    for (const [x, y, w, h] of roofRects(D)) ctx.rect(x + ox - 1, y + oy - 1, w + 2, h + 2);
    ctx.clip();
    ctx.fillStyle = 'rgba(10,22,36,0.45)';
    ctx.fillRect(0, 0, state.view.w, state.view.h);
    ctx.fillStyle = 'rgba(225,182,110,0.10)';
    for (const l of (D.base && D.base.lamps) || []) {
      ctx.beginPath();
      ctx.arc(l.x + ox, l.y + oy, l.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    // Luz tenue sobre la entrada (bajo el borde del techo).
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(225,182,110,0.18)';
    ctx.fillRect(595 + ox, ROOF_CUT_Y + oy, 90, 22);
    ctx.fillStyle = '#e1b66e';
    ctx.fillRect(638 + ox, ROOF_CUT_Y + oy, 4, 2);
    ctx.restore();
  }

  Umbra.render = { map, player, sprite: spriteCanvas, mood };

  Umbra.register({
    order: 6, // después de lighting.js (5): los ojos van sobre la oscuridad
    start() {
      floorCache.length = 0;
      roomLabel.key = null;
      roomLabel.t = Infinity;
      hud.alertUntil = -1;
      hud.reliefUntil = -1;
      roof.alpha = 1; // se empieza en el campamento
    },
    update(dt, state) {
      hud.t += dt;
      const outside = state.floor === 0 && state.G.outdoors(0, state.player.x, state.player.y);
      roof.alpha = Math.max(0, Math.min(1, roof.alpha + (outside ? dt : -dt) / 0.3));
      updateRoomLabel(dt, state);
    },
    drawLight(ctx, state) {
      drawRoof(ctx, state);
      eyes(ctx, state);
    },
    drawUI(ctx, state) {
      drawRoomLabel(ctx, state);
      drawHud(ctx, state);
    },
  });
})();
