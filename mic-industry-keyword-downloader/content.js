(() => {
  if (globalThis.__micKeywordConfigListener) return;
  globalThis.__micKeywordConfigListener = true;

  async function getConfig() {
    if (location.hostname !== 'data.made-in-china.com' ||
        location.pathname !== '/industry/keyword' ||
        !document.querySelector('.ft-cascader')) {
      throw new Error('请先在 MIC 关键词分析页面切换到「行业关键词」。');
    }

    const response = await fetch('/industry/mycat/hold?from=overview', {
      credentials: 'same-origin',
      cache: 'no-store'
    });
    if (!response.ok) throw new Error(`读取行业目录失败（HTTP ${response.status}）。`);
    const payload = await response.json();
    if (!payload.success || !Array.isArray(payload.data?.items)) {
      throw new Error('未能读取已设置的行业目录，请检查 MIC 登录状态。');
    }

    const selects = [...document.querySelectorAll('.ft-select')];
    const months = [...(selects[0]?.querySelectorAll('.select-opt') || [])]
      .map(node => node.textContent.trim())
      .filter(value => /^\d{4}-(0[1-9]|1[0-2])$/.test(value));
    const month = selects[0]?.querySelector('.ft-select-input-inner')?.textContent.trim() || '';
    const region = selects[1]?.querySelector('.ft-select-input-inner')?.textContent.trim() || '';
    const currentName = document.querySelector('.ft-cascader-input-inner')?.textContent.trim() || '';
    const visibleMatches = payload.data.items.filter(item =>
      item.catNameCnWrap === currentName || item.catNameCn === currentName);

    if (!months.length) throw new Error('页面上没有可选月份，请稍后重试。');
    return {
      items: payload.data.items.map(item => ({
        id: String(item.catId || ''),
        name: String(item.catNameCn || ''),
        label: String(item.catNameCnWrap || item.catNameCn || ''),
        parentId: String(item.parentCatId || ''),
        isParent: Boolean(item.secondCat)
      })).filter(item => /^[A-Za-z0-9]+$/.test(item.id)),
      months: [...new Set(months)],
      currentMonth: month,
      currentId: String(visibleMatches.length === 1 ? visibleMatches[0].catId : payload.data.defaultCat || ''),
      region
    };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== 'MIC_GET_CONFIG') return;
    (async () => {
      try {
        sendResponse({ ok: true, data: await getConfig() });
      } catch (error) {
        sendResponse({ ok: false, error: error.message || String(error) });
      }
    })();
    return true;
  });
})();
