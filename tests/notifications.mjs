import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {queueInquiryNotification,deliverInquiryNotifications} from '../inquiry-notifications.mjs';
import {readFileSync} from 'node:fs';
const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync(new URL('../customer-schema.sql',import.meta.url),'utf8'));
const db={prepare(sql){return {bind(...args){return {async run(){return {meta:{changes:Number(sqlite.prepare(sql).run(...args).changes)}}},async all(){return {results:sqlite.prepare(sql).all(...args)}}}}}}};
let now=Date.now(),failed=false,calls=[];
const originalNow=Date.now;Date.now=()=>now;
const env={CUSTOMER_DB:db,INQUIRY_EMAIL_ENABLED:'true',INQUIRY_EMAIL:{async send(message){calls.push(message);if(failed)throw Error('temporary');return {messageId:'test-'+calls.length};}}};
function inquiry(id){sqlite.prepare('INSERT INTO inquiries VALUES(?,?,?,?,?,?,?)').run(id,'Test <Customer>','customer@example.test','product','HSG2001','Can you confirm this item? <script>alert(1)</script> & details',Math.floor(now/1000));}
try{
 inquiry('disabled');assert.equal(await queueInquiryNotification({...env,INQUIRY_EMAIL_ENABLED:'false'},'disabled'),false);assert.deepEqual(await deliverInquiryNotifications({...env,INQUIRY_EMAIL_ENABLED:'false'}),{enabled:false,sent:0});assert.equal(calls.length,0);
 inquiry('success');assert.equal(await queueInquiryNotification(env,'success'),true);await queueInquiryNotification(env,'success');
 assert.equal((await deliverInquiryNotifications(env)).sent,1);assert.equal(calls.length,1);assert.equal(calls[0].to,'sales@elvarins.com');assert.equal(calls[0].replyTo,'customer@example.test');assert.ok(calls[0].text.includes('Can you confirm'));assert.ok(!calls[0].html.includes('<script>'));assert.ok(calls[0].html.includes('&lt;script&gt;'));assert.ok(calls[0].text.includes('not an order confirmation'));
 await deliverInquiryNotifications(env);assert.equal(calls.length,1,'Sent inquiry is not resent');
 inquiry('retry');await queueInquiryNotification(env,'retry');failed=true;await deliverInquiryNotifications(env);
 const row=sqlite.prepare('SELECT * FROM inquiry_notifications WHERE inquiry_id=?').get('retry');assert.equal(row.status,'failed');assert.equal(row.attempts,1);assert.ok(row.next_attempt>now/1000);
 await deliverInquiryNotifications(env);assert.equal(calls.length,2,'No immediate retry storm');
 now+=601000;failed=false;assert.equal((await deliverInquiryNotifications(env)).sent,1);assert.equal(sqlite.prepare('SELECT status FROM inquiry_notifications WHERE inquiry_id=?').get('retry').status,'sent');
 console.log('PASS: verified fixed recipient, complete inquiry, Reply-To, escaped HTML, disabled mode, duplicate queue protection, delayed retry and no resend after success');
}finally{Date.now=originalNow;sqlite.close();}
