// Umbra — campamento base exterior (frente a la entrada principal).
// La geometría vive en state.G.floors[0].base (tools/maps/mansion-1f.json).
// E junto al panel → 'base:board' · junto a la pizarra → 'base:objectives' · junto al camión → 'base:truck'.
// Con un elemento al alcance se muestra "E · Equipo", "E · Objetivos" o "E · Terminar investigación".
(function () {
  'use strict';

  const REACH = 14; // distancia del borde del objeto al centro del jugador (radio 8 + margen)

  const ITEMS = [
    { key: 'board', event: 'base:board', label: 'E · Equipo', side: 'boardSide' },
    { key: 'objectives', event: 'base:objectives', label: 'E · Objetivos', side: 'objectivesSide' },
    { key: 'truck', event: 'base:truck', label: 'E · Terminar investigación', side: null },
  ];

  function distToRect(p, r) {
    const dx = Math.max(r[0] - p.x, 0, p.x - (r[0] + r[2]));
    const dy = Math.max(r[1] - p.y, 0, p.y - (r[1] + r[3]));
    return Math.hypot(dx, dy);
  }

  // ¿El jugador está del lado accesible? (panel y pizarra se usan solo por el frente)
  function onSide(p, r, side) {
    if (side === 'down') return p.y >= r[1] + r[3];
    if (side === 'up') return p.y <= r[1];
    if (side === 'left') return p.x <= r[0];
    if (side === 'right') return p.x >= r[0] + r[2];
    return true;
  }

  function itemInReach(state) {
    if (state.floor !== 0) return null;
    const base = state.G.floors[0].base;
    if (!base) return null;
    const p = state.player;
    let found = null;
    let best = REACH;
    for (const it of ITEMS) {
      const r = base[it.key];
      if (!r) continue;
      const d = distToRect(p, r);
      if (d <= best && onSide(p, r, it.side && base[it.side])) {
        best = d;
        found = it;
      }
    }
    return found;
  }

  Umbra.base = { itemInReach };

  Umbra.register({
    order: 3, // después de journal/ui, antes de power.js y de la E de main.js
    onKey(e, state) {
      if (e.code !== 'KeyE' || state.scene !== 'play') return false;
      const it = itemInReach(state);
      if (!it) return false;
      if (!e.repeat) Umbra.emit(it.event);
      return true;
    },
    drawUI(ctx, state) {
      if (state.scene !== 'play' || (state.journal && state.journal.open)) return;
      const it = itemInReach(state);
      if (!it) return;
      const { ox, oy } = state.view;
      ctx.save();
      ctx.font = '8px monospace';
      const r = state.G.floors[0].base[it.key];
      const tw = Math.ceil(ctx.measureText(it.label).width) + 6;
      const px = Math.round(state.player.x + ox - tw / 2);
      // Del lado contrario al objeto, para no taparlo (bajo la barra de stamina si va abajo).
      const above = r[1] + r[3] <= state.player.y;
      const py = Math.round(state.player.y + oy) + (above ? 15 : -26);
      ctx.fillStyle = 'rgba(7,9,12,0.8)';
      ctx.fillRect(px, py, tw, 11);
      ctx.fillStyle = '#e1b66e';
      ctx.textAlign = 'left';
      ctx.fillText(it.label, px + 3, py + 8);
      // Resalta el objeto con un marco de 1 px.
      ctx.strokeStyle = '#e1b66e';
      ctx.lineWidth = 1;
      ctx.strokeRect(Math.round(r[0] + ox) - 1.5, Math.round(r[1] + oy) - 1.5, r[2] + 3, r[3] + 3);
      ctx.restore();
    },
  });
})();
