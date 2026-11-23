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
const [first, second, third, fourth] = U.data.tools;
assert.equal(U.data.tools.length, 9);
assert.equal(U.data.tools.find(tool => tool.id === 'flashlight').light, true);
const used = [];
U.on('tool:used', event => used.push(event.id));
use();
assert.deepEqual(used, []);

take();
assert.equal(state.journal.open, false);
const { board, objectives, truck } = state.G.floors[0].base;
const standByBoard = () => place(board[0] + 20, board[1] + board[3] + 10);
standByBoard();
take();
assert.equal(state.journal.mode, 'board');
U.emit('base:objectives');
assert.equal(state.journal.mode, 'board');

press('Enter');
press('Enter', true);
check([first.id, null, null]);
press('Escape');
press('Digit2');
use();
assert.deepEqual(used, []);
take();
for (let i = 0; i < 3; i++) {
  press('ArrowDown');
  press('Enter');
}
check([first.id, second.id, third.id]);
assert.match(state.journal.boardMessage, /Inventario lleno/);
press('ArrowUp');
press('Enter');
check([first.id, second.id, null]);
press('ArrowDown');
press('Enter');
check([first.id, second.id, fourth.id]);
press('Enter');
press('ArrowUp');
press('Enter');
check([first.id, second.id, third.id]);
press('Escape');
press('Digit3');
use();
assert.deepEqual(used, [third.id]);

const journal = U.systems.find(system => system.drawOverlay);
journal.onClick(428, 13, state);
assert.equal(state.journal.mode, 'book');
U.emit('base:board');
assert.equal(state.journal.mode, 'book');
press('KeyQ');
assert.equal(state.journal.tab, 4);
const initial = U.audio.volume('master');
press('ArrowLeft');
assert.equal(U.audio.volume('master'), initial - 5);
journal.drawOverlay(drawing, state);
journal.onClick(131, 64, state);
assert.equal(U.audio.volume('master'), 50);
journal.onClick(437, 10, state);
assert.equal(state.journal.open, false);

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
check([first.id, second.id, third.id]);
place(552, 767, 1);
nextFrame(32);
assert.equal(state.floor, 0);
check([first.id, second.id, third.id]);

const room = state.G.floors[0].rooms[0];
const [, x, y, w, h] = room;
place(x + w / 2, y + h / 2);
Object.assign(state.entity, { floor: 0, room, type: { ...state.entity.type, evidence: [first.evidence[0]] } });
press('Digit1');
U.emit('hunt:start', {});
use();
assert.equal(state.tools.detected, false);
assert.equal(state.journal.detected.size, 0);
U.emit('hunt:end', {});
use();
assert.equal(state.tools.detected, true);
assert.ok(state.journal.detected.has(first.evidence[0]));

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
assert.equal(state.scene, 'play');
place(objectives[0] - 10, objectives[1] + 20);
take();
assert.equal(state.journal.mode, 'objectives');
assert.deepEqual(Array.from(U.investigation.objectives(state), item => item.done), [false, false, true]);
press('Escape');
const standByTruck = () => place(truck[0] + truck[2] + 10, truck[1] + 20);
standByTruck();
take();
assert.match(state.message, /entidad en el diario antes de irte/);
state.journal.answer = state.entity.type.id;
U.emit('evidence:found', { id: first.evidence[0] });
assert.equal(state.journal.detected.size, 1);
U.emit('evidence:found', { id: second.evidence[0] });
take();
assert.equal(state.scene, 'result');
assert.equal(state.investigation.result.correct, true);
assert.equal(state.investigation.result.objectives.filter(item => item.done).length, 3);
press('Enter');
press('Enter');
check([null, null, null]);
assert.equal(state.investigation.survived, false);
U.emit('hunt:end', { caught: true });
assert.equal(state.investigation.survived, false);

U.emit('player:caught');
assert.equal(state.scene, 'result');
assert.equal(state.investigation.result.caught, true);
press('Enter');
press('Enter');
check([null, null, null]);
assert.equal(state.tools.selected, -1);
console.log('PASS: campamento, inventario, diario, ajustes, escaleras, evidencias, objetivos, camión y derrota.');
