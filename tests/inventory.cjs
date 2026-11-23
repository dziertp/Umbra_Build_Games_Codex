const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const handlers = new Map();
const noop = () => {};
const drawing = new Proxy({}, {
  get: (target, key) => target[key] ?? (key === 'measureText' ? text => ({ width: text.length * 5 }) : noop),
});
const canvas = { style: {}, getContext: () => drawing, addEventListener: noop };
let nextFrame;
const sandbox = vm.createContext({
  document: { getElementById: () => canvas, createElement: () => canvas },
  Image: class {},
  innerWidth: 480,
  innerHeight: 270,
  performance: { now: () => 0 },
  requestAnimationFrame: callback => { nextFrame = callback; },
  addEventListener(name, callback) {
    if (!handlers.has(name)) handlers.set(name, []);
    handlers.get(name).push(callback);
  },
});
for (const [, file] of read('index.html').matchAll(/<script src="([^"]+)"/g)) {
  vm.runInContext(read(file), sandbox, { filename: file });
}

const U = sandbox.Umbra;
const state = U.state;
const press = (code, repeat = false) => {
  for (const callback of handlers.get('keydown')) callback({ code, repeat, preventDefault: noop });
};
const place = (x, y, floor = 0) => {
  Object.assign(state.player, { x, y });
  state.floor = floor;
  U.rebuild();
};
const bag = () => Array.from(state.tools.slots, tool => tool?.id ?? null);
const use = () => press('KeyF');
const take = () => press('KeyE');
const check = expected => assert.deepEqual(bag(), expected);

press('Enter');
check([null, null, null]);
assert.equal(state.tools.selected, -1);
const [first, second, third, fourth] = state.tools.rackItems;
assert.equal(state.tools.rackItems.length, 8);
const used = [];
U.on('tool:used', event => used.push(event.id));
use();
assert.deepEqual(used, []);

// El jugador puede caminar del punto de inicio a cada herramienta del porche.
const walker = { ...state.player };
state.G.move(walker, 640 - walker.x, 0, 8, state.model);
assert.ok(Math.abs(walker.x - 640) < 0.01);
state.G.move(walker, 0, 1050 - walker.y, 8, state.model);
assert.ok(Math.abs(walker.y - 1050) < 0.01);
for (const item of state.tools.rackItems) {
  state.G.move(walker, item.x - walker.x, 0, 8, state.model);
  assert.ok(Math.abs(walker.x - item.x) < 0.01);
  assert.ok(!state.G.blocked(item.x, 1066, 8, state.model));
}

place(first.x, 1044);
take();
check([null, null, null]);
place(first.x, 1050);
state.model.walls.push([first.x - 12, 1058, first.x + 12, 1058, 2]);
take();
check([null, null, null]);
place(first.x, 1050, 1);
take();
check([null, null, null]);

place(first.x, 1050);
take();
press('KeyE', true);
take();
check([first.tool.id, null, null]);
press('Digit2');
use();
assert.deepEqual(used, []);
for (const item of [second, third, fourth]) {
  place(item.x, 1050);
  take();
}
check([first.tool.id, second.tool.id, third.tool.id]);
assert.match(state.message, /Inventario lleno/);
press('Digit3');
use();
assert.deepEqual(used, [third.tool.id]);
press('KeyG');
check([first.tool.id, second.tool.id, null]);
take();
check([first.tool.id, second.tool.id, fourth.tool.id]);
place(third.x, 1050);
take();
assert.match(state.message, /Inventario lleno/);
press('Digit3');
press('KeyG');
take();
check([first.tool.id, second.tool.id, third.tool.id]);

// Ejecuta el cambio de piso a través del bucle real sin dibujar el mapa.
const drawSwitchHint = U.systems.find(system => system.order === 8).drawUI;
for (const system of U.systems) {
  for (const hook of ['drawWorld', 'drawLight', 'drawUI', 'drawOverlay']) system[hook] = undefined;
}
U.render.map = noop;
U.render.player = noop;
place(552, 612);
nextFrame(16);
assert.equal(state.floor, 1);
check([first.tool.id, second.tool.id, third.tool.id]);
place(552, 767, 1);
nextFrame(32);
assert.equal(state.floor, 0);
check([first.tool.id, second.tool.id, third.tool.id]);

const room = state.G.floors[0].rooms[0];
const [, x, y, w, h] = room;
place(x + w / 2, y + h / 2);
Object.assign(state.entity, { floor: 0, room, type: { evidence: [first.tool.evidence[0]] } });
press('Digit1');
U.emit('hunt:start', {});
use();
assert.equal(state.tools.detected, false);
assert.equal(state.journal.detected.size, 0);
U.emit('hunt:end', {});
use();
assert.equal(state.tools.detected, true);
assert.ok(state.journal.detected.has(first.tool.evidence[0]));

const [ground] = state.G.floors;
place(ground.closet[0] + 20, ground.closet[1] + ground.closet[3] + 20);
take();
assert.equal(state.closetOpen[0], true);
U.emit('power:off');
place(ground.fuse[0] - 12, ground.fuse[1]);
take();
assert.equal(state.power.on, true);
let switchWorked = false;
switches: for (const sw of state.power.switches[0]) {
  for (const [dx, dy] of [[14, 0], [-14, 0], [0, 14], [0, -14]]) {
    const sx = sw.x + dx;
    const sy = sw.y + dy;
    if (state.G.blocked(sx, sy, 8, state.model)) continue;
    place(sx, sy);
    let hinted = false;
    drawing.fillText = label => { hinted = label === 'E · Luz'; };
    drawSwitchHint(drawing, state);
    delete drawing.fillText;
    if (!hinted) continue;
    take();
    assert.equal(state.power.lamps[0].filter(Boolean).length, 1);
    take();
    assert.equal(state.power.lamps[0].filter(Boolean).length, 0);
    switchWorked = true;
    break switches;
  }
}
assert.equal(switchWorked, true);
place(640, 1016);
take();
assert.match(state.message, /entidad en el diario/);

U.emit('player:caught');
assert.equal(state.scene, 'result');
assert.equal(state.investigation.result.caught, true);
press('Enter');
press('Enter');
check([null, null, null]);
assert.equal(state.tools.selected, -1);
assert.equal(state.tools.rackItems.length, 8);
console.log('PASS: inventario, porche, intercambio, escaleras, evidencias, cacería y reinicio.');
