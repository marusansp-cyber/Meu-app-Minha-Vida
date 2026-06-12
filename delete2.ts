import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
   "projectId": "gen-lang-client-0560232222",
   "appId": "1:77068623079:web:93110de089ef26fcc05642",
   "apiKey": "AIzaSyDeLu_klbUwWFeEU7ouD0BraoWfSo_Mkys",
   "authDomain": "gen-lang-client-0560232222.firebaseapp.com",
   "firestoreDatabaseId": "ai-studio-fbb65632-d46f-4cd0-bdf4-313c638a3020",
   "storageBucket": "gen-lang-client-0560232222.firebasestorage.app",
   "messagingSenderId": "77068623079"
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

async function run() {
  console.log("Fetching proposals...");
  const proposalsRef = collection(db, 'proposals');
  const snapProps = await getDocs(proposalsRef);
  
  const targetNames = ['Reny Aparecida Xavier Felix', 'Itamar Peron da Silva', 'Fabio Chaves'];
  
  let deletedCount = 0;
  
  for (const docSnap of snapProps.docs) {
    const data = docSnap.data();
    if (targetNames.includes(data.client) || targetNames.includes(data.name)) {
      console.log(`Deleting proposal: ${data.client || data.name} (${docSnap.id})`);
      await deleteDoc(doc(db, 'proposals', docSnap.id));
      deletedCount++;
    }
  }
  
  console.log(`Deleted ${deletedCount} proposals.`);
  
  console.log("Fetching leads...");
  const leadsRef = collection(db, 'leads');
  const snapLeads = await getDocs(leadsRef);
  
  for (const docSnap of snapLeads.docs) {
    const data = docSnap.data();
    if (targetNames.includes(data.name)) {
      console.log(`Deleting lead: ${data.name} (${docSnap.id})`);
      await deleteDoc(doc(db, 'leads', docSnap.id));
      deletedCount++;
    }
  }
  
  console.log(`Deleted ${deletedCount} docs total.`);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
