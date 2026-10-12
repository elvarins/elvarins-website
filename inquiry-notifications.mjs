// Alerts only the owner's fixed business inbox. Activation requires a verified
// Cloudflare Email Service sender, destination and restricted Worker binding.
const inbox='sales@elvarins.com';
const enabled=env=>env.INQUIRY_EMAIL_ENABLED==='true'&&typeof env.INQUIRY_EMAIL?.send==='function';
export async function queueInquiryNotification(env,id){
 if(!enabled(env))return false;
 await env.CUSTOMER_DB.prepare('INSERT OR IGNORE INTO inquiry_notifications(inquiry_id,status,attempts,next_attempt,lease_until) VALUES(?,\'pending\',0,0,0)').bind(id).run();
 return true;
}
export async function deliverInquiryNotifications(env){
 if(!enabled(env))return {enabled:false,sent:0};
 const db=env.CUSTOMER_DB,now=Math.floor(Date.now()/1000);
 const rows=await db.prepare("SELECT n.inquiry_id,i.topic,i.sku FROM inquiry_notifications n JOIN inquiries i ON i.id=n.inquiry_id WHERE n.status!='sent' AND n.attempts<5 AND n.next_attempt<=? AND n.lease_until<=? ORDER BY i.created_at LIMIT 3").bind(now,now).all();
 let sent=0;
 for(const row of rows.results){
  const lease=await db.prepare("UPDATE inquiry_notifications SET lease_until=?,attempts=attempts+1 WHERE inquiry_id=? AND status!='sent' AND lease_until<=?").bind(now+300,row.inquiry_id,now).run();
  if(!lease.meta.changes)continue;
  try{
   const text='A new Elvarins customer-care request is saved.\nReference: '+row.inquiry_id+'\nTopic: '+row.topic+'\nItem: '+(row.sku||'Not specified')+'\n\nReview the request in the private Elvarins customer-services database. Customer contact details and message content are not included in this alert.';
   const result=await env.INQUIRY_EMAIL.send({from:{email:'notifications@notify.elvarins.com',name:'Elvarins Customer Care'},to:inbox,subject:'Elvarins request '+row.inquiry_id,text,html:'<p>A new Elvarins customer-care request is saved.</p><p>Reference: '+row.inquiry_id+'</p><p>Review the request in the private customer-services database.</p>'});
   await db.prepare("UPDATE inquiry_notifications SET status='sent',message_id=?,lease_until=0 WHERE inquiry_id=?").bind(result?.messageId||'',row.inquiry_id).run();sent++;
  }catch{
   await db.prepare("UPDATE inquiry_notifications SET status='failed',next_attempt=?,lease_until=0 WHERE inquiry_id=?").bind(now+600,row.inquiry_id).run();
   console.error(JSON.stringify({event:'inquiry_notification_failed',reference:row.inquiry_id}));
  }
 }
 return {enabled:true,sent};
}
