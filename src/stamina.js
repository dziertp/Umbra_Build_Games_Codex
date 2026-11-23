// Umbra — stamina del investigador.
// Correr gasta stamina (≈4 s desde lleno). Sin correr, tras 1 s empieza a recuperarse
// (≈3 s quieto, más lento caminando). Si se vacía, no se puede correr hasta recuperar un 30 %.
// main.js corre solo si state.player.canRun no es false. Barra sobre los pies, solo si no está llena.
(function () {
  'use strict';

  const CFG = {
    runTime: 4,        // s de carrera continua desde lleno
    delay: 1,          // s sin correr antes de recuperar
    refillStill: 3,    // s para llenarse quieto
    refillWalk: 4.5,   // s para llenarse caminando
    unlock: 0.3,       // fracción mínima para volver a correr tras vaciarse
  };

  const MOVE_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

  Umbra.register({
    order: 2, // antes de que main.js mueva al jugador (main mueve después de todos los update)
    start(state) {
      state.stamina = { value: 1, exhausted: false, rest: 0, running: false };
      state.player.canRun = true;
    },
    update(dt, state) {
      const st = state.stamina;
      if (!st) return;
      const k = state.keys;
      const moving = MOVE_KEYS.some((c) => k.has(c));
      const wantsRun = k.has('ShiftLeft') || k.has('ShiftRight');
      st.running = moving && wantsRun && !st.exhausted;
      if (st.running) {
        st.value = Math.max(0, st.value - dt / CFG.runTime);
        st.rest = 0;
        if (st.value === 0) st.exhausted = true;
      } else {
        st.rest += dt;
        if (st.rest >= CFG.delay) st.value = Math.min(1, st.value + dt / (moving ? CFG.refillWalk : CFG.refillStill));
        if (st.exhausted && st.value >= CFG.unlock) st.exhausted = false;
      }
      state.player.canRun = !st.exhausted;
    },
    // Barra de 16×3 bajo los pies: cálida normal, rojiza si está agotado.
    drawUI(ctx, state) {
      const st = state.stamina;
      if (!st || st.value >= 1 || state.scene !== 'play') return;
      const x = Math.round(state.player.x + state.view.ox) - 8;
      const y = Math.round(state.player.y + state.view.oy) + 9;
      ctx.fillStyle = '#07090c';
      ctx.fillRect(x - 1, y - 1, 18, 5);
      ctx.fillStyle = '#2a241d';
      ctx.fillRect(x, y, 16, 3);
      ctx.fillStyle = st.exhausted ? '#9a4a3a' : '#c9a86a';
      ctx.fillRect(x, y, Math.round(16 * st.value), 3);
      if (st.exhausted) {
        // Marca del 30 %: desde ahí se puede volver a correr.
        ctx.fillStyle = '#d8d2c4';
        ctx.fillRect(x + Math.round(16 * CFG.unlock), y, 1, 3);
      }
    },
  });
})();
