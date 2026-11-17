'use strict';
const {db,auth,respond,error,route,fail,catalog,score}=require('./_shared.cjs');
module.exports=async(req,res)=>{if(!route(req,res,['POST']))return;try{
 const user=await auth(req),sql=db(),act=req.body?.action;
 if(act==='start'){
  const mode=req.body?.mode,topicId=req.body?.topicId;
  if(!['sprint','turbo'].includes(mode))fail('Modo não competitivo.',400);
  if(typeof topicId!=='string'||!catalog.has(topicId))fail('Desafio não encontrado.',404);
  const profile=await sql`SELECT 1 FROM public.lista_profiles WHERE user_id=${user}::uuid`;
  if(!profile.length)fail('Escolha seu apelido antes de participar do ranking.',409);
  const limits=await sql`SELECT count(*)::int AS attempts,count(*) FILTER(WHERE finished_at IS NULL AND started_at>now()-interval '150 seconds')::int AS active FROM public.lista_rounds WHERE user_id=${user}::uuid AND started_at>now()-interval '1 hour'`;
  if(limits[0].attempts>=40)fail('Limite de 40 partidas classificadas por hora.',429);
  if(limits[0].active>0)fail('Você já iniciou uma partida classificada. Aguarde até ela expirar.',409);
  let challengeId=null;const code=req.body?.challengeCode;
  if(code){if(mode!=='sprint'||!/^\w{10}$/.test(code))fail('Desafio de amigos deve usar Sprint.',400);
   const rooms=await sql`SELECT id,topic_ids FROM public.lista_challenges WHERE code=${code} AND expires_at>now() LIMIT 1`;
   if(!rooms.length||!rooms[0].topic_ids.includes(topicId))fail('O tema não faz parte do convite.',409);
   challengeId=rooms[0].id;
  }
  const rows=await sql`INSERT INTO public.lista_rounds(user_id,topic_id,mode,challenge_id) VALUES(${user}::uuid,${topicId},${mode},${challengeId}::uuid) RETURNING id`;
  return respond(res,201,{roundId:rows[0].id,mode,limit:mode==='turbo'?45:90});
 }
 if(act==='finish'){
  const id=req.body?.roundId;if(!/^[0-9a-f-]{36}$/i.test(id||''))fail('Identificador inválido.');
  const guesses=req.body?.guesses;if(!Array.isArray(guesses)||guesses.length>300||guesses.some(x=>typeof x!=='string'||x.length>120))fail('Lista de tentativas inválida.');
  if(Number(req.body?.hints||0)>0)fail('Partidas com dicas não pontuam no ranking. Jogue novamente sem dicas.',409);
  const found=await sql`SELECT id,topic_id,mode,started_at,finished_at FROM public.lista_rounds WHERE id=${id}::uuid AND user_id=${user}::uuid LIMIT 1`;
  if(!found.length)fail('Partida não encontrada.',404);const r=found[0];if(r.finished_at)fail('Partida já concluída.',409);
  const elapsed=(Date.now()-Date.parse(r.started_at))/1000,seconds=r.mode==='turbo'?45:90;
  if(elapsed<3||elapsed>seconds+20)fail('Esta partida expirou ou terminou cedo demais.',409);
  const t=catalog.get(r.topic_id);if(!t)fail('Desafio descontinuado.',409);
  const scored=score(t,guesses);
  const changed=await sql`UPDATE public.lista_rounds SET finished_at=now(),score=${scored.score},correct_count=${scored.correct},guesses_count=${guesses.length} WHERE id=${id}::uuid AND user_id=${user}::uuid AND finished_at IS NULL RETURNING id`;
  if(!changed.length)fail('Partida já registrada.',409);
  await sql`INSERT INTO public.lista_best_scores(user_id,topic_id,mode,score,correct_count,round_id)
  VALUES(${user}::uuid,${r.topic_id},${r.mode},${scored.score},${scored.correct},${id}::uuid)
  ON CONFLICT(user_id,topic_id,mode) DO UPDATE SET score=excluded.score,correct_count=excluded.correct_count,round_id=excluded.round_id,achieved_at=now()
  WHERE excluded.score>public.lista_best_scores.score`;
  return respond(res,200,{score:scored.score,correct:scored.correct,goalMet:scored.goalMet,recorded:true});
 }
 fail('Ação inválida.');
 }catch(e){error(res,e)}};
