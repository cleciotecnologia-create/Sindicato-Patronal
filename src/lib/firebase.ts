import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export { firebaseConfig };

// Initialize database with defensive fallback
let dbInstance;
try {
  if (firebaseConfig.firestoreDatabaseId) {
    dbInstance = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);
  } else {
    dbInstance = getFirestore(app);
  }
} catch (error) {
  console.warn("Failed to initialize Firestore with custom database ID, falling back to default:", error);
  dbInstance = getFirestore(app);
}

export const db = dbInstance;
export const auth = getAuth(app);
auth.languageCode = 'pt-br';

// Enable local persistence for auth
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("Could not set Auth local persistence:", err);
});

export const storage = getStorage(app);

// Helper to ensure authentication is fully initialized before Firestore requests
export async function ensureAuthReady() {
  try {
    if (auth.authStateReady) {
      await auth.authStateReady();
    }
  } catch (err) {
    console.warn("Auth state readiness check warning:", err);
  }
  return auth.currentUser;
}

// Helper to standardise metadata on documents (empresaId, createdBy, createdAt, updatedAt)
export function withDocumentMetadata<T extends Record<string, any>>(
  data: T,
  empresaIdOverride?: string
): T & { empresaId: string; createdBy: string; createdAt: string; updatedAt: string } {
  const currentUser = auth.currentUser;
  const userEmpresaId = empresaIdOverride || (currentUser as any)?.empresaId || (currentUser as any)?.cnpj || "sinpa_default";
  const now = new Date().toISOString();

  return {
    ...data,
    empresaId: data.empresaId || userEmpresaId,
    createdBy: data.createdBy || currentUser?.uid || currentUser?.email || "system",
    createdAt: data.createdAt || now,
    updatedAt: now,
  };
}

// Validate connection on demand
export async function testConnection() {
  try {
    await ensureAuthReady();
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Por favor, verifique sua configuração do Firebase ou conexão com a internet.");
    }
  }
}

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
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || false,
      isAnonymous: auth.currentUser?.isAnonymous || false,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Details:', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

