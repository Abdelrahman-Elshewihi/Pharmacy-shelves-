App.card = (() => {
  const { $, el, pad, ago, urlFor, light } = App.utils, list = $('#list'), prog = $('#progress');
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
    prog.innerHTML = sh.map(s => `<i class="${done(s) ? 'on' : ''}"></i>`).join('') + `<span>${n} / ${sh.length}</span>`;
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
    list.innerHTML = ''; App.store.shelves.forEach((s, i) => list.append(create(s, i))); progress();
    list.addEventListener('click', e => { const c = e.target.closest('.card'); if (c) App.detail.open(+c.dataset.id, c); });
    const lit = e => { const c = e.target.closest('.card'); if (c) { light(c, e.clientX, e.clientY); c.classList.add('lit'); } };
    list.addEventListener('pointerdown', lit); list.addEventListener('pointermove', lit);
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => list.addEventListener(ev, e => { const c = e.target.closest && e.target.closest('.card'); if (c) c.classList.remove('lit'); }, true));
    let t = 0; addEventListener('scroll', () => { if (t) return; t = 1; requestAnimationFrame(() => { t = 0; document.documentElement.classList.toggle('scrolled', scrollY > 70); }); }, { passive: true });
  }
  return { create, refresh, mount };
})();
