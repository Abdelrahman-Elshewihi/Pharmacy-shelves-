/* طبقة التخزين: IndexedDB (بيحفظ الصور كـ Blob مباشرة، من غير تحويل). لو فشلت بيكمل على الذاكرة المؤقتة. */
App.db = (() => {
  let db = null, broken = false; const mem = new Map();
  const open = () => new Promise((res, rej) => {
    const r = indexedDB.open(App.DB_NAME, App.DB_VERSION);
    r.onupgradeneeded = () => r.result.createObjectStore('shelves', { keyPath: 'id' });
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
  const run = async (mode, fn) => {
    db = db || await open(); db.onversionchange = () => { db.close(); db = null; };
    return new Promise((res, rej) => {
      const t = db.transaction('shelves', mode), rq = fn(t.objectStore('shelves'));
      t.oncomplete = () => res(rq && rq.result); t.onerror = t.onabort = () => rej(t.error);
    });
  };
  return {
    get broken() { return broken; },
    async all() { try { return await run('readonly', s => s.getAll()); } catch { broken = true; return []; } },
    async put(v) { mem.set(v.id, v); if (broken) return false; try { await run('readwrite', s => s.put(v)); return true; } catch { broken = true; return false; } }
  };
})();
