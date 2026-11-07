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
    const c = el(`<button class="card rim ${instant ? '' : 'enter'}" data-id="${s.id}" style="--i:${i}" aria-label="رف ${pad(s.id)}">
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
    list.innerHTML = ''; App.store.shelves.forEach((s, i) => list.append(create(s, i)));
    ptrack.innerHTML = App.store.shelves.map((_, i) => `<button data-i="${i}" aria-label="رف ${pad(i)}"></button>`).join('') + '<i class="lens"></i>'; progress();
    let cur = 0, lockUntil = 0;
    const go = i => { const c = list.children[i]; if (!c) return; cur = i; lockUntil = Date.now() + 900; const r = c.getBoundingClientRect();
      scrollTo({ top: Math.max(0, scrollY + r.top - (innerHeight - r.height) / 2), behavior: 'smooth' }); };
    scr = App.scrub.make(ptrack, { onPreview: go, onCommit: go });
    ptrack.addEventListener('click', e => { if (e.detail === 0) { const b = e.target.closest('button'); if (b) go(+b.dataset.i); } });
    scr.set(0, false); addEventListener('resize', () => scr.set(cur, false));
    const follow = () => {   // العدسة بتمشي مع الكارت اللي قدامك وانت بتسكرول
      if (scr.dragging() || Date.now() < lockUntil || document.body.classList.contains('lock')) return;
      const k = list.children, mid = innerHeight / 2; let b = 0, bd = 1e9;
      if (scrollY >= 30) { if (innerHeight + scrollY >= document.documentElement.scrollHeight - 30) b = k.length - 1; else for (let i = 0; i < k.length; i++) { const r = k[i].getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - mid); if (d < bd) { bd = d; b = i; } } }
      if (b !== cur) { cur = b; scr.set(b, true); }
    };
    list.addEventListener('click', e => { const c = e.target.closest('.card'); if (c) App.detail.open(+c.dataset.id, c); });
    const lit = e => { const c = e.target.closest('.card'); if (c) { light(c, e.clientX, e.clientY); c.classList.add('lit'); } };
    list.addEventListener('pointerdown', lit); list.addEventListener('pointermove', lit);
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => list.addEventListener(ev, e => { const c = e.target.closest && e.target.closest('.card'); if (c) c.classList.remove('lit'); }, true));
    let t = 0; addEventListener('scroll', () => { if (t) return; t = 1; requestAnimationFrame(() => { t = 0; document.documentElement.classList.toggle('scrolled', scrollY > 70); follow(); }); }, { passive: true });
  }
  return { create, refresh, mount };
})();
