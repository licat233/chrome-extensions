const locationText = document.querySelector('#location');
const statusText = document.querySelector('#status');
const chooseButton = document.querySelector('#choose');
const authorizeButton = document.querySelector('#authorize');
let selectedDirectory = null;
let locked = false;

async function refresh() {
  selectedDirectory = await DirectoryStore.get();
  const { job } = await chrome.storage.local.get('job');
  locked = Boolean(job?.id && job.status !== 'done');
  chooseButton.disabled = locked;
  if (!selectedDirectory) {
    locationText.textContent = '尚未选择文件夹';
    statusText.textContent = locked ? '任务尚未结束，请先继续完成任务。' : '请选择保存位置。';
    authorizeButton.hidden = true;
    return;
  }
  const permission = await selectedDirectory.queryPermission({ mode: 'readwrite' });
  locationText.textContent = selectedDirectory.name;
  authorizeButton.hidden = permission === 'granted';
  statusText.textContent = permission === 'granted'
    ? (locked ? '已授权。当前任务结束后可更改保存位置。' : '已授权，请切回 MIC 页面并打开插件。')
    : '需要重新授权该文件夹后才能继续下载。';
}

chooseButton.addEventListener('click', async () => {
  try {
    const handle = await window.showDirectoryPicker({ mode: 'readwrite', id: 'mic-keyword-save' });
    const { job } = await chrome.storage.local.get('job');
    if (job?.id && job.status !== 'done') {
      statusText.textContent = '下载任务正在进行或已暂停，完成后才能更改保存位置。';
      return;
    }
    await DirectoryStore.set(handle);
    await refresh();
  } catch (error) {
    if (error.name !== 'AbortError') statusText.textContent = `选择失败：${error.message || error}`;
  }
});
authorizeButton.addEventListener('click', async () => {
  try {
    const permission = await selectedDirectory.requestPermission({ mode: 'readwrite' });
    if (permission !== 'granted') { statusText.textContent = '未获得文件夹写入权限。'; return; }
    await refresh();
  } catch (error) { statusText.textContent = `授权失败：${error.message || error}`; }
});
chrome.storage.onChanged.addListener((changes, area) => { if (area === 'local' && changes.job) refresh(); });
refresh().catch(error => { statusText.textContent = `读取设置失败：${error.message || error}`; });
