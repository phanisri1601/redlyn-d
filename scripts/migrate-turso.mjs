import {createClient} from '@libsql/client';
import {migrateDatabase} from '../server/migrations.mjs';
const url=process.env.TURSO_DATABASE_URL,authToken=process.env.TURSO_AUTH_TOKEN;
if(!url&&!authToken) {
  if(process.argv.includes('--if-configured'))console.log('Database not connected yet. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel, then redeploy.');
  else {console.error('Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN before running db:migrate.');process.exitCode=1;}
} else if(!url||!authToken) {console.error('Both TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required.');process.exitCode=1;}
else {
  const client=createClient({url,authToken});
  try {const applied=await migrateDatabase(client);console.log(applied.length?'Applied '+applied.length+' database migrations.':'Database schema is up to date.');}
  catch {console.error('Database setup failed. Check the Turso URL/token and build logs in your account.');process.exitCode=1;}
  finally {client.close();}
}
