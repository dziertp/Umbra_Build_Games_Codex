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
    scene: 'intro', // intro | menu | play | result (intro.js)
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
    tell('Campamento. Toma tu equipo en el panel (E) y entra a la casa.', 5);
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
    const bounds = screen.getBoundingClientRect();
    const x = (e.clientX - bounds.left) * VIEW_W / bounds.width;
    const y = (e.clientY - bounds.top) * VIEW_H / bounds.height;
    if (state.scene === 'menu') {
      if (!Umbra.audio.menuClick(x, y)) startGame();
    } else if (state.scene === 'play') {
      Umbra.call('onClick', x, y, state);
    }
  });
  screen.addEventListener('pointermove', (e) => {
    if (state.scene !== 'play' || state.journal?.mode !== 'board') return;
    const bounds = screen.getBoundingClientRect();
    Umbra.call('onPointer', (e.clientX - bounds.left) * VIEW_W / bounds.width,
      (e.clientY - bounds.top) * VIEW_H / bounds.height, state);
  });

  // ---------- Actualización ----------
  function update(dt) {
    if (state.scene !== 'play' || state.journal?.open || state.paused) return;
    Umbra.call('update', dt, state);
    const k = state.keys;
    let dx = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    let dy = (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0) - (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0);
    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      state.player.facing = Math.atan2(dy, dx);
      const running = (k.has('ShiftLeft') || k.has('ShiftRight')) && state.player.canRun !== false; // stamina.js
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

    Umbra.render.map(ctx, state); // suelos, muebles, armario, muros (src/render.js)
    Umbra.call('drawWorld', ctx, state);
    Umbra.render.player(ctx, state); // sprite del investigador (src/render.js)
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
    ctx.fillText('UMBRA', VIEW_W / 2, 91);
    ctx.font = '10px monospace';
    ctx.fillStyle = '#8c9cac';
    ctx.fillText('Encuentra evidencias, identifica a la entidad', VIEW_W / 2, 119);
    ctx.fillText('en el diario y termina en el camión del campamento.', VIEW_W / 2, 132);
    ctx.fillStyle = C.fuse;
    ctx.fillText('Enter o clic para comenzar la partida', VIEW_W / 2, 180);
    ctx.save(); ctx.font = '8px monospace'; ctx.fillStyle = '#5a6470'; ctx.fillText('Hecho en vivo con Codex', VIEW_W / 2, VIEW_H - 6); ctx.restore();
    // Los ojos en la oscuridad.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(VIEW_W / 2 - 9, 147, 6, 2);
    ctx.fillRect(VIEW_W / 2 + 3, 147, 6, 2);
    Umbra.call('drawMenu', ctx, state);
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
    Umbra.call('updateAudio', state);
    if (state.scene === 'play') drawWorld();
    else if (state.scene === 'result') Umbra.call('drawResult', ctx, state);
    else if (state.scene === 'intro') Umbra.call('drawIntro', ctx, state);
    else drawMenu();
    sctx.imageSmoothingEnabled = false;
    sctx.drawImage(buffer, 0, 0, screen.width, screen.height);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
