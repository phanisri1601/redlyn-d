import {firebaseConnection} from '../server/firebase.mjs';

// Read-only connectivity check: creates no accounts or test documents.
try {
  const {db} = firebaseConnection();
  await db.collection('projects').limit(1).get();
  console.log('Firebase Firestore connection succeeded. Deploy the updated code with the Production Firebase environment variables to enable the live app.');
} catch {
  console.error('Firebase connection failed. Check the three FIREBASE_* server variables, Firestore database creation and service-account permissions. No credential values are printed.');
  process.exitCode = 1;
}
