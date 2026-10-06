// Server-only Firebase connection. Never import this module from browser code.
import {cert, getApps, initializeApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';

export function firebaseConfig(env = process.env) {
  const projectId = env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in the server environment. Do not put them in browser code.');
  }
  if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----') || !privateKey.endsWith('-----END PRIVATE KEY-----')) {
    throw new Error('FIREBASE_PRIVATE_KEY must contain the complete PEM private key.');
  }
  return {projectId, clientEmail, privateKey};
}

export function firebaseConnection(env = process.env) {
  const config = firebaseConfig(env);
  const name = `redlyn-${config.projectId}`;
  const app = getApps().find(item => item.name === name) || initializeApp({
    credential: cert(config), projectId: config.projectId,
  }, name);
  return {app, db: getFirestore(app)};
}
