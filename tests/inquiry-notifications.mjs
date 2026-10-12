import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {queueInquiryNotification,deliverInquiryNotifications} from '../inquiry-notifications.mjs';
const {Miniflare,convertV4MiniflareOptions}=await import(process.env.ELVARINS_TEST_MINIFLARE||'miniflare');
const options={modules:true,script:'export default {fetch(){return new Response("ok")}}',compatibilityDate:'2026-10-06',d1Databases:['CUSTOMER_DB']};
const mf=new Miniflare(convertV4MiniflareOptions?convertV4MiniflareOptions(options):options);
try{
 const db=await mf.getD1Database('CUSTOMER_DB');await db.exec(await readFile(new URL('../customer-schema.sql',import.meta.url),'utf8'));
 await db.prepare('INSERT INTO inquiries(id,name,email,topic,sku,message,created_at) VALUES(?,?,?,?,?,?,?)').bind('00000000-0000-4000-8000-000000000001','Test Customer','private@example.test','product','HSG1926','Private customer request text.',1).run();
 const messages=[],env={CUSTOMER_DB:db,INQUIRY_EMAIL_ENABLED:'true',INQUIRY_EMAIL:{async send(message){messages.push(message);return {messageId:'local-test-id'};}}};
 assert.equal(await queueInquiryNotification({...env,INQUIRY_EMAIL_ENABLED:'false'},'00000000-0000-4000-8000-000000000001'),false);
 assert.equal(await queueInquiryNotification({...env,INQUIRY_EMAIL:undefined},'00000000-0000-4000-8000-000000000001'),false);
 await queueInquiryNotification(env,'00000000-0000-4000-8000-000000000001');await queueInquiryNotification(env,'00000000-0000-4000-8000-000000000001');
 const failed={...env,INQUIRY_EMAIL:{async send(){throw new Error('Local simulated delivery failure');}}};
 assert.deepEqual(await deliverInquiryNotifications(failed),{enabled:true,sent:0});
 let row=await db.prepare('SELECT * FROM inquiry_notifications').first();assert.equal(row.status,'failed');assert.equal(row.attempts,1);assert.equal(row.lease_until,0);
 assert.deepEqual(await deliverInquiryNotifications(env),{enabled:true,sent:0});assert.equal(messages.length,0);
 await db.prepare('UPDATE inquiry_notifications SET next_attempt=0').run();
 assert.deepEqual(await deliverInquiryNotifications(env),{enabled:true,sent:1});assert.equal(messages[0].to,'sales@elvarins.com');assert.ok(messages[0].text.includes('HSG1926'));
 assert.ok(!messages[0].text.includes('private@example.test')&&!messages[0].text.includes('Private customer request text.'));
 assert.deepEqual(await deliverInquiryNotifications(env),{enabled:true,sent:0});assert.equal(messages.length,1);
 row=await db.prepare('SELECT * FROM inquiry_notifications').first();assert.equal(row.status,'sent');assert.equal(row.message_id,'local-test-id');
 console.log('PASS: notification activation guard, durable queue, deduplication, retry backoff, fixed recipient and private-data exclusion; no real email sent');
}finally{await mf.dispose();}
