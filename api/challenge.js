'use strict';
const crypto=require('node:crypto');
const {db,auth,respond,error,route,fail,catalog}=require('./_shared.cjs');
function chooseFive(){const pool=[...catalog.values()].filter(t=>t.curation==='featured'&&t.audience==='casual'&&t.level==='Fácil'&&t.answers.length>=4&&t.answers.length<=20);
 const picks=[],categories=new Set();for(const t of pool.sort(()=>Math.random()-.5)){if(categories.has(t.category))continue;picks.push(t.id);categories.add(t.category);if(picks.length===5)break}return picks}
module.exports=async(req,res)=>{if(!route(req,res,['GET','POST']))return;try{const sql=db();
 if(req.method==='POST'){
  const user=await auth(req),limit=await sql`SELECT count(*)::int AS total FROM public.lista_challenges WHERE creator_id=${user}::uuid AND created_at > now()-interval '24 hours'`;
  if(limit[0].total>=10)fail('Limite de 10 convites por dia.',429);
  const profile=await sql`SELECT 1 FROM public.lista_profiles WHERE user_id=${user}::uuid LIMIT 1`;
  if(!profile.length)fail('Escolha um apelido para criar desafios com ranking.',409);
  const code=crypto.randomBytes(10).toString('hex').slice(0,10).toUpperCase(),ids=chooseFive();
  if(ids.length!==5)fail('Não há temas suficientes para o desafio.',503);
  const rows=await sql`INSERT INTO public.lista_challenges(code,creator_id,topic_ids) VALUES(${code},${user}::uuid,${JSON.stringify(ids)}::jsonb) RETURNING code,topic_ids,expires_at`;
  return respond(res,201,{challenge:{code:rows[0].code,topics:rows[0].topic_ids,expiresAt:rows[0].expires_at}});
 }
 const code=String(req.query?.code||'').toUpperCase();if(!/^[A-Z0-9]{10}$/.test(code))fail('Código inválido.',400);
 const rooms=await sql`SELECT id,code,topic_ids,expires_at FROM public.lista_challenges WHERE code=${code} AND expires_at>now() LIMIT 1`;
 if(!rooms.length)fail('Este convite expirou ou não existe.',404);
 const room=rooms[0];
 // Highest verified score per player and topic in this room, no client-supplied scores.
 const scoreboard=await sql`SELECT p.nickname,coalesce(sum(z.best),0)::int AS total_score,count(z.best)::int AS rounds
  FROM public.lista_profiles p JOIN (SELECT user_id,topic_id,max(score)::int AS best FROM public.lista_rounds
  WHERE challenge_id=${room.id}::uuid AND finished_at IS NOT NULL GROUP BY user_id,topic_id) z ON z.user_id=p.user_id
  GROUP BY p.user_id,p.nickname ORDER BY total_score DESC,rounds DESC LIMIT 30`;
 return respond(res,200,{challenge:{code:room.code,topics:room.topic_ids,expiresAt:room.expires_at},rows:scoreboard})
 }catch(e){error(res,e)}};
