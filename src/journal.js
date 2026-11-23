(function () {
  'use strict';

  const columns = [
    { data: 'evidence', title: 'Evidencias', x: 24, width: 232 },
    { data: 'entities', title: 'Entidades', x: 264, width: 192 },
  ];
  const top = 66;
  const rowHeight = 19;
  const visibleRows = 8;

  function visibleRange(journal, column) {
    const items = Umbra.data[columns[column].data];
    const first = Math.max(0, journal.rows[column] - visibleRows + 1);
    return [first, Math.min(items.length, first + visibleRows)];
  }

  function activate(state) {
    const journal = state.journal;
    const id = Umbra.data[columns[journal.column].data][journal.rows[journal.column]]?.id;
    if (!id) return;
    if (journal.column === 1) {
      journal.answer = id;
    } else if (journal.marked.has(id)) {
      journal.marked.delete(id);
    } else {
      journal.marked.add(id);
    }
  }

  Umbra.on('evidence:found', ({ id }, state) => {
    const journal = state.journal;
    if (journal.detected.has(id)) return;
    journal.detected.add(id);
    journal.marked.add(id);
  });

  Umbra.register({
    order: 0,
    start(state) {
      state.journal = {
        open: false, marked: new Set(), detected: new Set(), answer: null, column: 0, rows: [0, 0],
      };
    },
    onKey(event, state) {
      if (state.scene !== 'play') return false;
      const journal = state.journal;
      if (event.code === 'Tab' || event.code === 'KeyJ') {
        event.preventDefault();
        if (!event.repeat) {
          journal.open = !journal.open;
          state.keys.clear();
        }
        return true;
      }
      if (!journal.open) return false;

      if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
        journal.column = Number(event.code === 'ArrowRight');
      } else if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
        const column = journal.column;
        const count = Umbra.data[columns[column].data].length;
        const step = event.code === 'ArrowUp' ? -1 : 1;
        journal.rows[column] = Math.max(0, Math.min(count - 1, journal.rows[column] + step));
      } else if (event.code === 'Enter' && !event.repeat) {
        activate(state);
      } else if (event.code === 'Escape') {
        journal.open = false;
      }
      return true;
    },
    onClick(x, y, state) {
      const journal = state.journal;
      if (!journal.open) return;
      const column = columns.findIndex(({ x: left, width }) => x >= left && x < left + width);
      if (column < 0 || y < top) return;
      const [first, end] = visibleRange(journal, column);
      const row = first + Math.floor((y - top) / rowHeight);
      if (row >= end) return;
      journal.column = column;
      journal.rows[column] = row;
      activate(state);
    },
    drawOverlay(ctx, state) {
      const journal = state.journal;
      if (!journal.open) return;
      ctx.save();
      ctx.textAlign = 'left';
      ctx.fillStyle = '#0a0b0e';
      ctx.fillRect(0, 0, state.view.w, state.view.h);
      ctx.fillStyle = '#25231f';
      ctx.fillRect(16, 12, state.view.w - 32, state.view.h - 24);
      ctx.fillStyle = '#e1b66e';
      ctx.font = 'bold 17px monospace';
      ctx.fillText('Diario de investigación', 24, 36);
      ctx.font = '10px monospace';
      const marked = [...journal.marked];
      columns.forEach(({ data, title, x, width }, column) => {
        ctx.fillStyle = '#e1b66e';
        ctx.fillText(title, x, 59);
        const [first, end] = visibleRange(journal, column);
        for (let i = first; i < end; i++) {
          const item = Umbra.data[data][i];
          const y = top + (i - first) * rowHeight;
          ctx.fillStyle = journal.column === column && journal.rows[column] === i ? '#514631' : '#1a1b1e';
          ctx.fillRect(x, y, width, rowHeight - 1);
          const isEvidence = column === 0;
          const compatible = isEvidence || marked.every(id => item.evidence.includes(id));
          const checked = isEvidence ? journal.marked.has(item.id) : journal.answer === item.id;
          ctx.fillStyle = compatible ? '#ded7c7' : '#948b82';
          ctx.fillText((checked ? '[x] ' : '[ ] ') + item.name, x + 5, y + 12, isEvidence ? width - 72 : width - 10);
          if (isEvidence && journal.detected.has(item.id)) {
            ctx.fillStyle = '#9eb8cd';
            ctx.fillText('Detectada', x + width - 59, y + 12);
          }
        }
      });
      ctx.fillStyle = '#ded7c7';
      const answer = Umbra.data.entities.find(item => item.id === journal.answer);
      ctx.fillText(answer ? 'Respuesta: ' + answer.name + ' · Sal por la puerta principal con E.' : 'Elige tu respuesta en la lista de entidades.', 24, 231, 432);
      ctx.fillStyle = '#aaa095';
      ctx.fillText('Flechas + Enter o clic · Tab / J: cerrar', 24, 246);
      ctx.restore();
    },
  });
})();
