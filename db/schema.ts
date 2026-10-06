import {sqliteTable,text,integer,primaryKey,index,uniqueIndex} from 'drizzle-orm/sqlite-core';
import {sql} from 'drizzle-orm';
export const activity=sqliteTable('activity',{
 id:text('id').primaryKey(),
 project_id:text('project_id').notNull(),
 author:text('author').notNull(),
 text:text('text').notNull(),
 internal:integer('internal').notNull().default(sql`0`),
 created_at:text('created_at').notNull()
},t=>[index('activity_project').on(t.project_id,t.created_at)]);
export const approvals=sqliteTable('approvals',{
 id:text('id').primaryKey(),
 project_id:text('project_id').notNull(),
 page:text('page').notNull(),
 author:text('author').notNull(),
 created_at:text('created_at').notNull()
},t=>[]);
export const attachments=sqliteTable('attachments',{
 id:text('id').primaryKey(),
 project_id:text('project_id').notNull(),
 feedback_id:text('feedback_id').notNull(),
 comment_id:text('comment_id'),
 name:text('name').notNull(),
 mime:text('mime').notNull(),
 size:integer('size').notNull(),
 internal:integer('internal').notNull().default(sql`0`),
 created_at:text('created_at').notNull()
},t=>[index('attachments_feedback').on(t.feedback_id)]);
export const auth_tokens=sqliteTable('auth_tokens',{
 token:text('token').primaryKey(),
 user_id:text('user_id').notNull(),
 purpose:text('purpose').notNull(),
 expires:integer('expires').notNull(),
 used:integer('used').notNull().default(sql`0`),
 created_at:text('created_at').notNull()
},t=>[index('auth_tokens_expiry').on(t.expires)]);
export const billing_checkouts=sqliteTable('billing_checkouts',{
 id:text('id').primaryKey(),
 owner_id:text('owner_id').notNull(),
 session_id:text('session_id'),
 plan:text('plan').notNull(),
 created_at:integer('created_at').notNull()
},t=>[index('checkout_owner').on(t.owner_id,t.created_at)]);
export const billing_events=sqliteTable('billing_events',{
 id:text('id').primaryKey(),
 created_at:integer('created_at').notNull()
},t=>[]);
export const comments=sqliteTable('comments',{
 id:text('id').primaryKey(),
 feedback_id:text('feedback_id').notNull(),
 author:text('author').notNull(),
 text:text('text').notNull(),
 internal:integer('internal').notNull().default(sql`0`),
 created_at:text('created_at').notNull()
},t=>[index('comments_feedback').on(t.feedback_id)]);
export const feedback=sqliteTable('feedback',{
 id:text('id').primaryKey(),
 project_id:text('project_id').notNull(),
 number:integer('number').notNull(),
 author:text('author').notNull(),
 text:text('text').notNull(),
 internal:integer('internal').notNull().default(sql`0`),
 status:text('status').notNull().default(sql`'Open'`),
 priority:text('priority').notNull().default(sql`'Normal'`),
 assignee:text('assignee').notNull().default(sql`''`),
 device:text('device').notNull(),
 anchor:text('anchor').notNull(),
 page:text('page').notNull(),
 metadata:text('metadata').notNull(),
 created_at:text('created_at').notNull()
},t=>[index('feedback_project').on(t.project_id,t.status)]);
export const invitations=sqliteTable('invitations',{
 id:text('id').primaryKey(),
 project_id:text('project_id').notNull(),
 email:text('email').notNull(),
 role:text('role').notNull(),
 token_hash:text('token_hash').notNull(),
 expires:integer('expires').notNull(),
 accepted:integer('accepted').notNull().default(sql`0`)
},t=>[uniqueIndex('invitations_token_hash_unique').on(t.token_hash)]);
export const links=sqliteTable('links',{
 id:text('id').primaryKey(),
 project_id:text('project_id').notNull(),
 token_hash:text('token_hash').notNull(),
 label:text('label').notNull().default(sql`'Client link'`),
 expires:integer('expires'),
 revoked:integer('revoked').notNull().default(sql`0`),
 require_email:integer('require_email').notNull().default(sql`0`),
 password:text('password'),
 can_comment:integer('can_comment').notNull().default(sql`1`),
 can_approve:integer('can_approve').notNull().default(sql`1`),
 created_at:text('created_at').notNull()
},t=>[uniqueIndex('links_token_hash_unique').on(t.token_hash)]);
export const members=sqliteTable('members',{
 project_id:text('project_id').notNull(),
 user_id:text('user_id').notNull(),
 role:text('role').notNull().default(sql`'developer'`)
},t=>[primaryKey({columns:[t.project_id,t.user_id]})]);
export const notifications=sqliteTable('notifications',{
 id:text('id').primaryKey(),
 user_id:text('user_id').notNull(),
 project_id:text('project_id').notNull(),
 feedback_id:text('feedback_id').notNull(),
 author:text('author').notNull(),
 text:text('text').notNull(),
 internal:integer('internal').notNull().default(sql`0`),
 read:integer('read').notNull().default(sql`0`),
 created_at:text('created_at').notNull(),
 email_state:text('email_state').notNull().default(sql`'disabled'`)
},t=>[index('notification_user').on(t.user_id,t.created_at)]);
export const preview_tickets=sqliteTable('preview_tickets',{
 token:text('token').primaryKey(),
 project_id:text('project_id').notNull(),
 user_id:text('user_id'),
 reviewer_token:text('reviewer_token'),
 expires:integer('expires').notNull()
},t=>[index('preview_ticket_expiry').on(t.expires)]);
export const projects=sqliteTable('projects',{
 id:text('id').primaryKey(),
 owner_id:text('owner_id').notNull(),
 name:text('name').notNull(),
 client:text('client').notNull().default(sql`''`),
 url:text('url').notNull(),
 description:text('description').notNull().default(sql`''`),
 environment:text('environment').notNull().default(sql`'staging'`),
 archived:integer('archived').notNull().default(sql`0`),
 created_at:text('created_at').notNull()
},t=>[]);
export const rate_limits=sqliteTable('rate_limits',{
 id:text('id').primaryKey(),
 count:integer('count').notNull(),
 reset_at:integer('reset_at').notNull()
},t=>[]);
export const reviewers=sqliteTable('reviewers',{
 token:text('token').primaryKey(),
 link_id:text('link_id').notNull(),
 name:text('name').notNull(),
 email:text('email').notNull().default(sql`''`),
 created_at:text('created_at').notNull()
},t=>[]);
export const sessions=sqliteTable('sessions',{
 token:text('token').primaryKey(),
 user_id:text('user_id').notNull(),
 expires:integer('expires').notNull()
},t=>[]);
export const subscriptions=sqliteTable('subscriptions',{
 owner_id:text('owner_id').primaryKey(),
 subscription_id:text('subscription_id').notNull(),
 customer_id:text('customer_id').notNull(),
 product_id:text('product_id').notNull(),
 plan:text('plan').notNull(),
 status:text('status').notNull(),
 valid_until:integer('valid_until'),
 cancel_at_end:integer('cancel_at_end').notNull().default(sql`0`),
 updated_at:integer('updated_at').notNull()
},t=>[uniqueIndex('subscriptions_subscription_id_unique').on(t.subscription_id)]);
export const usage_daily=sqliteTable('usage_daily',{
 owner_id:text('owner_id').notNull(),
 day:text('day').notNull(),
 views:integer('views').notNull().default(sql`0`)
},t=>[primaryKey({columns:[t.owner_id,t.day]})]);
export const users=sqliteTable('users',{
 id:text('id').primaryKey(),
 email:text('email').notNull(),
 name:text('name').notNull(),
 password:text('password').notNull(),
 created_at:text('created_at').notNull(),
 google_id:text('google_id'),
 email_verified:integer('email_verified').notNull().default(sql`0`)
},t=>[uniqueIndex('users_google_id_unique').on(t.google_id),uniqueIndex('users_email_unique').on(t.email)]);
export const workspace_invitations=sqliteTable('workspace_invitations',{
 id:text('id').primaryKey(),
 owner_id:text('owner_id').notNull(),
 email:text('email').notNull(),
 role:text('role').notNull(),
 token_hash:text('token_hash').notNull(),
 expires:integer('expires').notNull(),
 accepted:integer('accepted').notNull().default(sql`0`)
},t=>[uniqueIndex('workspace_invitations_token_hash_unique').on(t.token_hash)]);
export const workspace_members=sqliteTable('workspace_members',{
 owner_id:text('owner_id').notNull(),
 user_id:text('user_id').notNull(),
 role:text('role').notNull().default(sql`'developer'`)
},t=>[primaryKey({columns:[t.owner_id,t.user_id]})]);
export const workspace_settings=sqliteTable('workspace_settings',{
 owner_id:text('owner_id').primaryKey(),
 name:text('name').notNull()
},t=>[]);
