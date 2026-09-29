/* شاشة الرف: فتح/قفل بحركة الكارت، صورة، وصف، سحب للتنقل، وحفظ تلقائي.
   الزوم بإصبعين حر تماماً: أي لمسة بإصبعين أو زوم مفعّل بيوقف كل إيماءات التطبيق (تنقل/رجوع). */
App.detail = (() => {
  const { $, pad, ago, processImage, tick } = App.utils, S = App.store;
  const detail = $('#detail'), body = $('#dbody'), file = $('#file'), toastEl = $('#toast'), scroller = $('#dscroll'), bg = $('#bgnum');
  let cur = -1, viewUrl = null, pushed = false, toastT, busy = false; const seqs = {};
  const ICON = {
    edit: '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>'
  };
  const lock = ms => { busy = true; setTimeout(() => busy = false, ms); };
  const scale = () => (window.visualViewport ? visualViewport.scale : 1);

  function toast(msg, opt = {}) {
    toastEl.textContent = msg; toastEl.classList.toggle('warn', !!opt.warn);
    if (opt.action) { const b = document.createElement('button'); b.textContent = opt.action.label; b.onclick = () => { opt.action.fn(); toastEl.classList.remove('show'); }; toastEl.append(b); }
    toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), opt.action ? 4500 : 1300);
  }
  const stamp = () => { const e = $('#stamp'); if (e && cur >= 0) e.textContent = ago(S.shelves[cur].updatedAt); };

  function frame(src) {
    const f = $('#frame'); if (viewUrl) { URL.revokeObjectURL(viewUrl); viewUrl = null; }
    if (!src) {
      f.innerHTML = `<div class="inner"><button class="empty-frame" id="add"><div class="plus">+</div><strong>إضافة صورة</strong><span>الرف لسه من غير صورة</span></button></div>`;
      $('#add').onclick = () => file.click(); return;
    }
    viewUrl = URL.createObjectURL(src);
    f.innerHTML = `<div class="inner"><img alt="صورة رف ${pad(cur)}"></div><div class="tools">
      <button class="iconbtn glass rim refract" id="edit" aria-label="تغيير الصورة">${ICON.edit}</button>
      <button class="iconbtn glass rim refract" id="del" aria-label="حذف الصورة">${ICON.trash}</button></div>`;
    f.querySelector('img').src = viewUrl;
    $('#edit').onclick = () => file.click();
    $('#del').onclick = () => {
      const id = cur, s = S.shelves[id], prev = { image: s.image, thumb: s.thumb };
      f.querySelector('.inner').animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.94)' }], { duration: 180, easing: 'ease-in' })
        .onfinish = () => {
          S.update(id, { image: null, thumb: null }, true); if (cur === id) frame(null);
          toast('اتحذفت الصورة', { action: { label: 'تراجع', fn: () => { S.update(id, prev, true); if (cur === id) frame(prev.image); } } });
        };
    };
  }
  // الصورة بتظهر فوراً من الملف الأصلي، والتصغير والحفظ في الخلفية (وآخر اختيار هو اللي بيتحفظ)
  file.addEventListener('change', async () => {
    const f = file.files[0]; file.value = ''; if (!f || cur < 0) return;
    const id = cur, n = seqs[id] = (seqs[id] || 0) + 1; frame(f); tick(8);
    const r = await processImage(f); if (seqs[id] === n) S.update(id, r, true);
  });

  function render() {
    const s = S.shelves[cur];
    $('#dtitle').textContent = 'رف ' + pad(cur); bg.textContent = pad(cur);
    $('#dots').innerHTML = S.shelves.map((_, i) => `<button data-i="${i}" class="${i === cur ? 'on' : ''}" aria-label="رف ${pad(i)}"></button>`).join('');
    body.innerHTML = `<figure class="frame glass rim" id="frame"></figure><div class="side"><label class="notes glass rim"><span>الوصف</span>
      <textarea id="notes" placeholder="أضف ملاحظة عن محتويات الرف&#10;مثال: 12 علبة من النوع A، 3 علب ناقصة"></textarea></label><p class="stamp" id="stamp"></p></div>`;
    const t = $('#notes'); t.value = s.description;
    t.addEventListener('input', () => S.update(cur, { description: t.value }));
    frame(s.image); stamp(); scroller.dispatchEvent(new Event('scroll'));
  }

  S.on('saved', (id, ok) => {
    App.card.refresh(id);
    if (id === cur && !detail.hidden) { toast(ok ? '✓ تم الحفظ' : 'التخزين مش متاح — البيانات مؤقتة لحد ما تقفل الصفحة', { warn: !ok }); stamp(); }
  });

  const rectClip = r => `inset(${Math.max(r.top, 0)}px ${Math.max(innerWidth - r.right, 0)}px ${Math.max(innerHeight - r.bottom, 0)}px ${Math.max(r.left, 0)}px round 30px)`;
  function open(id, card) {
    if (busy || !detail.hidden) return; lock(420); tick(8);
    cur = id; render();
    const r = card.getBoundingClientRect();
    document.body.classList.add('lock'); detail.hidden = false;
    detail.style.transition = 'none'; detail.style.clipPath = rectClip(r); detail.style.opacity = '0'; body.style.opacity = '0'; body.style.transform = 'translateY(18px)';
    void detail.offsetWidth;
    detail.style.transition = 'clip-path .45s var(--out), opacity .15s'; detail.style.clipPath = 'inset(0 0 0 0 round 0px)'; detail.style.opacity = '1';
    body.style.transition = 'opacity .3s .12s, transform .6s .1s var(--out)'; body.style.opacity = '1'; body.style.transform = 'none';
    try { history.pushState({ shelf: id }, ''); pushed = true; } catch { pushed = false; }
  }
  function requestClose() { if (busy || detail.hidden) return; if (pushed) { try { history.back(); return; } catch {} } doClose(); }
  function doClose() {
    if (detail.hidden || cur < 0) return; lock(420);
    S.flush(); pushed = false;
    const card = document.querySelector(`.card[data-id="${cur}"]`); card.scrollIntoView({ block: 'nearest' });
    const r = card.getBoundingClientRect();
    body.style.transition = 'opacity .12s, transform .3s'; body.style.opacity = '0'; body.style.transform = 'translateY(10px)';
    detail.style.transition = 'clip-path .38s var(--out), opacity .2s .18s'; detail.style.clipPath = rectClip(r); detail.style.opacity = '0';
    setTimeout(() => { detail.hidden = true; document.body.classList.remove('lock'); if (viewUrl) { URL.revokeObjectURL(viewUrl); viewUrl = null; } cur = -1; }, 400);
  }
  function nav(dir) {
    const n = cur + dir;
    if (n < 0 || n >= S.shelves.length) { body.animate([{ transform: 'none' }, { transform: `translateX(${dir * -12}px)` }, { transform: 'none' }], { duration: 260, easing: 'ease-out' }); return; }
    cur = n; render(); scroller.scrollTop = 0; tick(6);
    body.animate([{ opacity: 0, transform: `translateX(${dir * -34}px) scale(.97)` }, { opacity: 1, transform: 'none' }], { duration: 340, easing: 'cubic-bezier(.2,.9,.25,1)' });
  }

  function bind() {
    $('#back').addEventListener('click', requestClose);
    $('#dots').addEventListener('click', e => { const b = e.target.closest('button'); if (b) nav(+b.dataset.i - cur); });
    window.addEventListener('popstate', () => { if (!detail.hidden) doClose(); });

    // ---- الإيماءات (آمنة مع الزوم) ----
    let t0 = null, multi = false;
    detail.addEventListener('touchstart', e => {
      if (e.touches.length > 1) { multi = true; t0 = null; return; }
      if (multi) return;
      const t = e.touches[0];
      t0 = { x: t.clientX, y: t.clientY, time: Date.now(), z: scale(), top: scroller.scrollTop <= 0, ta: !!e.target.closest('textarea'),
             edge: t.clientX < 28 || t.clientX > innerWidth - 28 };
    }, { passive: true });
    detail.addEventListener('touchmove', e => { if (e.touches.length > 1) { multi = true; t0 = null; } }, { passive: true });
    detail.addEventListener('touchcancel', () => { t0 = null; multi = false; }, { passive: true });
    detail.addEventListener('touchend', e => {
      if (e.touches.length > 0) return;
      const wasMulti = multi; multi = false;
      const s = t0; t0 = null;
      if (wasMulti || !s || s.ta || s.edge || busy) return;
      if (scale() > 1.02 || Math.abs(scale() - s.z) > .01) return;          // زوم شغال: مفيش إيماءات
      if (Date.now() - s.time > 700) return;                                  // سحب بطيء = مش إيماءة
      const t = e.changedTouches[0], dx = t.clientX - s.x, dy = t.clientY - s.y;
      if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 1.8) nav(dx < 0 ? 1 : -1);
      else if (s.top && dy > 130 && Math.abs(dx) < 55) requestClose();
    }, { passive: true });

    document.addEventListener('keydown', e => {
      if (detail.hidden) return;
      if (e.key === 'Escape') requestClose();
      else if (!e.target.closest('textarea')) { if (e.key === 'ArrowLeft') nav(1); if (e.key === 'ArrowRight') nav(-1); }
    });

    // باراللاكس خفيف عند التمرير
    let p = 0; scroller.addEventListener('scroll', () => {
      if (p) return; p = 1; requestAnimationFrame(() => {
        p = 0; const y = scroller.scrollTop, im = body.querySelector('.frame img');
        if (im) im.style.transform = `translateY(${Math.min(y * .1, 28)}px) scale(1.12)`;
        bg.style.transform = `translateY(${y * -.22}px)`;
      });
    }, { passive: true });
  }
  return { open, bind };
})();
