const ALARM = 'mic-download-watch';
const ROOT = 'https://data.made-in-china.com/industry/hot/word/download';

function safeName(value) {
  return String(value).replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/\.\./g, '_').replace(/\s+/g, ' ').trim().slice(0, 85) || '行业';
}

function reportUrl(task) {
  const params = new URLSearchParams({
    date: task.month,
    catelog: task.id,
    areaParam: '2',
    region: ''
  });
  return `${ROOT}?${params}`;
}

function reportFile(task) {
  return `MIC行业关键词/${task.month}/${safeName(task.name)}_${task.id}_${task.month}.xlsx`;
}

async function setBadge(job) {
  if (!job || job.status === 'done') {
    await chrome.action.setBadgeText({ text: job?.failed.length ? '!' : '' });
    if (job?.failed.length) await chrome.action.setBadgeBackgroundColor({ color: '#b52b33' });
    return;
  }
  await chrome.action.setBadgeBackgroundColor({ color: '#1677d2' });
  await chrome.action.setBadgeText({ text: `${job.completed + job.failed.length}/${job.tasks.length}`.slice(0, 4) });
}

async function saveJob(job) {
  await chrome.storage.local.set({ job });
  await setBadge(job);
}

async function nextDownload() {
  const { job } = await chrome.storage.local.get('job');
  if (!job || job.status !== 'running' || job.active) return;
  if (job.cursor >= job.tasks.length) {
    job.status = 'done';
    await saveJob(job);
    await chrome.alarms.clear(ALARM);
    return;
  }

  const task = job.tasks[job.cursor];
  const token = crypto.randomUUID();
  job.active = { task, token, id: null, startedAt: Date.now() };
  await saveJob(job);
  const { job: latest } = await chrome.storage.local.get('job');
  if (latest?.active?.token !== token) return;

  try {
    const id = await chrome.downloads.download({
      url: reportUrl(task),
      filename: reportFile(task),
      conflictAction: 'uniquify',
      saveAs: false
    });
    const { job: current } = await chrome.storage.local.get('job');
    if (current?.active?.token === token) {
      current.active.id = id;
      await saveJob(current);
    }
  } catch (error) {
    await finishTask(null, error.message || String(error), token);
  }
}

async function finishTask(downloadId, reason = '', token = '') {
  const { job } = await chrome.storage.local.get('job');
  if (!job?.active) return;
  if (token && job.active.token !== token) return;
  if (downloadId !== null && job.active.id !== downloadId) return;
  const task = job.active.task;
  if (reason) job.failed.push({ ...task, reason });
  else job.completed++;
  job.cursor++;
  job.active = null;
  if (job.cursor >= job.tasks.length) job.status = 'done';
  await saveJob(job);
  if (job.status === 'done') await chrome.alarms.clear(ALARM);
  else if (job.status === 'running') await nextDownload();
}

async function checkActive() {
  const { job } = await chrome.storage.local.get('job');
  if (!job || job.status === 'done') {
    await chrome.alarms.clear(ALARM);
    return;
  }
  if (!job.active) {
    if (job.status === 'running') await nextDownload();
    return;
  }
  if (job.active.id === null) {
    if (Date.now() - job.active.startedAt > 60000) {
      await finishTask(null, '启动下载超时', job.active.token);
    }
    return;
  }
  const [item] = await chrome.downloads.search({ id: job.active.id });
  if (!item) return;
  if (item.state === 'interrupted') {
    await finishTask(item.id, item.error || '下载中断');
  } else if (item.state === 'complete') {
    const invalid = /^text\/html/i.test(item.mime || '');
    await finishTask(item.id, invalid ? '返回了网页，请检查登录状态' : '');
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    try {
      if (message?.type === 'MIC_START') {
        const tasks = message.tasks;
        if (!Array.isArray(tasks) || tasks.length < 1 || tasks.length > 250 ||
            tasks.some(task => !/^[A-Za-z0-9]+$/.test(task.id) ||
              !/^\d{4}-(0[1-9]|1[0-2])$/.test(task.month) ||
              typeof task.name !== 'string')) {
          throw new Error('下载范围无效。');
        }
        const { job: existing } = await chrome.storage.local.get('job');
        if (existing && existing.status !== 'done') throw new Error('已有下载任务，请完成或暂停后继续。');
        const job = { status: 'running', tasks, cursor: 0, completed: 0, failed: [], active: null };
        await saveJob(job);
        await chrome.alarms.create(ALARM, { periodInMinutes: 0.5 });
        sendResponse({ ok: true, job });
        await nextDownload();
        return;
      }
      if (message?.type === 'MIC_PAUSE' || message?.type === 'MIC_RESUME') {
        const { job } = await chrome.storage.local.get('job');
        if (!job || job.status === 'done') throw new Error('没有可继续的任务。');
        job.status = message.type === 'MIC_PAUSE' ? 'paused' : 'running';
        await saveJob(job);
        sendResponse({ ok: true, job });
        if (job.status === 'running') await nextDownload();
        return;
      }
      sendResponse({ ok: false, error: '未知操作。' });
    } catch (error) {
      sendResponse({ ok: false, error: error.message || String(error) });
    }
  })();
  return true;
});

chrome.downloads.onChanged.addListener(async delta => {
  if (delta.state?.current === 'interrupted' || delta.state?.current === 'complete') {
    await checkActive();
  }
});
chrome.alarms.onAlarm.addListener(async alarm => {
  if (alarm.name === ALARM) await checkActive();
});
