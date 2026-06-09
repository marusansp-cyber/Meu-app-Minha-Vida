import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
  const adminConfig = serviceAccount.adminServiceAccountInfo; // if it exists
  
  if (adminConfig) {
      initializeApp({
        credential: cert(adminConfig)
      });
  } else {
      console.log('No admin config found');
      process.exit(1);
  }

  const db = getFirestore();

  async function fixCommissions() {
    const snapshot = await db.collection('proposals').get();
    
    let updatedCount = 0;
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.commission && parseInt(data.commission) > 100) {
        console.log(`Fixing proposal ${data.id || doc.id}: changing commission from ${data.commission} to 5`);
        await doc.ref.update({ commission: 5 });
        updatedCount++;
      }
    }
    
    console.log(`Updated ${updatedCount} proposals.`);
  }

  fixCommissions().catch(console.error);
} catch (e) {
  console.log('Error reading config', e.message);
}
