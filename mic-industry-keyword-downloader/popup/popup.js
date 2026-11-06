const elements = {
  message: document.querySelector('#message'),
  form: document.querySelector('#form'),
  months: document.querySelector('#months'),
  industries: document.querySelector('#industries'),
  count: document.querySelector('#industry-count'),
  region: document.querySelector('#region'),
  summary: document.querySelector('#summary'),
  search: document.querySelector('#search'),
  start: document.querySelector('#start'),
  progress: document.querySelector('#progress'),
  progressCount: document.querySelector('#progress-count'),
  progressBar: document.querySelector('#progress-bar'),
  currentFile: document.querySelector('#current-file'),
  failures: document.querySelector('#failures'),
  pause: document.querySelector('#pause'),
  resume: document.querySelector('#resume')
};

let config;
let chosenIds = new Set();
let chosenMonths = new Set();

function showMessage(message, error = false) {
  elements.message.textContent = message;
  elements.message.classList.toggle('error', error);
}

function checkboxLabel(className, text, checked, onChange, id = '') {
  const label = document.createElement('label');
  label.className = className;
  if (id) label.dataset.id = id;
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = checked;
  input.addEventListener('change', () => onChange(input.checked));
  const span = document.createElement('span');
  span.textContent = text;
  label.append(input, span);
  return label;
}

async function persistSelection() {
  await chrome.storage.local.set({
    selection: { ids: [...chosenIds], months: [...chosenMonths] }
  });
}

function updateSummary() {
  const total = chosenIds.size * chosenMonths.size;
  elements.count.textContent = `已选 ${chosenIds.size} 个`;
  elements.summary.textContent = `${chosenIds.size} 个行业 × ${chosenMonths.size} 个月份 = ${total} 份 XLSX`;
  elements.start.disabled = total === 0 || total > 250 || config.region !== '全球';
  if (total > 250) elements.summary.textContent += '（一次最多 250 份）';
}

function updateSearch() {
  const term = elements.search.value.trim().toLocaleLowerCase();
  for (const group of elements.industries.querySelectorAll('.group')) {
    const parent = group.querySelector('.industry.parent');
    const parentMatches = parent.textContent.toLocaleLowerCase().includes(term);
    let visible = 0;
    for (const child of group.querySelectorAll('.industry.child')) {
      const matches = parentMatches || child.textContent.toLocaleLowerCase().includes(term);
      child.classList.toggle('hidden', !matches);
      if (matches) visible++;
    }
    parent.classList.toggle('hidden', !parentMatches && visible === 0);
    group.classList.toggle('hidden', !parentMatches && visible === 0);
  }
}

function renderOptions() {
  elements.region.textContent = `当前区域：${config.region || '未知'}`;
  elements.months.replaceChildren();
  elements.industries.replaceChildren();

  for (const month of config.months) {
    elements.months.append(checkboxLabel('month', month, chosenMonths.has(month), checked => {
      if (checked) chosenMonths.add(month); else chosenMonths.delete(month);
      updateSummary();
      persistSelection();
    }));
  }

  const parents = config.items.filter(item => item.isParent);
  for (const parent of parents) {
    const group = document.createElement('div');
    group.className = 'group';
    const items = [parent, ...config.items.filter(item => item.parentId === parent.id)];
    for (const item of items) {
      group.append(checkboxLabel(`industry ${item.id === parent.id ? 'parent' : 'child'}`,
        item.id === parent.id ? parent.label : item.name,
        chosenIds.has(item.id), checked => {
          if (checked) chosenIds.add(item.id); else chosenIds.delete(item.id);
          updateSummary();
          persistSelection();
        }, item.id));
    }
    elements.industries.append(group);
  }

  updateSummary();
  updateSearch();
}

