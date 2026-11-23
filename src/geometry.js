(function (root) {
  "use strict";
  const floors = root.UMBRA_FLOORS || [root.UMBRA_MAP];
  const inside = (x, y, b) => x >= b[0] && y >= b[1] && x <= b[0] + b[2] && y <= b[1] + b[3];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function segmentDistance(x, y, s) {
    const dx = s[2] - s[0],
      dy = s[3] - s[1],
      den = dx * dx + dy * dy;
    const t = den ? clamp(((x - s[0]) * dx + (y - s[1]) * dy) / den, 0, 1) : 0;
    return Math.hypot(x - s[0] - t * dx, y - s[1] - t * dy);
  }
  function model(config = {}) {
    const floor = config.floor ?? 0,
      D = floors[floor],
      open = !!config.closetOpen;
    const walls = [...D.walls, ...D.leaves];
    const [x, y, w, h] = D.closet;
    walls.push([x, y, x + w, y, 3], [x, y, x, y + h, 3], [x + w, y, x + w, y + h, 3]);
    if (open) walls.push([x, y + h, x, y + h + 45, 2.4], [x + w, y + h, x + w, y + h + 45, 2.4]);
    else walls.push([x, y + h, x + w, y + h, 3]);
    const [sx, sy, sw, sh] = D.stairs;
    walls.push([sx, sy, sx, sy + sh, 3], [sx + sw, sy, sx + sw, sy + sh, 3]);
    if (floor === 0) walls.push([sx, sy, sx + sw, sy, 3]);
    else walls.push([sx, sy + sh, sx + sw, sy + sh, 3]);
    return {
      walls,
      rects: D.furniture.map((a) => a.slice(1)).concat(baseRects(D)),
      circles: D.circles,
      floorData: D,
      floor,
    };
  }
  // Campamento exterior (D.base): camión, panel, pizarra y poste del farol tienen colisión.
  function baseRects(D) {
    const b = D.base;
    if (!b) return [];
    return [b.truck, b.board, b.objectives, ...(b.lamps || []).map((l) => l.pole)].filter(Boolean);
  }
  // Fuera de la casa: un punto pisable que no está en ninguna habitación (porche, campamento, terraza).
  function outdoors(floor, x, y) {
    const D = floors[floor];
    if (D.rooms.some((r) => x >= r[1] && x < r[1] + r[3] && y >= r[2] && y < r[2] + r[4])) return false;
    return D.floors.some((b) => inside(x, y, b));
  }
  function blocked(x, y, r, m) {
    if (!m.floorData.floors.some((b) => inside(x, y, b))) return true;
    for (const s of m.walls) if (segmentDistance(x, y, s) < r + s[4] / 2 - 1e-6) return true;
    for (const b of m.rects) {
      const dx = x - clamp(x, b[0], b[0] + b[2]),
        dy = y - clamp(y, b[1], b[1] + b[3]);
      if (dx * dx + dy * dy < r * r - 1e-6) return true;
    }
    for (const c of m.circles) if (Math.hypot(x - c[0], y - c[1]) < r + c[2] - 1e-6) return true;
    return false;
  }
  function move(p, dx, dy, r, m) {
    const n = Math.max(1, Math.ceil(Math.hypot(dx, dy) / Math.max(1, r / 3)));
    let distance = 0,
      hits = 0;
    for (let i = 0; i < n; i++) {
      const ox = p.x,
        oy = p.y;
      if (!blocked(p.x + dx / n, p.y, r, m)) p.x += dx / n;
      else if (dx) hits++;
      if (!blocked(p.x, p.y + dy / n, r, m)) p.y += dy / n;
      else if (dy) hits++;
      distance += Math.hypot(p.x - ox, p.y - oy);
    }
    return { distance, hits };
  }
  function stairDestination(floor, p, r) {
    const [x, y, w, h] = floors[floor].stairs;
    if (p.x < x + r + 1.5 || p.x > x + w - r - 1.5 || p.y < y || p.y > y + h) return null;
    const margin = Math.max(30, r + 8);
    if (floor === 0 && p.y <= y + margin) return { x: x + w / 2, y: 560, floor: 1 };
    if (floor === 1 && p.y >= y + h - margin) return { x: x + w / 2, y: 814, floor: 0 };
    return null;
  }
  class Heap {
    constructor() {
      this.a = [];
    }
    push(v) {
      let i = this.a.length;
      this.a.push(v);
      while (i) {
        const p = (i - 1) >> 1;
        if (this.a[p].f <= v.f) break;
        this.a[i] = this.a[p];
        i = p;
      }
      this.a[i] = v;
    }
    pop() {
      if (!this.a.length) return null;
      const out = this.a[0],
        v = this.a.pop();
      if (this.a.length) {
        let i = 0;
        while (true) {
          let c = i * 2 + 1;
          if (c >= this.a.length) break;
          if (c + 1 < this.a.length && this.a[c + 1].f < this.a[c].f) c++;
          if (this.a[c].f >= v.f) break;
          this.a[i] = this.a[c];
          i = c;
        }
        this.a[i] = v;
      }
      return out;
    }
  }
  function grid(diameter, config, step = 4) {
    const floor = config.floor ?? 0,
      D = floors[floor];
    const [x, y, w, h] = D.bounds,
      cols = Math.floor(w / step) + 1,
      rows = Math.floor(h / step) + 1;
    const free = new Uint8Array(cols * rows),
      m = model(config);
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++)
        free[j * cols + i] = !blocked(x + i * step, y + j * step, diameter / 2, m);
    return { x, y, step, cols, rows, free, floor, diameter };
  }
  function nearest(g, p) {
    const cx = Math.round((p.x - g.x) / g.step),
      cy = Math.round((p.y - g.y) / g.step);
    let best = -1,
      dist = Infinity;
    for (let j = Math.max(0, cy - 5); j <= Math.min(g.rows - 1, cy + 5); j++)
      for (let i = Math.max(0, cx - 5); i <= Math.min(g.cols - 1, cx + 5); i++) {
        const k = j * g.cols + i;
        if (!g.free[k]) continue;
        const dd = Math.hypot(g.x + i * g.step - p.x, g.y + j * g.step - p.y);
        if (dd < dist) {
          dist = dd;
          best = k;
        }
      }
    return best;
  }
  function path(g, start, end) {
    const s = nearest(g, start),
      t = nearest(g, end);
    if (s < 0 || t < 0) return null;
    const n = g.free.length,
      dist = new Float64Array(n);
    dist.fill(Infinity);
    const prev = new Int32Array(n);
    prev.fill(-1);
    const done = new Uint8Array(n),
      heap = new Heap(),
      tx = t % g.cols,
      ty = Math.floor(t / g.cols);
    const heuristic = (i, j) => Math.hypot(i - tx, j - ty) * g.step;
    dist[s] = 0;
    heap.push({ k: s, f: heuristic(s % g.cols, Math.floor(s / g.cols)) });
    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
    ];
    while (heap.a.length) {
      const { k } = heap.pop();
      if (done[k]) continue;
      done[k] = 1;
      if (k === t) break;
      const i = k % g.cols,
        j = Math.floor(k / g.cols);
      for (const [di, dj] of dirs) {
        const ni = i + di,
          nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= g.cols || nj >= g.rows) continue;
        const nk = nj * g.cols + ni;
        if (!g.free[nk] || done[nk]) continue;
        if (di && dj && (!g.free[j * g.cols + ni] || !g.free[nj * g.cols + i])) continue;
        const nd = dist[k] + g.step * (di && dj ? Math.SQRT2 : 1);
        if (nd < dist[nk]) {
          dist[nk] = nd;
          prev[nk] = k;
          heap.push({ k: nk, f: nd + heuristic(ni, nj) });
        }
      }
    }
    if (!Number.isFinite(dist[t])) return null;
    const points = [];
    for (let k = t; k >= 0; k = prev[k]) {
      points.push({ x: g.x + (k % g.cols) * g.step, y: g.y + Math.floor(k / g.cols) * g.step });
      if (k === s) break;
    }
    points.reverse();
    return { points, distance: dist[t] };
  }
  const P = (x, y, floor = 0, label = "") => ({ x, y, floor, label });
  const trials = [
    {
      id: "entrada-fusibles",
      name: "1F · Entrada a fusibles",
      description: "Cruza el hall, entra al garaje y pulsa E junto a la caja.",
      start: P(640, 990),
      goals: [P(1052, 940, 0, "Fusibles")],
      finish: "fuse",
    },
    {
      id: "fusibles-armario",
      name: "1F · Fusibles a refugio A1",
      description: "Abre A1 en la galería, entra completamente y cierra con E.",
      start: P(1052, 940),
      goals: [P(535, 371, 0, "Armario A1")],
      finish: "closet",
    },
    {
      id: "living-armario",
      name: "1F · Living a refugio A1",
      description: "Desde el living ampliado, alcanza A1 y cierra sus puertas desde dentro.",
      start: P(260, 910),
      goals: [P(535, 371, 0, "Armario A1")],
      finish: "closet",
    },
    {
      id: "dormitorio-armario",
      name: "1F · Dormitorio a refugio A1",
      description: "Sal al distribuidor y alcanza A1 en la galería.",
      start: P(250, 480),
      goals: [P(535, 371, 0, "Armario A1")],
      finish: "closet",
    },
    {
      id: "oficina-hall",
      name: "1F · Oficina al hall",
      description: "Prueba el paso junto a la escalera desplazada 40 u.",
      start: P(330, 645),
      goals: [P(620, 645, 0, "Hall")],
      finish: "touch",
    },
    {
      id: "circuito",
      name: "1F · Circuito interior",
      description: "Recorre comedor, cocina y galería; vuelve al hall siguiendo las marcas.",
      start: P(740, 620),
      goals: [
        P(900, 640, 0, "Comedor"),
        P(980, 480, 0, "Cocina"),
        P(750, 435, 0, "Galería"),
        P(740, 600, 0, "Hall"),
      ],
      finish: "touch",
    },
    {
      id: "subida",
      name: "Escalera · Subir a 2F",
      description:
        "Entra por el extremo inferior de la escalera y camina hasta arriba. El piso cambia al terminar el tramo.",
      start: P(552, 814),
      goals: [P(552, 560, 1, "Llegada a segundo piso")],
      finish: "touch",
    },
    {
      id: "bajada",
      name: "Escalera · Bajar a 1F",
      description:
        "Desde el distribuidor superior, recorre los peldaños hacia abajo hasta volver al hall.",
      start: P(552, 560, 1),
      goals: [P(552, 814, 0, "Llegada a planta baja")],
      finish: "touch",
    },
    {
      id: "principal-a2",
      name: "2F · Dormitorio a refugio A2",
      description:
        "Sal del dormitorio principal, llega a la sala de estar y entra en A2. Cierra con E.",
      start: P(900, 450, 1),
      goals: [P(214, 574, 1, "Armario A2")],
      finish: "closet",
    },
    {
      id: "secundario-a2",
      name: "2F · Dormitorio secundario a A2",
      description:
        "Pasa por la galería y el distribuidor hasta la sala de estar. Entra en A2 y cierra.",
      start: P(240, 450, 1),
      goals: [P(214, 574, 1, "Armario A2")],
      finish: "closet",
    },
    {
      id: "circuito-arriba",
      name: "2F · Circuito por el vestidor",
      description:
        "Galería, dormitorio principal, vestidor y distribuidor: prueba la conexión secundaria.",
      start: P(720, 620, 1),
      goals: [
        P(750, 435, 1, "Galería"),
        P(900, 450, 1, "Dormitorio principal"),
        P(960, 600, 1, "Vestidor"),
        P(720, 620, 1, "Distribuidor"),
      ],
      finish: "touch",
    },
    {
      id: "arriba-fusibles",
      name: "Dos pisos · Dormitorio a fusibles",
      description:
        "Desde el dormitorio principal, baja por la escalera y restablece la electricidad con E en el garaje.",
      start: P(900, 450, 1),
      goals: [P(1052, 940, 0, "Fusibles")],
      finish: "fuse",
    },
    {
      id: "fusibles-a2",
      name: "Dos pisos · Fusibles a refugio A2",
      description:
        "Desde el garaje, sube por la escalera, entra en A2 en la sala de estar y cierra con E.",
      start: P(1052, 940),
      goals: [P(214, 574, 1, "Armario A2")],
      finish: "closet",
    },
  ];
  function crossPath(grids, start, target) {
    const from = start.floor ?? 0,
      to = target.floor ?? from;
    const first = grids[from];
    if (from === to) {
      const p = path(first, start, target);
      return p
        ? { ...p, points: p.points.map((v) => ({ ...v, floor: from })), transitions: 0 }
        : null;
    }
    const cx = floors[from].stairs[0] + floors[from].stairs[2] / 2;
    const exit = P(cx, from === 0 ? 614 : 762, from),
      arrival = P(cx, from === 0 ? 560 : 814, to);
    const a = path(first, start, exit),
      b = path(grids[to], arrival, target);
    if (!a || !b) return null;
    return {
      distance: a.distance + b.distance,
      transitions: 1,
      points: [
        ...a.points.map((v) => ({ ...v, floor: from })),
        ...b.points.map((v) => ({ ...v, floor: to })),
      ],
    };
  }
  function baseline(grids, trial) {
    let current = trial.start,
      total = 0,
      points = [],
      transitions = 0;
    for (const target of trial.goals) {
      const p = crossPath(grids, current, target);
      if (!p) return null;
      total += p.distance;
      transitions += p.transitions;
      points.push(...p.points);
      current = target;
    }
    return { distance: total, points, transitions };
  }
  root.UmbraGeometry = {
    data: floors[0],
    floors,
    inside,
    model,
    blocked,
    outdoors,
    move,
    grid,
    path,
    baseline,
    crossPath,
    trials,
    stairDestination,
  };
  if (typeof module !== "undefined") module.exports = root.UmbraGeometry;
})(globalThis);
