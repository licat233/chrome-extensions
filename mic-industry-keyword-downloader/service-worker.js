const ALARM = 'mic-download-watch';

async function saveJob(job) {
  await chrome.storage.local.set({ job });
  await chrome.action.setBadgeBackgroundColor({ color: job.failed.length && job.status === 'done' ? '#b52b33' : '#1677d2' });
  await chrome.action.setBadgeText({ text: job.status === 'done' ? (job.failed.length ? '!' : '') : `${job.cursor}/${job.tasks.length}`.slice(0, 4) });
}

async function ensureRunner() {
  const { job } = await chrome.storage.local.get('job');
  if (!job?.id || job.status !== 'running') return;
  if (!(await chrome.offscreen.hasDocument())) {
    try {
      await chrome.offscreen.createDocument({ url: 'offscreen.html', reasons: ['BLOBS'], justification: '读取 MIC 返回的报表并将 Blob 保存到用户选择的文件夹。' });
    } catch (error) {
      if (!(await chrome.offscreen.hasDocument())) throw error;
    }
  }
  await chrome.runtime.sendMessage({ type: 'MIC_OFFSCREEN_RUN' });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const types = ['MIC_START', 'MIC_PAUSE', 'MIC_RESUME', 'MIC_GET_JOB', 'MIC_RESULT', 'MIC_RUN_ERROR'];
  if (!types.includes(message?.type)) return;
  navigator.locks.request('mic-keyword-job', async () => {
    try {
      let { job } = await chrome.storage.local.get('job');
      if (message.type === 'MIC_GET_JOB') { sendResponse({ ok: true, job }); return; }
      if (message.type === 'MIC_START') {
        const tasks = message.tasks;
        if (!Array.isArray(tasks) || !tasks.length || tasks.length > 250 || tasks.some(t => !/^[A-Za-z0-9]+$/.test(t.id) || !/^\d{4}-(0[1-9]|1[0-2])$/.test(t.month) || typeof t.name !== 'string')) throw new Error('下载范围无效。');
        if (job?.id && job.status !== 'done') throw new Error('已有下载任务，请先完成该任务。');
        const id = crypto.randomUUID();
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        job = { id, folderName: `MIC行业关键词_${stamp}_${id.slice(0, 8)}`, status: 'running', tasks, cursor: 0, completed: 0, failed: [], active: null };
        await saveJob(job);
        await chrome.alarms.create(ALARM, { periodInMinutes: 0.5 });
        try { await ensureRunner(); } catch (error) { job.status = 'paused'; job.error = `无法启动后台任务：${error.message}`; await saveJob(job); }
        sendResponse({ ok: true, job }); return;
      }
      if (!job?.id) throw new Error('没有可继续的任务。');
      if (message.type === 'MIC_PAUSE' || message.type === 'MIC_RESUME') {
        if (job.status === 'done') throw new Error('任务已经结束。');
        job.status = message.type === 'MIC_PAUSE' ? 'paused' : 'running';
        job.error = '';
        await saveJob(job);
        if (job.status === 'running') {
          try { await ensureRunner(); } catch (error) { job.status = 'paused'; job.error = `无法启动后台任务：${error.message}`; await saveJob(job); }
        }
        sendResponse({ ok: true, job }); return;
      }
      if (message.jobId !== job.id) throw new Error('任务已更换。');
      if (message.type === 'MIC_RESULT' && message.index === job.cursor) {
        const task = job.tasks[job.cursor];
        if (message.error) job.failed.push({ ...task, reason: message.error }); else job.completed++;
        job.cursor++; job.active = null;
        if (job.cursor >= job.tasks.length) { job.status = 'done'; await chrome.alarms.clear(ALARM); }
        await saveJob(job);
      } else if (message.type === 'MIC_RUN_ERROR') {
        job.status = 'paused'; job.error = message.error || '任务中断，请点击继续。'; await saveJob(job);
      }
      sendResponse({ ok: true, job });
    } catch (error) { sendResponse({ ok: false, error: error.message || String(error) }); }
  });
  return true;
});
chrome.alarms.onAlarm.addListener(async alarm => {
  if (alarm.name === ALARM) { try { await ensureRunner(); } catch (_) {} }
});
