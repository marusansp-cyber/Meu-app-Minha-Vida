import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { readFileSync } from 'fs';

let config;
try {
  config = JSON.parse(readFileSync('./firebase-applet-config.json', 'utf8'));
} catch (e) {
  console.log('Error reading config', e.message);
  process.exit(1);
}

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function fixCommissions() {
  const snapshot = await getDocs(collection(db, 'proposals'));
  
  let updatedCount = 0;
  for (const document of snapshot.docs) {
    const data = document.data();
    console.log(`Checking proposal: ID ${document.id}, client ${data.client}, commission ${data.commission}`);
    
    // Convert string string commission
    let currentCommission = data.commission;
    if (typeof currentCommission === 'string') {
        currentCommission = parseFloat(currentCommission.replace(',', '.'));
    }

    if (currentCommission > 100) {
      console.log(`Fixing proposal ${data.id || document.id}: changing commission from ${data.commission} to 5`);
      await updateDoc(doc(db, 'proposals', document.id), { commission: 5 });
      updatedCount++;
    } else if (data.proposalNumber === '2601/06' || data.proposalNumber === '2601') {
      console.log(`Found proposal ${data.proposalNumber}. Fixing commission to 5 just in case.`);
      await updateDoc(doc(db, 'proposals', document.id), { commission: 5 });
      updatedCount++;
    } else if (data.client && (data.client.includes('Felipe') || data.client.includes('Fabio'))) {
      console.log(`Found proposal for ${data.client}. Fixing commission to 5 just in case.`);
      await updateDoc(doc(db, 'proposals', document.id), { commission: 5 });
      updatedCount++;
    }
  }
  
  console.log(`Updated ${updatedCount} proposals.`);
  process.exit(0);
}

fixCommissions().catch(console.error);
