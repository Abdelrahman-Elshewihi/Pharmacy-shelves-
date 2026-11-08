(async function boot() {
  try { const sb = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.StatusBar;   // شريط الحالة غامق ومتماشي مع التصميم
    if (sb) { sb.setOverlaysWebView({ overlay: false }); sb.setBackgroundColor({ color: '#010363' }); sb.setStyle({ style: 'DARK' }); } } catch {}
  await App.store.load();
  App.card.mount();
  App.detail.bind();
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch {} // يطلب من المتصفح ما يمسحش البيانات
})();
