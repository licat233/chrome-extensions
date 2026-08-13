document.addEventListener('DOMContentLoaded', async () => {
  const contentEl = document.getElementById('content');
  const footerEl = document.getElementById('footer');
  const emptyStateEl = document.getElementById('empty-state');
  const emptyMessageEl = document.getElementById('empty-message');
  const emptyIconEl = document.getElementById('empty-icon');
  const copyBtn = document.getElementById('copy-all');
  const screenshotBtn = document.getElementById('screenshot');
  const wechatBtn = document.getElementById('wechat-share');
  const formatSelect = document.getElementById('format');

  let currentFields = [];

  function normalizeField(field) {
    const rawName = String(field?.rawName ?? field?.name ?? '');
    const name = String(field?.name ?? (rawName || 'Field'));
    const value = String(field?.value ?? '');
    return { ...field, name, rawName, value };
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const tabUrl = tab?.url || '';

    if (!tab || tabUrl.startsWith('chrome://') || tabUrl.startsWith('edge://')) {
      emptyMessageEl.textContent = 'Cannot access this page.';
      emptyStateEl.className = 'error animate__animated animate__shakeX';
      emptyIconEl.className = 'fa-solid fa-circle-exclamation empty-icon';
      return;
    }

    chrome.tabs.sendMessage(tab.id, { action: 'getData' }, (response) => {
      if (chrome.runtime.lastError) {
        emptyMessageEl.textContent = chrome.runtime.lastError.message || 'Cannot read this page.';
        emptyStateEl.className = 'error animate__animated animate__shakeX';
        emptyIconEl.className = 'fa-solid fa-circle-xmark empty-icon';
        return;
      }

      if (response?.error) {
        emptyMessageEl.textContent = `Failed to extract data: ${response.error}`;
        emptyStateEl.className = 'error animate__animated animate__shakeX';
        emptyIconEl.className = 'fa-solid fa-triangle-exclamation empty-icon';
        return;
      }

      const fields = Array.isArray(response?.fields)
        ? response.fields.map(normalizeField)
        : [];

      if (!response || !response.found || fields.length === 0) {
        emptyMessageEl.textContent = 'No form data found on this page.';
        emptyStateEl.className = 'error animate__animated animate__shakeX';
        emptyIconEl.className = 'fa-solid fa-circle-xmark empty-icon';
        return;
      }

      currentFields = fields;
      emptyStateEl.style.display = 'none';
      footerEl.style.display = 'flex';

      const list = document.createElement('div');
      list.className = 'field-list';

      currentFields.forEach((field, index) => {
        const item = document.createElement('div');
        item.className = 'field-item animate__animated animate__fadeInUp';

        const label = document.createElement('div');
        label.className = 'field-label';

        const iconEl = document.createElement('i');
        iconEl.className = `fa-solid ${getFieldIcon(field.name)}`;
        label.appendChild(iconEl);

        const textEl = document.createElement('span');
        textEl.textContent = field.name;
        label.appendChild(textEl);

        item.appendChild(label);

        const isLong = field.value.length > 80;
        const displayText =
          field.value.length > 100 ? field.value.slice(0, 100) + '...' : field.value;

        const display = document.createElement('div');
        display.className = 'field-display';
        display.textContent = displayText;
        display.title = field.value;
        item.appendChild(display);

        const editor = document.createElement(isLong ? 'textarea' : 'input');
        editor.className = 'field-editor';
        if (isLong) editor.rows = 3;
        else editor.type = 'text';
        editor.value = field.value;
        item.appendChild(editor);

        const enterEdit = () => {
          display.style.display = 'none';
          editor.style.display = 'block';
          editor.focus();
        };

        const exitEdit = () => {
          currentFields[index].value = editor.value;
          const newText =
            editor.value.length > 100
              ? editor.value.slice(0, 100) + '...'
              : editor.value;
          display.textContent = newText;
          display.title = editor.value;
          editor.style.display = 'none';
          display.style.display = 'block';
        };

        display.addEventListener('click', enterEdit);

        editor.addEventListener('blur', exitEdit);
        editor.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            editor.blur();
          }
          if (!isLong && e.key === 'Enter') {
            e.preventDefault();
            editor.blur();
          }
        });

        list.appendChild(item);
      });

      contentEl.appendChild(list);
    });
  } catch (err) {
    emptyMessageEl.textContent = 'Failed to load data.';
    emptyStateEl.className = 'error animate__animated animate__shakeX';
    emptyIconEl.className = 'fa-solid fa-triangle-exclamation empty-icon';
  }

  function getFieldIcon(name) {
    const n = name.toLowerCase();
    if (/\b(name|full.?name|first.?name|last.?name|given.?name|family.?name)\b/.test(n)) return 'fa-user';
    if (/\b(email|e-mail|mail)\b/.test(n)) return 'fa-envelope';
    if (/\b(phone|tel|mobile|cell|telephone|fax)\b/.test(n)) return 'fa-phone';
    if (/\b(company|organization|firm|org|business)\b/.test(n)) return 'fa-building';
    if (/\b(message|inquiry|comment|note|description|detail|question|feedback)\b/.test(n)) return 'fa-comment-dots';
    if (/\b(subject|topic|title|re)\b/.test(n)) return 'fa-tag';
    if (/\b(address|street|location|addr)\b/.test(n)) return 'fa-location-dot';
    if (/\b(country|nation|region)\b/.test(n)) return 'fa-earth-americas';
    if (/\b(city|town)\b/.test(n)) return 'fa-city';
    if (/\b(state|province)\b/.test(n)) return 'fa-map';
    if (/\b(zip|postal|postcode)\b/.test(n)) return 'fa-envelopes-bulk';
    if (/\b(website|url|site|domain|homepage)\b/.test(n)) return 'fa-link';
    if (/\b(quantity|amount|number|count|qty)\b/.test(n)) return 'fa-hashtag';
    if (/\b(date|day|birthday|dob)\b/.test(n)) return 'fa-calendar-days';
    if (/\b(time|hour)\b/.test(n)) return 'fa-clock';
    if (/\b(file|attachment|upload|document)\b/.test(n)) return 'fa-paperclip';
    if (/\b(budget|price|cost|amount|fee)\b/.test(n)) return 'fa-dollar-sign';
    if (/\b(industry|sector|field)\b/.test(n)) return 'fa-industry';
    if (/\b(job|title|position|role|occupation)\b/.test(n)) return 'fa-briefcase';
    if (/\b(product|item|sku|model)\b/.test(n)) return 'fa-box';
    if (/\b(project|campaign)\b/.test(n)) return 'fa-diagram-project';
    if (/\b(priority|urgent)\b/.test(n)) return 'fa-flag';
    if (/\b(status|stage|progress)\b/.test(n)) return 'fa-chart-simple';
    return 'fa-circle-info';
  }

  function formatText(fields) {
    const title = '🛡️ ARMOR Inquiry';
    const line = '━'.repeat(35);

    const body = fields
      .map((f) => {
        const indentedValue = f.value.replace(/\n/g, '\n    ');
        return `▸ ${f.name}\n    ${indentedValue}`;
      })
      .join('\n\n');

    return `${title}\n${line}\n\n${body}`;
  }

  function formatJson(fields) {
    const obj = {};
    fields.forEach((f) => {
      if (obj[f.name] === undefined) {
        obj[f.name] = f.value;
      } else if (Array.isArray(obj[f.name])) {
        obj[f.name].push(f.value);
      } else {
        obj[f.name] = [obj[f.name], f.value];
      }
    });
    return JSON.stringify(obj, null, 2);
  }

  function formatMarkdown(fields) {
    return fields.map((f) => `- **${f.name}**: ${f.value}`).join('\n');
  }

  function setButtonFeedback(button, text, animation) {
    const label = button.querySelector('.btn-label');
    const original = label.textContent;
    label.textContent = text;
    button.classList.add('animate__animated', animation);
    setTimeout(() => {
      label.textContent = original;
      button.classList.remove('animate__animated', animation);
    }, 1500);
  }

  copyBtn.addEventListener('click', async () => {
    const format = formatSelect.value;
    let text;
    if (format === 'json') {
      text = formatJson(currentFields);
    } else if (format === 'markdown') {
      text = formatMarkdown(currentFields);
    } else {
      text = formatText(currentFields);
    }

    try {
      await navigator.clipboard.writeText(text);
      setButtonFeedback(copyBtn, 'Copied!', 'animate__pulse');
    } catch (err) {
      setButtonFeedback(copyBtn, 'Failed', 'animate__shakeX');
    }
  });

  async function openWeChat() {
    if (!chrome.tabs?.create) {
      window.open('weixin://', '_blank');
      return true;
    }

    return new Promise((resolve) => {
      chrome.tabs.create({ url: 'weixin://' }, () => {
        resolve(!chrome.runtime.lastError);
      });
    });
  }

  wechatBtn.addEventListener('click', async () => {
    if (currentFields.length === 0) return;

    try {
      await navigator.clipboard.writeText(formatText(currentFields));
      const opened = await openWeChat();
      setButtonFeedback(wechatBtn, opened ? 'Copied!' : 'Copied', 'animate__pulse');
    } catch (err) {
      setButtonFeedback(wechatBtn, 'Failed', 'animate__shakeX');
    }
  });

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function wrapText(ctx, text, maxWidth) {
    const lines = [];
    let currentLine = '';
    for (let i = 0; i < text.length; i++) {
      const testLine = currentLine + text[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine);
        currentLine = text[i];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  async function captureScreenshot(fields) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const dpr = 2;
    const width = 480;
    const pad = 28;
    const labelH = 16;
    const valueLineH = 20;
    const gap = 16;

    // measure total height
    ctx.font = 'bold 18px sans-serif';
    let totalH = pad + 28 + 16 + pad; // title area

    ctx.font = '11px sans-serif';
    fields.forEach((field) => {
      totalH += labelH;
      ctx.font = '13px sans-serif';
      const lines = wrapText(ctx, field.value, width - pad * 2);
      totalH += lines.length * valueLineH;
      totalH += gap;
      ctx.font = '11px sans-serif';
    });
    totalH += pad - gap;

    canvas.width = width * dpr;
    canvas.height = totalH * dpr;
    ctx.scale(dpr, dpr);

    // background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, totalH);

    // top accent bar
    ctx.fillStyle = '#55A7E9';
    ctx.fillRect(0, 0, width, 4);

    // title
    ctx.fillStyle = '#0F1B2E';
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText('ARMOR Inquiry', pad, pad + 18);

    // divider
    ctx.strokeStyle = '#E1ECF5';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, pad + 28);
    ctx.lineTo(width - pad, pad + 28);
    ctx.stroke();

    let y = pad + 28 + 20;
    fields.forEach((field) => {
      // label background (pill)
      const labelText = field.name.toUpperCase();
      ctx.font = '600 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const labelWidth = ctx.measureText(labelText).width;
      const pillPadX = 10;
      const pillPadY = 4;
      const pillH = 14 + pillPadY * 2;
      const pillW = labelWidth + pillPadX * 2;
      const pillRadius = 10;

      ctx.fillStyle = '#E8F5FF';
      roundRect(ctx, pad - pillPadX, y - 14 - pillPadY, pillW, pillH, pillRadius);
      ctx.fill();

      ctx.fillStyle = '#55A7E9';
      ctx.fillText(labelText, pad, y);
      y += labelH + 4;

      // value
      ctx.fillStyle = '#4A6175';
      ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const lines = wrapText(ctx, field.value, width - pad * 2);
      lines.forEach((line) => {
        ctx.fillText(line, pad, y);
        y += valueLineH;
      });
      y += gap;
    });

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      return true;
    } catch (err) {
      return false;
    }
  }

  screenshotBtn.addEventListener('click', async () => {
    if (currentFields.length === 0) return;
    const success = await captureScreenshot(currentFields);
    setButtonFeedback(
      screenshotBtn,
      success ? 'Copied!' : 'Failed',
      success ? 'animate__pulse' : 'animate__shakeX'
    );
  });
});
