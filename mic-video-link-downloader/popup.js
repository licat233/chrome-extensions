let currentResults = [];
let preferredFolder = "";

document.addEventListener("DOMContentLoaded", initPopup);

async function initPopup() {
  await loadPreferredFolder();
  bindFolderInput();
  scanActiveTab();
}

async function loadPreferredFolder() {
  const items = await chrome.storage.local.get(["preferredFolder"]);
  preferredFolder = items.preferredFolder || "";
  const input = document.querySelector("#folderName");
  input.value = preferredFolder || "MIC Course Videos";
}

function bindFolderInput() {
  const input = document.querySelector("#folderName");
  if (!input || input.dataset.bound === "true") {
    return;
  }
  input.dataset.bound = "true";
  input.addEventListener("input", () => {
    preferredFolder = input.value.trim();
    chrome.storage.local.set({ preferredFolder });
  });
}

async function scanActiveTab() {
  setStatus("Scanning current tab...");
  setBatch([], true);
  setListMessage("正在读取当前课程页的视频信息...", true);

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.id) {
      throw new Error("No active tab found.");
    }

    const scanData = await withTimeout(scanTab(tab.id), 15000, "扫描超时，请刷新课程页后再试。");

    currentResults = scanData.results || [];
    if (!preferredFolder && scanData.courseName) {
      preferredFolder = scanData.courseName;
      document.querySelector("#folderName").value = preferredFolder;
    }
    setStatus(`${scanData.courseName || "Course"} · ${currentResults.length} video item(s)`);
    renderResults(currentResults);
  } catch (error) {
    currentResults = [];
    setBatch([]);
    setStatus("No videos detected.");
    setListMessage(error.message || "请打开 Made-in-China 课程页后刷新页面，再点击扩展图标。");
  }
}

async function scanTab(tabId) {
  const injection = await chrome.scripting.executeScript({
    target: { tabId },
    func: extractCourseDataFromPage
  });
  const course = injection && injection[0] ? injection[0].result : null;

  if (!course) {
    throw new Error("没有从当前页面读取到课程数据。");
  }
  if (course.error) {
    throw new Error(course.error);
  }
  if (!course.mediaList || !course.mediaList.length) {
    throw new Error("当前页面没有可识别的视频 ID。");
  }

  const results = await Promise.all(course.mediaList.map((item) => fetchVideoResult(course, item)));
  await chrome.storage.local.set({ lastResults: results });

  return {
    pageUrl: course.pageUrl,
    courseName: course.courseName,
    results
  };
}

