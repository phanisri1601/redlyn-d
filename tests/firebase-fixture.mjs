import {after} from 'node:test';
import {firebaseConnection} from '../server/firebase.mjs';
import {firestoreBinding} from '../server/firestore-db.mjs';

const roots=[];
export function firebaseTestEnv() {
  const {db}=firebaseConnection();
  const root=db.collection('redlyn_test_runs').doc(crypto.randomUUID());
  roots.push({db,root});
  // Each fixture uses a disposable namespace, never the real app collections.
  const scoped={collection:name=>root.collection(name),runTransaction:callback=>db.runTransaction(callback)};
  const media=new Map();
  return {DB:firestoreBinding(scoped),MEDIA:{async put(id,body){media.set(id,await new Response(body).arrayBuffer());},async get(id){return media.has(id)?{body:media.get(id)}:null;}}};
}
after(async()=>{
  for(const {db,root} of roots)await db.recursiveDelete(root);
});
