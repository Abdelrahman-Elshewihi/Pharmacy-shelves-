/* حالة التطبيق: التعديل بيتطبق في الذاكرة فوراً (بدون أي انتظار)، والحفظ في IndexedDB بيتم في الخلفية.
   شكل الرف:  { id, image, thumb, description, updatedAt }  — ضيف حقول جديدة هنا بسهولة مستقبلاً. */
App.store = (() => {
  const shelves = [], timers = {}, subs = {};
  const empty = id => ({ id, image: null, thumb: null, description: '', updatedAt: null });
  const emit = (ev, ...a) => (subs[ev] || []).forEach(f => f(...a));
  const on = (ev, f) => (subs[ev] = subs[ev] || []).push(f);

  async function load() {
    const saved = await App.db.all(), byId = new Map(saved.map(s => [s.id, s]));
    shelves.length = 0;
    for (let i = 0; i < App.SHELF_COUNT; i++) shelves.push({ ...empty(i), ...(byId.get(i) || {}) });
  }
  function write(id) {
    delete timers[id];
    return App.db.put({ ...shelves[id] }).then(ok => emit('saved', id, ok));
  }
  function update(id, patch, now) {
    Object.assign(shelves[id], patch, { updatedAt: Date.now() });
    clearTimeout(timers[id]);
    if (now) return write(id);
    timers[id] = setTimeout(() => write(id), App.SAVE_DELAY);
  }
  function flush() { Object.keys(timers).forEach(id => { clearTimeout(timers[id]); write(+id); }); }

  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
  return { shelves, load, update, flush, on };
})();