function renderJob(job) {
  const visible = Boolean(job?.tasks?.length);
  elements.progress.hidden = !visible;
  if (!visible) return;
  const finished = job.completed + job.failed.length;
  elements.progressCount.textContent = `${finished}/${job.tasks.length}`;
  elements.progressBar.max = job.tasks.length;
  elements.progressBar.value = finished;
  if (job.status === 'done') {
    elements.currentFile.textContent = `已完成：${job.completed} 份成功，${job.failed.length} 份失败。文件位于「下载/MIC行业关键词」。`;
  } else {
    const task = job.active?.task || job.tasks[job.cursor];
    elements.currentFile.textContent = `${job.status === 'paused' ? '已暂停' : '正在下载'}：${task ? `${task.month} · ${task.name}` : '等待中'}`;
  }
  elements.failures.textContent = job.failed.length
    ? `失败：${job.failed.slice(-3).map(item => `${item.month} ${item.name}（${item.reason}）`).join('；')}`
    : '';
  elements.pause.hidden = job.status !== 'running';
  elements.resume.hidden = job.status !== 'paused';
  if (config) {
    updateSummary();
    if (job.status === 'running' || job.status === 'paused') elements.start.disabled = true;
  }
}

async function loadConfig() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.startsWith('https://data.made-in-china.com/industry/keyword')) {
    throw new Error('请在 Chrome 中打开 MIC 关键词分析页面，再点击插件图标。');
  }
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
  const result = await chrome.tabs.sendMessage(tab.id, { type: 'MIC_GET_CONFIG' });
  if (!result?.ok) throw new Error(result?.error || '无法读取 MIC 页面。');
  return result.data;
}

async function init() {
  try {
    config = await loadConfig();
    if (config.region !== '全球') {
      showMessage('当前版本批量导出支持「全球」区域，请先在页面中选择全球。', true);
    } else {
      showMessage('使用页面已设置的行业和可选月份。');
    }
    const { selection } = await chrome.storage.local.get('selection');
    const availableIds = new Set(config.items.map(item => item.id));
    chosenIds = new Set((selection?.ids || [config.currentId]).filter(id => availableIds.has(id)));
    chosenMonths = new Set((selection?.months || [config.currentMonth]).filter(month => config.months.includes(month)));
    if (!chosenIds.size && availableIds.has(config.currentId)) chosenIds.add(config.currentId);
    if (!chosenMonths.size && config.months.length) {
      chosenMonths.add(config.months.includes(config.currentMonth) ? config.currentMonth : config.months[0]);
    }
    elements.form.hidden = false;
    renderOptions();
  } catch (error) {
    showMessage(error.message || String(error), true);
  }

  const { job } = await chrome.storage.local.get('job');
  renderJob(job);
}

elements.search.addEventListener('input', updateSearch);
document.querySelector('#select-visible').addEventListener('click', () => {
  for (const label of elements.industries.querySelectorAll('.industry:not(.hidden)')) {
    const input = label.querySelector('input');
    input.checked = true;
    chosenIds.add(label.dataset.id);
  }
  updateSummary();
  persistSelection();
});
document.querySelector('#clear').addEventListener('click', () => {
  for (const label of elements.industries.querySelectorAll('.industry')) {
    label.querySelector('input').checked = false;
  }
  chosenIds.clear();
  updateSummary();
  persistSelection();
});
elements.start.addEventListener('click', async () => {
  const tasks = [];
  for (const month of config.months) {
    if (!chosenMonths.has(month)) continue;
    for (const item of config.items) {
      if (chosenIds.has(item.id)) tasks.push({ id: item.id, name: item.label, month });
    }
  }
  elements.start.disabled = true;
  try {
    const result = await chrome.runtime.sendMessage({ type: 'MIC_START', tasks });
    if (!result?.ok) throw new Error(result?.error || '无法启动下载。');
    renderJob(result.job);
    showMessage('已开始。关闭此窗口后下载会继续。');
  } catch (error) {
    showMessage(error.message || String(error), true);
    updateSummary();
  }
});
elements.pause.addEventListener('click', async () => {
  const result = await chrome.runtime.sendMessage({ type: 'MIC_PAUSE' });
  if (result?.ok) renderJob(result.job);
});
elements.resume.addEventListener('click', async () => {
  const result = await chrome.runtime.sendMessage({ type: 'MIC_RESUME' });
  if (result?.ok) renderJob(result.job);
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.job) renderJob(changes.job.newValue);
});
init();
