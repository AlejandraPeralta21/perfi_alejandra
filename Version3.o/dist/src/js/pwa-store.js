/* PWAStore: cola persistente de operaciones offline compartida por la página y el Service Worker.
   EJECUCIÓN: en la página entra por <script>; en el Service Worker entra por importScripts() desde sw.js.
   CONTEXTO: IndexedDB es la fuente compartida; los métodos enqueue/list/remove se llaman desde ambos. */
(function (root) {
  'use strict';

  const DB_NAME = 'alejandra-space-pwa';
  const DB_VERSION = 1;
  const STORE_NAME = 'outbox';
  const FALLBACK_KEY = 'as-pwa-outbox-fallback';
  let databasePromise;

  function openDatabase() {
    if (databasePromise) return databasePromise;
    databasePromise = new Promise(function (resolve, reject) {
      if (!root.indexedDB) return reject(new Error('IndexedDB no está disponible.'));
      const request = root.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = function () {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error || new Error('No se pudo abrir IndexedDB.')); };
      request.onblocked = function () { reject(new Error('IndexedDB está bloqueada.')); };
    });
    return databasePromise;
  }

  function fallbackRead() {
    try {
      const value = JSON.parse(root.localStorage.getItem(FALLBACK_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (error) { return []; }
  }

  function fallbackWrite(items) {
    if (!root.localStorage) throw new Error('No hay almacenamiento local disponible.');
    root.localStorage.setItem(FALLBACK_KEY, JSON.stringify(items));
  }

  async function enqueue(message) {
    const record = { id: String(message.id), queuedAt: Date.now(), payload: message };
    try {
      const database = await openDatabase();
      await new Promise(function (resolve, reject) {
        const transaction = database.transaction(STORE_NAME, 'readwrite');
        transaction.objectStore(STORE_NAME).put(record);
        transaction.oncomplete = resolve;
        transaction.onerror = function () { reject(transaction.error || new Error('No se pudo guardar la cola.')); };
        transaction.onabort = function () { reject(transaction.error || new Error('Se canceló el guardado de la cola.')); };
      });
    } catch (error) {
      const items = fallbackRead();
      const index = items.findIndex(function (item) { return String(item.id) === record.id; });
      if (index < 0) items.push(record);
      fallbackWrite(items);
    }
    return record;
  }

  async function list() {
    try {
      const database = await openDatabase();
      const items = await new Promise(function (resolve, reject) {
        const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
        request.onsuccess = function () { resolve(request.result || []); };
        request.onerror = function () { reject(request.error || new Error('No se pudo leer la cola.')); };
      });
      return items.sort(function (a, b) { return a.queuedAt - b.queuedAt; });
    } catch (error) {
      return fallbackRead().sort(function (a, b) { return a.queuedAt - b.queuedAt; });
    }
  }

  async function remove(id) {
    const key = String(id);
    try {
      const database = await openDatabase();
      await new Promise(function (resolve, reject) {
        const transaction = database.transaction(STORE_NAME, 'readwrite');
        transaction.objectStore(STORE_NAME).delete(key);
        transaction.oncomplete = resolve;
        transaction.onerror = function () { reject(transaction.error || new Error('No se pudo actualizar la cola.')); };
      });
    } catch (error) {
      fallbackWrite(fallbackRead().filter(function (item) { return String(item.id) !== key; }));
    }
  }

  root.PWAStore = { enqueue: enqueue, list: list, remove: remove };
})(self);
