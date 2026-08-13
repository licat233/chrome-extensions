const DEFAULT_APP_ID = "1252594874";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message.type !== "string") {
    return false;
  }

  if (message.type === "MIC_GET_PLAY_INFO") {
    getPlayInfo(message.appId || DEFAULT_APP_ID, message.fileId)
      .then((data) => sendResponse({ ok: true, data }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "MIC_DOWNLOAD_URL") {
    downloadUrl(message.url, message.filename)
      .then((downloadId) => sendResponse({ ok: true, downloadId }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "MIC_BATCH_DOWNLOAD") {
    batchDownload(message.items || [])
      .then((data) => sendResponse({ ok: true, data }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message.type === "MIC_GET_LAST_RESULTS") {
    chrome.storage.local.get(["lastResults"], (items) => {
      sendResponse({ ok: true, data: items.lastResults || [] });
    });
    return true;
  }

  return false;
});

async function getPlayInfo(appId, fileId) {
  if (!fileId) {
    throw new Error("Missing Tencent VOD fileId.");
  }

  const url = `https://playvideo.qcloud.com/getplayinfo/v4/${encodeURIComponent(appId)}/${encodeURIComponent(fileId)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Play info request failed: ${response.status}`);
  }

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(data.message || `Tencent VOD returned code ${data.code}`);
  }

  return normalizePlayInfo(data, appId, fileId);
}

function normalizePlayInfo(data, appId, fileId) {
  const videoInfo = data.videoInfo || {};
  const source = videoInfo.sourceVideo || {};
  const transcodes = Array.isArray(videoInfo.transcodeList) ? videoInfo.transcodeList : [];

  const hlsList = transcodes
    .filter((item) => item && item.url && /m3u8/i.test(item.url))
    .map((item) => ({
      url: item.url,
      definition: item.definition || "",
      templateName: item.templateName || "",
      duration: item.duration || source.duration || 0,
      width: item.width || 0,
      height: item.height || 0,
      size: item.size || item.totalSize || 0,
      bitrate: item.bitrate || 0
    }));

  return {
    appId,
    fileId,
    name: (videoInfo.basicInfo && videoInfo.basicInfo.name) || fileId,
    coverUrl: data.coverInfo && data.coverInfo.coverUrl,
    sourceVideo: source.url
      ? {
          url: source.url,
          duration: source.duration || 0,
          width: source.width || 0,
          height: source.height || 0,
          size: source.size || source.totalSize || 0,
          bitrate: source.bitrate || 0,
          container: source.container || ""
        }
      : null,
    hlsList
  };
}

async function downloadUrl(url, filename) {
  if (!url) {
    throw new Error("Missing download URL.");
  }

  const options = {
    url,
    saveAs: true
  };

  if (filename) {
    options.filename = sanitizeDownloadPath(filename);
  }

  return await chrome.downloads.download(options);
}

async function batchDownload(items) {
  if (!Array.isArray(items) || !items.length) {
    throw new Error("No download items.");
  }

  const results = [];
  for (const item of items) {
    if (!item || !item.url) {
      continue;
    }

    const options = {
      url: item.url,
      saveAs: false,
      conflictAction: "uniquify"
    };

    if (item.filename) {
      options.filename = sanitizeDownloadPath(item.filename);
    }

    const downloadId = await chrome.downloads.download(options);
    results.push({ downloadId, url: item.url, filename: options.filename || "" });
  }

  return {
    requestedCount: items.length,
    startedCount: results.length,
    results
  };
}

function sanitizeDownloadPath(filename) {
  return String(filename)
    .split("/")
    .map((part) => sanitizePathPart(part))
    .filter(Boolean)
    .join("/")
    .slice(0, 240);
}

function sanitizePathPart(part) {
  return String(part)
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}
