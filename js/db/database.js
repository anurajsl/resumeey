/* IndexedDB Database Layer */

import { DB_NAME, DB_VERSION } from '../utils/constants.js';

let _db = null;

export async function openDB() {
  if (_db) return _db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Resumes store
      if (!db.objectStoreNames.contains('resumes')) {
        const resumeStore = db.createObjectStore('resumes', { keyPath: 'id' });
        resumeStore.createIndex('type', 'type', { unique: false });
        resumeStore.createIndex('createdAt', 'createdAt', { unique: false });
        resumeStore.createIndex('parentId', 'parentId', { unique: false });
      }

      // Jobs store
      if (!db.objectStoreNames.contains('jobs')) {
        const jobStore = db.createObjectStore('jobs', { keyPath: 'id' });
        jobStore.createIndex('createdAt', 'createdAt', { unique: false });
        jobStore.createIndex('title', 'title', { unique: false });
      }

      // Settings store (single record)
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      // Audit log store
      if (!db.objectStoreNames.contains('audit')) {
        const auditStore = db.createObjectStore('audit', { keyPath: 'id', autoIncrement: true });
        auditStore.createIndex('timestamp', 'timestamp', { unique: false });
        auditStore.createIndex('type', 'type', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      _db = event.target.result;

      _db.onversionchange = () => {
        _db.close();
        _db = null;
        window.location.reload();
      };

      resolve(_db);
    };

    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      reject(new Error('Database upgrade blocked. Please close other tabs.'));
    };
  });
}

/**
 * Generic transaction helper
 */
export async function transaction(storeName, mode, callback) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    let result;

    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));

    Promise.resolve(callback(store, tx))
      .then(r => { result = r; })
      .catch(err => { tx.abort(); reject(err); });
  });
}

/**
 * Get a single record
 */
export async function dbGet(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Get all records from a store
 */
export async function dbGetAll(storeName, indexName, query, count) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const source = indexName ? store.index(indexName) : store;
    const req = source.getAll(query, count);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Put (create or update) a record
 */
export async function dbPut(storeName, record) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).put(record);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Delete a record
 */
export async function dbDelete(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Clear all records in a store
 */
export async function dbClear(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Count records
 */
export async function dbCount(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function closeDB() {
  if (_db) {
    _db.close();
    _db = null;
  }
}
