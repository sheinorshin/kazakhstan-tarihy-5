/* =========================================================================
   Петроглиф (жартас суреті) стиліндегі жанды суреттер.
   Әр фигура 120×80 өлшемді торда сызылған; sc() арқылы көрініске қойылады.
   ========================================================================= */
(function () {
  const A = {};
  const g = (cls, inner, tr) => `<g class="${cls}"${tr ? ` transform="${tr}"` : ''}>${inner}</g>`;
  const legs = (a, b) => `<g class="lg la">${a}</g><g class="lg lb">${b}</g>`;

  A.horse = (cls = '') => g('fig horse ' + cls,
    `<ellipse class="f" cx="56" cy="40" rx="25" ry="9"/>` +
    `<path class="w8" d="M75 36 L89 18"/><path class="w7" d="M88 17 L102 25"/><path class="w3" d="M87 15 L85 8"/>` +
    `<path class="w3" d="M78 32 L84 22"/><path class="w4" d="M32 37 Q20 40 17 55"/>` +
    legs(`<path class="w4" d="M38 46 L33 68"/><path class="w4" d="M74 46 L80 68"/>`, `<path class="w4" d="M46 47 L48 68"/><path class="w4" d="M67 47 L65 68"/>`));

  A.rider = (cls = '', weapon = 'bow') => g('fig rider ' + cls,
    A.horse('') +
    `<path class="w5" d="M59 31 L57 13"/><circle class="f" cx="57" cy="8" r="4.6"/>` +
    (weapon === 'bow'
      ? `<path class="w3" d="M57 19 L71 17"/><path class="w3 bow" d="M71 4 Q81 17 71 30"/><path class="w1" d="M71 4 L66 17 L71 30"/>`
      : weapon === 'lance'
        ? `<path class="w3" d="M57 20 L68 22"/><path class="w3" d="M30 14 L116 24"/><path class="f" d="M116 24 L106 19 L108 26 Z"/>`
        : `<path class="w3" d="M57 19 Q66 12 70 4"/><path class="w2" d="M70 4 L74 -2"/>`));

  A.deer = (cls = '') => g('fig deer ' + cls,
    `<ellipse class="f" cx="56" cy="44" rx="24" ry="8"/>` +
    `<path class="w7" d="M75 40 L85 25"/><path class="w6" d="M84 24 L95 29"/>` +
    `<path class="w3 ant" d="M86 22 Q82 10 74 4 M80 12 Q86 8 87 1 M77 7 Q72 8 67 4 M88 22 Q94 12 102 7 M96 13 Q101 7 103 1"/>` +
    `<path class="w4" d="M33 41 L27 37"/>` +
    legs(`<path class="w4" d="M39 50 L35 72"/><path class="w4" d="M72 50 L78 72"/>`, `<path class="w4" d="M46 51 L48 72"/><path class="w4" d="M65 51 L63 72"/>`));

  A.ibex = (cls = '') => g('fig ibex ' + cls,
    `<ellipse class="f" cx="54" cy="46" rx="22" ry="8"/>` +
    `<path class="w7" d="M72 42 L82 28"/><path class="w6" d="M81 27 L92 33"/>` +
    `<path class="w5 horn" d="M84 26 Q76 2 56 10"/><path class="w2" d="M90 33 L90 39"/><path class="w4" d="M33 42 L28 36"/>` +
    legs(`<path class="w4" d="M38 52 L34 72"/><path class="w4" d="M69 52 L74 72"/>`, `<path class="w4" d="M45 53 L47 72"/><path class="w4" d="M62 53 L60 72"/>`));

  A.camel = (cls = '') => g('fig camel ' + cls,
    `<path class="f" d="M30 46 Q32 30 42 34 Q48 18 57 32 Q63 18 70 32 Q76 34 78 40 L78 47 Z"/>` +
    `<path class="w7" d="M76 40 Q88 38 91 24"/><path class="w6" d="M90 23 L101 26"/><path class="w3" d="M31 42 Q24 46 25 54"/>` +
    legs(`<path class="w4" d="M36 46 L33 74"/><path class="w4" d="M72 46 L76 74"/>`, `<path class="w4" d="M44 47 L46 74"/><path class="w4" d="M65 47 L63 74"/>`));

  A.man = (cls = '', pose = 'spear') => g('fig man ' + cls,
    `<circle class="f" cx="60" cy="14" r="6"/><path class="w5" d="M60 21 L60 46"/>` +
    `<g class="lg la"><path class="w4" d="M60 46 L52 70"/></g><g class="lg lb"><path class="w4" d="M60 46 L68 70"/></g>` +
    (pose === 'spear'
      ? `<path class="w3" d="M60 28 L74 24"/><path class="w3" d="M60 30 L50 36"/><path class="w3 spear" d="M64 40 L100 6"/><path class="f" d="M100 6 L92 9 L97 14 Z"/>`
      : pose === 'bow'
        ? `<path class="w3" d="M60 28 L80 26"/><path class="w3" d="M60 30 L74 32"/><path class="w3" d="M80 10 Q92 27 80 44"/><path class="w1" d="M80 10 L73 30 L80 44"/>`
        : `<path class="w3" d="M60 30 Q48 26 44 16"/><path class="w3" d="M60 30 Q72 26 76 16"/>`));

  A.sunman = (cls = '') => g('fig sunman ' + cls,
    `<g class="rays">${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<path class="w3" d="M${(60 + Math.cos(a) * 13).toFixed(1)} ${(20 + Math.sin(a) * 13).toFixed(1)} L${(60 + Math.cos(a) * 21).toFixed(1)} ${(20 + Math.sin(a) * 21).toFixed(1)}"/><circle class="f" cx="${(60 + Math.cos(a) * 23).toFixed(1)}" cy="${(20 + Math.sin(a) * 23).toFixed(1)}" r="2"/>`; }).join('')}</g>` +
    `<circle class="f" cx="60" cy="20" r="9"/><path class="w5" d="M60 30 L60 58"/>` +
    `<path class="w4 arm" d="M60 40 Q48 38 43 27"/><path class="w4 arm2" d="M60 40 Q72 38 77 27"/>` +
    `<path class="w4" d="M60 58 Q49 61 47 76"/><path class="w4" d="M60 58 Q71 61 73 76"/><path class="w3" d="M60 58 L60 68"/>`);

  A.mammoth = (cls = '') => g('fig mammoth ' + cls,
    `<path class="f" d="M24 58 Q20 24 50 16 Q66 10 80 20 Q92 28 92 44 L92 58 Z"/>` +
    `<path class="w6 trunk" d="M92 36 Q104 48 98 64 Q96 70 101 70"/><path class="w3" d="M89 44 Q103 54 108 44"/>` +
    `<path class="w3" d="M24 40 Q16 44 16 54"/>` +
    legs(`<path class="w8" d="M33 56 L32 75"/><path class="w8" d="M83 56 L84 75"/>`, `<path class="w8" d="M45 58 L46 75"/><path class="w8" d="M72 58 L71 75"/>`));

  A.yurt = (cls = '') => g('fig yurt ' + cls,
    `<path class="smoke w3" d="M60 18 Q55 12 60 7 Q65 2 60 -4"/>` +
    `<path class="w4" d="M18 48 Q22 26 60 21 Q98 26 102 48"/><path class="w4" d="M18 48 L102 48 L102 74 L18 74 Z"/>` +
    `<path class="w2" d="M60 21 L40 48 M60 21 L80 48 M60 21 L60 48 M28 48 L48 74 M48 48 L28 74 M72 48 L92 74 M92 48 L72 74"/>` +
    `<path class="f" d="M52 56 L68 56 L68 74 L52 74 Z"/>`);

  A.fire = (cls = '') => g('fig fire ' + cls,
    `<path class="f fl1" d="M60 70 Q44 60 52 44 Q54 54 60 50 Q58 38 66 30 Q66 44 74 50 Q78 62 60 70 Z"/>` +
    `<path class="f fl2" d="M60 70 Q52 64 56 56 Q60 60 62 54 Q68 60 66 66 Z" style="opacity:.6"/>` +
    `<path class="w4" d="M42 74 L78 66 M42 66 L78 74"/>`);

  A.arrow = (cls = '') => g('fig arrow ' + cls,
    `<path class="w3" d="M10 40 L100 40"/><path class="f" d="M108 40 L96 34 L98 40 L96 46 Z"/><path class="w2" d="M10 40 L4 34 M10 40 L4 46 M16 40 L10 34 M16 40 L10 46"/>`);

  A.wall = (cls = '') => g('fig wall ' + cls,
    `<path class="w4" d="M6 74 L6 30 L18 30 L18 22 L30 22 L30 30 L46 30 L46 22 L58 22 L58 30 L74 30 L74 22 L86 22 L86 30 L98 30 L98 14 L114 14 L114 74 Z"/>` +
    `<path class="f" d="M50 52 Q56 42 62 52 L62 74 L50 74 Z"/>`);

  A.sun = (cls = '') => g('fig sun ' + cls,
    `<circle class="f" cx="60" cy="40" r="14"/><g class="rays">${Array.from({ length: 16 }, (_, i) => { const a = i * Math.PI / 8; return `<path class="w3" d="M${(60 + Math.cos(a) * 19).toFixed(1)} ${(40 + Math.sin(a) * 19).toFixed(1)} L${(60 + Math.cos(a) * 27).toFixed(1)} ${(40 + Math.sin(a) * 27).toFixed(1)}"/>`; }).join('')}</g>`);

  /* Фигураны көрініске қою: x, y — сол жақ жоғарғы бұрыш, s — масштаб, flip — айналдыру */
  const P = (fig, x, y, s = 1, flip = false, extra = '') =>
    `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})${flip ? ' translate(-120 0)' : ''}"${extra}>${fig}</g>`;
  const mover = (inner, dur, delay = 0, cls = 'mv') => `<g class="${cls}" style="animation-duration:${dur}s;animation-delay:${delay}s">${inner}</g>`;
  const ground = (y = 232) => `<path class="gl" d="M0 ${y} H800"/><path class="gd" d="M0 ${y + 10} H800"/>`;
  const dots = (n, seed = 3) => { let s = seed, h = ''; for (let i = 0; i < n; i++) { s = (s * 9301 + 49297) % 233280; const x = (s / 233280) * 800; s = (s * 9301 + 49297) % 233280; const y = (s / 233280) * 150; h += `<circle class="dot" cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(1 + (i % 3) * .6).toFixed(1)}" style="animation-delay:${(i % 7) * .45}s"/>`; } return h; };

  const SCENES = {
    sunman: () => dots(26, 5) + ground() +
      P(A.sunman('sway'), 330, 18, 1.8) +
      mover(P(A.deer('run'), 0, 150, .9), 26, 0) + mover(P(A.ibex('run'), 0, 152, .8), 26, -13) +
      P(A.sun('spin'), 640, -6, .9),
    stone: () => dots(14, 9) + ground() +
      P(A.fire('flick'), 60, 150, 1) +
      mover(P(A.mammoth('walk'), 0, 120, 1.3, true), 34, 0, 'mv rev') +
      mover(P(A.man('run', 'spear'), 0, 140, 1.15), 34, -2, 'mv rev slow') +
      mover(P(A.man('run', 'spear'), 0, 146, 1.05), 34, -4, 'mv rev slow') +
      P(A.deer(''), 640, 150, .8, true),
    nomads: () => dots(10, 2) + ground() +
      P(A.sun('spin arc'), 600, -10, .8) +
      P(A.yurt(''), 70, 120, 1.45) + P(A.yurt(''), 230, 150, 1) +
      P(A.horse('graze'), 420, 160, .9) + P(A.horse('graze d2'), 520, 158, .85, true) +
      mover(P(A.camel('run'), 0, 150, .95), 40, -20),
    saka: () => dots(16, 7) + ground() +
      P(A.deer('gold'), 70, 130, 1.25) + P(A.ibex('gold'), 560, 136, 1.1, true) +
      mover(P(A.rider('run', 'bow'), 0, 140, 1.15), 14, 0) +
      mover(P(A.arrow('fly'), 0, 60, .7), 3.2, 0, 'mv fast') +
      P(A.sun('spin'), 340, -20, .75),
    silk: () => dots(12, 4) + ground() +
      P(A.wall(''), 640, 140, 1.2) +
      mover(P(A.camel('run'), 0, 148, .9) + P(A.camel('run d2'), -105, 150, .85) + P(A.camel('run'), -205, 148, .9) + P(A.rider('run', 'staff'), -320, 140, .95), 30, 0, 'mv wide') +
      P(A.sun('spin'), 120, -14, .7),
    huns: () => dots(12, 8) + ground() +
      mover(P(A.rider('run', 'bow'), 0, 140, 1.1), 10, 0) +
      mover(P(A.rider('run d2', 'bow'), 0, 148, 1), 10, -3.3) +
      mover(P(A.rider('run', 'bow'), 0, 136, 1.05), 10, -6.6) +
      mover(P(A.arrow('fly whistle'), 0, 70, .6), 2.4, 0, 'mv fast') + mover(P(A.arrow('fly'), 0, 96, .55), 2.4, -1.1, 'mv fast'),
    sarmat: () => dots(12, 6) + ground() +
      mover(P(A.rider('run', 'lance'), 0, 136, 1.3), 12, 0) +
      P(A.man('', 'bow'), 600, 140, 1.25, true) + P(A.horse('graze'), 470, 162, .8, true),
    overview: () => dots(20, 11) + ground() +
      `<g transform="translate(400 124)"><g class="wheelspin">` +
      [A.horse(''), A.deer(''), A.camel(''), A.yurt(''), A.ibex(''), A.mammoth('')].map((f, i) => { const a = i * Math.PI / 3; return `<g transform="translate(${(Math.cos(a) * 98).toFixed(0)} ${(Math.sin(a) * 98).toFixed(0)})"><g class="unspin">${P(f, -30, -20, .5)}</g></g>`; }).join('') + `</g></g>` +
      P(A.sunman('sway'), 368, 84, .55) +
      mover(P(A.rider('run', 'bow'), 0, 160, .7), 16, 0) + P(A.yurt(''), 690, 166, .7)
  };

  window.ART = A;
  window.scene = (key, label) =>
    `<svg class="scene sc-${key}" viewBox="0 0 800 260" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${label || 'Жартас суреті стиліндегі көрініс'}">${(SCENES[key] || SCENES.sunman)()}</svg>`;
  window.figure = (key, cls) => `<svg class="mini-fig" viewBox="0 -8 120 90" aria-hidden="true">${A[key] ? A[key](cls || '') : ''}</svg>`;

  /* Сақ стиліндегі шаңырақ белгісі (логотип) */
  window.LOGO = `<svg viewBox="0 0 64 64" aria-hidden="true" class="logo-svg"><circle cx="32" cy="32" r="29" class="lg-ring"/><g class="lg-rays">${Array.from({ length: 16 }, (_, i) => { const a = i * Math.PI / 8; return `<path d="M${(32 + Math.cos(a) * 15).toFixed(1)} ${(32 + Math.sin(a) * 15).toFixed(1)} L${(32 + Math.cos(a) * 26).toFixed(1)} ${(32 + Math.sin(a) * 26).toFixed(1)}"/>`; }).join('')}</g><circle cx="32" cy="32" r="13" class="lg-in"/><path d="M19 32 H45 M32 19 V45 M21 26 Q32 22 43 26 M21 38 Q32 42 43 38" class="lg-x"/></svg>`;

  /* Қошқар мүйіз өрнегі — бөлгіш сызық */
  window.ORNAMENT = `<svg class="orn" viewBox="0 0 240 24" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path d="M0 12 H86 M154 12 H240"/><path d="M96 12 Q96 2 106 2 Q116 2 116 10 Q116 16 110 16 Q105 16 105 11 M144 12 Q144 2 134 2 Q124 2 124 10 Q124 16 130 16 Q135 16 135 11"/><path class="d" d="M120 4 L126 12 L120 20 L114 12 Z"/></svg>`;
})();
