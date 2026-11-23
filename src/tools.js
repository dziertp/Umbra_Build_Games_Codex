(function () {
  'use strict';

  let provisionalEntity;
  const slotKeys = ['Digit1', 'Digit2', 'Digit3'];
  const interference = ['ERROR', '???', '-- / --', 'SIN SEÑAL', '###', 'FUERA DE RANGO'];

  function equip(tools, slot) {
    if (tools.selected === slot) return;
    tools.selected = slot;
    tools.reading = tools.hunting && tools.slots[slot] ? garbled(tools.reading) : null;
    tools.detected = false;
  }

  function garbled(previous) {
    const choices = interference.filter(text => text !== previous);
    return choices[Math.floor(Math.random() * choices.length)];
  }

  function exchange(state, tool) {
    if (state.scene !== 'play' || !state.journal?.open || state.journal.mode !== 'board' || !tool) return;
    const tools = state.tools;
    const held = tools.slots.indexOf(tool);
    if (held >= 0) {
      tools.slots[held] = null;
      if (tools.selected === held) equip(tools, -1);
      return 'Devuelves ' + tool.name + '.';
    }
    const empty = tools.slots.indexOf(null);
    if (empty < 0) return 'Inventario lleno (3/3).';
    tools.slots[empty] = tool;
    if (tools.selected < 0) equip(tools, empty);
    return 'Recoges ' + tool.name + '.';
  }

  Umbra.tools = { exchange };

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
    state.tools.reading = state.tools.slots[state.tools.selected] ? garbled(state.tools.reading) : null;
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
      state.tools = {
        slots: slotKeys.map(() => null),
        selected: -1,
        reading: null,
        detected: false,
        hunting: false,
        interferenceTimer: 0,
      };
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
      if (!tools?.hunting || !tools.slots[tools.selected]) return;
      tools.interferenceTimer -= dt;
      if (tools.interferenceTimer <= 0) {
        tools.reading = garbled(tools.reading);
        tools.interferenceTimer = 0.12 + Math.random() * 0.16;
      }
    },
    onKey(event, state) {
      const tools = state.tools;
      if (state.scene !== 'play' || state.journal?.open) return false;
      const slot = slotKeys.indexOf(event.code);
      if (slot >= 0) {
        equip(tools, tools.slots[slot] ? slot : -1);
        return true;
      }
      const tool = tools.slots[tools.selected];
      if (event.code !== 'KeyF') return false;
      if (event.repeat) return true;
      if (!tool) {
        Umbra.tell('Equipa una herramienta con 1–3.');
        return true;
      }
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
      if (state.scene !== 'play' || state.journal?.open) return;
      const { slots, selected, reading, detected, hunting } = state.tools;
      const y = state.view.h - 53;
      ctx.save();
      ctx.fillStyle = '#555049';
      ctx.fillRect(8, y, 176, 27);
      ctx.fillStyle = '#15171a';
      ctx.fillRect(9, y + 1, 174, 25);
      ctx.fillStyle = '#d8d2c4';
      ctx.textAlign = 'left';
      ctx.font = '9px monospace';
      ctx.fillText(slots[selected]?.name || 'Sin herramienta equipada', 15, y + 11, 158);
      ctx.fillStyle = hunting ? '#e59f83' : detected ? '#edc578' : '#a5bacb';
      ctx.fillText(reading || (selected < 0 ? 'Equipo en el campamento' : 'Sin lectura'), 15, y + 22, 158);
      const left = Math.round((state.view.w - 86) / 2);
      ctx.fillStyle = '#d8d2c4';
      ctx.fillText('Inventario: ' + slots.filter(Boolean).length + '/3', left, y - 4);
      for (const [index, tool] of slots.entries()) {
        const x = left + index * 30;
        ctx.fillStyle = index === selected ? '#edc578' : '#555049';
        ctx.fillRect(x, y, 26, 26);
        ctx.fillStyle = tool ? '#aa9b80' : '#15171a';
        ctx.fillRect(x + 1, y + 1, 24, 24);
        if (tool) Umbra.journal.drawIcon(ctx, tool.evidence[0], x + 11, y + 7);
        ctx.fillStyle = tool ? '#241c14' : '#aaa095';
        ctx.fillText(String(index + 1), x + 3, y + 10);
      }
      ctx.restore();
    },
  });
})();
