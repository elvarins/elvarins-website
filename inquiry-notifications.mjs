// Alerts only the owner's fixed business inbox. Activation requires a verified
// Cloudflare Email Service sender, destination and restricted Worker binding.
const inbox='sales@elvarins.com';
const enabled=env=>env.INQUIRY_EMAIL_ENABLED==='true'&&typeof env.INQUIRY_EMAIL?.send==='function';
export async function queueInquiryNotification(env,id){
 if(!enabled(env))return false;
 await env.CUSTOMER_DB.prepare('INSERT OR IGNORE INTO inquiry_notifications(inquiry_id,status,attempts,next_attempt,lease_until) VALUES(?,\'pending\',0,0,0)').bind(id).run();
 return true;
}
export async function deliverInquiryNotifications(env,MessageType){
 if(!enabled(env))return {enabled:false,sent:0};
 const db=env.CUSTOMER_DB,now=Math.floor(Date.now()/1000);
 const rows=await db.prepare("SELECT n.inquiry_id,i.topic,i.sku,i.name,i.email,i.message FROM inquiry_notifications n JOIN inquiries i ON i.id=n.inquiry_id WHERE n.status!='sent' AND n.attempts<5 AND n.next_attempt<=? AND n.lease_until<=? ORDER BY i.created_at LIMIT 3").bind(now,now).all();
 let sent=0;
 for(const row of rows.results){
  const lease=await db.prepare("UPDATE inquiry_notifications SET lease_until=?,attempts=attempts+1 WHERE inquiry_id=? AND status!='sent' AND lease_until<=?").bind(now+300,row.inquiry_id,now).run();
  if(!lease.meta.changes)continue;
  try{
   const text='New Elvarins website inquiry\n\nReference: '+row.inquiry_id+'\nName: '+row.name+'\nEmail: '+row.email+'\nTopic: '+row.topic+'\nItem: '+(row.sku||'Not specified')+'\n\nMessage:\n'+row.message+'\n\nReply to this email to contact the customer. This is an inquiry, not an order confirmation.';
   const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
   const html='<h2>New Elvarins website inquiry</h2><p><strong>Reference:</strong> '+escape(row.inquiry_id)+'<br><strong>Name:</strong> '+escape(row.name)+'<br><strong>Email:</strong> '+escape(row.email)+'<br><strong>Topic:</strong> '+escape(row.topic)+'<br><strong>Item:</strong> '+escape(row.sku||'Not specified')+'</p><p><strong>Message</strong></p><div style="white-space:pre-wrap">'+escape(row.message)+'</div><p>Reply to this email to contact the customer. This is an inquiry, not an order confirmation.</p>';
   const encode=value=>btoa(Array.from(new TextEncoder().encode(value),byte=>String.fromCharCode(byte)).join('')).match(/.{1,76}/g)?.join('\r\n')||'';
   const boundary='elvarins-'+row.inquiry_id;
   const raw=['From: Elvarins Customer Care <notifications@notify.elvarins.com>','To: '+inbox,'Reply-To: '+String(row.email).replace(/[\r\n]/g,''),'Subject: Elvarins inquiry '+row.inquiry_id,'Message-ID: <'+row.inquiry_id+'@notify.elvarins.com>','Date: '+new Date().toUTCString(),'MIME-Version: 1.0','Content-Type: multipart/alternative; boundary="'+boundary+'"','','--'+boundary,'Content-Type: text/plain; charset=utf-8','Content-Transfer-Encoding: base64','',encode(text),'--'+boundary,'Content-Type: text/html; charset=utf-8','Content-Transfer-Encoding: base64','',encode(html),'--'+boundary+'--',''].join('\r\n');
   const Email=MessageType||(await import('cloudflare:email')).EmailMessage;
   const result=await env.INQUIRY_EMAIL.send(new Email('notifications@notify.elvarins.com',inbox,raw));
   await db.prepare("UPDATE inquiry_notifications SET status='sent',message_id=?,lease_until=0 WHERE inquiry_id=?").bind(result?.messageId||'',row.inquiry_id).run();sent++;
  }catch(error){
   await db.prepare("UPDATE inquiry_notifications SET status='failed',next_attempt=?,lease_until=0 WHERE inquiry_id=?").bind(now+600,row.inquiry_id).run();
   console.error(JSON.stringify({event:'inquiry_notification_failed',reference:row.inquiry_id,code:String(error.code||error.name||'unknown'),reason:String(error.message||'').replace(/[^\s<>@]+@[^\s<>@]+/g,'[address]').slice(0,240)}));
  }
 }
 return {enabled:true,sent};
}
