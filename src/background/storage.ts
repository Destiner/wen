interface ProviderData {
  mnemonic: string | null;
}

const KEY_PROVIDER = 'provider';

class Storage {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'wen';
  private readonly storeName = 'provider';
  private readonly version = 1;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = (): void => reject(request.error);
      request.onsuccess = (): void => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event): void => {
        const db = (event.target as IDBOpenDBRequest).result;
        db.createObjectStore(this.storeName, { keyPath: 'id' });
      };
    });
  }

  async setProviderData(data: ProviderData): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) throw new Error('Database not initialized');
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put({ id: KEY_PROVIDER, value: data });

      request.onerror = (): void => reject(request.error);
      request.onsuccess = (): void => resolve();
    });
  }

  async getProviderData(): Promise<ProviderData> {
    return new Promise((resolve, reject) => {
      if (!this.db) throw new Error('Database not initialized');
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(KEY_PROVIDER);

      request.onerror = (): void => reject(request.error);
      request.onsuccess = (): void => resolve(request.result.value);
    });
  }
}

// eslint-disable-next-line import-x/prefer-default-export
export { Storage };
