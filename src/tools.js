(function () {
  'use strict';

  let provisionalEntity;
  const interference = ['ERROR', '???', '-- / --', 'SIN SEÑAL', '###', 'FUERA DE RANGO'];

  function garbled(previous) {
    const choices = interference.filter(text => text !== previous);
    return choices[Math.floor(Math.random() * choices.length)];
  }

  function roomAt(rooms, player) {
    let room;
    let area = Infinity;
    for (const candidate of rooms) {
      const [, x, y, w, h] = candidate;
      // Las habitaciones pequeñas pueden estar dentro de otra, como la despensa.
      if (player.x >= x && player.x < x + w && player.y >= y && player.y < y + h && w * h < area) {
        room = candidate;
        area = w * h;
      }
    }
    return room;
  }

  Umbra.on('hunt:start', (_, state) => {
    if (!state?.tools) return;
    state.tools.hunting = true;
    state.tools.interferenceTimer = 0;
    state.tools.detected = false;
    state.tools.reading = garbled(state.tools.reading);
  });

  Umbra.on('hunt:end', (_, state) => {
    if (!state?.tools) return;
    state.tools.hunting = false;
    state.tools.interferenceTimer = 0;
    state.tools.detected = false;
    state.tools.reading = null;
  });

  Umbra.register({
    order: 20,
    start(state) {
      state.tools = { equipped: Umbra.data.tools[0], reading: null, detected: false, hunting: false, interferenceTimer: 0 };
      if (state.entity && state.entity !== provisionalEntity) return;

      const rooms = state.G.floors.flatMap((data, floor) => data.rooms.map(room => ({ floor, room })));
      const { floor, room } = rooms[Math.floor(Math.random() * rooms.length)];
      const types = Umbra.data.entities;
      const type = types[Math.floor(Math.random() * types.length)];
      const [, x, y, w, h] = room;
      provisionalEntity = { type, floor, room, x: x + w / 2, y: y + h / 2, mode: 'idle' };
      state.entity = provisionalEntity;
    },
    update(dt, state) {
      const tools = state.tools;
      if (!tools?.hunting) return;
      tools.interferenceTimer -= dt;
      if (tools.interferenceTimer <= 0) {
        tools.reading = garbled(tools.reading);
        tools.interferenceTimer = 0.12 + Math.random() * 0.16;
      }
    },
    onKey(event, state) {
      const tools = state.tools;
      const selected = Umbra.data.tools.find(tool => tool.key === event.code);
      if (selected) {
        if (selected !== tools.equipped) {
          tools.equipped = selected;
          tools.reading = tools.hunting ? garbled(tools.reading) : null;
          tools.detected = false;
        }
        return true;
      }
      if (event.code !== 'KeyF') return false;
      if (event.repeat) return true;
      const tool = tools.equipped;
      if (tools.hunting) {
        tools.detected = false;
        tools.reading = garbled(tools.reading);
        Umbra.emit('tool:used', { id: tool.id });
        return true;
      }

      const entity = state.entity;
      const room = roomAt(state.G.floors[state.floor].rooms, state.player);
      const evidence = entity && entity.floor === state.floor && room?.[0] === entity.room[0]
        ? tool.evidence.find(id => entity.type.evidence.includes(id))
        : undefined;
      tools.detected = Boolean(evidence);
      tools.reading = evidence ? tool.readings?.[evidence] : tool.idleReading;
      if (evidence && !tools.reading) {
        tools.reading = Umbra.data.evidence.find(item => item.id === evidence)?.name || 'Evidencia detectada';
      }
      if (evidence) Umbra.emit('evidence:found', { id: evidence });
      Umbra.emit('tool:used', { id: tool.id, evidence });
      return true;
    },
    drawUI(ctx, state) {
      const { equipped, reading, detected, hunting } = state.tools;
      const y = state.view.h - 63;
      ctx.save();
      ctx.fillStyle = '#555049';
      ctx.fillRect(8, y, 172, 37);
      ctx.fillStyle = '#15171a';
      ctx.fillRect(9, y + 1, 170, 35);
      ctx.fillStyle = '#d8d2c4';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(equipped.name + ' [' + equipped.key.replace('Digit', '') + ']', 15, y + 12, 158);
      ctx.font = '10px monospace';
      ctx.fillStyle = hunting ? '#e59f83' : detected ? '#edc578' : '#a5bacb';
      ctx.fillText(reading || 'Sin lectura', 15, y + 23, 158);
      ctx.fillStyle = '#aaa095';
      ctx.font = '8px monospace';
      ctx.fillText('1-8  Equipar    F  Usar', 15, y + 32, 158);
      ctx.restore();
    },
  });
})();
