const { randomUUID } = require('node:crypto');
const { seal, open, fingerprint } = require('./_trust-envelope.cjs');
const allowed = new Set(['session','refresh','authorize','client/people','client/devices',
  'client/invitations','client/revoke-invitation','client/revoke-device']);

/** Same-origin BFF. Only encrypted application-bound payloads cross Portal. */
module.exports = async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  const { PRIME_TRUST_ORIGIN:origin, PRIME_TRUST_RELAY_URL:relay,
    PRIME_TRUST_RELAY_TOKEN:token, PRIME_TRUST_ENVELOPE_KEY:key } = process.env;
  if (!origin || !relay || !token || !/^[a-f0-9]{64}$/.test(key || '')) return res.status(503).json({error:'TRUST_NOT_CONFIGURED'});
  let endpoint, local;
  try { endpoint=new URL(relay); local=new URL(origin); }
  catch { return res.status(503).json({error:'TRUST_NOT_CONFIGURED'}); }
  if (endpoint.protocol!=='https:' || endpoint.username || endpoint.password || endpoint.hash
      || local.protocol!=='https:' || local.origin!==origin) return res.status(503).json({error:'TRUST_NOT_CONFIGURED'});
  if(req.method!=='POST') return res.status(405).json({error:'METHOD_DENIED'});
  if(req.headers.origin!==origin || req.headers.host!==local.host) return res.status(403).json({error:'ORIGIN_DENIED'});
  const operation=req.query?.operation;
  if(!allowed.has(operation)) return res.status(403).json({error:'OPERATION_UNAVAILABLE'});
  let body;
  try {
    body=typeof req.body==='string'?JSON.parse(req.body):req.body;
    if(!body || Array.isArray(body) || JSON.stringify(body).length>4096) throw Error();
  } catch { return res.status(422).json({error:'INVALID_REQUEST'}); }
  const cookies={};
  for(const part of String(req.headers.cookie||'').split(';')) {
    const [name,...values]=part.trim().split('=');
    if(/^__Host-prime-trust-velyqua-(session|credential|device)$/.test(name)) {
      if(Object.hasOwn(cookies,name)) return res.status(403).json({error:'COOKIE_DENIED'});
      cookies[name]=values.join('=');
    }
  }
  const id=req.headers['x-prime-request-id'] || randomUUID();
  if(typeof id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id)) return res.status(422).json({error:'INVALID_REQUEST_ID'});
  async function request(value) {
    const response=await fetch(relay,{method:'POST',redirect:'error',signal:AbortSignal.timeout(3000),
      headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(value)});
    if(!response.ok) throw Error('Relay unavailable');
    if(!response.body) throw Error('Missing response');
    const chunks=[]; let length=0;
    for await(const chunk of response.body) {
      length+=chunk.length; if(length>70000) throw Error('Response bounds');
      chunks.push(Buffer.from(chunk));
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  }
  try {
    const payload={operation,body,cookies};
    const proof=fingerprint(key,id,payload);
    const submitted=await request({action:'submit',id,fingerprint:proof,
      ciphertext:seal(key,id,'request',{...payload,issued_at:Date.now()/1000})});
    if(submitted.accepted!==true) throw Error('Request unavailable');
    const deadline=Date.now()+8000;
    do {
      const result=await request({action:'result',id,fingerprint:proof});
      if(result.response) {
        const value=open(key,id,'response',result.response);
        if(!Number.isInteger(value.status)||value.status<200||value.status>599||!Array.isArray(value.cookies)
          ||value.cookies.length>3||value.cookies.some(c=>typeof c!=='string'||c.length>1024
            ||!/^__Host-prime-trust-velyqua-(session|device|credential)=/.test(c)
            ||!c.includes('HttpOnly')||!c.includes('Secure')||!c.includes('SameSite=strict')||c.includes('Domain=')||/[\r\n]/.test(c))) throw Error('Response denied');
        if(value.cookies.length) res.setHeader('Set-Cookie',value.cookies);
        res.setHeader('X-PRIME-Trust-Protocol','prime.trust.http.v1');
        return res.status(value.status).json(value.body);
      }
      await new Promise(resolve=>setTimeout(resolve,200));
    } while(Date.now()<deadline);
    return res.status(503).json({error:'TRUST_RESULT_PENDING',request_id:id});
  } catch { return res.status(503).json({error:'TRUST_TRANSPORT_UNAVAILABLE',request_id:id}); }
};
