// Umbra — introducción, objetivo inicial y consejos de contexto.
//   Escena 'intro': texto tipo créditos, línea por línea con fundido; tecla o clic → menú.
//   Al empezar: ventana de OBJETIVO que pausa el juego (state.paused) hasta Enter o clic.
//   Consejos: recuadros arriba a la derecha (bajo "J · Diario"), uno a la vez, una vez por partida.
(function () {
  'use strict';

  const LINES = [
    'Noviembre. Una mansión abandonada en las afueras.',
    'Los vecinos hablan de luces, pasos y voces que nadie puede explicar.',
    'Te contrataron para averiguar qué habita en la Mansión Umbra.',
    'Eres investigador paranormal. Esta noche, trabajas solo.',
  ];
  const PER_LINE = 3;
  const OBJECTIVE = [
    '1. Toma tu equipo en el panel del campamento (E). No olvides la linterna.',
    '2. Entra a la casa y encuentra la habitación de la entidad.',
    '3. Usa tus herramientas (F) para detectar sus evidencias.',
    '4. Identifícala en el diario (J).',
    '5. Vuelve al camión (E) para terminar la investigación.',
    'Si empieza a cazarte: huye o escóndete en un armario.',
  ];

  let introStart = performance.now();
  const tips = { queue: [], current: null, shown: new Set(), t: 0, since: 0 };

  function tip(id, text) {
    if (tips.shown.has(id)) return;
    tips.shown.add(id);
    tips.queue.push(text);
  }

  // ---------- Introducción ----------
  let skippedAt = -1e9;
  function toMenu() {
    if (Umbra.state && Umbra.state.scene === 'intro') Umbra.state.scene = 'menu';
    skippedAt = performance.now();
  }
  // Se registra antes que main.js: en la intro, cualquier tecla o clic solo pasa al menú.
  addEventListener('keydown', (e) => {
    if (Umbra.state && Umbra.state.scene === 'intro') {
      e.preventDefault();
      e.stopImmediatePropagation();
      toMenu();
    }
  });
  addEventListener('mousedown', (e) => {
    if (Umbra.state && Umbra.state.scene === 'intro') {
      e.stopImmediatePropagation();
      toMenu();
    }
  }, true);
  addEventListener('click', (e) => {
    if (Umbra.state && Umbra.state.scene === 'menu' && performance.now() - skippedAt < 400) e.stopImmediatePropagation();
  }, true);

  function drawIntro(ctx, state) {
    const { w, h } = state.view;
    const t = (performance.now() - introStart) / 1000;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    const i = Math.floor(t / PER_LINE);
    if (i >= LINES.length) {
      state.scene = 'menu';
      return;
    }
    const lt = t - i * PER_LINE;
    let a = lt < 0.6 ? lt / 0.6 : lt > PER_LINE - 0.6 ? (PER_LINE - lt) / 0.6 : 1;
    a = Math.max(0, Math.min(1, Math.ceil(a * 4) / 4));
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = '#f2efe6';
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(LINES[i], w / 2, h / 2, w - 24);
    ctx.globalAlpha = 1;
    ctx.font = '8px monospace';
    ctx.fillStyle = '#5a5a60';
    ctx.fillText('Cualquier tecla para continuar', w / 2, h - 12);
    ctx.restore();
  }

  // ---------- Objetivo ----------
  function drawObjective(ctx, state) {
    const { w, h } = state.view;
    ctx.save();
    ctx.fillStyle = 'rgba(5,6,8,0.75)';
    ctx.fillRect(0, 0, w, h);
    const bw = 400;
    const bh = 150;
    const bx = Math.round((w - bw) / 2);
    const by = Math.round((h - bh) / 2);
    ctx.fillStyle = '#3a3328';
    ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
    ctx.fillStyle = '#0b0d10';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = '#e1b66e';
    ctx.fillRect(bx - 2, by - 2, 4, 1);
    ctx.fillRect(bx + bw - 2, by + bh + 1, 4, 1);
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('OBJETIVO', w / 2, by + 18);
    ctx.textAlign = 'left';
    ctx.font = '8px monospace';
    OBJECTIVE.forEach((l, i) => {
      ctx.fillStyle = i === OBJECTIVE.length - 1 ? '#d89e89' : '#d8d2c4';
      ctx.fillText(l, bx + 14, by + 38 + i * 15 + (i === OBJECTIVE.length - 1 ? 4 : 0), bw - 28);
    });
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9eb8cd';
    ctx.fillText('Enter o clic para comenzar', w / 2, by + bh - 8);
    ctx.restore();
  }

  // ---------- Consejos ----------
  function bulb(ctx, x, y) {
    const px = (i, j, c) => { ctx.fillStyle = c; ctx.fillRect(x + i, y + j, 1, 1); };
    const Y = '#f2d36a', W = '#fff6c8', G = '#8a8a90', K = '#0d0b0e';
    const map = ['..KKK..', '.KYWYK.', 'KYWYYYK', 'KYYYYYK', '.KYYYK.', '..KYK..', '..GGG..', '..GGG..', '...G...'];
    map.forEach((row, j) => [...row].forEach((c, i) => {
      const col = { K, Y, W, G }[c];
      if (col) px(i, j, col);
    }));
  }

  function drawTip(ctx, state) {
    if (!tips.current) return;
    const { w } = state.view;
    const t = tips.since;
    // Entra deslizándose desde la derecha y sale igual.
    const slide = t < 0.3 ? 1 - t / 0.3 : t > 4.7 ? (t - 4.7) / 0.3 : 0;
    ctx.save();
    ctx.font = '8px monospace';
    const tw = Math.min(220, Math.ceil(ctx.measureText(tips.current).width) + 30);
    const bx = Math.round(w - tw - 6 + slide * (tw + 10));
    const by = 44; // bajo "J · Diario"
    ctx.fillStyle = '#3a3328';
    ctx.fillRect(bx - 1, by - 1, tw + 2, 28);
    ctx.fillStyle = '#0b0d10';
    ctx.fillRect(bx, by, tw, 26);
    bulb(ctx, bx + 5, by + 8);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#e1b66e';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('Consejo', bx + 18, by + 10);
    ctx.fillStyle = '#d8d2c4';
    ctx.font = '8px monospace';
    ctx.fillText(tips.current, bx + 18, by + 21, tw - 22);
    ctx.restore();
  }

  function hasFlashlight(state) {
    const slots = state.tools && state.tools.slots;
    return !!slots && slots.some((t) => t && t.id === 'flashlight');
  }

  Umbra.on('entity:event', () => tip('event', 'Los ruidos te indican dónde está la entidad.'));
  Umbra.on('evidence:found', () => tip('evidence', 'Revisa tus pruebas en el diario (J).'));
  Umbra.on('power:off', () => tip('power', 'Restablece la luz en los fusibles del garaje.'));
  Umbra.on('hunt:start', () => tip('hunt', '¡Escóndete en un armario y ciérralo con E!'));

  Umbra.register({
    order: 4,
    start(state) {
      state.paused = true; // ventana de objetivo
      tips.queue.length = 0;
      tips.current = null;
      tips.shown.clear();
      tips.t = 0;
    },
    onKey(e, state) {
      if (!state.paused) return false;
      e.preventDefault();
      if ((e.code === 'Enter' || e.code === 'Space') && !e.repeat) {
        state.paused = false;
        state.keys.clear();
      }
      return true;
    },
    onClick(x, y, state) {
      if (state.paused) state.paused = false;
    },
    update(dt, state) {
      tips.t += dt;
      if (tips.t > 3) tip('controls', 'Presiona K para ver los controles.');
      const base = state.G.floors[0].base;
      const p = state.player;
      if (base && state.floor === 0 && !hasFlashlight(state)) {
        const b = base.board;
        if (Math.hypot(p.x - (b[0] + b[2] / 2), p.y - (b[1] + b[3] / 2)) < 60) tip('flashlight', 'No olvides tu linterna.');
      }
      if (!state.G.outdoors(state.floor, p.x, p.y) && !(Umbra.lighting && Umbra.lighting.on)) {
        tip('switch', 'Busca los interruptores junto a las puertas para encender la luz.');
      }
      if (state.stamina && state.stamina.value < 0.3) tip('stamina', 'Correr te cansa. Camina para recuperarte.');
      if (tips.current) {
        tips.since += dt;
        if (tips.since > 5) tips.current = null;
      } else if (tips.queue.length) {
        tips.current = tips.queue.shift();
        tips.since = 0;
      }
    },
    drawUI(ctx, state) {
      drawTip(ctx, state);
    },
    drawOverlay(ctx, state) {
      if (state.paused) drawObjective(ctx, state);
    },
    drawIntro,
  });
})();
