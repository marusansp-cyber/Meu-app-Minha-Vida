import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services with connection hardening
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  // Use long-polling as a fallback only if WebSockets fail, or auto-detect
  experimentalAutoDetectLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

// Test Connection and provide clear diagnostics
async function testConnection() {
  try {
    // Try to get a non-existent doc to test connectivity
    await getDocFromServer(doc(db, '_connection_test_', 'check'));
    console.log("Firestore connection test: Success (reached backend)");
  } catch (error) {
    const err = error as any;
    console.error("Firestore initialization error details:", {
      code: err.code,
      message: err.message,
      stack: err.stack
    });

    if (err.code === 'unavailable') {
      console.error("CRITICAL: Firestore backend is unreachable. This may be due to temporary network issues or strict firewall/proxy settings.");
    } else if (err.code === 'permission-denied') {
      console.warn("Firestore connection check failed with permission-denied. This is expected if the test collection is protected, but indicates we ARE reaching the server.");
    }
  }
}

testConnection();

export default app;
