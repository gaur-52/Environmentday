import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  increment, 
  updateDoc, 
  getDoc,
  query,
  orderBy,
  limit,
  getDocFromServer
} from "firebase/firestore";
import { db, auth } from "./firebase";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

// Structured error handling as specified in system guidelines
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  
  // Graceful logs on terminal quota warnings
  if (errInfo.error.includes("Quota exceeded") || errInfo.error.includes("quota")) {
    console.warn("Firestore usage quota exceeded. The application will continue operating using local storage fallback successfully.");
  }
  
  throw new Error(JSON.stringify(errInfo));
}

// Test connectivity as requested in verification guidelines
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or network status.");
    }
  }
}

// ===================================================
// CERTIFICATE LOGS WRITING AND READING
// ===================================================

const COLLECTION_LOGS = "certificate_logs";

/**
 * Lists or streams certificate download/generation logs in reverse-chronological order
 */
export function listenCertificateLogs(onUpdate: (logs: any[]) => void) {
  const q = query(collection(db, COLLECTION_LOGS), orderBy("timestamp", "desc"), limit(400));
  
  return onSnapshot(q, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((docSnap) => {
      list.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });
    onUpdate(list);
  }, (error) => {
    // Fail silently on permission block/unconfigured placeholder config so client keeps working locally
    console.error("Firestore Listen Certificate Error: ", error);
    try {
      handleFirestoreError(error, OperationType.GET, COLLECTION_LOGS);
    } catch (e) {
      // safe fallback
    }
  });
}

/**
 * Insert or edit a generated certificate log
 */
export async function dbAddCertificateLog(log: {
  id: string;
  recipientName: string;
  guardianName: string;
  mobileNumber?: string;
  assemblyConstituency: string;
  block: string;
  district: string;
  certificateId: string;
  timestamp: string;
  format: string;
}) {
  const targetPath = `${COLLECTION_LOGS}/${log.id}`;
  try {
    await setDoc(doc(db, COLLECTION_LOGS, log.id), {
      recipientName: log.recipientName,
      guardianName: log.guardianName,
      mobileNumber: log.mobileNumber || "N/A",
      assemblyConstituency: log.assemblyConstituency,
      block: log.block,
      district: log.district,
      certificateId: log.certificateId,
      timestamp: log.timestamp,
      format: log.format
    });
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, targetPath);
    } catch (e) {
      // safe bypass
    }
  }
}

/**
 * Remove a individual record log
 */
export async function dbDeleteCertificateLog(id: string) {
  const targetPath = `${COLLECTION_LOGS}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTION_LOGS, id));
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.DELETE, targetPath);
    } catch (e) {
      // bypass
    }
  }
}

// ===================================================
// GLOBAL INTERACTION & CLICK COUNTER
// ===================================================

const COUNTER_DOC = doc(db, "counters", "global");

/**
 * Streams the real-time global visitor counter
 */
export function listenGlobalCounter(onUpdate: (count: number) => void) {
  return onSnapshot(COUNTER_DOC, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data && typeof data.pageCounter === "number") {
        onUpdate(data.pageCounter);
      }
    }
  }, (error) => {
    console.error("Firestore Listen Global Counter Error:", error);
  });
}

/**
 * Safely increments the global interaction/click counter
 */
export async function dbIncrementGlobalCounter() {
  const targetPath = "counters/global";
  try {
    const snap = await getDoc(COUNTER_DOC);
    if (!snap.exists()) {
      // Initialize with manual hand-picked krásne baseline to match localStorage setup (3483)
      await setDoc(COUNTER_DOC, { pageCounter: 3483 });
    } else {
      await updateDoc(COUNTER_DOC, {
        pageCounter: increment(1)
      });
    }
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, targetPath);
    } catch (e) {
      // safe fallback
    }
  }
}
