(function () {
  'use strict';

  function atMainDoor(state) {
    // Hueco entre los muros del vestíbulo y el porche de la mansión.
    const { x, y } = state.player;
    return state.floor === 0 && x >= 595 && x <= 685 && Math.abs(y - 1015) <= 22;
  }

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
      state.investigation = { startedAt: performance.now(), result: null };
    },
    onKey(event, state) {
      if (state.scene === 'result') {
        if (event.code === 'Enter' && !event.repeat) state.scene = 'menu';
        return true;
      }
      if (event.code !== 'KeyE' || !atMainDoor(state)) return false;
      if (event.repeat) return true;

      const answer = state.journal.answer;
      if (!answer) {
        Umbra.tell('Elige una entidad en el diario antes de salir.');
        return true;
      }
      const entity = state.entity.type;
      state.investigation.result = {
        correct: answer === entity.id,
        entityName: entity.name,
        seconds: Math.floor((performance.now() - state.investigation.startedAt) / 1000),
      };
      state.keys.clear();
      state.scene = 'result';
      return true;
    },
    drawResult(ctx, state) {
      const { caught, correct, entityName, seconds } = state.investigation.result;
      const time = Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
      const { w, h } = state.view;
      ctx.save();
      ctx.fillStyle = '#0a0b0e';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#25231f';
      ctx.fillRect(48, 51, w - 96, h - 102);
      ctx.textAlign = 'center';
      ctx.font = caught ? 'bold 20px monospace' : 'bold 24px monospace';
      ctx.fillStyle = correct ? '#e1b66e' : '#d89e89';
      ctx.fillText(caught ? 'La entidad te encontró' : correct ? 'Acierto' : 'Error', w / 2, 105);
      ctx.font = '12px monospace';
      ctx.fillStyle = '#ded7c7';
      ctx.fillText('La entidad era: ' + entityName, w / 2, 137);
      ctx.fillText('Tiempo de partida: ' + time, w / 2, 157);
      ctx.fillStyle = '#9eb8cd';
      ctx.fillText('Enter para volver al menú', w / 2, 192);
      ctx.restore();
    },
  });
})();
