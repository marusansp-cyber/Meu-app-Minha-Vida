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
const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);

async function run() {
  console.log("Fetching leads...");
  const leadsRef = collection(db, 'leads');
  const snap = await getDocs(leadsRef);
  
  const leads = snap.docs.map(d => ({id: d.id, ...d.data()})) as any[];
  console.log(`Found ${leads.length} leads in total.`);
  
  const targetNames = ['Reny Aparecida Xavier Felix', 'Itamar Peron da Silva', 'Fabio Chaves'];
  
  for (const lead of leads) {
    if (targetNames.includes(lead.name)) {
      console.log(`Deleting lead: ${lead.name} (${lead.id})`);
      await deleteDoc(doc(db, 'leads', lead.id));
    }
  }
  console.log("Done deleting leads.");
  
  // also check proposals
  console.log("Fetching proposals...");
  const proposalsRef = collection(db, 'proposals');
  const snapProps = await getDocs(proposalsRef);
  
  const proposals = snapProps.docs.map(d => ({id: d.id, ...d.data()})) as any[];
  for (const p of proposals) {
    if (targetNames.includes(p.client) || targetNames.includes(p.name)) {
      console.log(`Deleting proposal: ${p.client || p.name} (${p.id})`);
      await deleteDoc(doc(db, 'proposals', p.id));
    }
  }
  
  // Also check installations if they were converted
  console.log("Fetching installations...");
  const instRef = collection(db, 'installations');
  const snapInst = await getDocs(instRef);
  
  const installations = snapInst.docs.map(d => ({id: d.id, ...d.data()})) as any[];
  for (const i of installations) {
     // installations typically use `name` as the address, but might have client or representative
     if (targetNames.includes(i.clientName) || targetNames.includes(i.name) || targetNames.some(name => typeof i.name === 'string' && i.name.includes(name))) {
         console.log(`Deleting installation: ${i.name} (${i.id})`);
         await deleteDoc(doc(db, 'installations', i.id));
     }
  }
  
  console.log("Finished all checks.");
  process.exit(0);
}

run().catch(console.error);
