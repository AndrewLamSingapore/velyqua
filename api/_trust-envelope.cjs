const { createCipheriv, createDecipheriv, createHmac, randomBytes } = require('node:crypto');
const aad = (id, direction) => Buffer.from(`prime.trust.relay.v1:velyqua:${id}:${direction}`);
function keyBytes(key) {
  if (typeof key !== 'string' || !/^[a-f0-9]{64}$/.test(key)) throw Error('Trust key unavailable');
  return Buffer.from(key,'hex');
}
function seal(key,id,direction,value) {
  const nonce=randomBytes(12), cipher=createCipheriv('aes-256-gcm',keyBytes(key),nonce);
  cipher.setAAD(aad(id,direction));
  const ciphertext=Buffer.concat([cipher.update(JSON.stringify(value),'utf8'),cipher.final()]);
  return Buffer.concat([nonce,ciphertext,cipher.getAuthTag()]).toString('base64');
}
function open(key,id,direction,value) {
  if(typeof value!=='string'||value.length>65536) throw Error('Trust envelope invalid');
  const raw=Buffer.from(value,'base64');
  if(raw.length<28) throw Error('Trust envelope invalid');
  const cipher=createDecipheriv('aes-256-gcm',keyBytes(key),raw.subarray(0,12));
  cipher.setAAD(aad(id,direction)); cipher.setAuthTag(raw.subarray(-16));
  return JSON.parse(Buffer.concat([cipher.update(raw.subarray(12,-16)),cipher.final()]).toString('utf8'));
}
function fingerprint(key,id,value) {
  return createHmac('sha256',keyBytes(key)).update(aad(id,'request-fingerprint')).update(JSON.stringify(value)).digest('hex');
}
module.exports={seal,open,fingerprint};
