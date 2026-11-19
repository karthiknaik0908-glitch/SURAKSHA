import { openDB } from 'idb';

const DB_NAME = 'suraksha-offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending_sos';

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'local_id' });
          store.createIndex('synced', 'synced');
          store.createIndex('created_at_local', 'created_at_local');
        }
      },
    });
  }
  return dbPromise;
}

export async function savePendingSOSLocal(sosData) {
  const db = await getDB();
  const localRecord = {
    ...sosData,
    local_id: `local_sos_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    synced: false,
    created_at_local: new Date().toISOString(),
  };
  await db.put(STORE_NAME, localRecord);
  return localRecord;
}

export async function getPendingSOSLocal() {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  return all.filter((r) => !r.synced);
}

export async function getAllLocalSOS() {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function markSOSSynced(localId, serverId = null) {
  const db = await getDB();
  const record = await db.get(STORE_NAME, localId);
  if (record) {
    record.synced = true;
    if (serverId) record.serverId = serverId;
    record.synced_at = new Date().toISOString();
    await db.put(STORE_NAME, record);
  }
}

export async function clearSyncedSOS() {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  for (const r of all) {
    if (r.synced) {
      await db.delete(STORE_NAME, r.local_id);
    }
  }
}
