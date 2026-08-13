(function () {
  function beautifyFieldName(raw) {
    const customMap = {
      'your-name': 'Name',
      'your-email': 'Email',
      'your-phone': 'Phone',
      'your-subject': 'Subject',
      'your-message': 'Inquiry Message',
      'mfile-868': 'Attachment',
      'page-url': 'Source Page',

      'name': 'Name',
      'phone': 'Phone',
      'email': 'Email',
      'message': 'Inquiry Message',
      'url': 'Source Page',
      'country': 'Country',
      'ip': 'IP Address',
      'time': 'Submitted At',
      'ditch': 'Traffic Source',
      'device': 'Device',
    };

    const key = raw.toLowerCase();
    if (customMap[key]) return customMap[key];

    let cleaned = raw.replace(/^your-/i, '');
    cleaned = cleaned.replace(/[-_]/g, ' ');
    return cleaned
      .split(' ')
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ''))
      .join(' ');
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function extractData() {
    const fields = [];

    const container1 = document.querySelector('#wpcf7r_leads .inside');
    if (container1) {
      const wraps = container1.querySelectorAll('.field-wrap');
      wraps.forEach((wrap) => {
        const labelEl = wrap.querySelector('label strong');
        const inputEl = wrap.querySelector('input');
        if (labelEl && inputEl) {
          const rawName = labelEl.textContent.trim();
          fields.push({
            name: beautifyFieldName(rawName),
            rawName,
            value: inputEl.value,
          });
        }
      });
    }

    const container2 = document.querySelector(
      '#carbon_fields_container_ .inside, #normal-sortables .carbon-box .inside'
    );
    if (container2) {
      const carbonFields = container2.querySelectorAll('.carbon-field.carbon-html');
      carbonFields.forEach((field) => {
        const labelEl = field.querySelector('label');
        const valueEl = field.querySelector('.field-holder > div');
        if (labelEl && valueEl) {
          const rawName = labelEl.textContent.trim();
          const rawText = valueEl.textContent.trim();
          const prefixPattern = new RegExp(
            '^' + escapeRegExp(rawName) + '\\s*[:：]\\s*',
            'i'
          );
          const value = rawText.replace(prefixPattern, '');
          fields.push({
            name: beautifyFieldName(rawName),
            rawName,
            value,
          });
        }
      });
    }

    return fields;
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getData') {
      try {
        const fields = extractData();
        sendResponse({ fields, found: fields.length > 0 });
      } catch (err) {
        sendResponse({
          fields: [],
          found: false,
          error: err && err.message ? err.message : String(err),
        });
      }
    }
    return true;
  });
})();
