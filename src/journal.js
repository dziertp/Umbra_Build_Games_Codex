// Umbra — diario de investigación: un libro de dos páginas con tres pestañas.
//   ENTIDADES: grilla de nombres (paginada) + ficha de la entidad.
//   EQUIPO:    herramientas con su tecla + ficha y evidencia que detecta.
//   PRUEBAS:   8 evidencias (sin marcar → confirmada → descartada) + qué entidades encajan.
// Tab / J abre y cierra (el juego queda en pausa). Q/E pestañas, flechas, Enter, clic.
// Todo el contenido sale de Umbra.data; la respuesta queda en state.journal.answer (ui.js).
// Íconos: si una evidencia trae `icon: 'assets/icons/<id>.png'`, se usa esa imagen.
(function () {
  'use strict';

  const TABS = ['ENTIDADES', 'EQUIPO', 'PRUEBAS', 'CONTROLES'];
  const MOVEMENT_CONTROLS = [
    ['WASD / Flechas', 'Moverse'],
    ['Shift', 'Correr'],
    ['E', 'Interactuar o esconderse'],
    ['L', 'Encender o apagar linterna'],
    ['F', 'Usar herramienta'],
    ['M', 'Activar o silenciar sonido'],
    ['G', 'Devolver equipo en el porche'],
  ];
  const JOURNAL_CONTROLS = [
    ['1–3', 'Equipar un espacio del inventario'],
    ['Tab / J', 'Abrir o cerrar el diario'],
    ['Q / E', 'Cambiar pestaña'],
    ['Flechas', 'Navegar en el diario'],
    ['Enter / Espacio', 'Marcar o elegir en Pruebas'],
    ['Clic', 'Seleccionar elementos'],
    ['Esc', 'Cerrar diario o volver al menú'],
  ];
  const C = {
    shade: 'rgba(5,6,8,0.9)',
    cover: '#3b2b20',
    coverEdge: '#21180f',
    paper: '#a39577',
    paperDark: '#918468',
    paperLine: '#7d715a',
    spot: '#9a8c6f',
    ink: '#241c14',
    inkSoft: '#54493a',
    inkFaint: '#7d7058',
    red: '#7c2b22',
    green: '#2d5230',
    select: '#8c7f63',
    tabOff: '#6e6250',
    hint: '#8c9cac',
  };
  // Libro: tapa, dos páginas y lomo.
  const BOOK = { x: 22, y: 12, w: 428, h: 240 };
  const LEFT = { x: 36, y: 16, w: 190 };
  const RIGHT = { x: 246, y: 16, w: 190 };
  const GRID = { cols: 3, row: 12 };

  // ---------- Íconos de evidencias (12×12, pocos colores) ----------
  const ICONS = {
    emf: { pal: { k: '#241c14', r: '#c4503c', d: '#5a4a3a' }, px: [
      'kkkkkkkkkkkk', 'k..........k', 'kr.r.r.r.r.k', 'kr.r.r.r.r.k', 'k..........k', 'kkkkkkkkkkkk',
      '....kddk....', '....kddk....', '....kddk....', '....kddk....', '....kddk....', '....kkkk....'] },
    uv: { pal: { p: '#5f3f8c' }, px: [
      '...p.p.p....', '...p.p.p.p..', '.p.p.p.p.p..', '.p.p.p.p.p..', '.p.ppppppp..', '.ppppppppp..',
      '..pppppppp..', '..pppppppp..', '...pppppp...', '...pppppp...', '....pppp....', '............'] },
    spiritbox: { pal: { k: '#241c14', s: '#5a4a3a', g: '#4f7f4a' }, px: [
      '.........k..', '........k...', '.......k....', 'kkkkkkkkkkkk', 'k..........k', 'k.s.s..ggg.k',
      'k..s.s.....k', 'k.s.s..k.k.k', 'k..........k', 'kkkkkkkkkkkk', '............', '............'] },
    orbs: { pal: { o: '#5f7a72', w: '#e6ecd4' }, px: [
      '............', '..oo........', '.owwo.......', '.owwo....o..', '..oo....owo.', '.........o..',
      '....oo......', '...owwo.....', '...owwo.....', '....oo......', '............', '............'] },
    freezing: { pal: { b: '#2f5f86' }, px: [
      '.....b......', '...b.b.b....', '....bbb.....', '.b..bbb..b..', '..b.bbb.b...', 'bbbbbbbbbbb.',
      '..b.bbb.b...', '.b..bbb..b..', '....bbb.....', '...b.b.b....', '.....b......', '............'] },
    writing: { pal: { k: '#241c14', w: '#d4c9ab', r: '#7c2b22' }, px: [
      '.kkkkkkkkk..', '.kwwwwwwwk..', '.kwrrwrwwk..', '.kwwrrwrrk..', '.kwwwwwwwk..', '.kwrwrrwwk..',
      '.kwwrwwrrk..', '.kwwwwwwwk..', '.kwrrrwwwk..', '.kwwwwwwwk..', '.kkkkkkkkk..', '............'] },
    laser: { pal: { g: '#3f8a3a', k: '#241c14' }, px: [
      'g.g.g.g.g.g.', '............', 'g.g.gkk.g.g.', '.....kk.....', 'g.g.kkkkg.g.', '....kkkk....',
      'g.gkkkkkkg.g', '....kkkk....', 'g.g.kkkkg.g.', '....k..k....', 'g.g.kg.kg.g.', '............'] },
    wither: { pal: { v: '#4f5a32', p: '#7a5a3e', y: '#9a8434', k: '#3b2b20' }, px: [
      '............', '....vvvv....', '...v....v...', '...v.....v..', '...v.....pp.', '...v....pyyp',
      '...v.....pp.', '...v...p....', '...v........', '..vvv.......', '.kkkkk..p...', '.kkkkk......'] },
    unknown: { pal: { k: '#241c14' }, px: [
      '............', '...kkkkk....', '..kk...kk...', '.......kk...', '......kk....', '.....kk.....',
      '.....kk.....', '............', '.....kk.....', '.....kk.....', '............', '............'] },
  };
  const images = {}; // id → Image cargada (solo si la evidencia declara `icon`)

  function loadImages() {
    for (const ev of Umbra.data.evidence || []) {
      if (!ev.icon || images[ev.id]) continue;
      const img = new Image();
      img.onload = () => { images[ev.id] = img; };
      img.src = ev.icon;
    }
  }

  function drawIcon(ctx, id, x, y) {
    x = Math.round(x);
    y = Math.round(y);
    const img = images[id];
    if (img) {
      const s = Math.min(16, Math.max(img.width, img.height));
      ctx.drawImage(img, x + 6 - s / 2, y + 6 - s / 2, s, s);
      return;
    }
    const icon = ICONS[id] || ICONS.unknown;
    for (let j = 0; j < icon.px.length; j++) {
      const row = icon.px[j];
      for (let i = 0; i < row.length; i++) {
        const col = icon.pal[row[i]];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(x + i, y + j, 1, 1);
      }
    }
  }

  // ---------- Utilidades ----------
  const data = () => Umbra.data;
  const evidenceById = (id) => (data().evidence || []).find((e) => e.id === id);
  function wrap(ctx, text, maxW) {
    const lines = [];
    let line = '';
    for (const word of String(text || '').split(/\s+/)) {
      const test = line ? line + ' ' + word : word;
      if (line && ctx.measureText(test).width > maxW) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function text(ctx, str, x, y, color, font, maxW) {
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.fillText(str, Math.round(x), Math.round(y), maxW);
  }

  // Estado de cada evidencia: 0 sin marcar, 1 confirmada, 2 descartada.
  function mark(j, id) {
    return j.marks[id] || 0;
  }

  function compatible(j, entity) {
    for (const ev of data().evidence) {
      const m = mark(j, ev.id);
      if (m === 1 && !entity.evidence.includes(ev.id)) return false;
      if (m === 2 && entity.evidence.includes(ev.id)) return false;
    }
    return true;
  }

  // Grilla paginada: devuelve la página actual y cuántas hay.
  function gridPage(sel, count, rows) {
    const per = GRID.cols * rows;
    return { page: Math.floor(sel / per), pages: Math.max(1, Math.ceil(count / per)), per };
  }

  // Movimiento en grilla; devuelve null si se sale por un costado.
  function gridMove(sel, count, dx, dy) {
    const col = sel % GRID.cols;
    if (dx < 0 && col === 0) return null;
    if (dx > 0 && (col === GRID.cols - 1 || sel === count - 1)) return null;
    const next = sel + dx + dy * GRID.cols;
    if (next < 0) return sel;
    if (next >= count) return dy > 0 ? sel : count - 1;
    return next;
  }

  // ---------- Dibujo ----------
  function hit(j, x, y, w, h, fn) {
    j.hits.push({ x, y, w, h, fn });
  }

  function drawBook(ctx, j) {
    const { x, y, w, h } = BOOK;
    // Pestañas (detrás de la tapa).
    TABS.forEach((label, i) => {
      const ty = y + 12 + i * 56;
      const active = j.tab === i;
      ctx.fillStyle = C.coverEdge;
      ctx.fillRect(x + w - 2, ty - 1, 20, 54);
      ctx.fillStyle = active ? C.paper : C.tabOff;
      ctx.fillRect(x + w - 2, ty, active ? 19 : 17, 52);
      ctx.save();
      ctx.translate(x + w + 11, ty + 26);
      ctx.rotate(Math.PI / 2);
      ctx.textAlign = 'center';
      text(ctx, label, 0, 3, active ? C.ink : '#2e261d', 'bold 8px monospace', 48);
      ctx.restore();
      hit(j, x + w - 2, ty, 19, 52, () => setTab(j, i));
    });
    // Tapa.
    ctx.fillStyle = C.coverEdge;
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = C.cover;
    ctx.fillRect(x, y, w, h);
    // Cantos de hojas.
    ctx.fillStyle = C.paperLine;
    ctx.fillRect(x + 3, y + 4, w - 6, h - 6);
    ctx.fillStyle = C.paperDark;
    ctx.fillRect(x + 4, y + 4, w - 8, h - 8);
    // Páginas.
    ctx.fillStyle = C.paper;
    ctx.fillRect(x + 4, y + 4, w / 2 - 5, h - 10);
    ctx.fillRect(x + w / 2 + 1, y + 4, w / 2 - 5, h - 10);
    // Lomo.
    ctx.fillStyle = C.paperDark;
    ctx.fillRect(x + w / 2 - 4, y + 4, 3, h - 10);
    ctx.fillRect(x + w / 2 + 1, y + 4, 3, h - 10);
    ctx.fillStyle = C.paperLine;
    ctx.fillRect(x + w / 2 - 1, y + 4, 2, h - 8);
    // Manchas de papel viejo (fijas).
    ctx.fillStyle = C.spot;
    for (let i = 0; i < 24; i++) {
      const sx = x + 8 + ((i * 97) % (w - 16));
      const sy = y + 8 + ((i * 53 + i * i * 7) % (h - 20));
      if (Math.abs(sx - (x + w / 2)) > 6) ctx.fillRect(sx, sy, 1 + (i % 2), 1);
    }
  }

  function pageTitle(ctx, page, str) {
    text(ctx, str, page.x, page.y + 14, C.ink, 'bold 10px monospace', page.w);
    ctx.fillStyle = C.inkSoft;
    ctx.fillRect(page.x, page.y + 18, page.w, 1);
  }

  // Grilla de entidades (ENTIDADES izquierda y PRUEBAS derecha).
  function entityGrid(ctx, j, page, top, rows, focused, opts) {
    const list = data().entities;
    const { page: pg, pages, per } = gridPage(j.entitySel, list.length, rows);
    const cw = page.w / GRID.cols;
    for (let k = 0; k < per; k++) {
      const i = pg * per + k;
      const e = list[i];
      if (!e) break;
      const cx = page.x + (k % GRID.cols) * cw;
      const cy = top + Math.floor(k / GRID.cols) * GRID.row;
      const ok = !opts.filter || compatible(j, e);
      const isAnswer = opts.answer && j.answer === e.id;
      if (isAnswer) {
        ctx.fillStyle = C.ink;
        ctx.fillRect(cx, cy, cw - 2, GRID.row - 1);
      } else if (i === j.entitySel) {
        ctx.fillStyle = C.select;
        ctx.fillRect(cx, cy, cw - 2, GRID.row - 1);
      }
      if (i === j.entitySel && focused) {
        ctx.strokeStyle = isAnswer ? C.red : C.ink;
        ctx.lineWidth = 1;
        ctx.strokeRect(cx + 0.5, cy + 0.5, cw - 3, GRID.row - 2);
      }
      const color = isAnswer ? C.paper : ok ? C.ink : C.inkFaint;
      text(ctx, e.name, cx + 3, cy + 9, color, '8px monospace', cw - 7);
      if (!ok) {
        const tw = Math.min(cw - 7, ctx.measureText(e.name).width);
        ctx.fillStyle = C.red;
        ctx.fillRect(cx + 2, cy + 6, tw + 2, 1);
      }
      hit(j, cx, cy, cw - 2, GRID.row - 1, () => {
        j.entitySel = i;
        j.focus = opts.focusIndex;
        if (opts.answer) j.answer = j.answer === e.id ? null : e.id;
      });
    }
    if (pages > 1) {
      const y = top + rows * GRID.row + 9;
      const mid = page.x + page.w / 2;
      ctx.textAlign = 'center';
      text(ctx, 'Página ' + (pg + 1) + '/' + pages, mid, y, C.inkSoft, '8px monospace');
      ctx.textAlign = 'left';
      text(ctx, '< Anterior', page.x, y, pg > 0 ? C.ink : C.inkFaint, '8px monospace');
      ctx.textAlign = 'right';
      text(ctx, 'Siguiente >', page.x + page.w, y, pg < pages - 1 ? C.ink : C.inkFaint, '8px monospace');
      ctx.textAlign = 'left';
      hit(j, page.x, y - 8, 56, 11, () => { if (pg > 0) j.entitySel = (pg - 1) * per; });
      hit(j, page.x + page.w - 60, y - 8, 60, 11, () => { if (pg < pages - 1) j.entitySel = (pg + 1) * per; });
    }
  }

  function evidenceRow(ctx, j, ev, x, y, w) {
    drawIcon(ctx, ev.id, x, y);
    const m = mark(j, ev.id);
    text(ctx, ev.name, x + 16, y + 9, C.ink, '9px monospace', w - 30);
    if (m) text(ctx, m === 1 ? '✓' : '✗', x + w - 8, y + 9, m === 1 ? C.green : C.red, 'bold 9px monospace');
  }

  function paragraph(ctx, str, page, y, maxLines, font = '9px monospace', lh = 11) {
    ctx.font = font;
    const lines = wrap(ctx, str, page.w);
    lines.slice(0, maxLines).forEach((l, i) => text(ctx, l, page.x, y + i * lh, C.inkSoft, font));
    return y + Math.min(lines.length, maxLines) * lh;
  }

  function drawEntities(ctx, j) {
    pageTitle(ctx, LEFT, TABS[0][0] + TABS[0].slice(1).toLowerCase());
    entityGrid(ctx, j, LEFT, LEFT.y + 26, 15, true, { focusIndex: 0 });
    const e = data().entities[j.entitySel];
    if (!e) return;
    pageTitle(ctx, RIGHT, e.name);
    let y = paragraph(ctx, e.description, RIGHT, RIGHT.y + 32, 9);
    y += 8;
    text(ctx, 'Evidencias', RIGHT.x, y, C.ink, 'bold 9px monospace');
    y += 6;
    for (const id of e.evidence) {
      const ev = evidenceById(id) || { id, name: id };
      evidenceRow(ctx, j, ev, RIGHT.x, y, RIGHT.w);
      y += 16;
    }
  }

  function drawEquipment(ctx, j, slots) {
    const tools = data().tools || [];
    pageTitle(ctx, LEFT, 'Equipo');
    tools.forEach((t, i) => {
      const y = LEFT.y + 26 + i * 17;
      if (i === j.toolSel) {
        ctx.fillStyle = C.select;
        ctx.fillRect(LEFT.x, y, LEFT.w, 15);
        ctx.strokeStyle = C.ink;
        ctx.strokeRect(LEFT.x + 0.5, y + 0.5, LEFT.w - 1, 14);
      }
      ctx.strokeStyle = C.ink;
      ctx.strokeRect(LEFT.x + 3.5, y + 2.5, 11, 10);
      ctx.textAlign = 'center';
      const slot = slots.indexOf(t);
      text(ctx, slot < 0 ? '–' : String(slot + 1), LEFT.x + 9, y + 11, C.ink, 'bold 8px monospace');
      ctx.textAlign = 'left';
      text(ctx, t.name, LEFT.x + 20, y + 11, C.ink, '9px monospace', LEFT.w - 40);
      const evId = (t.evidence || [])[0];
      if (evId) drawIcon(ctx, evId, LEFT.x + LEFT.w - 15, y + 1);
      hit(j, LEFT.x, y, LEFT.w, 15, () => { j.toolSel = i; });
    });
    const t = tools[j.toolSel];
    if (!t) return;
    pageTitle(ctx, RIGHT, t.name);
    const slot = slots.indexOf(t);
    const hint = slot < 0 ? 'Recógela en el porche con E' : 'Espacio ' + (slot + 1) + ' · F para usar al equiparla';
    text(ctx, hint, RIGHT.x, RIGHT.y + 32, C.inkSoft, '8px monospace', RIGHT.w);
    let y = paragraph(ctx, t.description, RIGHT, RIGHT.y + 48, 9);
    y += 8;
    text(ctx, 'Detecta', RIGHT.x, y, C.ink, 'bold 9px monospace');
    y += 6;
    for (const id of t.evidence || []) {
      const ev = evidenceById(id) || { id, name: id };
      evidenceRow(ctx, j, ev, RIGHT.x, y, RIGHT.w);
      y += 16;
    }
  }

  function drawControls(ctx, page, title, controls) {
    pageTitle(ctx, page, title);
    const keyWidth = 82;
    const actionX = page.x + keyWidth + 8;
    controls.forEach(([keys, action], index) => {
      const y = page.y + 29 + index * 28;
      ctx.fillStyle = C.paperDark;
      ctx.fillRect(page.x, y, keyWidth, 17);
      text(ctx, keys, page.x + 4, y + 12, C.ink, 'bold 8px monospace', keyWidth - 8);
      ctx.font = '9px monospace';
      wrap(ctx, action, page.w - keyWidth - 8).forEach((line, row) => {
        text(ctx, line, actionX, y + 9 + row * 10, C.ink, '9px monospace');
      });
      ctx.fillStyle = C.paperLine;
      ctx.fillRect(page.x, y + 23, page.w, 1);
    });
  }

  function drawProof(ctx, j) {
    const evs = data().evidence;
    pageTitle(ctx, LEFT, 'Pruebas');
    const cw = LEFT.w / 3;
    const ch = 40;
    const top = LEFT.y + 24;
    evs.forEach((ev, i) => {
      const cx = LEFT.x + (i % 3) * cw;
      const cy = top + Math.floor(i / 3) * ch;
      const m = mark(j, ev.id);
      const sel = j.evSel === i;
      if (sel) {
        ctx.fillStyle = C.select;
        ctx.fillRect(cx + 1, cy, cw - 2, ch - 2);
        if (j.focus === 0) {
          ctx.strokeStyle = C.ink;
          ctx.strokeRect(cx + 1.5, cy + 0.5, cw - 3, ch - 3);
        }
      }
      const ix = cx + cw / 2 - 6;
      drawIcon(ctx, ev.id, ix, cy + 4);
      if (m === 1) {
        ctx.strokeStyle = C.green;
        ctx.strokeRect(Math.round(ix) - 2.5, cy + 1.5, 16, 16);
      }
      ctx.font = '7px monospace';
      const lines = wrap(ctx, ev.name, cw - 6).slice(0, 2);
      ctx.textAlign = 'center';
      lines.forEach((l, k) => text(ctx, l, cx + cw / 2, cy + 26 + k * 8, m === 2 ? C.inkFaint : C.ink, '7px monospace', cw - 4));
      ctx.textAlign = 'left';
      if (m === 2) {
        ctx.fillStyle = C.red;
        for (let d = 0; d < 14; d++) {
          ctx.fillRect(Math.round(ix) - 1 + d, cy + 3 + d, 1, 1);
          ctx.fillRect(Math.round(ix) + 12 - d, cy + 3 + d, 1, 1);
        }
      }
      hit(j, cx + 1, cy, cw - 2, ch - 2, () => {
        j.evSel = i;
        j.focus = 0;
        cycle(j, ev.id);
      });
    });
    const ev = evs[j.evSel];
    if (ev) {
      let y = top + 3 * ch + 8;
      const m = mark(j, ev.id);
      const status = m === 1 ? (j.detected.has(ev.id) ? 'Confirmada (detectada)' : 'Confirmada') : m === 2 ? 'Descartada' : 'Sin marcar';
      text(ctx, ev.name, LEFT.x, y, C.ink, 'bold 9px monospace', LEFT.w - 4);
      y += 10;
      text(ctx, status, LEFT.x, y, m === 1 ? C.green : m === 2 ? C.red : C.inkSoft, '8px monospace');
      paragraph(ctx, ev.description, LEFT, y + 11, 4, '8px monospace', 10);
    }

    // Página derecha: qué entidades encajan.
    text(ctx, 'Según la evidencia,', RIGHT.x, RIGHT.y + 14, C.ink, 'bold 10px monospace', RIGHT.w);
    text(ctx, 'la entidad es…', RIGHT.x, RIGHT.y + 26, C.ink, 'bold 10px monospace', RIGHT.w);
    ctx.fillStyle = C.inkSoft;
    ctx.fillRect(RIGHT.x, RIGHT.y + 30, RIGHT.w, 1);
    entityGrid(ctx, j, RIGHT, RIGHT.y + 36, 13, j.focus === 1, { focusIndex: 1, filter: true, answer: true });
    const left = data().entities.filter((e) => compatible(j, e)).length;
    const answer = data().entities.find((e) => e.id === j.answer);
    const by = BOOK.y + BOOK.h - 26;
    text(ctx, 'Posibles: ' + left + ' de ' + data().entities.length, RIGHT.x, by, C.inkSoft, '8px monospace');
    text(ctx, answer ? 'Respuesta: ' + answer.name + '. Sal por la puerta principal.' : 'Elige tu respuesta con Enter o clic.',
      RIGHT.x, by + 10, answer ? C.red : C.inkSoft, answer ? 'bold 8px monospace' : '8px monospace', RIGHT.w);
  }

  // ---------- Acciones ----------
  function setTab(j, i) {
    j.tab = (i + TABS.length) % TABS.length;
    j.focus = 0;
  }

  function cycle(j, id) {
    j.marks[id] = (mark(j, id) + 1) % 3;
  }

  function navigate(j, code) {
    if (j.tab === 3) return;
    const dx = code === 'ArrowLeft' ? -1 : code === 'ArrowRight' ? 1 : 0;
    const dy = code === 'ArrowUp' ? -1 : code === 'ArrowDown' ? 1 : 0;
    const entities = data().entities.length;
    if (j.tab === 0) {
      const n = gridMove(j.entitySel, entities, dx, dy);
      if (n !== null) j.entitySel = n;
    } else if (j.tab === 1) {
      j.toolSel = Math.max(0, Math.min(data().tools.length - 1, j.toolSel + dy));
    } else if (j.focus === 0) {
      const n = gridMove(j.evSel, data().evidence.length, dx, dy);
      if (n === null) { if (dx > 0) j.focus = 1; } else j.evSel = n;
    } else {
      const n = gridMove(j.entitySel, entities, dx, dy);
      if (n === null) { if (dx < 0) j.focus = 0; } else j.entitySel = n;
    }
  }

  function activate(j) {
    if (j.tab !== 2) return;
    if (j.focus === 0) {
      const ev = data().evidence[j.evSel];
      if (ev) cycle(j, ev.id);
    } else {
      const e = data().entities[j.entitySel];
      if (e) j.answer = j.answer === e.id ? null : e.id;
    }
  }

  Umbra.on('evidence:found', ({ id }, state) => {
    const j = state.journal;
    if (!j) return;
    j.detected.add(id);
    j.marks[id] = 1;
  });

  Umbra.register({
    order: 0,
    start(state) {
      loadImages();
      state.journal = {
        open: false,
        tab: 0,
        focus: 0,      // 0 página izquierda, 1 página derecha (en PRUEBAS)
        entitySel: 0,
        toolSel: 0,
        evSel: 0,
        marks: {},     // id de evidencia → 1 confirmada, 2 descartada
        detected: new Set(),
        answer: null,  // id de la entidad elegida (lo lee ui.js)
        hits: [],
      };
    },
    onKey(event, state) {
      if (state.scene !== 'play' || !state.journal) return false;
      const j = state.journal;
      if (event.code === 'Tab' || event.code === 'KeyJ') {
        event.preventDefault();
        if (!event.repeat) {
          j.open = !j.open;
          state.keys.clear();
        }
        return true;
      }
      if (!j.open) return false;
      event.preventDefault();
      const code = event.code;
      if (code === 'Escape') j.open = false;
      else if (code === 'KeyQ' && !event.repeat) setTab(j, j.tab - 1);
      else if (code === 'KeyE' && !event.repeat) setTab(j, j.tab + 1);
      else if (code.startsWith('Arrow')) navigate(j, code);
      else if ((code === 'Enter' || code === 'Space') && !event.repeat) activate(j);
      return true; // con el diario abierto, ninguna tecla llega al juego
    },
    onClick(x, y, state) {
      const j = state.journal;
      if (!j || !j.open) return;
      for (let i = j.hits.length - 1; i >= 0; i--) {
        const h = j.hits[i];
        if (x >= h.x && x < h.x + h.w && y >= h.y && y < h.y + h.h) {
          h.fn();
          return;
        }
      }
    },
    drawOverlay(ctx, state) {
      const j = state.journal;
      if (!j || !j.open) return;
      j.hits = [];
      ctx.save();
      ctx.textAlign = 'left';
      ctx.fillStyle = C.shade;
      ctx.fillRect(0, 0, state.view.w, state.view.h);
      ctx.fillStyle = '#07090c'; // tapa los mensajes del juego bajo la línea de ayuda
      ctx.fillRect(0, BOOK.y + BOOK.h + 2, state.view.w, state.view.h - BOOK.y - BOOK.h - 2);
      drawBook(ctx, j);
      if (j.tab === 0) drawEntities(ctx, j);
      else if (j.tab === 1) drawEquipment(ctx, j, state.tools.slots);
      else if (j.tab === 2) drawProof(ctx, j);
      else {
        drawControls(ctx, LEFT, 'Movimiento e interacción', MOVEMENT_CONTROLS);
        drawControls(ctx, RIGHT, 'Investigación e interfaz', JOURNAL_CONTROLS);
      }
      ctx.textAlign = 'center';
      const footer = j.tab === 3
        ? 'Q/E o clic: cambiar pestaña · Tab/J o Esc: cerrar'
        : 'Q/E pestaña · Flechas · Enter marcar/elegir · Clic · Tab/J cerrar';
      text(ctx, footer, state.view.w / 2, state.view.h - 5, C.hint, '8px monospace');
      ctx.restore();
    },
  });
})();
