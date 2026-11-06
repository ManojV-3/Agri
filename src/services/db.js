import Dexie from 'dexie';

export const db = new Dexie('CropCareDatabase');

db.version(2).stores({
  settings: 'key',
  scans: '++id, timestamp, crop, disease, risk',
  crops: '++id, name, crop, createdAt',
  syncQueue: '++id, type, status, timestamp',
  customPrices: 'solutionId',
  farmer: 'id'
});

// Farmer Profile helpers
export async function getFarmerProfile() {
  try {
    const profile = await db.farmer.get('current_farmer');
    if (profile) return profile;
    // Fallback to localStorage backup
    const local = localStorage.getItem('cropcare_farmer_profile');
    return local ? JSON.parse(local) : null;
  } catch (err) {
    console.warn('Failed to get farmer profile from IndexedDB:', err);
    const local = localStorage.getItem('cropcare_farmer_profile');
    return local ? JSON.parse(local) : null;
  }
}

export async function saveFarmerProfile(profile) {
  try {
    const data = {
      id: 'current_farmer',
      ...profile,
      updatedAt: Date.now()
    };
    await db.farmer.put(data);
    localStorage.setItem('cropcare_farmer_profile', JSON.stringify(data));
    return data;
  } catch (err) {
    console.error('Failed to save farmer profile:', err);
    localStorage.setItem('cropcare_farmer_profile', JSON.stringify(profile));
    return profile;
  }
}

export async function logoutFarmer() {
  try {
    await db.farmer.delete('current_farmer');
    localStorage.removeItem('cropcare_farmer_profile');
  } catch (err) {
    console.error('Failed to logout farmer:', err);
    localStorage.removeItem('cropcare_farmer_profile');
  }
}

// Settings helpers
export async function getSetting(key, defaultValue = null) {
  try {
    const item = await db.settings.get(key);
    return item ? item.value : defaultValue;
  } catch (err) {
    console.warn(`Failed to get setting ${key} from IndexedDB:`, err);
    return defaultValue;
  }
}

export async function setSetting(key, value) {
  try {
    await db.settings.put({ key, value });
  } catch (err) {
    console.warn(`Failed to set setting ${key} in IndexedDB:`, err);
  }
}

// Scans helpers
export async function saveScanRecord(scan) {
  const record = {
    ...scan,
    timestamp: scan.timestamp || Date.now(),
    syncStatus: 'pending'
  };
  const id = await db.scans.add(record);
  
  // Also queue for server sync
  await db.syncQueue.add({
    type: 'scan',
    scanId: id,
    action: 'create',
    payload: { ...record, id },
    status: 'pending',
    timestamp: Date.now()
  });

  return id;
}

export async function getRecentScans(limit = 3) {
  try {
    return await db.scans.orderBy('timestamp').reverse().limit(limit).toArray();
  } catch (err) {
    console.error('Error fetching recent scans:', err);
    return [];
  }
}

export async function getAllScans() {
  try {
    return await db.scans.orderBy('timestamp').reverse().toArray();
  } catch (err) {
    console.error('Error fetching all scans:', err);
    return [];
  }
}

export async function deleteScanRecord(id) {
  try {
    await db.scans.delete(id);
    await db.syncQueue.add({
      type: 'scan',
      scanId: id,
      action: 'delete',
      status: 'pending',
      timestamp: Date.now()
    });
  } catch (err) {
    console.error('Error deleting scan record:', err);
  }
}

// Crops & Fields helpers
export async function getCrops() {
  try {
    return await db.crops.orderBy('createdAt').reverse().toArray();
  } catch (err) {
    console.error('Error fetching crops:', err);
    return [];
  }
}

export async function saveCrop(cropData) {
  try {
    if (cropData.id) {
      await db.crops.update(cropData.id, { ...cropData, updatedAt: Date.now() });
      return cropData.id;
    } else {
      return await db.crops.add({
        ...cropData,
        createdAt: Date.now()
      });
    }
  } catch (err) {
    console.error('Error saving crop:', err);
    return null;
  }
}

export async function deleteCrop(id) {
  try {
    await db.crops.delete(id);
  } catch (err) {
    console.error('Error deleting crop:', err);
  }
}

// Custom prices helpers
export async function getCustomPrices() {
  try {
    const list = await db.customPrices.toArray();
    const map = {};
    list.forEach(item => {
      map[item.solutionId] = item;
    });
    return map;
  } catch (err) {
    console.error('Error getting custom prices:', err);
    return {};
  }
}

export async function saveCustomPrice(solutionId, data) {
  try {
    await db.customPrices.put({
      solutionId,
      ...data,
      updatedAt: Date.now()
    });
  } catch (err) {
    console.error('Error saving custom price:', err);
  }
}

export async function resetCustomPrices() {
  try {
    await db.customPrices.clear();
  } catch (err) {
    console.error('Error clearing custom prices:', err);
  }
}

// Sync queue helpers
export async function getPendingSyncCount() {
  try {
    return await db.syncQueue.where('status').equals('pending').count();
  } catch {
    return 0;
  }
}
