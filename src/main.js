// Umbra — bucle principal (versión inicial de la jornada).
// Recorre la mansión con la geometría de V4. La oscuridad, la investigación
// y la entidad se agregan en sus propios archivos.
(function () {
  'use strict';
  const G = globalThis.UmbraGeometry;

  // Resolución interna baja: se escala sin suavizado para el aspecto pixel art.
  const VIEW_W = 480;
  const VIEW_H = 270;
  const PLAYER = { diameter: 16, visual: 24, walk: 72, run: 102 };

  const screen = document.getElementById('game');
  const sctx = screen.getContext('2d');
  const buffer = document.createElement('canvas');
  buffer.width = VIEW_W;
  buffer.height = VIEW_H;
  const ctx = buffer.getContext('2d');

  const state = {
    scene: 'menu', // menu | play | result
    floor: 0,
    closetOpen: [false, false],
    player: { x: 0, y: 0, facing: 0 },
    keys: new Set(),
    model: null,
    message: '',
    messageUntil: 0,
    view: { w: VIEW_W, h: VIEW_H, ox: 0, oy: 0 }, // pantalla = mundo + (ox, oy)
    G,
  };
  Umbra.state = state;
  Umbra.tell = tell;
  Umbra.rebuild = rebuild;

  const C = {
    void: '#07090c',
    wall: '#9aa3ad',
    furniture: '#3b3f47',
    furnitureEdge: '#555b64',
    stairs: '#4a4038',
    closet: '#2f5a50',
    fuse: '#e1b66e',
    door: '#cfac73',
    window: '#81aac8',
    player: '#e8e3d8',
    text: '#d8d2c4',
  };

  function floorData() {
    return G.floors[state.floor];
  }

  function rebuild() {
    state.model = G.model({ floor: state.floor, closetOpen: state.closetOpen[state.floor] });
  }

  function tell(text, seconds = 3) {
    state.message = text;
    state.messageUntil = performance.now() + seconds * 1000;
  }

  function startGame() {
    const spawn = G.floors[0].spawn;
    state.floor = 0;
    state.closetOpen = [false, false];
    state.player = { x: spawn.x, y: spawn.y, facing: -Math.PI / 2 };
    rebuild();
    state.scene = 'play';
    Umbra.call('start', state);
    Umbra.emit('start');
    tell('Planta baja. Explora la mansión.');
  }

  function nearRect(r, margin) {
    const p = state.player;
    return (
      p.x > r[0] - margin && p.x < r[0] + r[2] + margin &&
      p.y > r[1] - margin && p.y < r[1] + r[3] + margin
    );
  }

  function interact() {
    const D = floorData();
    if (D.closet && nearRect(D.closet, 40)) {
      state.closetOpen[state.floor] = !state.closetOpen[state.floor];
      rebuild();
      tell((state.closetOpen[state.floor] ? 'Abres ' : 'Cierras ') + 'el armario ' + D.closet_id + '.');
      return;
    }
    if (D.fuse && nearRect(D.fuse, 30)) {
      Umbra.emit('power:on'); // power.js restablece la luz y avisa
    }
  }

  // ---------- Entrada ----------
  addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (state.scene === 'menu') {
      if (!e.repeat && (e.code === 'Enter' || e.code === 'Space')) startGame();
      return;
    }
    for (const sys of Umbra.systems) {
      if (sys.onKey && sys.onKey(e, state) === true) return;
    }
    if (state.scene !== 'play') return;
    if (e.code === 'KeyE' && !e.repeat) interact();
    if (e.code === 'Escape') state.scene = 'menu';
    state.keys.add(e.code);
  });
  addEventListener('keyup', (e) => state.keys.delete(e.code));
  addEventListener('blur', () => state.keys.clear());
  screen.addEventListener('click', (e) => {
    if (state.scene === 'menu') {
      startGame();
    } else if (state.scene === 'play') {
      const bounds = screen.getBoundingClientRect();
      const x = (e.clientX - bounds.left) * VIEW_W / bounds.width;
      const y = (e.clientY - bounds.top) * VIEW_H / bounds.height;
      Umbra.call('onClick', x, y, state);
    }
  });

  // ---------- Actualización ----------
  function update(dt) {
    if (state.scene !== 'play' || state.journal?.open) return;
    Umbra.call('update', dt, state);
    const k = state.keys;
    let dx = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    let dy = (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0) - (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0);
    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      state.player.facing = Math.atan2(dy, dx);
      const running = k.has('ShiftLeft') || k.has('ShiftRight');
      const speed = running ? PLAYER.run : PLAYER.walk;
      G.move(state.player, dx * speed * dt, dy * speed * dt, PLAYER.diameter / 2, state.model);
    }
    const dest = G.stairDestination(state.floor, state.player, PLAYER.diameter / 2);
    if (dest) {
      state.floor = dest.floor;
      state.player.x = dest.x;
      state.player.y = dest.y;
      rebuild();
      tell(state.floor === 1 ? 'Segundo piso.' : 'Planta baja.');
    }
  }

  // ---------- Dibujo ----------
  function rect(r, fill, stroke) {
    ctx.fillStyle = fill;
    ctx.fillRect(Math.round(r[0]), Math.round(r[1]), Math.round(r[2]), Math.round(r[3]));
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.strokeRect(Math.round(r[0]) + 0.5, Math.round(r[1]) + 0.5, Math.round(r[2]) - 1, Math.round(r[3]) - 1);
    }
  }

  function line(s, color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(s[0], s[1]);
    ctx.lineTo(s[2], s[3]);
    ctx.stroke();
  }

  function drawWorld() {
    const D = floorData();
    const p = state.player;
    ctx.fillStyle = C.void;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    state.view.ox = Math.round(VIEW_W / 2 - p.x);
    state.view.oy = Math.round(VIEW_H / 2 - p.y);
    ctx.save();
    ctx.translate(state.view.ox, state.view.oy);

    for (const r of D.rooms) rect(r.slice(1, 5), r[5]);
    for (const w of D.windows || []) line(w, C.window, 3);
    const [sx, sy, sw, sh] = D.stairs;
    rect(D.stairs, C.stairs);
    ctx.fillStyle = '#5e5247';
    for (let y = sy + 6; y < sy + sh; y += 12) ctx.fillRect(sx + 2, y, sw - 4, 2);
    for (const f of D.furniture) rect(f.slice(1, 5), C.furniture, C.furnitureEdge);
    for (const c of D.circles) {
      ctx.fillStyle = C.furniture;
      ctx.beginPath();
      ctx.arc(c[0], c[1], c[2], 0, Math.PI * 2);
      ctx.fill();
    }
    if (D.closet) rect(D.closet, C.closet, state.closetOpen[state.floor] ? C.door : '#6fb3a3');
    if (D.fuse) rect(D.fuse, C.fuse);
    for (const s of state.model.walls) line(s, C.wall, s[4]);
    Umbra.call('drawWorld', ctx, state);

    // Jugador: referencia de 24 u con ojos hacia donde mira.
    ctx.fillStyle = C.player;
    ctx.beginPath();
    ctx.arc(p.x, p.y, PLAYER.visual / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10151c';
    const ex = Math.cos(p.facing) * 5;
    const ey = Math.sin(p.facing) * 5;
    const px = -Math.sin(p.facing) * 3;
    const py = Math.cos(p.facing) * 3;
    ctx.fillRect(Math.round(p.x + ex + px - 1), Math.round(p.y + ey + py - 1), 2, 2);
    ctx.fillRect(Math.round(p.x + ex - px - 1), Math.round(p.y + ey - py - 1), 2, 2);
    ctx.restore();
    Umbra.call('drawLight', ctx, state);
    Umbra.call('drawUI', ctx, state);

    if (performance.now() < state.messageUntil) {
      ctx.fillStyle = 'rgba(7,9,12,.75)';
      ctx.fillRect(0, VIEW_H - 22, VIEW_W, 22);
      ctx.fillStyle = C.text;
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(state.message, VIEW_W / 2, VIEW_H - 8);
    }
    Umbra.call('drawOverlay', ctx, state);
  }

  function drawMenu() {
    ctx.fillStyle = C.void;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = C.text;
    ctx.font = 'bold 32px monospace';
    ctx.fillText('UMBRA', VIEW_W / 2, 95);
    ctx.font = '10px monospace';
    ctx.fillStyle = '#8c9cac';
    ctx.fillText('Identifica a la entidad antes de que te encuentre.', VIEW_W / 2, 125);
    ctx.fillText('WASD / flechas: moverse · Shift: correr', VIEW_W / 2, 170);
    ctx.fillText('E: interactuar · L: linterna · Esc: menú', VIEW_W / 2, 183);
    ctx.fillText('Tab: diario', VIEW_W / 2, 196);
    ctx.fillStyle = C.fuse;
    ctx.fillText('Pulsa Enter o haz clic para comenzar', VIEW_W / 2, 219);
    // Los ojos en la oscuridad.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(VIEW_W / 2 - 9, 145, 6, 2);
    ctx.fillRect(VIEW_W / 2 + 3, 145, 6, 2);
  }

  // ---------- Escalado a pantalla ----------
  function resize() {
    const scale = Math.max(1, Math.floor(Math.min(innerWidth / VIEW_W, innerHeight / VIEW_H)));
    screen.width = VIEW_W * scale;
    screen.height = VIEW_H * scale;
    sctx.imageSmoothingEnabled = false;
  }
  addEventListener('resize', resize);
  resize();

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.25, (now - last) / 1000);
    last = now;
    update(dt);
    if (state.scene === 'play') drawWorld();
    else if (state.scene === 'result') Umbra.call('drawResult', ctx, state);
    else drawMenu();
    sctx.imageSmoothingEnabled = false;
    sctx.drawImage(buffer, 0, 0, screen.width, screen.height);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
