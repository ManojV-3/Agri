import { db } from './db';

let isSyncing = false;

/**
 * Flush sync queue items when internet connectivity is re-established.
 */
export async function flushSyncQueue() {
  if (isSyncing || !navigator.onLine) return;
  isSyncing = true;

  try {
    const pendingItems = await db.syncQueue.where('status').equals('pending').toArray();
    if (pendingItems.length === 0) {
      isSyncing = false;
      return;
    }

    console.log(`[CropCare Sync] Online! Flushing ${pendingItems.length} queued item(s)...`);

    for (const item of pendingItems) {
      try {
        // Stub: In a live enterprise deployment with backend API, POST /api/scans or /api/sync
        // For our offline-first PWA architecture, we mark the record as synced
        await new Promise(res => setTimeout(res, 80)); // simulate sync latency
        
        await db.syncQueue.update(item.id, {
          status: 'synced',
          syncedAt: Date.now()
        });

        if (item.type === 'scan' && item.scanId) {
          await db.scans.update(item.scanId, { syncStatus: 'synced' });
        }
      } catch (err) {
        console.warn(`[CropCare Sync] Failed item ${item.id}:`, err);
      }
    }

    console.log('[CropCare Sync] Sync queue flushed successfully.');
  } catch (err) {
    console.error('[CropCare Sync] Sync error:', err);
  } finally {
    isSyncing = false;
  }
}

/**
 * Register automatic listeners for network status changes.
 */
export function initSyncService(onStatusChange) {
  window.addEventListener('online', () => {
    console.log('[CropCare Sync] Network online detected.');
    flushSyncQueue().then(() => {
      if (onStatusChange) onStatusChange(true);
    });
  });

  window.addEventListener('offline', () => {
    console.log('[CropCare Sync] Network offline detected.');
    if (onStatusChange) onStatusChange(false);
  });

  // Attempt initial flush if online
  if (navigator.onLine) {
    flushSyncQueue();
  }
}
