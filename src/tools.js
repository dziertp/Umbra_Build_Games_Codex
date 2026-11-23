(function () {
  'use strict';

  let provisionalEntity;
  const slotKeys = ['Digit1', 'Digit2', 'Digit3'];
  const rack = { x: 544, y: 1066, spacing: 24, floor: 0 }; // Porche.
  const pickupReach = 20;
  const returnReach = 28;
  const accents = ['#9db774', '#b497cc', '#c69770', '#91aaba', '#ae7370', '#e1b66e', '#71a591', '#caa2a8'];
  const interference = ['ERROR', '???', '-- / --', 'SIN SEÑAL', '###', 'FUERA DE RANGO'];

  function inReach(state, item, reach) {
    if (state.floor !== rack.floor) return false;
    const { x, y } = state.player;
    const dx = item.x - x;
    const dy = rack.y - y;
    if (Math.hypot(dx, dy) >= reach) return false;
    const probe = { x, y };
    state.G.move(probe, dx, dy, 8, state.model);
    return Math.hypot(probe.x - item.x, probe.y - rack.y) < 0.01;
  }

  function nearbyTool(state) {
    let nearest;
    let distance = pickupReach;
    for (const item of state.tools.rackItems) {
      if (state.tools.slots.includes(item.tool) || !inReach(state, item, distance)) continue;
      nearest = item;
      distance = Math.hypot(item.x - state.player.x, rack.y - state.player.y);
    }
    return nearest?.tool;
  }

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
        rackItems: Umbra.data.tools.map((tool, i) => ({
          tool,
          x: rack.x + rack.spacing * i,
          color: accents[i % accents.length],
        })),
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
      if (event.code === 'KeyE') {
        const tool = nearbyTool(state);
        if (!tool) return false;
        if (event.repeat) return true;
        const empty = tools.slots.indexOf(null);
        if (empty < 0) {
          Umbra.tell('Inventario lleno. Solo puedes llevar 3 herramientas');
        } else {
          tools.slots[empty] = tool;
          if (tools.selected < 0) equip(tools, empty);
          Umbra.tell('Recoges ' + tool.name + '.');
        }
        return true;
      }
      const tool = tools.slots[tools.selected];
      if (event.code === 'KeyG' && tool && tools.rackItems.some(item => inReach(state, item, returnReach))) {
        if (event.repeat) return true;
        tools.slots[tools.selected] = null;
        equip(tools, -1);
        Umbra.tell('Devuelves ' + tool.name + '.');
        return true;
      }
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
    drawWorld(ctx, state) {
      if (state.floor !== rack.floor) return;
      const { rackItems, slots } = state.tools;
      const width = rack.spacing * (rackItems.length - 1) + 20;
      ctx.fillStyle = '#251d19';
      ctx.fillRect(rack.x - 10, rack.y - 8, width, 17);
      ctx.fillStyle = '#503c2e';
      ctx.fillRect(rack.x - 10, rack.y - 8, width, 13);
      ctx.fillStyle = '#735941';
      ctx.fillRect(rack.x - 10, rack.y - 8, width, 2);
      for (const { tool, x, color } of rackItems) {
        if (slots.includes(tool)) continue;
        ctx.fillStyle = '#17181a';
        ctx.fillRect(x - 5, rack.y - 5, 10, 9);
        ctx.fillStyle = color;
        ctx.fillRect(x - 4, rack.y - 4, 7, 5);
        ctx.fillStyle = '#d8d2c4';
        ctx.fillRect(x - 3, rack.y - 3, 3, 1);
      }
    },
    drawUI(ctx, state) {
      if (state.scene !== 'play' || state.journal?.open) return;
      const { slots, selected, rackItems, reading, detected, hunting } = state.tools;
      const y = state.view.h - 88;
      ctx.save();
      ctx.fillStyle = '#555049';
      ctx.fillRect(8, y, 176, 62);
      ctx.fillStyle = '#15171a';
      ctx.fillRect(9, y + 1, 174, 60);
      ctx.fillStyle = '#d8d2c4';
      ctx.textAlign = 'left';
      ctx.font = '9px monospace';
      ctx.fillText('Inventario: ' + slots.filter(Boolean).length + '/' + slots.length, 15, y + 11);
      for (const [index, tool] of slots.entries()) {
        const row = y + 23 + index * 11;
        if (index === selected) {
          ctx.fillStyle = '#514631';
          ctx.fillRect(12, row - 8, 168, 10);
        }
        ctx.fillStyle = index === selected ? '#edc578' : tool ? '#d8d2c4' : '#aaa095';
        ctx.fillText('[' + (index + 1) + '] ' + (tool?.name || 'Vacío'), 15, row, 158);
      }
      ctx.fillStyle = hunting ? '#e59f83' : detected ? '#edc578' : '#a5bacb';
      ctx.fillText(reading || (selected < 0 ? 'Sin herramienta equipada' : 'Sin lectura'), 15, y + 57, 158);

      const pick = nearbyTool(state);
      const canReturn = selected >= 0 && rackItems.some(item => inReach(state, item, returnReach));
      if (pick || canReturn) {
        const hints = [];
        if (pick) hints.push('E · Recoger ' + pick.name);
        if (canReturn) hints.push('G · Devolver herramienta');
        const width = Math.ceil(Math.max(...hints.map(hint => ctx.measureText(hint).width))) + 10;
        ctx.fillStyle = 'rgba(7,9,12,.9)';
        ctx.fillRect((state.view.w - width) / 2, 150, width, hints.length * 11 + 2);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#edc578';
        hints.forEach((hint, index) => ctx.fillText(hint, state.view.w / 2, 160 + index * 11));
      }
      ctx.restore();
    },
  });
})();
