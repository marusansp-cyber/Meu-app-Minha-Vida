import { 
  collection, 
  onSnapshot, 
  query, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  setDoc,
  serverTimestamp,
  orderBy,
  where,
  QueryConstraint
} from 'firebase/firestore';
import { db, auth } from './firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Generic sync function
function convertTimestamps(data: any): any {
  if (!data || typeof data !== 'object') return data;
  
  // Handle Firestore Timestamp
  if (data.seconds !== undefined && data.nanoseconds !== undefined) {
    return new Date(data.seconds * 1000).toISOString();
  }

  const converted: any = Array.isArray(data) ? [] : {};
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value && typeof value === 'object') {
      converted[key] = convertTimestamps(value);
    } else {
      converted[key] = value;
    }
  });
  return converted;
}

export function syncCollection<T>(
  collectionPath: string, 
  onUpdate: (data: T[]) => void,
  sortField?: string,
  whereQueries?: { field: string; operator: any; value: any }[]
) {
  const colRef = collection(db, collectionPath);
  const constraints: QueryConstraint[] = [];

  if (whereQueries) {
    whereQueries.forEach(q => {
      constraints.push(where(q.field, q.operator, q.value));
    });
  }

  if (sortField) {
    constraints.push(orderBy(sortField, 'desc'));
  }

  const q = constraints.length > 0 ? query(colRef, ...constraints) : colRef;

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      ...convertTimestamps(doc.data()),
      id: doc.id
    })) as T[];
    onUpdate(data);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
  });
}

function cleanData(data: any) {
  const clean: any = {};
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined && key !== 'id') {
      clean[key] = data[key];
    }
  });
  return clean;
}

export async function createDocument(collectionPath: string, data: any) {
  try {
    const colRef = collection(db, collectionPath);
    const docRef = await addDoc(colRef, {
      ...cleanData(data),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Log activity
    if (collectionPath !== 'activities' && collectionPath !== 'history') {
      await logActivity({
        type: 'create',
        collection: collectionPath,
        docId: docRef.id,
        data: cleanData(data),
        user: {
          uid: auth.currentUser?.uid,
          email: auth.currentUser?.email,
          displayName: auth.currentUser?.displayName
        }
      });
    }

    return docRef;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collectionPath);
  }
}

export async function updateDocument(collectionPath: string, id: string, data: any) {
  if (!id) {
    console.error(`updateDocument failed: ID is missing for collection ${collectionPath}`);
    return;
  }
  try {
    const docRef = doc(db, collectionPath, id);
    await updateDoc(docRef, {
      ...cleanData(data),
      updatedAt: serverTimestamp()
    });

    // Log activity
    if (collectionPath !== 'activities' && collectionPath !== 'history') {
      await logActivity({
        type: 'update',
        collection: collectionPath,
        docId: id,
        data: cleanData(data),
        user: {
          uid: auth.currentUser?.uid,
          email: auth.currentUser?.email,
          displayName: auth.currentUser?.displayName
        }
      });
    }

    return docRef;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${collectionPath}/${id}`);
  }
}

export async function deleteDocument(collectionPath: string, id: string) {
  if (!id) {
    console.error(`deleteDocument failed: ID is missing for collection ${collectionPath}`);
    return;
  }
  try {
    const docRef = doc(db, collectionPath, id);
    await deleteDoc(docRef);

    // Log activity
    if (collectionPath !== 'activities' && collectionPath !== 'history') {
      await logActivity({
        type: 'delete',
        collection: collectionPath,
        docId: id,
        user: {
          uid: auth.currentUser?.uid,
          email: auth.currentUser?.email,
          displayName: auth.currentUser?.displayName
        }
      });
    }

    return docRef;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionPath}/${id}`);
  }
}

async function logActivity(activity: any) {
  try {
    const colRef = collection(db, 'history');
    await addDoc(colRef, {
      ...activity,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

export async function getDocument<T>(collectionPath: string, id: string): Promise<T | null> {
  if (!id) {
    console.error(`getDocument failed: ID is missing for collection ${collectionPath}`);
    return null;
  }
  try {
    const docRef = doc(db, collectionPath, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...convertTimestamps(docSnap.data()) } as T;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${collectionPath}/${id}`);
    return null;
  }
}

export async function setDocument(collectionPath: string, id: string, data: any) {
  if (!id) {
    console.error(`setDocument failed: ID is missing for collection ${collectionPath}`);
    return;
  }
  try {
    const docRef = doc(db, collectionPath, id);
    return await setDoc(docRef, {
      ...cleanData(data),
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionPath}/${id}`);
  }
}
