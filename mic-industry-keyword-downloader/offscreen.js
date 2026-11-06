let running = false;
let pending = false;

function safeName(value) {
  return String(value).replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/\.\./g, '_').replace(/\s+/g, ' ').trim().replace(/[. ]+$/g, '').slice(0, 85) || '行业';
}
async function getJob() {
  const response = await chrome.runtime.sendMessage({ type: 'MIC_GET_JOB' });
  if (!response?.ok) throw new Error(response?.error || '无法读取任务。');
  return response.job;
}
async function run() {
  let job = await getJob();
  if (!job?.id || job.status !== 'running') return;
  const jobId = job.id;
  const directory = await DirectoryStore.get();
  if (!directory || await directory.queryPermission({ mode: 'readwrite' }) !== 'granted') {
    throw new Error('保存位置尚未授权。请打开“设置保存路径”重新授权后继续。');
  }
  const batchDir = await directory.getDirectoryHandle(job.folderName, { create: true });
  while (job.status === 'running' && job.cursor < job.tasks.length) {
    const index = job.cursor;
    const task = job.tasks[index];
    let data;
    let error = '';
    try {
      const query = new URLSearchParams({ date: task.month, catelog: task.id, areaParam: '2', region: '' });
      const response = await fetch(`https://data.made-in-china.com/industry/hot/word/download?${query}`, { credentials: 'include', signal: AbortSignal.timeout(90000) });
      if (response.status === 401 || response.status === 403) throw new Error('AUTH_REQUIRED');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      data = await response.blob();
      const signature = new Uint8Array(await data.slice(0, 4).arrayBuffer());
      if (signature.length < 4 || signature[0] !== 0x50 || signature[1] !== 0x4b) throw new Error('AUTH_REQUIRED');
    } catch (err) {
      if (err.message === 'AUTH_REQUIRED') throw new Error('MIC 返回的内容不是报表，请检查登录状态后继续。');
      error = err.message || String(err);
    }
    if (!error) {
      const monthDir = await batchDir.getDirectoryHandle(task.month, { create: true });
      const file = await monthDir.getFileHandle(`${safeName(task.name)}_${task.id}_${task.month}.xlsx`, { create: true });
      const writable = await file.createWritable();
      try { await writable.write(data); await writable.close(); }
      catch (err) { try { await writable.abort(); } catch (_) {} throw new Error(`保存文件失败：${err.message || String(err)}`); }
    }
    const result = await chrome.runtime.sendMessage({ type: 'MIC_RESULT', jobId, index, error });
    if (!result?.ok) throw new Error(result?.error || '无法更新下载进度。');
    job = await getJob();
    if (!job || job.id !== jobId) return;
  }
}
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== 'MIC_OFFSCREEN_RUN') return;
  sendResponse({ ok: true });
  if (running) { pending = true; return; }
  startRunner();
});
function startRunner() {
  running = true;
  (async () => {
    try { await run(); }
    catch (error) {
      try { const job = await getJob(); if (job?.status === 'running') await chrome.runtime.sendMessage({ type: 'MIC_RUN_ERROR', jobId: job.id, error: error.message || String(error) }); } catch (_) {}
    } finally {
      running = false;
      if (pending) { pending = false; startRunner(); }
    }
  })();
}
