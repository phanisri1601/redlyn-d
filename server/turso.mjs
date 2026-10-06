// Adapt the existing D1-style queries to a persistent SQLite-compatible Turso database.
export function databaseBinding(client) {
  const result = r => ({results:r.rows.map(row=>({...row})),meta:{changes:r.rowsAffected},changes:r.rowsAffected});
  return {
    prepare(sql) {
      return {
        sql,args:[],
        bind(...args) { return {...this,args}; },
        async first() { const r=await client.execute({sql:this.sql,args:this.args});return r.rows.length?{...r.rows[0]}:null; },
        async all() { return result(await client.execute({sql:this.sql,args:this.args})); },
        async run() { return result(await client.execute({sql:this.sql,args:this.args})); }
      };
    },
    async batch(statements) {
      return (await client.batch(statements.map(s=>({sql:s.sql,args:s.args})), 'write')).map(result);
    }
  };
}
