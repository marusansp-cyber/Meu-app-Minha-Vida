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
  orderBy
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
export function syncCollection<T>(
  collectionPath: string, 
  onUpdate: (data: T[]) => void,
  sortField?: string
) {
  const colRef = collection(db, collectionPath);
  const q = sortField ? query(colRef, orderBy(sortField, 'desc')) : colRef;

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({
      ...doc.data(),
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
    return await addDoc(colRef, {
      ...cleanData(data),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
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
    return await updateDoc(docRef, {
      ...cleanData(data),
      updatedAt: serverTimestamp()
    });
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
    return await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionPath}/${id}`);
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
      return { id: docSnap.id, ...docSnap.data() } as T;
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
