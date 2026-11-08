/* شريط التنقل الزجاجي: عدسة بتتمسك وتتسحب. فيزياء زنبرك + transform بس = سلس على أي شاشة.
   make(track, { onPreview(i), onMove(p), onCommit(i) }) → { set(i, animate), follow(p), dragging() } */
App.scrub = (() => {
  function make(track, o) {
    const lens = track.querySelector('.lens');
    let C = [], W = 0, L = 0, cur = 0, idx = 0, x = 0, v = 0, tgt = 0, press = 1, pt = 1, drag = false, pid = null, raf = 0, last = 0, sx0 = 0, moved = false, pend = null, stiff = false;
    const measure = () => { C = [...track.querySelectorAll('button')].map(b => b.offsetLeft + b.offsetWidth / 2); W = lens.offsetWidth; };
    const near = p => C.reduce((b, c, i) => Math.abs(c - p) < Math.abs(C[b] - p) ? i : b, 0);
    const clamp = p => Math.min(Math.max(p, Math.min(C[0], C[C.length - 1])), Math.max(C[0], C[C.length - 1]));
    const toPos = p => (p - C[0]) / (C[C.length - 1] - C[0]) * (C.length - 1);
    const fromPos = f => C[0] + (C[C.length - 1] - C[0]) * Math.min(Math.max(f, 0), C.length - 1) / (C.length - 1);
    const apply = () => {
      const sx = pt * (1 + Math.min(Math.abs(v) / 24, .55)), sy = pt * (1 - Math.min(Math.abs(v) / 100, .15));
      lens.style.transform = `translate3d(${x - W / 2}px,0,0) scale(${sx},${sy})`;
    };
    function step(t) {
      const dt = Math.min((t - last) / 16.67 || 1, 2.2); last = t;
      if (pend !== null && o.onMove) { const f = pend; pend = null; o.onMove(f); }      // تمرير الصفحة مرة واحدة في الفريم
      const k = drag ? .3 : stiff ? .22 : .16, c = drag ? .9 : stiff ? .62 : .32;
      v += ((tgt - x) * k - v * c) * dt; x += v * dt; pt += (press - pt) * Math.min(.24 * dt, 1);
      if (!drag && pend === null && Math.abs(tgt - x) < .15 && Math.abs(v) < .1 && Math.abs(press - pt) < .004) { x = tgt; v = 0; pt = press; raf = 0; apply(); return; }
      apply(); raf = requestAnimationFrame(step);
    }
    const run = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); } };
    function move(e) {
      const p = clamp(e.clientX - L); tgt = p;
      if (!moved && Math.abs(e.clientX - sx0) > 6) moved = true;
      const i = near(p); if (i !== idx) { idx = i; App.utils.tick(3); o.onPreview && o.onPreview(i); }
      if (moved && o.onMove) pend = toPos(p);
    }
    track.addEventListener('pointerdown', e => {
      if (!e.isPrimary || e.button > 0) return;
      measure(); if (!C.length || !W) return;
      L = track.getBoundingClientRect().left; sx0 = e.clientX; moved = false; stiff = false;
      drag = true; pid = e.pointerId; press = 1.32; track.classList.add('grab');
      try { track.setPointerCapture(pid); } catch {}
      move(e); run(); App.utils.tick(4);
    });
    track.addEventListener('pointermove', e => { if (drag && e.pointerId === pid) move(e); });
    const end = cancel => e => {
      if (!drag || e.pointerId !== pid) return;
      drag = false; pid = null; press = 1; stiff = false; pend = null; track.classList.remove('grab');
      if (cancel) { idx = cur; o.onPreview && o.onPreview(cur); } else cur = idx;
      tgt = C[idx]; run(); if (!cancel) o.onCommit && o.onCommit(idx, moved);
    };
    track.addEventListener('pointerup', end(false)); track.addEventListener('pointercancel', end(true));
    track.addEventListener('contextmenu', e => e.preventDefault());
    function set(i, anim = true) {
      measure(); if (!C.length || !W) return; cur = idx = i; tgt = C[i]; stiff = false;
      if (anim) run(); else { x = tgt; v = 0; apply(); }
    }
    function follow(f) {   // العدسة بتمشي مع السكرول بشكل متصل
      if (drag) return; if (!C.length || !W) { measure(); if (!C.length || !W) return; }
      stiff = true; tgt = fromPos(f); cur = idx = Math.round(f); run();
    }
    return { set, follow, dragging: () => drag };
  }
  return { make };
})();
