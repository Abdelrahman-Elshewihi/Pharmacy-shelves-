/* شاشة الرف: فتح/قفل بحركة الكارت، صورة، وصف، سحب للتنقل، وحفظ تلقائي */
App.detail = (() => {
  const { $, pad, ago, processImage } = App.utils, S = App.store;
  const detail = $('#detail'), body = $('#dbody'), file = $('#file'), toastEl = $('#toast'), scroller = $('#dscroll');
  let cur = -1, viewUrl = null, pushed = false, toastT;
  const ICON = {
    edit: '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>'
  };

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
      <button class="iconbtn" id="edit" aria-label="تغيير الصورة">${ICON.edit}</button>
      <button class="iconbtn" id="del" aria-label="حذف الصورة">${ICON.trash}</button></div>`;
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
  // الصورة بتظهر فوراً من الملف الأصلي، والتصغير والحفظ بيحصلوا في الخلفية
  file.addEventListener('change', async () => {
    const f = file.files[0]; file.value = ''; if (!f || cur < 0) return;
    const id = cur; frame(f);
    const r = await processImage(f); S.update(id, r, true);
  });

  function render() {
    const s = S.shelves[cur];
    $('#dtitle').textContent = 'رف ' + pad(cur); $('#bgnum').textContent = pad(cur);
    $('#dots').innerHTML = S.shelves.map((_, i) => `<i class="${i === cur ? 'on' : ''}"></i>`).join('');
    body.innerHTML = `<figure class="frame" id="frame"></figure><div class="side"><label class="notes"><span>الوصف</span>
      <textarea id="notes" placeholder="أضف ملاحظة عن محتويات الرف&#10;مثال: 12 علبة من النوع A، 3 علب ناقصة"></textarea></label><p class="stamp" id="stamp"></p></div>`;
    const t = $('#notes'); t.value = s.description;
    t.addEventListener('input', () => S.update(cur, { description: t.value }));
    frame(s.image); stamp();
  }

  S.on('saved', (id, ok) => {
    App.card.refresh(id);
    if (id === cur && !detail.hidden) { toast(ok ? '✓ تم الحفظ' : 'التخزين مش متاح — البيانات مؤقتة لحد ما تقفل الصفحة', { warn: !ok }); stamp(); }
  });

  const rectClip = r => `inset(${Math.max(r.top, 0)}px ${Math.max(innerWidth - r.right, 0)}px ${Math.max(innerHeight - r.bottom, 0)}px ${Math.max(r.left, 0)}px round 28px)`;
  function open(id, card) {
    cur = id; render();
    const r = card.getBoundingClientRect();
    document.body.classList.add('lock'); detail.hidden = false;
    detail.style.transition = 'none'; detail.style.clipPath = rectClip(r); detail.style.opacity = '0'; body.style.opacity = '0';
    void detail.offsetWidth;
    detail.style.transition = 'clip-path .36s var(--ease), opacity .15s'; detail.style.clipPath = 'inset(0 0 0 0 round 0px)'; detail.style.opacity = '1';
    body.style.transition = 'opacity .22s .1s'; body.style.opacity = '1';
    try { history.pushState({ shelf: id }, ''); pushed = true; } catch { pushed = false; }
  }
  function requestClose() { if (pushed) { try { history.back(); return; } catch {} } doClose(); }
  function doClose() {
    if (detail.hidden) return;
    S.flush(); pushed = false;
    const card = document.querySelector(`.card[data-id="${cur}"]`); card.scrollIntoView({ block: 'nearest' });
    const r = card.getBoundingClientRect();
    body.style.transition = 'opacity .1s'; body.style.opacity = '0';
    detail.style.transition = 'clip-path .3s var(--ease), opacity .18s .14s'; detail.style.clipPath = rectClip(r); detail.style.opacity = '0';
    setTimeout(() => { detail.hidden = true; document.body.classList.remove('lock'); if (viewUrl) { URL.revokeObjectURL(viewUrl); viewUrl = null; } cur = -1; }, 310);
  }
  function nav(dir) {
    const n = cur + dir;
    if (n < 0 || n >= S.shelves.length) { body.animate([{ transform: 'none' }, { transform: `translateX(${dir * -10}px)` }, { transform: 'none' }], { duration: 200 }); return; }
    cur = n; render(); scroller.scrollTop = 0;
    body.animate([{ opacity: 0, transform: `translateX(${dir * -28}px)` }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.2,.9,.25,1)' });
  }

  function bind() {
    $('#back').addEventListener('click', requestClose);
    window.addEventListener('popstate', () => { if (!detail.hidden) doClose(); });
    let t0 = null;
    detail.addEventListener('touchstart', e => { const t = e.touches[0]; t0 = { x: t.clientX, y: t.clientY, top: scroller.scrollTop <= 0, ta: !!e.target.closest('textarea') }; }, { passive: true });
    detail.addEventListener('touchend', e => {
      if (!t0) return; const t = e.changedTouches[0], dx = t.clientX - t0.x, dy = t.clientY - t0.y;
      if (!t0.ta && Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) nav(dx < 0 ? 1 : -1);      // سحب جانبي: تنقل
      else if (!t0.ta && t0.top && dy > 110 && Math.abs(dx) < 60) requestClose();                          // سحب لتحت: رجوع
      t0 = null;
    }, { passive: true });
    document.addEventListener('keydown', e => {
      if (detail.hidden) return;
      if (e.key === 'Escape') requestClose();
      else if (!e.target.closest('textarea')) { if (e.key === 'ArrowLeft') nav(1); if (e.key === 'ArrowRight') nav(-1); }
    });
  }
  return { open, bind };
})();
