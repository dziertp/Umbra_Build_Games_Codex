// Umbra — arte compartido en pixel art, dibujado en código.
//   Umbra.art.tool(ctx, id, x, y, scale)        herramienta de 16×16 (× scale), vista de frente
//   Umbra.art.portrait(ctx, x, y, mood, t)      retrato del investigador de 32×32
//     mood: 'calm' | 'alert' | 'scared' | 'tired' | 'dark' | 'relief'; t en segundos (parpadeo, temblor)
(function () {
  'use strict';

  // ---------- Herramientas (16×16) ----------
  const K = '#0d0b0e'; // contorno
  const TOOLS = {
    emf: {
      pal: { k: K, d: '#2a2a30', g: '#3fbf4a', G: '#9fd04a', y: '#e8d24a', o: '#e8902a', r: '#d8402a' },
      px: [
        '................', '..kkkkkkkkkkkk..', '..kddddddddddk..', '..kgdGdydodrdk..', '..kddddddddddk..',
        '..kddddddddddk..', '..kdkkkkkkkkdk..', '..kddddddddddk..', '..kdkkkkkkkkdk..', '..kddddddddddk..',
        '..kkkkkkkkkkkk..', '.....kddddk.....', '.....kddddk.....', '.....kddddk.....', '.....kkkkkk.....',
        '................',
      ],
    },
    uv: {
      pal: { k: K, m: '#5f3f8c', M: '#c8a0ff', p: '#4a3070', P: '#c070ff' },
      px: [
        '................', '................', '................', '................', '..........kkkkk.',
        '..........kpppPk', 'kkkkkkkkkkkpppPk', 'kmmmmmmmmmkpppPk', 'kmMmmmmmmmkpppPk', 'kkkkkkkkkkkpppPk',
        '..........kpppPk', '..........kkkkk.', '................', '................', '................',
        '................',
      ],
    },
    flashlight: {
      pal: { k: K, m: '#3a3a40', M: '#8a8a90', p: '#2a2a30', P: '#f2e2a0' },
      px: [
        '................', '................', '................', '................', '..........kkkkk.',
        '..........kpppPk', 'kkkkkkkkkkkpppPk', 'kmmmmmmmmmkpppPk', 'kmMmmmmmmmkpppPk', 'kkkkkkkkkkkpppPk',
        '..........kpppPk', '..........kkkkk.', '................', '................', '................',
        '................',
      ],
    },
    spiritbox: {
      pal: { k: K, d: '#2e2a26', o: '#e8902a', O: '#8a4a14', s: '#5a4a3a' },
      px: [
        '............k...', '...........k....', '..........k.....', '.........k......', '.kkkkkkkkkkkkkk.',
        '.kddddddddddddk.', '.kdoOoOooodssdk.', '.kdooooooodssdk.', '.kddddddddddddk.', '.kdsdsdsddkkddk.',
        '.kdsdsdsddkkddk.', '.kddddddddddddk.', '.kkkkkkkkkkkkkk.', '................', '................',
        '................',
      ],
    },
    camera: {
      pal: { k: K, d: '#2a2c30', g: '#3c4a55', r: '#d8402a', L: '#3c4a55', W: '#c8d8e0' },
      px: [
        '................', '................', '................', '...kkkkk........', '...kgggk........',
        '.kkkkkkkkkkk....', '.kddddddddddkkk.', '.kdrddddddddkLLk', '.kddddddddddkLWk', '.kddddddddddkLLk',
        '.kddddddddddkkk.', '.kkkkkkkkkkkk...', '................', '................', '................',
        '................',
      ],
    },
    thermometer: {
      pal: { k: K, y: '#e0b830', G: '#9fd04a', r: '#d8402a', d: '#5a5a60' },
      px: [
        '................', '.....kkkkkk.....', '....kyyyyyyk....', '....kykkkkyk....', '....kykGGkyk....',
        '....kykGGkyk....', '....kykkkkyk....', '....kyyyyyyk....', '....kyyrryyk....', '....kyyyyyyk....',
        '....kyyyyyyk....', '.....kyyyyk.....', '......kddk......', '......kddk......', '.......kk.......',
        '................',
      ],
    },
    book: {
      pal: { k: K, w: '#e8e0c8', l: '#7a6a58', b: '#7c2b22' },
      px: [
        '................', '................', '................', '................', '.kkkkkk..kkkkkk.',
        'kwwwwwwkkwwwwwwk', 'kwllllwkkwllllwk', 'kwwwwwwkkwwwwwwk', 'kwlllwwkkwllwwwk', 'kwwwwwwkkwwwwwwk',
        'kwllllwkkwlllwwk', 'kwwwwwwkkwwwwwwk', '.kkkkkkkkkkkkkk.', '..bbbbbbbbbbbb..', '................',
        '................',
      ],
    },
    laser: {
      pal: { k: K, d: '#2a2c2a', g: '#3faf3a', G: '#7fff6a' },
      px: [
        '................', '..g...g...g...g.', '................', 'g...g...g...g...', '................',
        '...kkkkkkkkkk...', '...kddddddddk...', '...kdGGdddddk...', '...kdGGdddddk...', '...kddddddddk...',
        '...kkkkkkkkkk...', '......kddk......', '.....kkkkkk.....', '................', '................',
        '................',
      ],
    },
    flowers: {
      pal: { k: K, p: '#c84a6a', y: '#e8d24a', v: '#4a7a3a', l: '#5a9a4a', t: '#8a5a3a' },
      px: [
        '................', '...pp....pp.....', '..pyyp..pyyp....', '...pp....pp.....', '....v....v......',
        '....v.pp.v......', '...lv.pp.vl.....', '....vl.v.v......', '.....v.v.v......', '....kkkkkkkk....',
        '....kttttttk....', '.....kttttk.....', '.....kttttk.....', '......kkkk......', '................',
        '................',
      ],
    },
  };
  const UNKNOWN = {
    pal: { k: K, b: '#5a4a36', B: '#6b5d45' },
    px: [
      '................', '................', '................', '..kkkkkkkkkkkk..', '..kBBBBBBBBBBk..',
      '..kbbbbBBbbbbk..', '..kbbbbBBbbbbk..', '..kbbbbBBbbbbk..', '..kbbbbBBbbbbk..', '..kbbbbBBbbbbk..',
      '..kbbbbBBbbbbk..', '..kkkkkkkkkkkk..', '................', '................', '................',
      '................',
    ],
  };

  function tool(ctx, id, x, y, scale) {
    const s = Math.max(1, Math.round(scale || 1));
    const icon = TOOLS[id] || UNKNOWN;
    x = Math.round(x);
    y = Math.round(y);
    for (let j = 0; j < icon.px.length; j++) {
      const row = icon.px[j];
      for (let i = 0; i < row.length; i++) {
        const c = icon.pal[row[i]];
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(x + i * s, y + j * s, s, s);
      }
    }
  }

  // ---------- Retrato del investigador (32×32) ----------
  // Basado en Turner_Model: pelo negro despeinado, piel clara, abrigo oscuro, mochila marrón.
  const P = {
    bg: '#14161a', hair: '#241e23', hairHi: '#342b31', skin: '#d6c0a6', skinSh: '#b59c86',
    eye: '#0d0b0e', white: '#f2efe6', mouth: '#7a4a44', coat: '#2c2c35', coatHi: '#3b3b46',
    shirt: '#55525a', strap: '#5a4232', sweat: '#9ec8e8', blush: '#c89a88',
  };

  function portrait(ctx, x, y, mood, t) {
    t = t || 0;
    x = Math.round(x);
    y = Math.round(y);
    const px = (i, j, w, h, c) => {
      ctx.fillStyle = c;
      ctx.fillRect(x + i, y + j, w, h);
    };
    px(0, 0, 32, 32, mood === 'dark' ? '#050608' : P.bg);
    const blink = (t % 3.6) < 0.12;

    if (mood === 'dark') {
      // Oscuridad total: solo los ojos, como en el juego.
      if (!blink) {
        px(11, 15, 3, 1, P.white);
        px(18, 15, 3, 1, P.white);
      }
      return;
    }

    // Temblor al estar asustado.
    const dx = mood === 'scared' ? (Math.floor(t * 24) % 2 ? 1 : 0) : 0;
    const o = (i, j, w, h, c) => px(i + dx, j, w, h, c);

    // Abrigo, camisa y correas de la mochila.
    o(3, 26, 26, 6, P.coat);
    o(5, 25, 22, 1, P.coat);
    o(6, 26, 3, 6, P.coatHi);
    o(13, 24, 6, 4, P.shirt);
    o(8, 26, 2, 6, P.strap);
    o(22, 26, 2, 6, P.strap);
    // Cuello y cara.
    o(13, 21, 6, 4, P.skinSh);
    o(9, 9, 14, 13, P.skin);
    o(10, 22, 12, 1, P.skin);
    o(21, 10, 2, 11, P.skinSh);
    o(11, 22, 10, 1, P.skinSh);
    // Pelo despeinado.
    o(7, 3, 18, 7, P.hair);
    o(6, 5, 2, 9, P.hair);
    o(24, 5, 2, 8, P.hair);
    o(8, 9, 2, 6, P.hair);
    o(22, 9, 2, 5, P.hair);
    o(9, 2, 2, 1, P.hair);
    o(13, 1, 3, 2, P.hair);
    o(18, 2, 2, 1, P.hair);
    o(22, 2, 2, 2, P.hair);
    o(5, 6, 1, 2, P.hair);
    o(10, 10, 3, 2, P.hair);
    o(14, 10, 2, 1, P.hair);
    o(17, 10, 4, 2, P.hair);
    o(12, 4, 3, 1, P.hairHi);
    o(18, 5, 2, 1, P.hairHi);

    // Ojos y boca según el estado de ánimo.
    const closedEyes = () => {
      o(11, 15, 3, 1, P.eye);
      o(18, 15, 3, 1, P.eye);
    };
    if (mood === 'alert') {
      if (blink) closedEyes();
      else {
        o(11, 14, 3, 2, P.white);
        o(18, 14, 3, 2, P.white);
        o(13, 14, 1, 2, P.eye); // mira a un lado
        o(20, 14, 1, 2, P.eye);
      }
      o(11, 12, 3, 1, P.hair); // cejas arriba
      o(18, 12, 3, 1, P.hair);
      o(15, 19, 2, 2, P.mouth);
    } else if (mood === 'scared') {
      o(10, 13, 4, 4, P.white);
      o(18, 13, 4, 4, P.white);
      o(11, 14, 2, 2, P.eye);
      o(19, 14, 2, 2, P.eye);
      o(10, 11, 4, 1, P.hair);
      o(18, 11, 4, 1, P.hair);
      o(14, 19, 4, 3, P.eye); // boca abierta
      const drop = Math.floor(t * 3) % 4;
      o(24, 11 + drop, 1, 2, P.sweat);
      o(7, 13 + ((drop + 2) % 4), 1, 2, P.sweat);
    } else if (mood === 'tired') {
      o(11, 15, 3, 1, P.eye); // párpados caídos
      o(18, 15, 3, 1, P.eye);
      o(11, 14, 3, 1, P.skinSh);
      o(18, 14, 3, 1, P.skinSh);
      const pant = Math.floor(t * 4) % 2;
      o(14, 19, 4, pant ? 3 : 2, P.eye); // jadeo
      o(23, 12 + (Math.floor(t * 2) % 3), 1, 2, P.sweat);
      o(10, 17, 2, 1, P.blush);
      o(20, 17, 2, 1, P.blush);
    } else if (mood === 'relief') {
      // Ojos cerrados en arco y media sonrisa.
      o(11, 15, 3, 1, P.eye);
      o(18, 15, 3, 1, P.eye);
      o(10, 14, 1, 1, P.eye);
      o(21, 14, 1, 1, P.eye);
      o(14, 19, 1, 1, P.mouth);
      o(15, 20, 3, 1, P.mouth);
      o(18, 19, 1, 1, P.mouth);
    } else {
      // calm
      if (blink) closedEyes();
      else {
        o(12, 14, 2, 2, P.eye);
        o(18, 14, 2, 2, P.eye);
      }
      o(15, 19, 3, 1, P.mouth);
    }
  }

  Umbra.art = { tool, portrait, toolIds: Object.keys(TOOLS) };
})();
