const {neon}=require('@neondatabase/serverless');
const path=require('node:path');
const topics=require('../data/topics.json');
const catalog=new Map(topics.map(t=>[t.id,t]));
const jwksURL=process.env.NEON_AUTH_JWKS_URL;
let jwks;
function db(){if(!process.env.DATABASE_URL)throw Object.assign(new Error('Banco não configurado'),{status:503});return neon(process.env.DATABASE_URL)}
async function auth(req){const h=req.headers.authorization||'';const token=h.startsWith('Bearer ')?h.slice(7):'';if(!token)throw Object.assign(new Error('Entre na sua conta.'),{status:401});if(!jwksURL)throw Object.assign(new Error('Autenticação indisponível.'),{status:503});
 const {createRemoteJWKSet,jwtVerify}=await import('jose');if(!jwks)jwks=createRemoteJWKSet(new URL(jwksURL));
 let payload;try{({payload}=await jwtVerify(token,jwks,{algorithms:['ES256','RS256','EdDSA'],clockTolerance:5}));}catch{throw Object.assign(new Error('Sessão inválida ou expirada.'),{status:401})}
 if(!/^[0-9a-f-]{36}$/i.test(payload.sub||''))throw Object.assign(new Error('Identidade inválida.'),{status:401});
 const sql=db();const found=await sql`SELECT id FROM neon_auth."user" WHERE id=${payload.sub}::uuid AND coalesce(banned,false)=false LIMIT 1`;if(!found.length)throw Object.assign(new Error('Conta não encontrada.'),{status:401});return payload.sub;
}
function respond(res,code,data){res.statusCode=code;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(data))}
function error(res,e){const code=Number.isInteger(e.status)?e.status:500;if(code===500)console.error('LISTA API:',e?.message||e);respond(res,code,{error:code===500?'Erro interno do servidor.':e.message})}
function route(req,res,methods){if(!methods.includes(req.method)){res.setHeader('Allow',methods.join(', '));respond(res,405,{error:'Método não permitido.'});return false}return true}
function fail(msg,status=400){throw Object.assign(new Error(msg),{status})}
function nickname(value){const v=String(value||'').trim();if(!/^[A-Za-z0-9_]{3,20}$/.test(v))fail('Apelido: 3 a 20 caracteres, letras sem acento, números ou _.');return v}
function norm(input,t){let s=String(input||'').trim();if(t.id==='porques')return s.toLowerCase().replace(/\s+/g,' ');
 if(t.id==='grupos-sanguineos'&&/^(?:AB|A|B|O)\s*[+-]$/i.test(s))s=s.slice(0,-1).trim()+(s.endsWith('+')?' positivo':' negativo');
 if(t.id==='operacoes'&&['+','-','*','/'].includes(s))s={'+':'mais','-':'menos','*':'vezes','/':'dividir'}[s];
 if(t.id==='pontuacao-final'&&['.','?','!','...'].includes(s))s={'.':'ponto final','?':'ponto de interrogacao','!':'ponto de exclamacao','...':'reticencias'}[s];
 return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ')
}
function score(t,guesses){const map=new Map();for(const answer of t.answers)for(const alias of [answer,...(t.aliases?.[answer]||[])]){const k=norm(alias,t);if(!map.has(k))map.set(k,answer)}
 const seen=new Set();let streak=0,total=0,correct=0;const mult={'Fácil':1,'Médio':1.15,'Difícil':1.4,'Lendário':1.75}[t.level]||1;
 for(const g of guesses){const match=map.get(norm(g,t));if(match&&seen.has(match))continue;if(match){seen.add(match);correct++;streak++;total+=Math.round((100+Math.min(10,streak-1)*12)*mult)}else streak=0}
 return {score:total,correct}
}
module.exports={db,auth,respond,error,route,fail,nickname,catalog,score};
