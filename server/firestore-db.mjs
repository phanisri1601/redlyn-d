// Maps the application's existing data operations to native Firestore reads,
// queries and transactions. This is not a general-purpose SQL engine.
// All operation strings come from trusted server code, never from requests.
import {createHash} from 'node:crypto';

const schemas = {
 users:['id','email','name','password','created_at','google_id','email_verified'],
 sessions:['token','user_id','expires'],
 projects:['id','owner_id','name','client','url','description','environment','archived','created_at'],
 members:['project_id','user_id','role'],
 links:['id','project_id','token_hash','label','expires','revoked','require_email','password','can_comment','can_approve','created_at'],
 reviewers:['token','link_id','name','email','created_at'],
 feedback:['id','project_id','number','author','text','internal','status','priority','assignee','device','anchor','page','metadata','created_at'],
 comments:['id','feedback_id','author','text','internal','created_at'],
 attachments:['id','project_id','feedback_id','comment_id','name','mime','size','internal','created_at'],
 approvals:['id','project_id','page','author','created_at'],
 activity:['id','project_id','author','text','internal','created_at'],
 invitations:['id','project_id','email','role','token_hash','expires','accepted'],
 rate_limits:['id','count','reset_at'],
 preview_tickets:['token','project_id','user_id','reviewer_token','expires'],
 workspace_members:['owner_id','user_id','role'],
 workspace_invitations:['id','owner_id','email','role','token_hash','expires','accepted'],
 workspace_settings:['owner_id','name'],
 usage_daily:['owner_id','day','views'],
 auth_tokens:['token','user_id','purpose','expires','used','created_at'],
 notifications:['id','user_id','project_id','feedback_id','author','text','internal','read','created_at','email_state'],
 subscriptions:['owner_id','subscription_id','customer_id','product_id','plan','status','valid_until','cancel_at_end','updated_at'],
 billing_checkouts:['id','owner_id','session_id','plan','created_at'],
 billing_events:['id','created_at'],
};
const defaults={client:'',description:'',environment:'staging',archived:0,role:'developer',label:'Client link',expires:null,revoked:0,require_email:0,password:null,can_comment:1,can_approve:1,email:'',google_id:null,email_verified:0,internal:0,status:'Open',priority:'Normal',assignee:'',accepted:0,views:0,used:0,read:0,email_state:'disabled'};
const pk={members:['project_id','user_id'],workspace_members:['owner_id','user_id'],usage_daily:['owner_id','day'],workspace_settings:['owner_id'],subscriptions:['owner_id'],sessions:['token'],reviewers:['token'],auth_tokens:['token'],preview_tickets:['token']};
const digest=value=>createHash('sha256').update(value).digest('hex');
const key=(table,row)=>digest(JSON.stringify((pk[table]||['id']).map(k=>row[k])));
const conflict=message=>Object.assign(new Error(message),{status:409});
const unique={users:['email','google_id'],links:['token_hash'],invitations:['token_hash'],workspace_invitations:['token_hash'],subscriptions:['subscription_id']};
const distinct=rows=>[...new Map(rows.map(r=>[r.id||r.user_id, r])).values()];
const sort=(rows,field='created_at',desc=true)=>rows.sort((a,b)=>(a[field]>b[field]?1:a[field]<b[field]?-1:0)*(desc?-1:1));
const open=f=>!['Resolved','Approved'].includes(f.status);
function split(value) {return value.split(/,(?=(?:[^']*'[^']*')*[^']*$)/).map(s=>s.trim());}
function literal(value,args,cursor) {
 if(value==='?')return args[cursor.n++];
 if(value==='NULL')return null;
 if(/^'.*'$/.test(value))return value.slice(1,-1).replaceAll("''", "'");
 if(/^-?\d+$/.test(value))return Number(value);
 throw new Error('Unsupported data operation literal');
}
function conditions(where,args,cursor={n:0}) {
 if(!where)return [];
 return where.split(/ AND /).map(part=>{
  let m=part.match(/^(\w+) (IS NOT NULL|IS NULL)$/);
  if(m)return {field:m[1],op:m[2],value:null};
  m=part.match(/^(\w+) NOT IN \((.+)\)$/);
  if(m)return {field:m[1],op:'not-in',value:split(m[2]).map(v=>literal(v,args,cursor))};
  m=part.match(/^(\w+)(<>|>=|<=|=|>|<)(.+)$/);
  if(!m)throw new Error('Unsupported data operation condition');
  return {field:m[1],op:m[2],value:literal(m[3],args,cursor)};
 });
}
function matches(row,c) {
 const a=row[c.field],b=c.value;
 switch(c.op){case '=':return a===b;case '<>':return a!==b;case '>':return a!=null&&a>b;case '<':return a!=null&&a<b;case '>=':return a!=null&&a>=b;case '<=':return a!=null&&a<=b;case 'IS NULL':return a==null;case 'IS NOT NULL':return a!=null;case 'not-in':return a!=null&&!b.includes(a);default:throw new Error('Unsupported comparison');}
}

async function parallelRows(rows,run){let next=0;await Promise.all(Array.from({length:Math.min(8,rows.length)},async()=>{while(next<rows.length){const row=rows[next++];await run(row);}}));}

class Store {
 constructor(db,tx){this.db=db;this.tx=tx;this.pending=new Map();}
 collection(table){if(!schemas[table]&& !['_unique','_guards'].includes(table))throw new Error('Unsupported collection');return this.db.collection(table);}
 async get(table,id){const ref=this.collection(table).doc(id);if(this.pending.has(ref.path))return this.pending.get(ref.path).row;const snap=await(this.tx?this.tx.get(ref):ref.get());return snap.exists?snap.data():null;}
 async byKey(table,row){return this.get(table,key(table,row));}
 async query(table,filters=[],limit=null){
  const keys=pk[table]||['id'];
  if(keys.every(k=>filters.some(c=>c.field===k&&c.op==='='))){const row=await this.byKey(table,Object.fromEntries(keys.map(k=>[k,filters.find(c=>c.field===k&&c.op==='=').value])));return row&&filters.every(c=>matches(row,c))?[row]:[];}
  let query=this.collection(table);
  // One indexed equality (or range for expiration cleanup) keeps reads scoped
  // without requiring a composite index for every filter/order combination.
  const index=filters.find(c=>c.op==='=')||filters.find(c=>['>','<','>=','<='].includes(c.op));
  if(index)query=query.where(index.field,index.op==='='?'==':index.op,index.value);
  if(limit)query=query.limit(limit);
  const snapshot=await(this.tx?this.tx.get(query):query.get());
  const rows=new Map(snapshot.docs.map(s=>[s.ref.path,s.data()]));
  for(const [path,p] of this.pending)if(p.table===table){rows.delete(path);if(p.row)rows.set(path,p.row);}
  return [...rows.values()].filter(row=>filters.every(c=>matches(row,c)));
 }
 async equal(table,field,value){return this.query(table,[{field,op:'=',value}]);}
 async row(table,field,value){return (await this.equal(table,field,value))[0]||null;}
 stage(table,row,id=key(table,row)){const ref=this.collection(table).doc(id);this.pending.set(ref.path,{table,ref,row});}
 remove(table,row){this.stage(table,null,key(table,row));}
 async save(table,row,{replace=false,ignore=false}={}){
  const previous=await this.byKey(table,row);
  if(previous&&!replace){if(ignore)return 0;throw conflict('This record already exists.');}
  const full={...Object.fromEntries(schemas[table].filter(k=>k in defaults).map(k=>[k,defaults[k]])),...row};
  for(const field of unique[table]||[]){
   if(full[field]==null)continue;
   const indexId=digest(JSON.stringify([table,field,full[field]]));const index=await this.get('_unique',indexId);
   if(index&&index.rowId!==key(table,row))throw conflict(table==='users'?'An account already exists for this email.':'This record already exists.');
   if(previous?.[field]!=null&&previous[field]!==full[field])this.stage('_unique',null,digest(JSON.stringify([table,field,previous[field]])));
   this.stage('_unique',{rowId:key(table,row)},indexId);
  }
  this.stage(table,full);return 1;
 }
 async update(table,row,patch){return this.save(table,{...row,...patch},{replace:true});}
 flush(){for(const {ref,row} of this.pending.values())if(row)this.tx.set(ref,row);else this.tx.delete(ref);}
 async memberIds(owner){const wm=await this.equal('workspace_members','owner_id',owner),projects=await this.equal('projects','owner_id',owner);const ids=new Set(wm.map(m=>m.user_id));for(const p of projects)for(const m of await this.equal('members','project_id',p.id))if(m.user_id!==owner)ids.add(m.user_id);return ids;}
 async accessible(user,workspace=null){const wm=await this.equal('workspace_members','user_id',user),pm=await this.equal('members','user_id',user);let rows=await this.equal('projects','owner_id',user);for(const m of wm)rows.push(...await this.equal('projects','owner_id',m.owner_id));for(const m of pm){const p=await this.byKey('projects',{id:m.project_id});if(p)rows.push(p);}return distinct(rows).filter(p=>!workspace||p.owner_id===workspace);}
 async people(owner,project=null){const memberships=await this.equal('workspace_members','owner_id',owner),ids=new Map(memberships.map(m=>[m.user_id,m.role]));if(project)for(const m of await this.equal('members','project_id',project))if(!ids.has(m.user_id))ids.set(m.user_id,m.role);ids.set(owner,'owner');const out=[];for(const [id,role] of ids){const u=await this.byKey('users',{id});if(u)out.push({...u,role});}return out;}
}

async function select(s,sql,a) {
 if(sql==='SELECT 1 AS ok')return [{ok:1}];
 if(sql.startsWith('SELECT users.* FROM sessions')){const session=await s.byKey('sessions',{token:a[0]});return session&&session.expires>a[1]?[await s.byKey('users',{id:session.user_id})].filter(Boolean):[];}
 if(sql.startsWith('SELECT reviewers.*')||sql.startsWith('SELECT l.* FROM reviewers')){const r=await s.byKey('reviewers',{token:a[0]});const l=r&&await s.byKey('links',{id:r.link_id});return l?[sql.startsWith('SELECT l.*')?l:{...r,project_id:l.project_id,revoked:l.revoked,expires:l.expires,can_comment:l.can_comment,can_approve:l.can_approve}]:[];}
 if(sql.startsWith('SELECT i.*,COALESCE')){const i=await s.row('workspace_invitations','token_hash',a[0]);const u=i&&await s.byKey('users',{id:i.owner_id});if(!u)return [];const ws=await s.byKey('workspace_settings',{owner_id:u.id});return [{...i,name:ws?.name||u.name+'’s workspace'}];}
 if(sql.startsWith('SELECT invitations.*,projects.name')){const i=await s.row('invitations','token_hash',a[0]);const p=i&&await s.byKey('projects',{id:i.project_id});return p?[{...i,name:p.name}]:[];}
 if(sql.startsWith('SELECT COUNT(*) AS n FROM (SELECT user_id'))return [{n:(await s.memberIds(a[0])).size}];
 if(sql.startsWith('SELECT id,name,email,email_verified FROM users WHERE id=? OR'))return (await s.people(a[0],a[2])).map(u=>({id:u.id,name:u.name,email:u.email,email_verified:u.email_verified}));
 if(sql.startsWith('SELECT u.id,u.name,u.email,m.role')||sql.startsWith('SELECT users.id,users.name,users.email,members.role')){const project=sql.startsWith('SELECT users.id')?a[0]:null,owner=project?a[1]:a[0];return (await s.people(owner,project)).map(u=>({id:u.id,name:u.name,email:u.email,role:u.role}));}
 if(sql.startsWith('SELECT u.id,u.name,ws.name')){const owners=new Set([a[0]]);for(const m of await s.equal('workspace_members','user_id',a[0]))owners.add(m.owner_id);for(const m of await s.equal('members','user_id',a[0])){const p=await s.byKey('projects',{id:m.project_id});if(p)owners.add(p.owner_id);}const rows=[];for(const id of owners){const u=await s.byKey('users',{id});if(u){const ws=await s.byKey('workspace_settings',{owner_id:id});rows.push({id,name:u.name,workspace_name:ws?.name||null});}}return rows;}
 if(sql.startsWith('SELECT p.*, (SELECT COUNT')){const rows=await s.accessible(a[0],a[3]);await parallelRows(rows,async p=>{const [f,approvals,rawAttachments]=await Promise.all([s.equal('feedback','project_id',p.id),s.equal('approvals','project_id',p.id),s.equal('attachments','project_id',p.id)]),attachments=sort(rawAttachments);Object.assign(p,{open_count:f.filter(open).length,feedback_count:f.length,public_open_count:f.filter(r=>!r.internal&&open(r)).length,reopened_count:f.filter(r=>!r.internal&&r.status==='Reopened').length,approval_count:approvals.length,cover_id:attachments.find(r=>!r.internal&&r.name==='screenshot.png'&&f.some(item=>item.id===r.feedback_id&&!item.internal))?.id||null});});return sort(rows);}
 if(sql.startsWith('SELECT a.*,p.name AS project_name')){const projects=await s.accessible(a[0],a[3]);let rows=[];for(const p of projects)rows.push(...(await s.equal('activity','project_id',p.id)).map(r=>({...r,project_name:p.name})));return sort(rows).slice(0,100);}
 if(sql.startsWith('SELECT n.*,p.name AS project_name')){const projects=new Map((await s.accessible(a[0],a[4])).map(p=>[p.id,p]));const rows=[];for(const n of await s.equal('notifications','user_id',a[0])){if(!projects.has(n.project_id))continue;if(!await s.byKey('feedback',{id:n.feedback_id}))continue;rows.push({...n,project_name:projects.get(n.project_id).name});}return sort(rows).slice(0,100);}
 if(sql.startsWith('SELECT COALESCE(SUM(CASE WHEN substr(f.created_at')){let rows=[];for(const p of await s.equal('projects','owner_id',a[1]))rows.push(...await s.equal('feedback','project_id',p.id));rows=rows.filter(r=>r.created_at.slice(0,7)===a[2]);return [{today:rows.filter(r=>r.created_at.slice(0,10)===a[0]).length,month:rows.length}];}
 if(sql.startsWith('SELECT COALESCE(SUM(CASE WHEN day=')){const rows=(await s.equal('usage_daily','owner_id',a[1])).filter(r=>r.day.slice(0,7)===a[2]);return [{today:rows.filter(r=>r.day===a[0]).reduce((n,r)=>n+r.views,0),month:rows.reduce((n,r)=>n+r.views,0)}];}
 const m=sql.match(/^SELECT (.+) FROM (\w+)(?: WHERE (.*?))?(?: ORDER BY (\w+)(?: (DESC|ASC))?)?(?: LIMIT (\d+))?$/);
 if(!m)throw new Error('Unsupported Firestore read operation');
 const [,columns,table,where,order,direction,limit]=m;
 let rows=await s.query(table,conditions(where,a),!where&&!order&&!columns.startsWith('COUNT')&&limit?Number(limit):null);
 if(columns.startsWith('COUNT(*) AS '))return [{[columns.slice(12)]:rows.length}];
 if(columns==='COALESCE(MAX(number),0)+1 AS n')return [{n:Math.max(0,...rows.map(r=>r.number))+1}];
 if(order)sort(rows,order,direction==='DESC');if(limit)rows=rows.slice(0,Number(limit));
 if(columns==='*')return rows;
 return rows.map(r=>Object.fromEntries(split(columns).map(column=>{const protectedField=column==='password IS NOT NULL AS protected';return protectedField?['protected',r.password!=null?1:0]:[column,r[column]];})));
}

async function mutate(s,sql,a) {
 if(sql.startsWith('INSERT INTO rate_limits')){const previous=await s.byKey('rate_limits',{id:a[0]});return s.save('rate_limits',{id:a[0],count:previous&&previous.reset_at>=a[2]?previous.count+1:1,reset_at:previous&&previous.reset_at>=a[3]?previous.reset_at:a[1]},{replace:true});}
 if(sql.startsWith('INSERT INTO usage_daily')){const row=await s.byKey('usage_daily',{owner_id:a[0],day:a[1]});if(row&&row.views>=a[2])return 0;return s.save('usage_daily',{owner_id:a[0],day:a[1],views:(row?.views||0)+1},{replace:true});}
 if(sql.startsWith('INSERT OR REPLACE INTO workspace_members')){const invite=await s.byKey('workspace_invitations',{id:a[1]});if(!invite||invite.accepted||invite.expires<=a[2]||a[3]!=null&&(await s.memberIds(invite.owner_id)).size+1>=a[4])return 0;return s.save('workspace_members',{owner_id:invite.owner_id,user_id:a[0],role:invite.role},{replace:true});}
 if(sql.startsWith('INSERT OR REPLACE INTO members')){const invite=await s.byKey('invitations',{id:a[1]});if(!invite||invite.accepted||invite.expires<=a[2])return 0;const existing=await s.byKey('workspace_members',{owner_id:a[7],user_id:a[8]});if(a[3]!=null&&!existing&&(await s.memberIds(a[4])).size+1>=a[6])return 0;return s.save('members',{project_id:invite.project_id,user_id:a[0],role:invite.role},{replace:true});}
 if(sql.startsWith('UPDATE workspace_invitations SET accepted')){const row=await s.byKey('workspace_invitations',{id:a[0]});if(!row||row.accepted||!await s.byKey('workspace_members',{owner_id:row.owner_id,user_id:a[1]}))return 0;return s.update('workspace_invitations',row,{accepted:1});}
 if(sql.startsWith('UPDATE invitations SET accepted')){const row=await s.byKey('invitations',{id:a[0]});if(!row||!await s.byKey('members',{project_id:row.project_id,user_id:a[1]}))return 0;return s.update('invitations',row,{accepted:1});}
 if(sql.startsWith('INSERT INTO projects(')&&sql.includes(' SELECT ')){if(a[8]!=null&&(await s.equal('projects','owner_id',a[9])).filter(p=>!p.archived).length>=a[10])return 0;return s.save('projects',Object.fromEntries(['id','owner_id','name','client','url','description','environment','created_at'].map((k,i)=>[k,a[i]])));}
 if(sql.startsWith('UPDATE projects SET name=')){const row=await s.byKey('projects',{id:a[6]});if(!row)return 0;if(!a[7]&&row.archived&&a[8]!=null&&(await s.equal('projects','owner_id',row.owner_id)).filter(p=>!p.archived).length>=a[9])return 0;return s.update('projects',row,Object.fromEntries(['name','client','url','description','environment','archived'].map((k,i)=>[k,a[i]])));}
 if(sql.startsWith('INSERT INTO billing_checkouts(')&&sql.includes(' SELECT ')){if((await s.equal('billing_checkouts','owner_id',a[4])).some(r=>r.created_at>a[5]))return 0;return s.save('billing_checkouts',{id:a[0],owner_id:a[1],session_id:null,plan:a[2],created_at:a[3]});}
 if(sql.includes('AND EXISTS(SELECT 1 FROM auth_tokens')){const updatingPassword=sql.startsWith('UPDATE users SET password'),deleting=sql.startsWith('DELETE');const token=await s.byKey('auth_tokens',{token:a[updatingPassword?2:1]});if(!token||token.used||!deleting&&token.expires<=a[updatingPassword?3:2])return 0;if(deleting){const rows=await s.equal('sessions','user_id',a[0]);for(const row of rows)s.remove('sessions',row);return rows.length;}const row=await s.byKey('users',{id:a[updatingPassword?1:0]});return row?s.update('users',row,updatingPassword?{password:a[0]}:{email_verified:1}):0;}
 let m=sql.match(/^INSERT( OR IGNORE| OR REPLACE)? INTO (\w+)(?:\(([^)]+)\))? VALUES\(([^)]+)\)(?: ON CONFLICT.*)?$/);
 if(m){const [,mode,table,columns,values]=m;if(!schemas[table])throw new Error('Unsupported collection');const keys=columns?split(columns):schemas[table];const cursor={n:0};const row=Object.fromEntries(split(values).map((v,i)=>[keys[i],literal(v,a,cursor)]));return s.save(table,row,{replace:mode===' OR REPLACE'||sql.includes('ON CONFLICT'),ignore:mode===' OR IGNORE'});}
 m=sql.match(/^UPDATE (\w+) SET (.*?)(?: WHERE (.+))?$/);
 if(m){const [,table,set,where]=m,cursor={n:0};const patch=Object.fromEntries(split(set).map(v=>{const [field,value]=v.split('=');return [field,literal(value,a,cursor)];}));const rows=await s.query(table,conditions(where,a,cursor));for(const row of rows)await s.update(table,row,patch);return rows.length;}
 m=sql.match(/^DELETE FROM (\w+)(?: WHERE (.+))?$/);
 if(m){const rows=await s.query(m[1],conditions(m[2],a));for(const row of rows)s.remove(m[1],row);return rows.length;}
 throw new Error('Unsupported Firestore write operation');
}

export function firestoreBinding(db) {
 async function batch(statements) {
  return db.runTransaction(async tx=>{
   const s=new Store(db,tx);
   // Serialize capacity-changing transactions even when a membership query is
   // empty. This prevents two invitations from consuming the same final seat.
   const capacity=statements.some(x=>/^(INSERT|UPDATE|DELETE).*\b(projects|members|workspace_members|invitations|workspace_invitations)\b/.test(x.sql));
   const guard=capacity?db.collection('_guards').doc('capacity'):null;
   const previous=guard?await tx.get(guard):null;
   const results=[];for(const statement of statements){const changes=await mutate(s,statement.sql,statement.args);results.push({success:true,meta:{changes},changes});}
   s.flush();if(guard)tx.set(guard,{version:(previous.data()?.version||0)+1});return results;
  });
 }
 return {provider:'firebase',prepare(sql){return {sql,args:[],bind(...args){return {...this,args};},async first(){return (await select(new Store(db),sql,this.args))[0]||null;},async all(){return {results:await select(new Store(db),sql,this.args)};},async run(){return (await batch([this]))[0];}};},batch};
}
