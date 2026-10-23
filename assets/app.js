/* =========================================================================
   Сайттың жұмыс логикасы: беттер, тұлға терезесі, карта, уақыт сызығы, ойындар.
   ========================================================================= */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const store = { get(k, d) { try { const v = localStorage.getItem('kt5.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('kt5.' + k, JSON.stringify(v)); } catch (e) { /* жоқ */ } } };

  const B = window.BOOK, CH = window.CHAPTERS, TP = window.TOPICS, PS = window.PERSONS, CATS = window.CATS;
  const TMAP = {}; TP.forEach(t => { TMAP[t.id] = t; });
  const PMAP = {}; PS.forEach(p => { PMAP[p.id] = p; p.topics = []; });
  TP.forEach(t => (t.ppl || []).forEach(([pid, role]) => { if (PMAP[pid]) PMAP[pid].topics.push([t.id, role]); else console.warn('Тұлға табылмады:', pid, t.id); }));
  const GL = {}; window.GLOSSARY.forEach(([term, def]) => { GL[term.toLowerCase()] = { term, def, topics: [] }; });
  TP.forEach(t => (t.kw || []).forEach(k => { const g = GL[k.toLowerCase()]; if (g && !g.topics.includes(t.id)) g.topics.push(t.id); }));
  const SITEMAP = {}; window.SITES.forEach(s => { SITEMAP[s[0]] = s; });
  const ORDER = TP.map(t => t.id);
  const topicCount = TP.filter(t => t.ch > 0).length;

  /* ---------- Жалпы бөлшектер ---------- */
  const initials = n => n.replace(/\(.*?\)/g, '').trim().split(/\s+/).filter(w => /^[А-ЯӘҒҚҢӨҰҮҺІЁA-Z]/.test(w) && !/^[IVX]+$/.test(w)).slice(0, 2).map(w => w[0]).join('') || n[0];
  /* Суреттер Wikimedia Commons-тан жүктеледі (330px стандартты өлшем). Жүктелмесе, бас әріптер көрінеді. */
  const imgUrl = p => p.img ? window.IMG_BASE + p.img.replace('/500px-', '/330px-') : '';
  const ava = (p, cls = '') => `<span class="ava ${cls}"><span class="ini">${esc(initials(p.n))}</span>${p.img ? `<img src="${esc(imgUrl(p))}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}</span>`;
  const catOf = p => CATS[p.cat] || ['', 'var(--gold)'];
  const tLabel = id => { const t = TMAP[id]; return t ? (t.ch ? t.n : 'Кіріспе') : ''; };
  const chapterOf = t => CH.find(c => c.n === t.ch);
  const band = (key, label) => `<div class="band">${window.scene(key, label)}</div>`;
  const para = arr => { let h = '', ul = []; const flush = () => { if (ul.length) { h += `<ul>${ul.map(x => `<li>${x}</li>`).join('')}</ul>`; ul = []; } };
    arr.forEach(s => { if (s.startsWith('- ')) ul.push(s.slice(2)); else { flush(); h += `<p>${s}</p>`; } }); flush(); return h; };
  const ICON = {
    sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M7 4h3v16H7zM14 4h3v16h-3z"/></svg>',
    menu: '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>'
  };

  /* ---------- Басты бет ---------- */
  const isPhone = () => window.matchMedia('(max-width: 760px)').matches;
  /* Тараулар: компьютерде ашық, телефонда жиналған — басқанда ашылады */
  function chapterList() {
    const open = !isPhone();
    return CH.filter(c => c.n > 0).map(c => { const ts = TP.filter(t => t.ch === c.n); return `<details class="chap rv"${open ? ' open' : ''}>
      <summary class="chap-h"><span class="chap-n">${c.n}</span><span><span class="eyebrow">${esc(c.era)}</span><h3>${esc(c.t)}</h3><span class="cnt">${ts.length} тақырып</span></span><span class="chev" aria-hidden="true"></span></summary>
      <ul class="tlist">${ts.map(t => `<li><a href="#t-${t.id}"><span class="no">${t.n}</span><span class="tt">${esc(t.t)}</span></a></li>`).join('')}</ul>
      <a class="chap-go" href="#c-${c.n}">Тарау туралы: мақсаты мен тапсырмалары →</a></details>`; }).join('');
  }
  function home() {
    const feats = [
      ['#topics', 'Тақырыптар', `${topicCount} тақырыптың қысқаша мазмұны, тұлғалары, тапсырмалары мен тесті.`, 'horse', 'Оқу'],
      ['#persons', 'Тұлғалар', `${PS.length} тарихи тұлға туған жылы бойынша. Әрқайсысының өмірі, туыстары, тақырыптары.`, 'man', 'Тұлғалар'],
      ['#timeline', 'Уақыт өзені', 'Палеолиттен Аттилаға дейін: дәуірлер мен оқиғалар, ғалымдардың ашулары.', 'deer', 'Ерекше'],
      ['#map', 'Тарихи карта', 'Есік, Берел, Ботай, Тамғалы... Ескерткіштер картада.', 'camel', 'Ерекше'],
      ['#game', 'Тарихи сайыс', 'Білімді тексер: тест және «Кім айтты?» ойыны.', 'ibex', 'Ойын'],
      ['#glossary', 'Сөздік', `${window.GLOSSARY.length} термин түсіндірмесі, іздеу мүмкіндігімен.`, 'yurt', 'Анықтама']
    ];
    return `<div class="page">
      <div class="hero">${band('sunman', 'Тамғалы стиліндегі күнбасты бейне мен аңдар')}
        <div class="wrap"><div class="read hero-text"><div class="hero-card rise">
          <span class="eyebrow">5-сынып · Ежелгі дәуір</span>
          <h1><span class="g">${esc(B.title)}</span></h1>
          <p class="lede">Оқулық негізіндегі интерактивті сайт: тақырыптар мен тұлғалар, уақыт өзені, тарихи карта, сөздік және сайыс. Оқушылар мен мұғалімдерге арналған.</p>
          <div class="credits">
            <div class="credit"><span class="eyebrow">Оқулық авторлары</span><ul>${B.authors.map(a => `<li>${esc(a)}</li>`).join('')}</ul><p>${esc(B.sub)}. ${esc(B.pub)}.</p></div>
            <div class="credit maker"><span class="eyebrow">Сайтты жасаған</span><div class="name">${esc(B.maker)}</div><p>Оқулық мазмұны қысқаша, өз сөзімізбен берілді.</p></div>
          </div>
          <div class="stats"><div class="stat"><b data-count="7">7</b><span>тарау</span></div><div class="stat"><b data-count="${topicCount}">${topicCount}</b><span>тақырып</span></div><div class="stat"><b data-count="${PS.length}">${PS.length}</b><span>тұлға</span></div><div class="stat"><b data-count="${window.GLOSSARY.length}">${window.GLOSSARY.length}</b><span>термин</span></div></div>
        </div></div></div></div>
      <div class="wrap">
        <div class="sec-h"><h2>Не бар?</h2><a href="#t-0-1">Кіріспе сабақтан бастау →</a></div>
        <div class="feat rise">${feats.map(f => `<a class="tile" href="${f[0]}"><span class="k">${f[4]}</span><h3>${f[1]}</h3><p>${f[2]}</p>${window.figure(f[3])}</a>`).join('')}</div>
        ${window.ORNAMENT}
        <div class="sec-h"><h2>Тараулар</h2><span class="muted">${topicCount} тақырып, 7 тарау</span></div>
        ${chapterList()}
      </div></div>`;
  }
  function topicsPage() {
    return `<div class="page">${band('overview', 'Уақыт шеңбері: жартас суреттері')}<div class="wrap"><div class="t-head read"><div class="t-card rise">
      <span class="eyebrow">Мазмұны</span><h1>Тақырыптар</h1><p class="muted">Оқулықтың 7 тарауы. Тақырыпты басып, қысқаша мазмұнын, тұлғаларын, тапсырмаларын ашыңыз.</p>
      <div class="meta"><a class="pill" href="#t-0-1">Кіріспе сабақ</a><a class="pill" href="#glossary">Сөздік</a></div></div></div>${chapterList()}</div></div>`;
  }

  /* ---------- Тарау беті ---------- */
  function chapterPage(n) {
    const c = CH.find(x => x.n === n); if (!c) return notFound();
    const ts = TP.filter(t => t.ch === n);
    const cp = PS.filter(p => (p.also || []).some(a => a[0] === 'c' + n));
    return `<div class="page">${band(c.scene, c.t)}<div class="wrap"><div class="t-head read"><div class="t-card rise">
      <div class="crumbs"><a href="#home">Басты бет</a><span>›</span><a href="#topics">Тақырыптар</a></div>
      <span class="t-num">${n ? n + '-тарау' : 'Кіріспе'}</span><h1>${esc(c.t)}</h1>
      <div class="meta"><span class="pill">${esc(c.era)}</span><span class="pill">${ts.length} тақырып</span></div></div></div>
      <div class="read prose"><p class="lead rv">${esc(c.intro)}</p>
      ${cp.length ? `<div class="quotes">${cp.map(p => `<blockquote class="scroll rv">Қазақ жұртының арғы түбі ғұндардан басталады. Ғұндардан кейін көк түріктерге жалғасады.<cite>— <button data-person="${p.id}">${esc(p.n)}</button></cite></blockquote>`).join('')}</div>` : ''}
      ${c.think ? `<h2>Ойланып көрейік</h2><ul>${c.think.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      <h2>Тақырыптар</h2><ul class="tlist" style="padding:0">${ts.map(t => `<li><a href="#t-${t.id}"><span class="no">${t.n}</span><span class="tt">${esc(t.t)}</span></a></li>`).join('')}</ul>
      ${c.learned ? `<details class="box rv"><summary><span class="badge">✓</span>Сендер не білдіңдер?</summary><div class="in"><ul>${c.learned.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></details>` : ''}
      ${c.tasks ? `<details class="box rv" open><summary><span class="badge">?</span>Тарау бойынша тапсырмалар</summary><div class="in"><ol>${c.tasks.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div></details>` : ''}
      ${pagerChapter(n)}</div></div></div>`;
  }
  function pagerChapter(n) {
    const prev = CH.find(c => c.n === n - 1), next = CH.find(c => c.n === n + 1);
    return `<nav class="pager">${prev ? `<a href="#c-${prev.n}"><small>← Алдыңғы тарау</small><b>${esc(prev.t)}</b></a>` : '<span></span>'}${next ? `<a class="nx" href="#c-${next.n}"><small>Келесі тарау →</small><b>${esc(next.t)}</b></a>` : ''}</nav>`;
  }

  /* ---------- Тақырып беті ---------- */
  function topicPage(id) {
    const t = TMAP[id]; if (!t) return notFound();
    const c = chapterOf(t), i = ORDER.indexOf(id), prev = TMAP[ORDER[i - 1]], next = TMAP[ORDER[i + 1]];
    const qs = (t.quote || []).map(([pid, txt, src]) => `<blockquote class="scroll rv">${esc(txt)}<cite>— ${PMAP[pid] ? `<button data-person="${pid}">${esc(src)}</button>` : esc(src)}</cite></blockquote>`).join('');
    const ppl = (t.ppl || []).map(([pid, role]) => { const p = PMAP[pid]; if (!p) return ''; return `<button class="pcard rv" data-person="${pid}">${ava(p)}<span><span class="nm">${esc(p.n)}</span><span class="yr">${esc(p.yt)}</span><span class="rl">${esc(role)}</span></span></button>`; }).join('');
    const sites = (t.sites || []).filter(s => SITEMAP[s]);
    return `<div class="page">${band(c.scene, c.t)}<div class="wrap"><div class="t-head read"><div class="t-card rise">
      <div class="crumbs"><a href="#home">Басты бет</a><span>›</span><a href="#c-${c.n}">${c.n ? c.n + '-тарау' : 'Кіріспе'}</a></div>
      <span class="t-num">${t.ch ? esc(t.n) : 'Кіріспе'}</span><h1>${esc(t.t)}</h1>
      <div class="meta"><span class="pill">Оқулық, ${esc(t.pg)} бет</span><span class="pill">${t.ls} сабақ</span>${(t.ppl || []).length ? `<span class="pill">${t.ppl.length} тұлға</span>` : ''}${sites.length ? `<a class="pill" href="#m-${sites[0]}">Картада көру</a>` : ''}</div>
      <div class="rq"><span class="ic">?</span><div><span class="eyebrow">Зерттеу сұрағы</span><div class="q">${esc(t.q)}</div></div></div>
      <div class="kw">${(t.kw || []).map(k => `<button class="chip" data-term="${esc(k)}">${esc(k)}</button>`).join('')}</div>
      </div></div>
      ${(() => { /* Бөлімдер жолағы: басқанда сол бөлімге секіреді */
        const short = s => s.length > 24 ? s.slice(0, 22).trim() + '…' : s;
        const items = t.sec.map(([h], k) => ['s' + k, k ? short(h) : 'Мазмұны'])
          .concat((t.fact || []).length ? [['facts', 'Қызықты']] : [], qs ? [['src', 'Дереккөздер']] : [], (t.dates || []).length ? [['dates', 'Даталар']] : [],
            ppl ? [['ppl', 'Тұлғалар']] : [], [['teach', 'Мұғалімге']], (t.quiz || []).length ? [['quiz', 'Тест ★']] : []);
        return `<nav class="toc read" aria-label="Тақырып бөлімдері"><div class="toc-in">${items.map(([k, l], n) => `<button type="button" data-jump="${k}"${n ? '' : ' class="on"'}>${esc(l)}</button>`).join('')}</div></nav>`; })()}
      <article class="read prose">
        <p class="lead anchor" id="s0">${t.lead}</p>
        ${t.sec.map(([h, ...ps], k) => `<section class="sec rv${k ? ' anchor' : ''}"${k ? ` id="s${k}"` : ''}><h2>${esc(h)}</h2>${para(ps)}</section>`).join('')}
        ${(t.fact || []).length ? `<div class="facts anchor" id="facts">${t.fact.map(f => `<div class="fact rv"><span class="ic">!</span><div><span class="ttl">Бұл қызықты</span><p>${esc(f)}</p></div></div>`).join('')}</div>` : ''}
        ${qs ? `<h2 class="anchor" id="src">Дереккөздер сөйлейді</h2><div class="quotes">${qs}</div>` : ''}
        ${(t.dates || []).length ? `<h2 class="anchor" id="dates">Маңызды даталар</h2><div class="dates rv">${t.dates.map(([d, e]) => `<div class="date"><b>${esc(d)}</b>${esc(e)}</div>`).join('')}</div>` : ''}
        ${ppl ? `<h2 class="anchor" id="ppl">Тақырыптағы тұлғалар</h2><p class="muted" style="margin:0">Тұлғаны басып, толық мәлімет терезесін ашыңыз.</p><p class="swipe-hint">← Карточкаларды жылжытыңыз →</p><div class="ppl">${ppl}</div>` : ''}
        ${sites.length ? `<h2>Ескерткіштер картада</h2><div class="kw">${sites.map(s => `<a class="chip" href="#m-${s}">${esc(SITEMAP[s][1])}</a>`).join('')}</div>` : ''}
        <details class="box rv anchor" id="teach"><summary><span class="badge">М</span>Мұғалімге: сабақ мақсаттары мен тапсырмалар</summary><div class="in">
          <h4>Бұл сабақта біз</h4><ul>${(t.goal || []).map(g => `<li>${esc(g)}</li>`).join('')}</ul>
          <h4>Оқулықтағы тапсырмалар</h4><ol>${(t.tasks || []).map(x => `<li>${esc(x)}</li>`).join('')}</ol>
          <p class="muted" style="margin-top:12px;font-size:15px">Оқулық беттері: ${esc(t.pg)}. Сабақ саны: ${t.ls}.</p></div></details>
        ${quizBox(t)}
        <nav class="pager">${prev ? `<a href="#t-${prev.id}"><small>← ${prev.ch ? esc(prev.n) : 'Кіріспе'}</small><b>${esc(prev.t)}</b></a>` : '<span></span>'}${next ? `<a class="nx" href="#t-${next.id}"><small>${esc(next.n)} →</small><b>${esc(next.t)}</b></a>` : ''}</nav>
      </article></div></div>`;
  }
  function quizBox(t) {
    if (!t.quiz || !t.quiz.length) return '';
    return `<section class="box quiz rv anchor" id="quiz" data-quiz="${t.id}"><div class="box-h"><span class="badge">★</span>Өзіңді тексер</div><div class="in">
      ${t.quiz.map((q, qi) => { const opts = shuffle(q[1].map((o, oi) => [o, oi === q[2]])); return `<div class="qq" data-qi="${qi}"><div class="qt">${qi + 1}. ${esc(q[0])}</div><div class="opts">${opts.map(([o, ok]) => `<button class="opt" data-ok="${ok ? 1 : 0}">${esc(o)}</button>`).join('')}</div><div class="why" hidden>${q[3] ? esc(q[3]) : ''}</div></div>`; }).join('')}
      <div class="score" hidden><span class="big">0/0</span><span class="msg"></span><button class="btn alt" data-retry="${t.id}">Қайта бастау</button></div></div></section>`;
  }

  /* ---------- Тұлғалар беті ---------- */
  let pFilter = { cat: 'all', q: '' };
  function eraOf(y) {
    if (y == null) return 'Аңыз кейіпкерлері';
    if (y < -300) return 'Б.з.д. VII–IV ғасырлар';
    if (y < 0) return 'Б.з.д. III–I ғасырлар';
    if (y < 600) return 'Біздің заманымыздың I–VI ғасырлары';
    if (y < 1800) return 'Орта ғасырлар';
    return 'XIX–XXI ғасырлар: ғалымдар мен суретшілер';
  }
  function personsList() {
    const q = pFilter.q.trim().toLowerCase();
    const list = PS.filter(p => (pFilter.cat === 'all' || p.cat === pFilter.cat) && (!q || (p.n + ' ' + p.role + ' ' + p.from).toLowerCase().includes(q)))
      .sort((a, b) => (a.y == null) - (b.y == null) || (a.y - b.y));
    if (!list.length) return '<p class="muted">Ештеңе табылмады.</p>';
    let h = '', last = '';
    list.forEach((p, i) => {
      const e = eraOf(p.y); if (e !== last) { h += `<div class="pera"><span>${esc(e)}</span></div>`; last = e; }
      const cc = catOf(p)[1], n = p.topics.length + (p.also || []).length;
      h += `<button class="pt" data-person="${p.id}" style="--cc:${cc};animation-delay:${Math.min(i, 14) * 35}ms">${ava(p)}<span class="info"><span class="y">${esc(p.yt)}</span><span class="nm">${esc(p.n)}</span><span class="sub">${esc(p.role)} · ${esc(p.from)}</span><span><span class="cat">${esc(catOf(p)[0])}</span><span class="tc">${n} тақырыпта</span></span></span></button>`;
    });
    return `<div class="ptl">${h}</div>`;
  }
  function personsPage() {
    return `<div class="page">${band('saka', 'Сақ дәуірінің жартас суреттері')}<div class="wrap"><div class="t-head read"><div class="t-card rise">
      <span class="eyebrow">Тұлғалар</span><h1>Оқулықтағы тұлғалар</h1><p class="muted">Барлық ${PS.length} тұлға туған жылы бойынша, ең көнеден бастап реттелген. Тұлғаны басып, өмір сүрген жылдарын, қайдан шыққанын, не істегенін, туыстарын және қай тақырыптарда аталатынын көріңіз.</p></div></div>
      <div class="read"><div class="filters">
        <label class="search">${ICON.search}<input id="psearch" type="search" placeholder="Тұлғаны іздеу..." value="${esc(pFilter.q)}" aria-label="Тұлғаны іздеу"></label>
      </div><div class="filters" role="group" aria-label="Санат">${[['all', ['Барлығы']]].concat(Object.entries(CATS)).map(([k, v]) => `<button class="chip ${pFilter.cat === k ? 'on' : ''}" data-pcat="${k}">${esc(v[0])}</button>`).join('')}</div>
      <div id="plist">${personsList()}</div></div></div></div>`;
  }

  /* ---------- Тұлға терезесі ---------- */
  const FIGFOR = { ruler: 'rider', hero: 'man', author: 'camel', scientist: 'deer', art: 'ibex', legend: 'sunman' };
  function openPerson(id) {
    const p = PMAP[id]; if (!p) return;
    const links = p.topics.map(([tid, role]) => { const t = TMAP[tid]; return `<a href="#t-${tid}"><span class="no">${esc(tLabel(tid))}</span><span><span class="t">${esc(t.t)}</span><span class="d">${esc(role)}</span></span></a>`; })
      .concat((p.also || []).map(([cid, lbl]) => `<a href="#${cid.replace('c', 'c-')}"><span class="no">${esc(cid.slice(1))}-тар.</span><span><span class="t">${esc(lbl)}</span><span class="d">${esc(CH.find(c => 'c' + c.n === cid).t)}</span></span></a>`));
    const quotes = TP.flatMap(t => (t.quote || []).filter(q => q[0] === id).map(q => [t.id, q[1]]));
    const rels = (p.rel || []).map(([r, n, rid]) => `<span class="rel"><small>${esc(r)}</small>${rid && PMAP[rid] ? `<button data-person="${rid}">${esc(n)}</button>` : esc(n)}</span>`).join('');
    openModal(`<div class="sheet-top">${ava(p, 'big')}<div><span class="eyebrow" style="color:${catOf(p)[1]}">${esc(catOf(p)[0])}</span><h2 id="mtitle">${esc(p.n)}</h2><div class="role">${esc(p.role)}</div></div>${window.figure(FIGFOR[p.cat] || 'horse', 'run')}</div>
      <div class="sheet-body">
        <div class="facts-row"><div class="fr"><small>Өмір сүрген жылдары</small><div>${esc(p.yt)}</div></div><div class="fr"><small>Қайдан шыққан</small><div>${esc(p.from)}</div></div></div>
        <h3>Не істеді?</h3><ul>${(p.did || []).map(d => `<li>${esc(d)}</li>`).join('')}</ul>
        ${quotes.length ? `<h3>Сөзінен</h3>${quotes.map(([tid, q]) => `<blockquote class="scroll" style="margin:10px 0 16px">${esc(q)}<cite><a href="#t-${tid}" style="color:inherit">${esc(tLabel(tid))} тақырыбы</a></cite></blockquote>`).join('')}` : ''}
        <h3>Туыстары</h3>${rels ? `<div class="rels">${rels}</div>` : '<p class="muted" style="margin:0">Оқулықта туыстары туралы мәлімет жоқ.</p>'}
        <h3>Қай тақырыптарда аталады?</h3><div class="tlinks">${links.join('') || '<p class="muted">—</p>'}</div>
        ${p.ext ? `<div class="note"><b>Қосымша:</b> ${esc(p.ext)}</div>` : ''}
        ${p.img ? `<div class="credit-line">Сурет: <a href="https://commons.wikimedia.org/wiki/File:${encodeURIComponent(p.file || '')}" target="_blank" rel="noopener">Wikimedia Commons</a>${p.imgNote ? ' · ' + esc(p.imgNote) : ''}</div>` : '<div class="credit-line">Суреті жоқ: орнына сақ өрнегі қойылды.</div>'}
      </div>`);
  }
  function openTerm(k) {
    const g = GL[k.toLowerCase()];
    openModal(`<div class="sheet-top" style="grid-template-columns:1fr"><div><span class="eyebrow">Сөздік</span><h2 id="mtitle">${esc(g ? g.term : k)}</h2></div>${window.figure('ibex')}</div>
      <div class="sheet-body"><p style="font-size:19px;margin-top:0">${g ? esc(g.def) : 'Бұл сөз сөздікте әлі жоқ.'}</p>
      ${g && g.topics.length ? `<h3>Тақырыптарда</h3><div class="tlinks">${g.topics.map(tid => `<a href="#t-${tid}"><span class="no">${esc(tLabel(tid))}</span><span class="t">${esc(TMAP[tid].t)}</span></a>`).join('')}</div>` : ''}
      <p style="margin-top:18px"><a class="btn alt" href="#glossary">Бүкіл сөздікті ашу</a></p></div>`);
  }
  let lastFocus = null;
  function openModal(inner) {
    closeModal(true); lastFocus = document.activeElement;
    const m = document.createElement('div'); m.className = 'modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-labelledby', 'mtitle');
    m.innerHTML = `<div class="shade" data-close></div><div class="sheet"><div class="sheet-bar"><span class="grip" aria-hidden="true"></span><button class="ib x" data-close aria-label="Жабу">${ICON.close}</button></div>${inner}</div>`;
    document.body.appendChild(m); document.body.style.overflow = 'hidden'; document.body.classList.add('modal-open');
    setTimeout(() => { const b = $('.sheet .x', m); if (b) b.focus({ preventScroll: true }); }, 30);
    /* Телефонда терезені төмен сырғытып жабуға болады */
    const sh = $('.sheet', m); let y0 = null, dy = 0;
    sh.addEventListener('touchstart', e => { if (sh.scrollTop <= 0) { y0 = e.touches[0].clientY; dy = 0; sh.style.transition = 'none'; } }, { passive: true });
    sh.addEventListener('touchmove', e => { if (y0 == null) return; dy = e.touches[0].clientY - y0; if (dy > 0) sh.style.transform = `translateY(${dy}px)`; else { y0 = null; sh.style.transform = ''; } }, { passive: true });
    sh.addEventListener('touchend', () => { if (y0 == null) return; y0 = null; sh.style.transition = 'transform .25s ease'; if (dy > 110) { sh.style.transform = 'translateY(100%)'; setTimeout(() => closeModal(), 220); } else sh.style.transform = ''; });
  }
  function openMore() {
    const still = document.body.classList.contains('still');
    openModal(`<div class="sheet-top" style="grid-template-columns:1fr"><div><span class="eyebrow">Мәзір</span><h2 id="mtitle">Тағы</h2></div></div>
      <div class="sheet-body"><div class="more-grid">
        <a href="#timeline">${window.figure('deer')}Уақыт өзені</a><a href="#map">${window.figure('camel')}Карта</a><a href="#glossary">${window.figure('yurt')}Сөздік</a></div>
        <button class="more-row" role="switch" aria-checked="${isDark()}" data-toggle="theme"><span>Қараңғы түс</span><span class="sw"></span></button>
        <button class="more-row" role="switch" aria-checked="${!still}" data-toggle="motion"><span>Анимация</span><span class="sw"></span></button>
        <section class="about" aria-labelledby="about-h">
          <span class="eyebrow">Автор туралы</span>
          <h3 id="about-h" class="about-name">${esc(B.maker)}</h3>
          <p>«Қазақстан тарихы» оқулығы (5-сынып) негізіндегі осы оқу сайтының авторы.</p>
          <div class="about-links">${(B.makerLinks || []).map(([n, u]) => `<a class="btn alt" href="${esc(u)}" target="_blank" rel="noopener">${n === 'YouTube' ? '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="M10 9.2v5.6l4.8-2.8z" class="fill"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" class="fill"/></svg>'}${esc(n)}</a>`).join('')}</div>
        </section>
        <div class="note warn"><b>Ескерту.</b> Бұл сайт тек оқу мақсатында жасалған, коммерциялық мақсатта пайдаланылмайды. Сайтты немесе оның материалдарын кез келген түрде пайдалану автормен келісіліп, тек оның рұқсатымен жүзеге асырылуы тиіс.</div>
        <p class="muted" style="font-size:14px;margin:14px 2px 0">Оқулық авторлары: ${esc(B.authors.join(', '))}.</p>
        <p class="made">Сайт ${esc(B.madeWith)} көмегімен жасалды.</p></div>`);
  }
  function closeModal(silent) {
    const m = $('.modal'); if (!m) return; m.remove(); document.body.style.overflow = ''; document.body.classList.remove('modal-open');
    if (!silent && lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) { /* */ }
  }

  /* ---------- Уақыт сызығы ---------- */
  let tlTab = 'ancient';
  function timelinePage() {
    const E = window.ERAS;
    const evs = tlTab === 'ancient'
      ? E.map((era, ei) => { const list = window.EVENTS.filter(e => e[3] === ei); return list.length ? `<div class="era-h"><span style="background:${era[3]}">${esc(era[0])}</span></div>` + list.map((e, i) => `<a class="ev" href="#t-${e[2]}" style="--ec:${era[3]};animation-delay:${i * 40}ms"><span><span class="when">${esc(e[0])}</span><span class="what">${esc(e[1])}</span></span><span class="go">${esc(tLabel(e[2]))} →</span></a>`).join('') : ''; }).join('')
      : window.DISCOVERIES.map((e, i) => `<a class="ev" href="#t-${e[2]}" style="--ec:var(--turq);animation-delay:${i * 50}ms"><span><span class="when">${esc(e[0])}</span><span class="what">${esc(e[1])}</span></span><span class="go">${esc(tLabel(e[2]))} →</span></a>`).join('');
    return `<div class="page">${band('stone', 'Тас дәуірінің аңшылары')}<div class="wrap"><div class="t-head read"><div class="t-card rise">
      <span class="eyebrow">Ерекше бөлім</span><h1>Уақыт өзені</h1><p class="muted">1 миллион жыл бұрынғы алғашқы адамдардан Аттилаға дейін. Оқиғаны басып, тақырыпты ашыңыз. «Ғалымдардың ашулары» бөлімінде ескерткіштердің қашан табылғаны көрсетілген.</p></div></div>
      <div class="read"><div class="eras">${E.map((e, i) => `<a class="era" href="#t-${e[2]}" style="background:${e[3]};animation-delay:${i * 60}ms" title="${esc(e[4])}"><b>${esc(e[0])}</b><small>${esc(e[1])}</small></a>`).join('')}</div>
      <div class="tabs" role="tablist"><button class="tab ${tlTab === 'ancient' ? 'on' : ''}" data-tl="ancient" role="tab">Ежелгі дәуір оқиғалары</button><button class="tab ${tlTab === 'disc' ? 'on' : ''}" data-tl="disc" role="tab">Ғалымдардың ашулары</button></div>
      <div class="tl">${evs}</div></div></div></div>`;
  }

  /* ---------- Карта ---------- */
  const MS = 25.5, proj = (lon, lat) => [((lon - 45.6) * 0.68 * MS), ((56.2 - lat) * MS)];
  const TYPES = { s: ['Тас дәуірі тұрағы', '#8C6B4F'], b: ['Мыс-тас пен қола дәуірі', '#C08A2E'], k: ['Қорған, оба', '#C2492E'], a: ['Жартас суреттері', '#2F8F86'], c: ['Қала, қамал', '#4C6FB0'], r: ['Тайпалар аймағы', '#7C8B3A'] };
  let mapType = 'all', mapSel = null;
  const pts = arr => arr.map(([lo, la]) => proj(lo, la).map(v => v.toFixed(1)).join(',')).join(' ');
  const LAKES = [[48.6, 42.6, 'Каспий'], [59.2, 45.3, 'Арал'], [76.2, 45.75, 'Балқаш']];
  const ANGLES = [0, 180, -35, 35, 145, -145, -90, 90, -60, 60, -120, 120];
  const measure = (() => { let c = null; return (t, it) => { try { c = c || document.createElement('canvas').getContext('2d'); c.font = `${it ? 'italic ' : ''}700 12px "Alegreya Sans", "Segoe UI", Arial, sans-serif`; return c.measureText(t).width; } catch (e) { return t.length * 6.6; } }; })();
  /* Барлық атауды бір-біріне соқтықпайтын етіп орналастыру; орын тар болса, атау сызықпен ұзағырақ шығарылады */
  const LCACHE = {};
  function bestLabels(list) {
    const key = mapType + '|' + (document.fonts && document.fonts.status === 'loaded' ? 1 : 0);
    if (LCACHE[key]) return LCACHE[key];
    let best = null;
    for (let seed = 0; seed < 60; seed++) { const r = placeLabels(list, seed); if (!best || r.bad < best.bad) best = r; if (!best.bad) break; }
    return (LCACHE[key] = best.res);
  }
  function placeLabels(list, seed) {
    let rs = seed * 9301 + 49297; const rnd = () => { rs = (rs * 9301 + 49297) % 233280; return rs / 233280; };
    const P = list.map(s => proj(s[2], s[3]));
    const occ = P.map(([x, y]) => [x - 9, y - 9, 18, 18]);
    LAKES.forEach(([lo, la, t]) => { const [x, y] = proj(lo, la); occ.push([x - 2, y - 13, t.length * 7.5 + 4, 17]); });
    const hit = b => occ.some(o => b[0] < o[0] + o[2] + 2 && b[0] + b[2] + 2 > o[0] && b[1] < o[1] + o[3] + 1 && b[1] + b[3] + 1 > o[1]);
    const segs = [];
    const inBox = (px, py, o) => px > o[0] - 1 && px < o[0] + o[2] + 1 && py > o[1] - 1 && py < o[1] + o[3] + 1;
    const segBox = (a, b, o) => { for (let k = 1; k < 16; k++) { if (inBox(a[0] + (b[0] - a[0]) * k / 16, a[1] + (b[1] - a[1]) * k / 16, o)) return true; } return false; };
    const side = (a, b, c) => (c[0] - a[0]) * (b[1] - a[1]) - (c[1] - a[1]) * (b[0] - a[0]);
    const cross = (p1, p2, p3, p4) => side(p3, p4, p1) * side(p3, p4, p2) < 0 && side(p1, p2, p3) * side(p1, p2, p4) < 0;
    /* Сызықтың «айыбы»: атау арқылы өтсе — 60, басқа сызықты қиса — 40, басқа нүктенің үстінен өтсе — 15 */
    const linePen = (i, a, b) => { let p = 0; occ.forEach((o, k) => { if (k === i) return; if (k < P.length ? segBox(a, b, [o[0] + 3, o[1] + 3, o[2] - 6, o[3] - 6]) : segBox(a, b, o)) p += k < P.length ? 15 : 60; }); segs.forEach(s => { if (cross(a, b, s[0], s[1])) p += 40; }); return p; };
    const boxOk = b => !segs.some(s => segBox(s[0], s[1], b));
    const crowd = i => P.filter((p, j) => j !== i && Math.hypot(p[0] - P[i][0], p[1] - P[i][1]) < 45).length;
    const res = {}; let bad = 0;
    list.map((s, i) => [s, i, crowd(i) + (seed ? rnd() * 4 : 0)]).sort((a, b) => a[2] - b[2]).forEach(([s, i]) => {
      const [x, y] = P[i], w = measure(s[1], s[6] === 'r') + 6, h = 15;
      /* Тығыз топта атау топтың ортасынан сыртқа қарай шығарылады — сызықтар қиылыспайды */
      const near = P.filter((p, j) => j !== i && Math.hypot(p[0] - x, p[1] - y) < 70);
      let order = ANGLES;
      if (near.length) {
        const cx = near.reduce((a, p) => a + p[0], 0) / near.length, cy = near.reduce((a, p) => a + p[1], 0) / near.length;
        const away = Math.atan2(y - cy, x - cx) * 180 / Math.PI, diff = a => Math.abs(((a - away) % 360 + 540) % 360 - 180);
        order = ANGLES.slice().sort((a, b) => diff(a) - diff(b));
      }
      /* Ең жақын «таза» орынды іздейміз; табылмаса — ең аз кедергісі барын аламыз (атау үстіне атау түспейді) */
      let best = null, bestPen = Infinity;
      search: for (const r of [0, 22, 38, 56, 76, 98, 122, 148, 175]) for (const a of order.concat(r ? [-15, 15, 165, -165, -75, 75, -105, 105, -25, 25, 155, -155, -45, 45, 135, -135] : [])) {
        if (r * .6 >= bestPen) break search;
        const rad = a * Math.PI / 180, cs = Math.cos(rad), sn = Math.sin(rad), ax = x + r * cs, ay = y + r * sn;
        const bx = cs > .3 ? ax + 10 : cs < -.3 ? ax - 10 - w : ax - w / 2;
        const by = Math.abs(cs) <= .3 ? (sn < 0 ? ay - 11 - h : ay + 11) : ay - h / 2;
        const b = [bx, by, w, h];
        if (bx < -4 || bx + w > 732 || by < -4 || by + h > 432) continue;
        if (hit(b)) continue;
        let pen = boxOk(b) ? 0 : 40;
        if (r) { const ex = Math.max(bx, Math.min(x, bx + w)), ey = Math.max(by, Math.min(y, by + h)); pen += linePen(i, [x, y], [ex, ey]); }
        pen += r * .6; /* алыс кеткен атауға да айып: атау өз нүктесіне жақын тұрсын */
        if (pen < bestPen) { bestPen = pen; best = { b, r }; }
        if (bestPen === 0) break search;
      }
      if (!best) { best = { b: [x + 10, y - h / 2, w, h], r: 0 }; bestPen = 1000; }
      bad += bestPen;
      if (best.r) { const b = best.b; segs.push([[x, y], [Math.max(b[0], Math.min(x, b[0] + b[2])), Math.max(b[1], Math.min(y, b[1] + b[3]))]]); }
      occ.push(best.b); res[s[0]] = best;
    });
    return { res, bad };
  }
  function mapSvg() {
    const W = window.KZ_WATER, list = window.SITES.filter(s => mapType === 'all' || s[6] === mapType), L = bestLabels(list);
    const dots = list.map(s => {
      const [x, y] = proj(s[2], s[3]), col = TYPES[s[6]][1];
      return `<g class="mk ${s[0] === mapSel ? 'on' : ''}" data-site="${s[0]}" tabindex="0" role="button" aria-label="${esc(s[1])}"><circle class="p" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" fill="${col}" opacity=".5" style="animation-delay:${(x % 7) / 3}s"/>${s[6] === 'r' ? `<circle class="c" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="none" stroke="${col}" stroke-width="2.5" stroke-dasharray="3 3"/>` : `<circle class="c" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6.5" fill="${col}" stroke="var(--panel)" stroke-width="2.5"/>`}</g>`;
    }).join('');
    const names = list.map(s => {
      const [x, y] = proj(s[2], s[3]), { b, r } = L[s[0]];
      const ex = Math.max(b[0], Math.min(x, b[0] + b[2])), ey = Math.max(b[1], Math.min(y, b[1] + b[3])), d = Math.hypot(ex - x, ey - y) || 1;
      const lead = r ? `<line class="lead" x1="${(x + (ex - x) / d * 8).toFixed(1)}" y1="${(y + (ey - y) / d * 8).toFixed(1)}" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}"/>` : '';
      return `<g class="mk ml ${s[0] === mapSel ? 'on' : ''}" data-site="${s[0]}">${lead}<text x="${(b[0] + 3).toFixed(1)}" y="${(b[1] + 11.5).toFixed(1)}"${s[6] === 'r' ? ' font-style="italic"' : ''}>${esc(s[1])}</text></g>`;
    }).join('');
    const marks = dots + names;
    return `<svg viewBox="-6 -6 740 440" role="img" aria-label="Қазақстанның сызба картасы және ескерткіштер">
      <polygon class="water" points="${pts(W.caspian)}"/><polygon class="land" points="${pts(window.KZ_OUTLINE)}"/>
      <polygon class="water" points="${pts(W.aral)}"/><polygon class="water" points="${pts(W.balkhash)}"/>
      ${W.rivers.map(r => `<polyline class="river" points="${pts(r)}"/>`).join('')}
      <g font-family="var(--f-d)" font-style="italic" font-size="13" fill="var(--ink2)" opacity=".8">${LAKES.map(([lo, la, t]) => `<text x="${proj(lo, la)[0].toFixed(1)}" y="${proj(lo, la)[1].toFixed(1)}">${t}</text>`).join('')}</g>
      ${marks}</svg>`;
  }
  function mapCard() {
    const s = SITEMAP[mapSel]; if (!s) return `<div class="mapcard"><h3>Ескерткішті таңдаңыз</h3><p class="muted" style="margin:6px 0 0">Картадағы нүктені басыңыз. Әр ескерткіш оқулықтағы тақырыпқа сілтейді.</p></div>`;
    const t = TMAP[s[4]];
    return `<div class="mapcard"><span class="eyebrow" style="color:${TYPES[s[6]][1]}">${esc(TYPES[s[6]][0])}</span><h3>${esc(s[1])}</h3><p style="margin:6px 0 12px">${esc(s[5])}</p>${t ? `<a class="btn" href="#t-${t.id}">${esc(tLabel(t.id))} · ${esc(t.t)} →</a>` : ''}</div>`;
  }
  function mapPage() {
    return `<div class="page">${band('silk', 'Жібек жолындағы керуен')}<div class="wrap"><div class="t-head read"><div class="t-card rise">
      <span class="eyebrow">Ерекше бөлім</span><h1>Тарихи карта</h1><p class="muted">Оқулықтағы ${window.SITES.length} ескерткіш пен тайпа мекені. Нүктені басып, қай тақырыпқа жататынын көріңіз.</p></div></div>
      <div class="legend">${[['all', ['Барлығы', 'var(--ink)']]].concat(Object.entries(TYPES)).map(([k, v]) => `<button class="chip ${mapType === k ? 'on' : ''}" data-mtype="${k}"><i style="background:${v[1]}"></i>${esc(v[0])}</button>`).join('')}</div>
      <div class="mapbox" id="mapbox">${mapSvg()}</div>
      <p class="map-hint swipe">← Картаны саусақпен жылжытыңыз →</p>
      <p class="map-hint">Сызба карта: шекаралар мен орындар шамамен көрсетілген. Арқайым мен Қызыл Аңғар (Чигу) қазіргі Қазақстаннан тыс жерде.</p>
      <div id="mapcard">${mapCard()}</div>
      <div class="kw" style="margin-top:16px">${window.SITES.map(s => `<button class="chip" data-site="${s[0]}">${esc(s[1])}</button>`).join('')}</div></div></div>`;
  }

  /* ---------- Сөздік ---------- */
  const KZ_ABC = 'АӘБВГҒДЕЁЖЗИЙКҚЛМНҢОӨПРСТУҰҮФХҺЦЧШЩЪЫІЬЭЮЯ';
  const kzCmp = (a, b) => { const A = a.toUpperCase(), Bb = b.toUpperCase(); for (let i = 0; i < Math.min(A.length, Bb.length); i++) { const x = KZ_ABC.indexOf(A[i]), y = KZ_ABC.indexOf(Bb[i]); if (x !== y) return (x < 0 ? 999 + A.charCodeAt(i) : x) - (y < 0 ? 999 + Bb.charCodeAt(i) : y); } return A.length - Bb.length; };
  let gq = '', gl = '';
  function glossList() {
    const q = gq.trim().toLowerCase();
    const list = Object.values(GL).filter(g => (!gl || g.term[0].toUpperCase() === gl) && (!q || (g.term + ' ' + g.def).toLowerCase().includes(q))).sort((a, b) => kzCmp(a.term, b.term));
    return list.length ? list.map((g, i) => `<div class="term" id="g-${encodeURIComponent(g.term)}" style="animation-delay:${Math.min(i, 12) * 25}ms"><h3>${esc(g.term)}</h3><p>${esc(g.def)}</p>${g.topics.length ? `<div class="in-t">${g.topics.map(tid => `<a href="#t-${tid}">${esc(tLabel(tid))}</a>`).join('')}</div>` : ''}</div>`).join('') : '<p class="muted">Ештеңе табылмады.</p>';
  }
  function glossaryPage() {
    const have = new Set(Object.values(GL).map(g => g.term[0].toUpperCase()));
    return `<div class="page">${band('nomads', 'Көшпелілер ауылы')}<div class="wrap"><div class="t-head read"><div class="t-card rise">
      <span class="eyebrow">Анықтама</span><h1>Сөздік</h1><p class="muted">Оқулықтағы ${window.GLOSSARY.length} терминнің қысқаша түсіндірмесі. Тақырып нөмірін басып, сөз кездесетін сабаққа өтіңіз.</p></div></div>
      <div class="filters"><label class="search">${ICON.search}<input id="gsearch" type="search" placeholder="Терминді іздеу..." value="${esc(gq)}" aria-label="Терминді іздеу"></label></div>
      <div class="abc"><button class="${gl ? '' : 'on'}" data-abc="">∗</button>${KZ_ABC.split('').filter(ch => have.has(ch)).map(ch => `<button class="${gl === ch ? 'on' : ''}" data-abc="${ch}">${ch}</button>`).join('')}</div>
      <div class="gl-list" id="glist">${glossList()}</div></div></div>`;
  }

  /* ---------- Ойын ---------- */
  let G = null;
  function gamePage() {
    return `<div class="page">${band('huns', 'Ғұн садақшылары')}<div class="wrap"><div class="t-head read"><div class="t-card rise">
      <span class="eyebrow">Ойын</span><h1>Тарихи сайыс</h1><p class="muted">Өзіңді тексер! Әр ойында 10 сұрақ. Жауап бергеннен кейін түсіндірмесі мен тақырыпқа сілтеме шығады.</p></div></div>
      <div class="read"><div class="game-modes">
        <div class="gcard"><h3>Тарихи тест</h3><p class="muted" style="margin:0">Барлық тақырыптардан аралас сұрақтар. Тарауды таңдауға болады.</p>
          <label class="search" style="flex:none"><select id="gch" aria-label="Тарау" style="all:unset;flex:1;font-size:17px;cursor:pointer"><option value="all">Барлық тараулар</option>${CH.filter(c => c.n > 0).map(c => `<option value="${c.n}">${c.n}. ${esc(c.t)}</option>`).join('')}</select></label>
          <button class="btn gold" data-game="quiz">Бастау</button></div>
        <div class="gcard"><h3>Кім айтты?</h3><p class="muted" style="margin:0">Дереккөздердегі сөз кімге тиесілі? Төрт тұлғаның біреуін таңда.</p><button class="btn gold" data-game="who">Бастау</button></div>
      </div><div id="gstage"></div></div></div></div>`;
  }
  function startGame(kind) {
    if (kind === 'quiz') {
      const ch = ($('#gch') || {}).value || 'all';
      const pool = TP.filter(t => ch === 'all' || String(t.ch) === ch).flatMap(t => (t.quiz || []).map(q => ({ t: t.id, q: q[0], o: q[1], a: q[2], why: q[3] })));
      G = { kind, list: shuffle(pool).slice(0, 10), i: 0, score: 0 };
    } else {
      const pool = TP.flatMap(t => (t.quote || []).filter(q => PMAP[q[0]]).map(q => ({ t: t.id, pid: q[0], text: q[1], src: q[2] })));
      const ids = Array.from(new Set(pool.map(x => x.pid)));
      G = { kind, list: shuffle(pool).slice(0, 10).map(x => ({ ...x, opts: shuffle([x.pid].concat(shuffle(ids.filter(i => i !== x.pid)).slice(0, 3))) })), i: 0, score: 0 };
    }
    renderGame(); const st = $('#gstage'); if (st) st.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function renderGame() {
    const st = $('#gstage'); if (!st || !G) return;
    if (G.i >= G.list.length) {
      const n = G.list.length, s = G.score, stars = s >= n * .9 ? 3 : s >= n * .6 ? 2 : s > 0 ? 1 : 0;
      st.innerHTML = `<div class="gstage result"><div class="eyebrow">Нәтиже</div><div class="big">${s}/${n}</div><div class="stars">${[0, 1, 2].map(i => `<span style="animation-delay:${.2 + i * .25}s;opacity:${i < stars ? 1 : .2}">★</span>`).join('')}</div><p style="font-size:19px">${stars === 3 ? 'Керемет! Нағыз тарихшысың.' : stars === 2 ? 'Жақсы нәтиже! Тағы бір рет байқап көр.' : 'Тақырыптарды қайталап, қайта ойна.'}</p><p><button class="btn gold" data-game="${G.kind}">Қайта ойнау</button></p></div>`;
      if (stars >= 2) confetti();
      return;
    }
    const x = G.list[G.i], pr = `<div class="eyebrow">${G.i + 1}-сұрақ / ${G.list.length} · Ұпай: ${G.score}</div><div class="gbar"><i style="width:${G.i / G.list.length * 100}%"></i></div>`;
    if (G.kind === 'quiz') {
      const opts = shuffle(x.o.map((o, i) => [o, i === x.a]));
      st.innerHTML = `<div class="gstage">${pr}<div class="gq">${esc(x.q)}</div><div class="opts">${opts.map(([o, ok]) => `<button class="opt" data-gok="${ok ? 1 : 0}">${esc(o)}</button>`).join('')}</div><div class="why" hidden>${x.why ? esc(x.why) + ' ' : ''}<a href="#t-${x.t}">${esc(tLabel(x.t))} тақырыбын оқу →</a></div><p><button class="btn" data-next hidden>Келесі сұрақ →</button></p></div>`;
    } else {
      st.innerHTML = `<div class="gstage">${pr}<blockquote class="scroll gq">${esc(x.text)}</blockquote><div class="who">${x.opts.map(pid => { const p = PMAP[pid]; return `<button class="opt" data-gok="${pid === x.pid ? 1 : 0}">${ava(p)}<span>${esc(p.n)}</span></button>`; }).join('')}</div><div class="why" hidden>Дереккөз: ${esc(x.src)}. <a href="#t-${x.t}">${esc(tLabel(x.t))} тақырыбы →</a></div><p><button class="btn" data-next hidden>Келесі сұрақ →</button></p></div>`;
    }
  }

  /* ---------- Конфетти ---------- */
  function confetti() {
    if (document.body.classList.contains('still') || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let c = $('#confetti'); if (!c) { c = document.createElement('canvas'); c.id = 'confetti'; document.body.appendChild(c); }
    const x = c.getContext('2d'), W = c.width = innerWidth, H = c.height = innerHeight;
    const cols = ['#E2B246', '#D29E2E', '#41C0B1', '#E86E50', '#8DAEE6'];
    const P = Array.from({ length: 120 }, () => ({ x: W / 2 + (Math.random() - .5) * 120, y: H * .45, vx: (Math.random() - .5) * 13, vy: -Math.random() * 13 - 4, r: Math.random() * 6, s: 5 + Math.random() * 6, c: cols[Math.floor(Math.random() * cols.length)], d: (Math.random() - .5) * .3 }));
    let t = 0; (function f() { x.clearRect(0, 0, W, H); P.forEach(p => { p.vy += .32; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.d; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); x.restore(); }); if (++t < 160) requestAnimationFrame(f); else { x.clearRect(0, 0, W, H); c.remove(); } })();
  }

  function notFound() { return `<div class="page"><div class="wrap read" style="padding-top:60px"><h1>Бет табылмады</h1><p><a href="#home">Басты бетке оралу</a></p></div></div>`; }

  /* ---------- Маршрут ---------- */
  const app = $('#app');
  function route() {
    const h = decodeURIComponent((location.hash || '#home').slice(1));
    closeModal(true);
    let html, nav = 'home', after = null;
    if (!h || h === 'home') html = home();
    else if (h === 'topics') { html = topicsPage(); nav = 'topics'; }
    else if (/^c-\d$/.test(h)) { html = chapterPage(+h.slice(2)); nav = 'topics'; }
    else if (/^t-\d-\d$/.test(h)) { html = topicPage(h.slice(2)); nav = 'topics'; }
    else if (h === 'persons') { html = personsPage(); nav = 'persons'; }
    else if (/^p-/.test(h)) { html = personsPage(); nav = 'persons'; after = () => openPerson(h.slice(2)); }
    else if (h === 'timeline') { html = timelinePage(); nav = 'timeline'; }
    else if (h === 'map') { html = mapPage(); nav = 'map'; }
    else if (/^m-/.test(h)) { mapSel = h.slice(2); mapType = 'all'; html = mapPage(); nav = 'map'; }
    else if (h === 'glossary') { html = glossaryPage(); nav = 'glossary'; }
    else if (h === 'game') { html = gamePage(); nav = 'game'; }
    else html = notFound();
    app.innerHTML = html;
    $$('.links a').forEach(a => a.classList.toggle('on', a.dataset.nav === nav));
    const tab = ['timeline', 'map', 'glossary'].includes(nav) ? 'more' : nav;
    $$('.tabbar [data-tab]').forEach(a => { a.classList.toggle('on', a.dataset.tab === tab); if (a.tagName === 'A') { if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); } });
    $('.links').classList.remove('open');
    document.body.classList.remove('nav-hidden');
    window.scrollTo(0, 0); lastY = 0;
    document.title = (($('h1', app) || {}).textContent || B.title) + ' · Қазақстан тарихы, 5-сынып';
    observe(); countUp(); watchMotion();
    if (nav === 'map') { centerMap(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { const mb = $('#mapbox'); if (mb) { mb.innerHTML = mapSvg(); centerMap(); } }); }
    if (after) after();
  }
  /* Телефонда карта көлденең жылжиды: таңдалған нүктені не тығыз оңтүстікті ортаға әкелеміз */
  function centerMap() {
    const mb = $('#mapbox'); if (!mb || mb.scrollWidth <= mb.clientWidth) return;
    const s = SITEMAP[mapSel], fx = s ? (proj(s[2], s[3])[0] + 6) / 740 : .58;
    mb.scrollLeft = Math.max(0, fx * mb.scrollWidth - mb.clientWidth / 2);
  }
  /* Тақырып бөлімдері: қай бөлімде тұрғанымызды белгілеу */
  function spyToc() {
    const btns = $$('.toc button'); if (!btns.length) return;
    const line = (isPhone() ? 52 : 60) + 80; let cur = btns[0];
    btns.forEach(b => { const el = document.getElementById(b.dataset.jump); if (el && el.getBoundingClientRect().top <= line) cur = b; });
    if (!cur.classList.contains('on')) { btns.forEach(b => b.classList.toggle('on', b === cur)); const strip = cur.parentNode; strip.scrollTo({ left: cur.offsetLeft - strip.clientWidth / 2 + cur.offsetWidth / 2, behavior: 'smooth' }); }
  }
  let lastY = 0;

  /* Пайда болу әсері */
  let io = null;
  function observe() {
    if (!('IntersectionObserver' in window)) return;
    if (io) io.disconnect();
    io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('pop'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    $$('.rv', app).forEach(el => { if (el.getBoundingClientRect().top > innerHeight) io.observe(el); });
  }
  /* Экраннан тыс кеткен анимация тоқтап тұрады (жоғарғы сурет, карта, белгішелер, логотип) — телефон қызып, қатып қалмауы үшін.
     Тоқтату CSS-тегі .off класымен жасалады, сондықтан «Анимация» ауыстырғышы бұрынғыдай жұмыс істейді. */
  let mo = null;
  function watchMotion() {
    if (!('IntersectionObserver' in window) || !document.getAnimations) return;
    if (mo) mo.disconnect();
    mo = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('off', !e.isIntersecting)), { rootMargin: '60px 0px' });
    const seen = new Set();
    const watch = el => { if (el && !seen.has(el)) { seen.add(el); mo.observe(el); } };
    $$('.band, #mapbox', app).forEach(watch);
    document.getAnimations().forEach(a => {
      const t = a.effect && a.effect.target;
      if (!t || !t.closest || a.effect.getTiming().iterations !== Infinity || t.closest('#bgfx, #dust, .modal')) return;
      watch(t.closest('svg') || t);
    });
  }
  function countUp() {
    $$('[data-count]', app).forEach(el => { const n = +el.dataset.count; let i = 0; const st = Math.max(1, Math.round(n / 30)); el.textContent = '0'; const tm = setInterval(() => { i = Math.min(n, i + st); el.textContent = i; if (i >= n) clearInterval(tm); }, 28); });
  }

  /* ---------- Оқиғалар ---------- */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-person],[data-term],[data-close],[data-pcat],[data-tl],[data-mtype],[data-site],[data-abc],[data-game],[data-next],.opt,[data-retry],[data-jump],[data-toggle],[data-tab="more"]');
    if (!el) return;
    if (el.matches('[data-close]')) return closeModal();
    if (el.matches('[data-tab="more"]')) return openMore();
    if (el.dataset.toggle) { if (el.dataset.toggle === 'theme') toggleTheme(); else toggleMotion(); el.setAttribute('aria-checked', el.dataset.toggle === 'theme' ? isDark() : !document.body.classList.contains('still')); return; }
    if (el.dataset.jump) { const tg = document.getElementById(el.dataset.jump); if (tg) { if (tg.tagName === 'DETAILS') tg.open = true; tg.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); $$('.toc button').forEach(b => b.classList.toggle('on', b === el)); } return; }
    if (el.dataset.person) { e.preventDefault(); return openPerson(el.dataset.person); }
    if (el.dataset.term) return openTerm(el.dataset.term);
    if (el.dataset.pcat) { pFilter.cat = el.dataset.pcat; $$('[data-pcat]').forEach(b => b.classList.toggle('on', b === el)); $('#plist').innerHTML = personsList(); return; }
    if (el.dataset.tl) { tlTab = el.dataset.tl; app.innerHTML = timelinePage(); watchMotion(); return; }
    if (el.dataset.mtype) { mapType = el.dataset.mtype; $$('[data-mtype]').forEach(b => b.classList.toggle('on', b === el)); $('#mapbox').innerHTML = mapSvg(); return; }
    if (el.dataset.site) { mapSel = el.dataset.site; if (mapType !== 'all' && SITEMAP[mapSel][6] !== mapType) mapType = 'all'; $('#mapbox').innerHTML = mapSvg(); $('#mapcard').innerHTML = mapCard(); if (el.classList.contains('chip')) { centerMap(); $('#mapbox').scrollIntoView({ behavior: 'smooth', block: 'center' }); } return; }
    if (el.dataset.abc != null && el.matches('[data-abc]')) { gl = el.dataset.abc; $$('[data-abc]').forEach(b => b.classList.toggle('on', b === el)); $('#glist').innerHTML = glossList(); return; }
    if (el.dataset.game) return startGame(el.dataset.game);
    if (el.matches('[data-next]')) { G.i++; renderGame(); return; }
    if (el.dataset.retry) { const box = el.closest('.quiz'); box.outerHTML = quizBox(TMAP[el.dataset.retry]); return; }
    if (el.classList.contains('opt')) {
      if (el.dataset.gok != null) { // ойын
        const wrap = el.closest('.gstage'); if (wrap.dataset.done) return; wrap.dataset.done = 1;
        const ok = el.dataset.gok === '1'; if (ok) G.score++;
        $$('.opt', wrap).forEach(b => { b.disabled = true; if (b.dataset.gok === '1') b.classList.add('ok'); else if (b === el) b.classList.add('no'); else b.classList.add('dim'); });
        $('.why', wrap).hidden = false; $('[data-next]', wrap).hidden = false; $('[data-next]', wrap).focus(); return;
      }
      const qq = el.closest('.qq'); if (!qq || qq.dataset.done) return; qq.dataset.done = el.dataset.ok;
      $$('.opt', qq).forEach(b => { b.disabled = true; if (b.dataset.ok === '1') b.classList.add('ok'); else if (b === el) b.classList.add('no'); else b.classList.add('dim'); });
      const why = $('.why', qq); why.innerHTML = (el.dataset.ok === '1' ? '<b>Дұрыс!</b> ' : 'Дұрыс жауап белгіленді. ') + why.innerHTML; why.hidden = false;
      const box = el.closest('.quiz'), all = $$('.qq', box), done = all.filter(q => q.dataset.done);
      if (done.length === all.length) { const s = done.filter(q => q.dataset.done === '1').length, sc = $('.score', box); sc.hidden = false; $('.big', sc).textContent = s + '/' + all.length; $('.msg', sc).textContent = s === all.length ? 'Керемет! Барлығы дұрыс.' : s >= all.length / 2 ? 'Жақсы! Қатені қайталап ал.' : 'Тақырыпты тағы бір оқып шық.'; if (s === all.length) confetti(); }
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.mk')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
  });
  document.addEventListener('input', e => {
    if (e.target.id === 'psearch') { pFilter.q = e.target.value; $('#plist').innerHTML = personsList(); }
    if (e.target.id === 'gsearch') { gq = e.target.value; $('#glist').innerHTML = glossList(); }
  });
  window.addEventListener('hashchange', route);
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const p = $('#progress'), d = document.documentElement, max = d.scrollHeight - innerHeight, y = scrollY;
      if (p) p.style.width = (max > 0 ? Math.min(100, y / max * 100) : 0) + '%';
      /* Телефонда төмен оқығанда жоғарғы жолақ жасырылады, жоғары сырғытқанда қайта шығады */
      if (isPhone() && !$('.modal')) { if (y > lastY + 8 && y > 160) document.body.classList.add('nav-hidden'); else if (y < lastY - 8 || y < 80) document.body.classList.remove('nav-hidden'); }
      lastY = y; spyToc();
    });
  }, { passive: true });

  /* ---------- Тақырып түсі және қозғалыс ---------- */
  function isDark() { const t = document.documentElement.dataset.theme; return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; }
  function paintTools() { $('#themeBtn').innerHTML = isDark() ? ICON.sun : ICON.moon; $('#themeBtn').setAttribute('aria-label', isDark() ? 'Жарық түске ауысу' : 'Қараңғы түске ауысу'); $('#motionBtn').innerHTML = document.body.classList.contains('still') ? ICON.play : ICON.pause; $('#motionBtn').setAttribute('aria-label', document.body.classList.contains('still') ? 'Анимацияны қосу' : 'Анимацияны тоқтату'); }
  function toggleTheme() { const d = !isDark(); document.documentElement.dataset.theme = d ? 'dark' : 'light'; store.set('theme', d ? 'dark' : 'light'); paintTools(); }
  function toggleMotion() { document.body.classList.toggle('still'); store.set('still', document.body.classList.contains('still')); paintTools(); }
  $('#themeBtn').addEventListener('click', toggleTheme);
  $('#motionBtn').addEventListener('click', toggleMotion);
  $('#menuBtn').addEventListener('click', () => $('.links').classList.toggle('open'));
  const th = store.get('theme', null); if (th) document.documentElement.dataset.theme = th;
  if (store.get('still', false)) document.body.classList.add('still');
  $('#menuBtn').innerHTML = ICON.menu;

  /* Фондағы жүрген аңдар мен алтын тозаң */
  const bg = $('#bgfx');
  [['deer', 70, 0], ['horse', 55, -20], ['camel', 90, -50], ['ibex', 64, -35]].forEach(([f, d, del]) => { bg.insertAdjacentHTML('beforeend', `<svg viewBox="0 -8 120 90" style="animation-duration:${d}s;animation-delay:${del}s">${window.ART[f]('walk')}</svg>`); });
  const dust = $('#dust'); for (let i = 0; i < 14; i++) dust.insertAdjacentHTML('beforeend', `<i style="left:${(i * 7.3 + 3) % 100}%;animation-duration:${14 + (i % 5) * 4}s;animation-delay:-${i * 2.1}s;transform:scale(${.5 + (i % 3) * .3})"></i>`);

  paintTools(); route();
})();