function extractCourseDataFromPage() {
  const APP_ID_FALLBACK = "1252594874";

  try {
    const ssrScript = document.querySelector("script#ssrData");
    if (!ssrScript) {
      return { error: "当前页没有找到课程数据。请确认正在 Made-in-China 课程详情页，并刷新页面。" };
    }

    const ssrData = JSON.parse(ssrScript.textContent.trim());
    const courseId = ssrData.courseId || "";
    const detail = ssrData.courseDetail && ssrData.courseDetail.data ? ssrData.courseDetail.data : {};
    const mediaList = Array.isArray(detail.mediaList) ? detail.mediaList : [];
    const appId = findAppIdInPage() || APP_ID_FALLBACK;

    return {
      appId,
      courseId,
      pageUrl: window.location.href,
      courseName: detail.name || document.title || "MIC course",
      coverUrl: detail.coverUrl || "",
      mediaList: mediaList
        .filter((item) => item && item.cloudMediaId)
        .map((item, index) => ({
          index,
          mediaId: item.mediaId || "",
          mediaNum: item.mediaNum || index + 1,
          title: item.title || `Video ${index + 1}`,
          playTime: item.playTime || 0,
          fileId: item.cloudMediaId
        }))
    };
  } catch (error) {
    return { error: error.message || "读取课程数据失败。" };
  }

  function findAppIdInPage() {
    const html = document.documentElement.innerHTML;
    const candidates = [
      html.match(/appID["']?\s*[:=]\s*["']?(\d{6,})/i),
      html.match(/appId["']?\s*[:=]\s*["']?(\d{6,})/i)
    ];
    const hit = candidates.find(Boolean);
    return hit ? hit[1] : "";
  }
}

async function fetchVideoResult(course, item) {
  const response = await chrome.runtime.sendMessage({
    type: "MIC_GET_PLAY_INFO",
    appId: course.appId,
    fileId: item.fileId
  });

  if (!response || !response.ok) {
    throw new Error(response && response.error ? response.error : `Failed to fetch ${item.title}`);
  }

  return {
    ...item,
    appId: course.appId,
    courseId: course.courseId,
    courseName: course.courseName,
    playInfo: response.data
  };
}

function withTimeout(promise, timeoutMs, message) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function renderResults(results) {
  const list = document.querySelector("#list");
  list.innerHTML = "";
  setBatch(results);

  if (!results.length) {
    setListMessage("暂无结果。");
    return;
  }

  results.forEach((result) => list.appendChild(renderItem(result)));
}

function setBatch(results, loading = false) {
  const batch = document.querySelector("#batch");
  const folder = getDownloadFolder(results);

  batch.innerHTML = "";

  const mp4Items = buildBatchItems(results, "mp4", folder);
  const hlsItems = buildBatchItems(results, "m3u8", folder);
  const allLinks = results.map((result) => linkLinesForResult(result).join("\n")).filter(Boolean).join("\n\n");

  batch.appendChild(makeFolderRow());
  batch.appendChild(makeButton(loading ? "Scanning MP4..." : `All MP4 (${mp4Items.length})`, () => batchDownload(mp4Items, "MP4"), "batch"));
  batch.appendChild(makeButton(loading ? "Scanning m3u8..." : `All m3u8 (${hlsItems.length})`, () => batchDownload(hlsItems, "m3u8"), "batch"));
  batch.appendChild(makeButton("Copy All Links", () => copyText(allLinks), "secondary"));

  batch.children[1].disabled = loading || !mp4Items.length;
  batch.children[2].disabled = loading || !hlsItems.length;
  batch.children[3].disabled = loading || !allLinks;
  bindFolderInput();
}

function makeFolderRow() {
  const row = document.createElement("div");
  row.className = "folder-row";
  row.innerHTML = `
    <label class="folder-label" for="folderName">保存到下载目录下的子文件夹</label>
    <input id="folderName" type="text" value="${escapeHtml(preferredFolder || "MIC Course Videos")}" spellcheck="false">
  `;
  return row;
}

function renderItem(result) {
  const source = result.playInfo && result.playInfo.sourceVideo;
  const bestHls = result.playInfo && result.playInfo.hlsList && result.playInfo.hlsList[0];
  const lines = linkLinesForResult(result);

  const item = document.createElement("article");
  item.className = "item";
  item.innerHTML = `
    <div class="title">${escapeHtml(result.mediaNum)}. ${escapeHtml(result.title)}</div>
    <div class="meta">
      fileID ${escapeHtml(result.fileId)}
      ${source ? ` · MP4 ${formatSize(source.size)} ${source.width || ""}x${source.height || ""}` : ""}
    </div>
    <div class="actions"></div>
    <textarea readonly>${escapeHtml(lines.join("\n"))}</textarea>
  `;

  const actions = item.querySelector(".actions");
  if (source && source.url) {
    actions.appendChild(makeButton("Download MP4", () => download(result, source.url, "mp4")));
    actions.appendChild(makeButton("Copy MP4", () => copyText(source.url), "secondary"));
  }

  if (bestHls && bestHls.url) {
    actions.appendChild(makeButton("Download m3u8", () => download(result, bestHls.url, "m3u8")));
    actions.appendChild(makeButton("Copy m3u8", () => copyText(bestHls.url), "secondary"));
  }

  actions.appendChild(makeButton("Copy All", () => copyText(lines.join("\n")), "secondary"));
  return item;
}

function makeButton(label, onClick, className = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  if (className) {
    button.className = className;
  }
  button.addEventListener("click", onClick);
  return button;
}

function linkLinesForResult(result) {
  const source = result.playInfo && result.playInfo.sourceVideo;
  const bestHls = result.playInfo && result.playInfo.hlsList && result.playInfo.hlsList[0];
  const lines = [];

  if (source && source.url) {
    lines.push(`MP4: ${source.url}`);
  }

  if (bestHls && bestHls.url) {
    lines.push(`m3u8: ${bestHls.url}`);
  }

  return lines;
}

function buildBatchItems(results, extension, folder = getDownloadFolder(results)) {
  return results
    .map((result) => {
      const source = result.playInfo && result.playInfo.sourceVideo;
      const bestHls = result.playInfo && result.playInfo.hlsList && result.playInfo.hlsList[0];
      const url = extension === "mp4" ? source && source.url : bestHls && bestHls.url;

      if (!url) {
        return null;
      }

      return {
        url,
        filename: `${folder}/${result.mediaNum}. ${result.title}.${extension}`
      };
    })
    .filter(Boolean);
}

function getDownloadFolder(results = currentResults) {
  const input = document.querySelector("#folderName");
  const value = input ? input.value.trim() : preferredFolder;
  if (value) {
    return value;
  }
  if (results.length && results[0].courseName) {
    return results[0].courseName;
  }
  return "MIC Course Videos";
}

async function batchDownload(items, label) {
  if (!items.length) {
    setStatus(`No ${label} links to download.`);
    return;
  }

  setStatus(`Starting ${items.length} ${label} download(s)...`);
  const response = await chrome.runtime.sendMessage({
    type: "MIC_BATCH_DOWNLOAD",
    items
  });

  if (!response || !response.ok) {
    setStatus(response && response.error ? response.error : "Batch download failed.");
    return;
  }

  setStatus(`Started ${response.data.startedCount} ${label} download(s).`);
}

async function download(result, url, extension) {
  const filename = `${getDownloadFolder([result])}/${result.mediaNum}. ${result.title}.${extension}`;
  const response = await chrome.runtime.sendMessage({
    type: "MIC_DOWNLOAD_URL",
    url,
    filename
  });

  if (!response || !response.ok) {
    setStatus(response && response.error ? response.error : "Download failed.");
    return;
  }

  setStatus("Download started.");
}

async function copyText(text) {
  await navigator.clipboard.writeText(text);
  setStatus("Copied.");
}

function setStatus(text) {
  document.querySelector("#status").textContent = text;
}

function setListMessage(text, loading = false) {
  const className = loading ? "placeholder" : "empty";
  document.querySelector("#list").innerHTML = `<p class="${className}">${escapeHtml(text)}</p>`;
}

function formatSize(bytes) {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit ? 1 : 0)} ${units[unit]}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
