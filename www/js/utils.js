App.utils = (() => {
  const $ = s => document.querySelector(s);
  const pad = n => String(n + 1).padStart(2, '0');
  const el = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

  function ago(ts) {
    if (!ts) return 'لسه ما اتحدّثش';
    const m = Math.floor((Date.now() - ts) / 60000);
    if (m < 1) return 'آخر تحديث: دلوقتي';
    if (m < 60) return `آخر تحديث: من ${m} دقيقة`;
    const h = Math.floor(m / 60);
    if (h < 24) return `آخر تحديث: من ${h} ساعة`;
    const d = Math.floor(h / 24);
    if (d === 1) return 'آخر تحديث: امبارح';
    if (d < 7) return `آخر تحديث: من ${d} أيام`;
    return 'آخر تحديث: ' + new Date(ts).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
  }

  async function scale(bmp, max, q) {
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(bmp, 0, 0, c.width, c.height);
    return new Promise(r => c.toBlob(b => r(b), 'image/jpeg', q));
  }
  // بيصغّر الصورة (نسخة كاملة + مصغّرة) عشان التطبيق يفضل خفيف وسريع. لو المتصفح قديم بيحفظ الأصل زي ما هو.
  async function processImage(file) {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
      const image = await scale(bmp, App.IMG_MAX, .85), thumb = await scale(bmp, App.THUMB_MAX, .78);
      if (bmp.close) bmp.close();
      if (!image || !thumb) throw 0;
      return { image, thumb };
    } catch { return { image: file, thumb: file }; }
  }

  // كاش لروابط الصور عشان ما نعيدش إنشاءها
  const urls = new Map();
  function urlFor(key, blob) {
    const c = urls.get(key);
    if (c && c.blob === blob) return c.url;
    if (c) URL.revokeObjectURL(c.url);
    if (!blob) { urls.delete(key); return null; }
    const url = URL.createObjectURL(blob); urls.set(key, { blob, url }); return url;
  }
  const tick = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch {} }; // اهتزاز خفيف
  const light = (c, x, y) => { const r = c.getBoundingClientRect(); const dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2);
    c.style.setProperty('--mx', (x - r.left) + 'px'); c.style.setProperty('--my', (y - r.top) + 'px'); c.style.setProperty('--ang', (Math.atan2(dy, dx) * 180 / Math.PI + 90) + 'deg'); };
  return { $, pad, el, ago, processImage, urlFor, tick, light };
})();
