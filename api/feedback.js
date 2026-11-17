'use strict';
const {db,auth,respond,error,route,fail,catalog}=require('./_shared.cjs');
const KINDS=['too_specific','missing_answer','bad_question','unfun','great'];
module.exports=async(req,res)=>{if(!route(req,res,['POST']))return;try{
 const user=await auth(req),body=req.body||{},topicId=String(body.topicId||''),kind=String(body.kind||''),comment=String(body.comment||'').trim();
 if(!catalog.has(topicId))fail('Tema não encontrado.',404);
 if(!KINDS.includes(kind)||comment.length>350)fail('Avaliação inválida.');
 const sql=db();
 const limit=await sql`SELECT count(*)::int AS total FROM public.lista_topic_feedback WHERE user_id=${user}::uuid AND updated_at > now()-interval '1 hour'`;
 if(limit[0].total>=15)fail('Limite de avaliações por hora atingido.',429);
 const found=await sql`INSERT INTO public.lista_topic_feedback(user_id,topic_id,kind,comment)
 VALUES(${user}::uuid,${topicId},${kind},${comment})
 ON CONFLICT(user_id,topic_id,kind) DO UPDATE SET comment=excluded.comment,updated_at=now() RETURNING id`;
 return respond(res,200,{saved:Boolean(found.length),message:'Obrigado! Sua avaliação foi enviada à curadoria.'})
 }catch(e){error(res,e)}};
