import { db as dexieDb } from '../db/database';
import { db as firestoreDb, auth } from './firebase';
import { doc, setDoc, getDoc, collection, getDocs, serverTimestamp, writeBatch, deleteDoc } from 'firebase/firestore';

const MAX_BATCH_SIZE = 500;

export const syncDataToCloud = async () => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const syncTimestamp = new Date().toISOString();
    
    // 1. Update main vault metadata
    const vaultRef = doc(firestoreDb, 'vaults', user.uid);
    await setDoc(vaultRef, { 
      lastSync: serverTimestamp(),
      userId: user.uid
    }, { merge: true });

    // 2. Iterate through ALL Dexie tables and sync them
    for (const table of dexieDb.tables) {
      const records = await table.toArray();
      
      // Use batches for each table
      for (let i = 0; i < records.length; i += MAX_BATCH_SIZE) {
        const batch = writeBatch(firestoreDb);
        const chunk = records.slice(i, i + MAX_BATCH_SIZE);
        
        chunk.forEach(record => {
          if (!record.id && record.id !== 0) return; // Skip if no ID
          const recordId = record.id.toString();
          const ref = doc(firestoreDb, `vaults/${user.uid}/${table.name}`, recordId);
          batch.set(ref, { ...record, syncedAt: serverTimestamp() }, { merge: true });
        });
        
        await batch.commit();
      }
    }

    console.log("Cloud Sync Complete: Data synchronized successfully.");
  } catch (e) {
    console.error("Cloud Sync Failed", e);
  }
};

export const restoreDataFromCloud = async () => {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const vaultRef = doc(firestoreDb, 'vaults', user.uid);
    const snap = await getDoc(vaultRef);
    if (!snap.exists()) return null;

    const restoredData: Record<string, unknown[]> = {};

    // Iterate through all tables defined in Dexie and fetch from Firestore
    for (const table of dexieDb.tables) {
      const colRef = collection(firestoreDb, `vaults/${user.uid}/${table.name}`);
      const colSnap = await getDocs(colRef);
      const records = colSnap.docs.map(d => d.data() as unknown);
      restoredData[table.name] = records;
    }

    console.log("Cloud Restore Complete: Data parity achieved.");
    return restoredData;
  } catch (e) {
    console.error("Cloud Restore Failed", e);
  }
  return null;
};
