const bulkText = document.querySelector("#bulkText");
const fillButton = document.querySelector("#fill");
const clearButton = document.querySelector("#clear");
const extractButton = document.querySelector("#extract");
const pasteAndFillButton = document.querySelector("#pasteAndFill");
const progressWrap = document.querySelector("#progressWrap");
const progressLabel = progressWrap.querySelector(".progress-label");

function setProgress(active, message = "正在填充...") {
  progressLabel.textContent = message;
  progressWrap.hidden = !active;
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("没有找到当前页面");
  return tab;
}

async function sendToPage(type, payload = {}) {
  const tab = await getActiveTab();
  try {
    return await chrome.tabs.sendMessage(tab.id, { type, ...payload });
  } catch (error) {
    if (!/Receiving end does not exist|Could not establish connection/i.test(error.message)) {
      throw error;
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
    return chrome.tabs.sendMessage(tab.id, { type, ...payload });
  }
}

async function saveDraft() {
  await chrome.storage.local.set({ bulkTextDraft: bulkText.value });
}

chrome.storage.local.get("bulkTextDraft").then(({ bulkTextDraft }) => {
  if (bulkTextDraft) bulkText.value = bulkTextDraft;
});

bulkText.addEventListener("input", saveDraft);

fillButton.addEventListener("click", async () => {
  await fillFromText(bulkText.value);
});

extractButton.addEventListener("click", async () => {
  setButtonsDisabled(true);
  setProgress(true, "正在提取当前产品信息...");
  try {
    const result = await sendToPage("MIC_PRODUCT_INFO_EXTRACT");
    if (!result?.ok || !result?.data) {
      throw new Error(result?.error || "页面没有返回可提取的产品信息");
    }

    const text = JSON.stringify(result.data, null, 2);
    bulkText.value = text;
    await saveDraft();

    let copied = true;
    try {
      await navigator.clipboard.writeText(text);
    } catch (_error) {
      copied = false;
    }

    if (!copied) console.warn("MIC Product Assistant: copy failed; extracted text remains in the popup textarea.");
  } catch (error) {
    console.error("MIC Product Assistant: extract failed", error);
  } finally {
    setProgress(false);
    setButtonsDisabled(false);
  }
});

clearButton.addEventListener("click", async () => {
  bulkText.value = "";
  await saveDraft();
  bulkText.focus();
});

pasteAndFillButton.addEventListener("click", async () => {
  setProgress(true, "正在读取剪贴板...");
  try {
    const text = await navigator.clipboard.readText();
    bulkText.value = text;
    await saveDraft();
    await fillFromText(text);
  } catch (error) {
    console.error("MIC Product Assistant: clipboard read failed", error);
    setProgress(false);
  }
});

async function fillFromText(text) {
  if (!text.trim()) {
    setProgress(false);
    return;
  }

  if (looksLikeExtractedContext(text)) {
    setProgress(false);
    return;
  }

  setButtonsDisabled(true);
  setProgress(true, "正在填充...");

  try {
    await sendToPage("MIC_BULK_FILL_APPLY", { text });
  } catch (error) {
    console.error("MIC Product Assistant: fill failed", error);
  } finally {
    setProgress(false);
    setButtonsDisabled(false);
  }
}

function looksLikeExtractedContext(text) {
  try {
    return JSON.parse(text)?.schema === "mic-product-edit-context/v1";
  } catch (_error) {
    return false;
  }
}

function setButtonsDisabled(disabled) {
  [extractButton, fillButton, clearButton, pasteAndFillButton].forEach((button) => {
    button.disabled = disabled;
  });
}
