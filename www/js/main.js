(async function boot() {
  await App.store.load();
  App.card.mount();
  App.detail.bind();
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch {} // يطلب من المتصفح ما يمسحش البيانات
})();
