(function () {
  'use strict';

  let provisionalEntity;

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

  Umbra.register({
    order: 20,
    start(state) {
      state.tools = { equipped: Umbra.data.tools[0], reading: null, detected: false };
      if (state.entity && state.entity !== provisionalEntity) return;

      const rooms = state.G.floors.flatMap((data, floor) => data.rooms.map(room => ({ floor, room })));
      const { floor, room } = rooms[Math.floor(Math.random() * rooms.length)];
      const types = Umbra.data.entities;
      const type = types[Math.floor(Math.random() * types.length)];
      const [, x, y, w, h] = room;
      provisionalEntity = { type, floor, room, x: x + w / 2, y: y + h / 2, mode: 'idle' };
      state.entity = provisionalEntity;
    },
    onKey(event, state) {
      const tools = state.tools;
      const selected = Umbra.data.tools.find(tool => tool.key === event.code);
      if (selected) {
        if (selected !== tools.equipped) {
          tools.equipped = selected;
          tools.reading = null;
          tools.detected = false;
        }
        return true;
      }
      if (event.code !== 'KeyF') return false;
      if (event.repeat) return true;

      const entity = state.entity;
      const tool = tools.equipped;
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
      return true;
    },
    drawUI(ctx, state) {
      const { equipped, reading, detected } = state.tools;
      const y = state.view.h - 63;
      ctx.save();
      ctx.fillStyle = '#555049';
      ctx.fillRect(8, y, 172, 37);
      ctx.fillStyle = '#15171a';
      ctx.fillRect(9, y + 1, 170, 35);
      ctx.fillStyle = '#d8d2c4';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(equipped.name, 15, y + 12, 158);
      ctx.font = '10px monospace';
      ctx.fillStyle = detected ? '#edc578' : '#a5bacb';
      ctx.fillText(reading || 'Sin lectura', 15, y + 23, 158);
      ctx.fillStyle = '#aaa095';
      ctx.font = '8px monospace';
      ctx.fillText('1/2/3  Equipar    F  Usar', 15, y + 32, 158);
      ctx.restore();
    },
  });
})();
