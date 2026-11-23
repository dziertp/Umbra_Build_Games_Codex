(function () {
  'use strict';

  function objectives(state) {
    return [
      { label: 'Identificar a la entidad', done: Boolean(state.journal.answer) },
      { label: 'Detectar dos evidencias distintas', done: state.journal.detected.size >= 2 },
      { label: 'Sobrevivir a una cacería', done: state.investigation.survived },
    ];
  }

  Umbra.investigation = { objectives };

  Umbra.on('hunt:end', (event, state) => {
    if (state?.scene === 'play' && state.investigation && !event?.caught) state.investigation.survived = true;
  });

  Umbra.on('base:truck', (_, state) => {
    if (state?.scene !== 'play' || state.journal.open) return;
    const answer = state.journal.answer;
    if (!answer) {
      Umbra.tell('Elige una entidad en el diario antes de irte');
      return;
    }
    state.investigation.result = {
      correct: answer === state.entity.type.id,
      entityName: state.entity.type.name,
      seconds: Math.floor((performance.now() - state.investigation.startedAt) / 1000),
      objectives: objectives(state),
    };
    state.keys.clear();
    state.scene = 'result';
  });

  Umbra.on('player:caught', (_, state) => {
    if (!state?.investigation || state.investigation.result) return;
    state.investigation.result = {
      caught: true,
      entityName: state.entity?.type?.name || 'Desconocida',
      seconds: Math.floor((performance.now() - state.investigation.startedAt) / 1000),
    };
    state.keys.clear();
    state.scene = 'result';
  });

  Umbra.register({
    order: 1,
    start(state) {
      state.investigation = { startedAt: performance.now(), survived: false, result: null };
    },
    onKey(event, state) {
      if (state.scene !== 'result') return false;
      if (event.code === 'Enter' && !event.repeat) state.scene = 'menu';
      return true;
    },
    drawResult(ctx, state) {
      const { caught, correct, entityName, seconds, objectives: completed } = state.investigation.result;
      const time = Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
      const { w, h } = state.view;
      ctx.save();
      ctx.fillStyle = '#0a0b0e';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#25231f';
      ctx.fillRect(48, caught ? 51 : 25, w - 96, caught ? h - 102 : h - 50);
      ctx.textAlign = 'center';
      ctx.font = caught ? 'bold 20px monospace' : 'bold 24px monospace';
      ctx.fillStyle = correct ? '#e1b66e' : '#d89e89';
      ctx.fillText(caught ? 'La entidad te encontró' : correct ? 'Acierto' : 'Error', w / 2, caught ? 105 : 66);
      ctx.font = '12px monospace';
      ctx.fillStyle = '#ded7c7';
      ctx.fillText('La entidad era: ' + entityName, w / 2, caught ? 137 : 94);
      ctx.fillText('Tiempo de investigación: ' + time, w / 2, caught ? 157 : 114);
      if (completed) {
        ctx.font = 'bold 11px monospace';
        ctx.fillText('Objetivos: ' + completed.filter(item => item.done).length + '/' + completed.length, w / 2, 141);
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        completed.forEach(({ label, done }, index) => {
          ctx.fillStyle = done ? '#a6bb83' : '#bdb2a0';
          ctx.fillText((done ? '[✓] ' : '[ ] ') + label, 132, 159 + index * 15);
        });
        ctx.textAlign = 'center';
      }
      ctx.fillStyle = '#9eb8cd';
      ctx.fillText('Enter para volver al menú', w / 2, caught ? 192 : 222);
      ctx.restore();
    },
  });
})();
