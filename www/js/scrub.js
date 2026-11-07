/* شريط التنقل الزجاجي: عدسة بتتمسك وتتسحب (زي سويتش iOS). الحركة كلها transform + فيزياء زنبرك بسيطة = خفيف وسلس.
   make(track, { onPreview(i), onCommit(i) }) → { set(i, animate), dragging() } */
App.scrub = (() => {
  function make(track, o) {
    const lens = track.querySelector('.lens');
    let C = [], W = 0, cur = 0, idx = 0, x = 0, v = 0, tgt = 0, press = 1, pt = 1, drag = false, pid = null, raf = 0, last = 0;
    const measure = () => { C = [...track.querySelectorAll('button')].map(b => b.offsetLeft + b.offsetWidth / 2); W = lens.offsetWidth; };
    const near = p => C.reduce((b, c, i) => Math.abs(c - p) < Math.abs(C[b] - p) ? i : b, 0);
    const clamp = p => Math.min(Math.max(p, Math.min(...C)), Math.max(...C));
    const apply = () => {
      const sx = pt * (1 + Math.min(Math.abs(v) / 24, .55)), sy = pt * (1 - Math.min(Math.abs(v) / 100, .15));
      lens.style.transform = `translate3d(${x - W / 2}px,0,0) scale(${sx},${sy})`;
    };
    function step(t) {
      const dt = Math.min((t - last) / 16.67 || 1, 2.2); last = t;
      const k = drag ? .3 : .16, c = drag ? .9 : .32;           // أثناء السحب: لازقة في الصباع — بعد الإفلات: ترتد بنعومة
      v += ((tgt - x) * k - v * c) * dt; x += v * dt; pt += (press - pt) * Math.min(.24 * dt, 1);
      if (!drag && Math.abs(tgt - x) < .15 && Math.abs(v) < .1 && Math.abs(press - pt) < .004) { x = tgt; v = 0; pt = press; raf = 0; apply(); return; }
      apply(); raf = requestAnimationFrame(step);
    }
    const run = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); } };
    function move(e) {
      const p = clamp(e.clientX - track.getBoundingClientRect().left); tgt = p;
      const i = near(p); if (i !== idx) { idx = i; App.utils.tick(3); o.onPreview && o.onPreview(i); }
    }
    track.addEventListener('pointerdown', e => {
      if (!e.isPrimary || e.button > 0) return;
      measure(); if (!C.length || !W) return;
      drag = true; pid = e.pointerId; press = 1.32; track.classList.add('grab');
      try { track.setPointerCapture(pid); } catch {}
      move(e); run(); App.utils.tick(4);
    });
    track.addEventListener('pointermove', e => { if (drag && e.pointerId === pid) move(e); });
    const end = cancel => e => {
      if (!drag || e.pointerId !== pid) return;
      drag = false; pid = null; press = 1; track.classList.remove('grab');
      if (cancel) { idx = cur; o.onPreview && o.onPreview(cur); } else cur = idx;
      tgt = C[idx]; run(); if (!cancel) o.onCommit && o.onCommit(idx);
    };
    track.addEventListener('pointerup', end(false)); track.addEventListener('pointercancel', end(true));
    track.addEventListener('contextmenu', e => e.preventDefault());
    function set(i, anim = true) {
      measure(); if (!C.length || !W) return; cur = idx = i; tgt = C[i];
      if (anim) run(); else { x = tgt; v = 0; apply(); }
    }
    return { set, dragging: () => drag };
  }
  return { make };
})();
