/* شاشة الرف: فتح/قفل بحركة الكارت، صورة، وصف، سحب للتنقل، وحفظ تلقائي.
   الزوم بإصبعين حر تماماً: أي لمسة بإصبعين أو زوم مفعّل بيوقف كل إيماءات التطبيق (تنقل/رجوع). */
App.detail = (() => {
  const { $, pad, ago, processImage, tick } = App.utils, S = App.store;
  const detail = $('#detail'), body = $('#dbody'), file = $('#file'), toastEl = $('#toast'), scroller = $('#dscroll'), bg = $('#bgnum');
  let cur = -1, scr, viewUrl = null, pushed = false, toastT, busy = false; const seqs = {};
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
  const mark = i => { $('#dots').querySelectorAll('button').forEach((b, k) => b.classList.toggle('on', k === i)); };
  const stamp = () => { const e = $('#stamp'); if (e && cur >= 0) e.textContent = ago(S.shelves[cur].updatedAt); };

  function frame(src) {
    const f = $('#frame'); if (viewUrl) { URL.revokeObjectURL(viewUrl); viewUrl = null; }
    if (!src) {
      f.innerHTML = `<div class="inner"><button class="empty-frame" id="add"><div class="plus">+</div><strong>إضافة صورة</strong><span>الرف لسه من غير صورة</span></button></div>`;
      $('#add').onclick = () => file.click(); return;
    }
    viewUrl = URL.createObjectURL(src);
    f.innerHTML = `<div class="inner"><img alt="صورة رف ${pad(cur)}"></div><div class="tools">
      <button class="iconbtn glass" id="edit" aria-label="تغيير الصورة">${ICON.edit}</button>
      <button class="iconbtn glass" id="del" aria-label="حذف الصورة">${ICON.trash}</button></div>`;
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
    mark(cur);
    body.innerHTML = `<figure class="frame glass" id="frame"></figure><div class="side"><label class="notes glass"><span>الوصف</span>
      <textarea id="notes" placeholder="أضف ملاحظة عن محتويات الرف&#10;مثال: 12 علبة من النوع A، 3 علب ناقصة"></textarea></label><p class="stamp" id="stamp"></p></div>`;
    const t = $('#notes'); t.value = s.description;
    t.addEventListener('input', () => S.update(cur, { description: t.value }));
    frame(s.image); stamp(); scroller.dispatchEvent(new Event('scroll'));
  }

  S.on('saved', (id, ok) => {
    App.card.refresh(id);
    if (id === cur && !detail.hidden) { toast(ok ? '✓ تم الحفظ' : 'التخزين مش متاح — البيانات مؤقتة لحد ما تقفل الصفحة', { warn: !ok }); stamp(); }
  });

  const tf = r => `translate(${r.left + r.width / 2 - innerWidth / 2}px,${r.top + r.height / 2 - innerHeight / 2}px) scale(${Math.max(r.width / innerWidth, .25)})`;
  const rectClip = r => `inset(${Math.max(r.top, 0)}px ${Math.max(innerWidth - r.right, 0)}px ${Math.max(innerHeight - r.bottom, 0)}px ${Math.max(r.left, 0)}px round 30px)`;
  let coverT = 0;
  function open(id, card) {
    if (busy || !detail.hidden) return; lock(420); tick(8);
    cur = id; render();
    const r = card.getBoundingClientRect();
    document.body.classList.add('lock'); detail.hidden = false; scr.set(cur, false);
    detail.style.opacity = ''; detail.style.transform = ''; body.style.opacity = '0'; body.style.transform = 'translateY(18px)';
    void detail.offsetWidth;
    detail.animate([{ transform: tf(r), opacity: 0 }, { opacity: 1, offset: .55 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2,.9,.25,1)' });
    coverT = setTimeout(() => { if (!detail.hidden) document.body.classList.add('covered'); }, 480);
    body.style.transition = 'opacity .3s .12s, transform .6s .1s var(--out)'; body.style.opacity = '1'; body.style.transform = 'none';
    try { history.pushState({ shelf: id }, ''); pushed = true; } catch { pushed = false; }
  }
  function requestClose() { if (busy || detail.hidden) return; if (pushed) { try { history.back(); return; } catch {} } doClose(); }
  function doClose() {
    clearTimeout(coverT); document.body.classList.remove('covered');
    if (detail.hidden || cur < 0) return; lock(420);
    S.flush(); pushed = false;
    const card = document.querySelector(`.card[data-id="${cur}"]`); card.scrollIntoView({ block: 'nearest' });
    const r = card.getBoundingClientRect();
    body.style.transition = 'opacity .12s, transform .3s'; body.style.opacity = '0'; body.style.transform = 'translateY(10px)';
    const from = detail.style.transform || 'none'; detail.style.transform = '';
    detail.animate([{ transform: from, opacity: 1 }, { opacity: 1, offset: .45 }, { transform: tf(r), opacity: 0 }], { duration: 360, easing: 'cubic-bezier(.3,.8,.3,1)', fill: 'forwards' });
    setTimeout(() => { detail.getAnimations().forEach(a => a.cancel()); detail.hidden = true; document.body.classList.remove('lock'); if (viewUrl) { URL.revokeObjectURL(viewUrl); viewUrl = null; } cur = -1; }, 400);
  }
  function nav(dir) {
    const n = cur + dir;
    if (n < 0 || n >= S.shelves.length) { body.animate([{ transform: 'none' }, { transform: `translateX(${Math.sign(dir) * -12}px)` }, { transform: 'none' }], { duration: 260, easing: 'ease-out' }); return; }
    cur = n; render(); scr.set(cur, true); scroller.scrollTop = 0; tick(6);
    body.animate([{ opacity: 0, transform: `translateX(${Math.sign(dir) * -34}px) scale(.97)` }, { opacity: 1, transform: 'none' }], { duration: 340, easing: 'cubic-bezier(.2,.9,.25,1)' });
  }

  function bind() {
    $('#back').addEventListener('click', requestClose);
    const dotsEl = $('#dots');
    dotsEl.innerHTML = S.shelves.map((_, i) => `<button data-i="${i}" aria-label="رف ${pad(i)}"></button>`).join('') + '<i class="lens"></i>';
    scr = App.scrub.make(dotsEl, {
      onPreview: i => { $('#dtitle').textContent = 'رف ' + pad(i); mark(i); },
      onCommit: i => { if (i !== cur) nav(i - cur); else { $('#dtitle').textContent = 'رف ' + pad(cur); mark(cur); } }
    });
    dotsEl.addEventListener('click', e => { if (e.detail === 0) { const b = e.target.closest('button'); if (b && +b.dataset.i !== cur) nav(+b.dataset.i - cur); } });
    window.addEventListener('resize', () => { if (!detail.hidden) scr.set(cur, false); });
    window.addEventListener('popstate', () => { if (!detail.hidden) doClose(); });

    // ---- الإيماءات: الشاشة بتمشي مع صباعك حرفياً (يمين/شمال = تنقل، لتحت = رجوع). آمنة مع الزوم ----
    let t0 = null, multi = false, mode = null, anim = false;
    const SPR = 'cubic-bezier(.34,1.4,.64,1)', OUT = 'cubic-bezier(.2,.9,.25,1)';
    function dropDrag() {   // رجّع الشاشة لمكانها بنعومة
      if (mode === 'h') { const f = body.style.transform || 'none', o = body.style.opacity || 1; body.style.transform = ''; body.style.opacity = ''; body.style.transition = '';
        body.animate([{ transform: f, opacity: o }, { transform: 'none', opacity: 1 }], { duration: 420, easing: SPR }); }
      else if (mode === 'v') { const f = detail.style.transform || 'none'; detail.style.transform = '';
        detail.animate([{ transform: f }, { transform: 'none' }], { duration: 380, easing: SPR }); }
      mode = null;
    }
    function commitH(dx) {
      const n = cur + (dx < 0 ? 1 : -1), sg = dx < 0 ? -1 : 1; anim = true; mode = null;
      const f = body.style.transform || 'none', o = +(body.style.opacity || 1);
      body.style.transform = ''; body.style.transition = ''; body.style.opacity = '0';
      const a = body.animate([{ transform: f, opacity: o }, { transform: `translate3d(${sg * innerWidth * .45}px,0,0)`, opacity: 0 }], { duration: 170, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' });
      a.onfinish = () => {
        a.cancel(); cur = n; render(); scr.set(cur, true); scroller.scrollTop = 0; body.style.opacity = ''; tick(6);
        body.animate([{ transform: `translate3d(${-sg * 70}px,0,0) scale(.97)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 440, easing: OUT });
        anim = false;
      };
    }
    detail.addEventListener('touchstart', e => {
      if (e.touches.length > 1) { multi = true; dropDrag(); t0 = null; return; }
      t0 = null; if (multi || anim || busy || e.target.closest('.dots')) return;
      const t = e.touches[0];
      t0 = { x: t.clientX, y: t.clientY, lx: t.clientX, ly: t.clientY, lt: Date.now(), vx: 0, vy: 0, z: scale(), top: scroller.scrollTop <= 0,
             ta: !!e.target.closest('textarea'), edge: t.clientX < 28 || t.clientX > innerWidth - 28, hit: false };
      mode = null;
    }, { passive: true });
    detail.addEventListener('touchmove', e => {
      if (e.touches.length > 1) { multi = true; dropDrag(); t0 = null; return; }
      if (!t0) return;
      if (scale() > 1.02 || Math.abs(scale() - t0.z) > .01) { dropDrag(); t0 = null; return; }   // زوم شغال: مفيش إيماءات
      const t = e.touches[0], dx = t.clientX - t0.x, dy = t.clientY - t0.y, now = Date.now(), dt = Math.max(now - t0.lt, 1);
      t0.vx = t0.vx * .6 + (t.clientX - t0.lx) / dt * .4; t0.vy = t0.vy * .6 + (t.clientY - t0.ly) / dt * .4; t0.lx = t.clientX; t0.ly = t.clientY; t0.lt = now;
      if (!mode) {
        if (t0.ta || t0.edge) return;
        if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.6) mode = 'h';
        else if (t0.top && dy > 14 && dy > Math.abs(dx) * 1.6) mode = 'v';
        else return;
        body.style.transition = 'none';
      }
      if (mode === 'h') {
        const n = cur + (dx < 0 ? 1 : -1), lim = n < 0 || n >= S.shelves.length;
        body.style.transform = `translate3d(${dx * (lim ? .22 : .9)}px,0,0)`; body.style.opacity = 1 - Math.min(Math.abs(dx) / (innerWidth * 1.2), .45);
        if (!lim && !t0.hit && Math.abs(dx) > 90) { t0.hit = true; tick(5); }
      } else {
        const y = Math.max(dy, 0); detail.style.transform = `translate3d(0,${y * .92}px,0) scale(${1 - Math.min(y / 1700, .09)})`;
        if (!t0.hit && y > 120) { t0.hit = true; tick(5); }
      }
    }, { passive: true });
    detail.addEventListener('touchcancel', () => { dropDrag(); t0 = null; multi = false; }, { passive: true });
    detail.addEventListener('touchend', e => {
      if (e.touches.length > 0) return;
      const wasMulti = multi; multi = false; const s = t0; t0 = null;
      if (wasMulti || !s || !mode) { dropDrag(); return; }
      const t = e.changedTouches[0], dx = t.clientX - s.x, dy = t.clientY - s.y;
      if (mode === 'h') {
        const n = cur + (dx < 0 ? 1 : -1), ok = n >= 0 && n < S.shelves.length && (Math.abs(dx) > 90 || (Math.abs(s.vx) > .5 && Math.abs(dx) > 28));
        if (ok) commitH(dx); else dropDrag();
      } else if (dy > 120 || (s.vy > .7 && dy > 40)) { mode = null; requestClose(); } else dropDrag();
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
