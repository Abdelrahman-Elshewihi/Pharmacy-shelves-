App.card = (() => {
  const { $, el, pad, ago, urlFor, light } = App.utils, list = $('#list'), prog = $('#progress'), cnt = $('#cnt'), ptrack = $('#ptrack'); let scr;
  const done = s => !!(s.image && s.description.trim());

  function status(s) {
    const i = !!s.image, d = !!s.description.trim();
    if (i && d) return ['ok', 'متوثّق'];
    if (i) return ['part', 'محتاج وصف'];
    if (d) return ['part', 'محتاج صورة'];
    return ['', 'فاضي'];
  }
  function progress() {
    const sh = App.store.shelves, n = sh.filter(done).length;
    cnt.textContent = `${n} / ${sh.length}`;
    ptrack.querySelectorAll('button').forEach((b, i) => b.classList.toggle('done', done(sh[i])));
    prog.setAttribute('aria-label', `${n} من ${sh.length} أرفف متوثّقة`);
  }
  function create(s, i = 0, instant) {
    const [cls, label] = status(s), u = urlFor('t' + s.id, s.thumb || s.image), d = s.description.trim();
    const c = el(`<button class="card ${u ? 'has' : ''} ${instant ? '' : 'enter'}" data-id="${s.id}" style="--i:${i}" aria-label="رف ${pad(s.id)}">
      <div class="media">${u ? '' : '<div class="ph"><i></i><i></i><i></i></div>'}</div><div class="scrim"></div>
      <span class="num">${pad(s.id)}</span><span class="status ${cls}"><b></b>${label}</span>
      <div class="meta"><p></p><small></small></div></button>`);
    if (u) {
      const im = new Image(); im.alt = ''; im.decoding = 'async'; im.src = u;
      if (instant) im.className = 'on'; else im.onload = () => im.classList.add('on');
      c.querySelector('.media').append(im);
    }
    const p = c.querySelector('p'); p.textContent = d || 'أضف ملاحظة عن محتويات الرف'; if (!d) p.className = 'empty';
    c.querySelector('small').textContent = ago(s.updatedAt);
    c.addEventListener('animationend', () => c.classList.remove('enter'), { once: true });
    return c;
  }
  function refresh(id) {
    const old = list.querySelector(`[data-id="${id}"]`); if (old) old.replaceWith(create(App.store.shelves[id], 0, true));
    progress();
  }
  function mount() {
    const sh = App.store.shelves, n = sh.length;
    list.innerHTML = ''; sh.forEach((s, i) => list.append(create(s, i)));
    ptrack.innerHTML = sh.map((_, i) => `<button data-i="${i}" aria-label="رف ${pad(i)}"></button>`).join('') + '<i class="lens"></i>'; progress();
    let maxY = 1, snapRaf = 0, sbar = false, tk = false;
    const calc = () => { maxY = Math.max(1, document.documentElement.scrollHeight - innerHeight); };
    const clampY = y => Math.min(Math.max(y, 0), maxY);
    const stop = () => { if (snapRaf) { cancelAnimationFrame(snapRaf); snapRaf = 0; } };
    const snapTo = i => {   // تمرير ناعم لنص الكارت (JS خفيف، فريم بفريم)
      const c = list.children[i]; if (!c) return; calc(); stop();
      const y0 = scrollY, y1 = clampY(c.offsetTop + c.offsetHeight / 2 - innerHeight / 2), t0 = performance.now(), d = Math.min(460, 180 + Math.abs(y1 - y0) * .22);
      const f = t => { const k = Math.min((t - t0) / d, 1); scrollTo(0, y0 + (y1 - y0) * (1 - Math.pow(1 - k, 3))); snapRaf = k < 1 ? requestAnimationFrame(f) : 0; };
      snapRaf = requestAnimationFrame(f);
    };
    scr = App.scrub.make(ptrack, {
      onMove: p => { stop(); calc(); scrollTo(0, clampY(p / (n - 1) * maxY)); },   // السحب = تمرير مباشر 1:1
      onCommit: i => snapTo(i)
    });
    ptrack.addEventListener('click', e => { if (e.detail === 0) { const b = e.target.closest('button'); if (b) snapTo(+b.dataset.i); } });
    list.addEventListener('click', e => { const c = e.target.closest('.card'); if (c) App.detail.open(+c.dataset.id, c); });
    const onScroll = () => {
      if (tk) return; tk = true;
      requestAnimationFrame(() => {
        tk = false; const y = scrollY, s = y > 70;
        if (s !== sbar) { sbar = s; document.documentElement.classList.toggle('scrolled', s); }
        if (!scr.dragging() && !document.body.classList.contains('lock')) scr.follow(clampY(y) / maxY * (n - 1));
      });
    };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('touchstart', stop, { passive: true });
    addEventListener('resize', () => { calc(); scr.set(0, false); onScroll(); });
    calc(); scr.set(0, false);
  }
  return { create, refresh, mount };
})();
