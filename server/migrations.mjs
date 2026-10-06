import {readFile,readdir} from 'node:fs/promises';
export async function migrateDatabase(client, directory=new URL('../db/migrations/',import.meta.url)) {
  await client.execute('CREATE TABLE IF NOT EXISTS _redlyn_migrations(name TEXT PRIMARY KEY)');
  const applied=[];
  for(const name of (await readdir(directory)).filter(n=>n.endsWith('.sql')).sort()) {
    const sql=await readFile(new URL(name,directory),'utf8');
    const tx=await client.transaction('write');
    try {
      const existing=await tx.execute({sql:'SELECT name FROM _redlyn_migrations WHERE name=?',args:[name]});
      if(!existing.rows.length) {
        // These versioned migration files contain simple statements, with no semicolons in literals.
        await tx.batch(sql.split(';').map(s=>s.trim()).filter(Boolean));
        await tx.execute({sql:'INSERT INTO _redlyn_migrations(name) VALUES(?)',args:[name]});
        applied.push(name);
      }
      await tx.commit();
    } catch(error) { await tx.rollback();throw error; }
    finally { tx.close(); }
  }
  return applied;
}
