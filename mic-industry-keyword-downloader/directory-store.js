const DirectoryStore = {
  async open() {
    return await new Promise((resolve, reject) => {
      const request = indexedDB.open('mic-download-settings', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('settings');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  async get() {
    const db = await this.open();
    try {
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction('settings', 'readonly');
        const request = transaction.objectStore('settings').get('directory');
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } finally { db.close(); }
  },
  async set(handle) {
    const db = await this.open();
    try {
      await new Promise((resolve, reject) => {
        const transaction = db.transaction('settings', 'readwrite');
        transaction.objectStore('settings').put(handle, 'directory');
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error || new Error('保存设置失败'));
      });
    } finally { db.close(); }
  }
};
