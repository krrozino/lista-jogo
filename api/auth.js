'use strict';
const UPSTREAM = 'https://ep-restless-pond-bdvrz7ad.neonauth.c-8.us-east-2.aws.neon.tech/lista_jogo/auth';
const SKIP_REQUEST = new Set(['host','connection','content-length','transfer-encoding','accept-encoding','x-forwarded-host','x-forwarded-proto','x-forwarded-for','cf-connecting-ip']);
const SKIP_RESPONSE = new Set(['content-length','content-encoding','transfer-encoding','connection','access-control-allow-origin','access-control-allow-credentials','set-cookie']);
module.exports = async (req,res) => {
 try {
  const raw = Array.isArray(req.query?.path) ? req.query.path.join('/') : String(req.query?.path||'');
  if (!raw || raw.includes('..') || !/^[a-z\d_./-]+$/i.test(raw)) {res.statusCode=400;res.end('Invalid auth path');return}
  const target=new URL(UPSTREAM+'/'+raw);
  const original=new URL(req.url,'https://lista-jogo.vercel.app');
  for(const [key,value] of original.searchParams){if(key!=='path')target.searchParams.append(key,value)}
  const headers=new Headers();
  for(const [key,value] of Object.entries(req.headers||{})) {
   if(SKIP_REQUEST.has(key.toLowerCase())||value==null)continue;
   headers.set(key,Array.isArray(value)?value.join(', '):String(value));
  }
  let body;
  if(!['GET','HEAD'].includes(req.method)){
   if(Buffer.isBuffer(req.body)) body=req.body;
   else if(typeof req.body==='string')body=req.body;
   else if(req.body!==undefined&&req.body!==null)body=JSON.stringify(req.body);
   else body=undefined;
  }
  const upstream=await fetch(target,{method:req.method,headers,body,redirect:'manual',signal:AbortSignal.timeout(15000)});
  res.statusCode=upstream.status;
  for(const [key,value] of upstream.headers){if(!SKIP_RESPONSE.has(key.toLowerCase()))res.setHeader(key,value)}
  const cookies=upstream.headers.getSetCookie();
  if(cookies.length)res.setHeader('set-cookie',cookies.map(cookie=>cookie.replace(/;\s*Domain=[^;]*/gi,'').replace(/;\s*Partitioned\b/gi,'')));
  res.setHeader('cache-control','no-store');
  res.end(Buffer.from(await upstream.arrayBuffer()));
 }catch(error){console.error('Neon Auth proxy:',error?.message);res.statusCode=502;res.setHeader('content-type','application/json; charset=utf-8');res.end(JSON.stringify({error:'Serviço de autenticação temporariamente indisponível.'}))}
};
