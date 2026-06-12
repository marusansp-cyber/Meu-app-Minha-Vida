const PROJECT_ID = "gen-lang-client-0560232222";
const DATABASE_ID = "ai-studio-fbb65632-d46f-4cd0-bdf4-313c638a3020";
const API_KEY = "AIzaSyDeLu_klbUwWFeEU7ouD0BraoWfSo_Mkys";

async function getDocs(collection) {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents/${collection}?key=${API_KEY}&pageSize=100`;
    const res = await fetch(url);
    if (!res.ok) {
        console.error(await res.text());
        return [];
    }
    const data = await res.json();
    return data.documents || [];
}

async function deleteDoc(name) {
    const url = `https://firestore.googleapis.com/v1/${name}?key=${API_KEY}`;
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok) {
        console.error(`Failed to delete ${name}`, await res.text());
    } else {
        console.log(`Deleted ${name}`);
    }
}

async function run() {
    const targetNames = ['Reny Aparecida Xavier Felix', 'Itamar Peron da Silva', 'Fabio Chaves'];
    
    // Check Proposals
    console.log("Checking proposals...");
    const proposals = await getDocs("proposals");
    for (const doc of proposals) {
        const clientName = doc.fields?.client?.stringValue || doc.fields?.name?.stringValue;
        if (targetNames.includes(clientName)) {
            await deleteDoc(doc.name);
        }
    }
    
    // Check Leads
    console.log("Checking leads...");
    const leads = await getDocs("leads");
    for (const doc of leads) {
        const leadName = doc.fields?.name?.stringValue;
        if (targetNames.includes(leadName)) {
            await deleteDoc(doc.name);
        }
    }
    
    // Check Installations
    console.log("Checking installations...");
    const installations = await getDocs("installations");
    for (const doc of installations) {
        const clientName = doc.fields?.clientName?.stringValue || doc.fields?.name?.stringValue;
        let isMatch = false;
        if (clientName && targetNames.some(n => clientName.includes(n))) isMatch = true;
        
        if (isMatch) {
            await deleteDoc(doc.name);
        }
    }
}

run().catch(console.error);
