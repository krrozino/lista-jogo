'use strict';
const {db,auth,respond,error,route,fail,catalog,isAdmin}=require('./_shared.cjs');
module.exports=async(req,res)=>{if(!route(req,res,['GET','POST']))return;try{
 const user=await auth(req),sql=db();if(!await isAdmin(sql,user))fail('Painel restrito a administradores autorizados.',403);
 if(req.method==='GET'){
  const rows=await sql`SELECT f.topic_id, count(*)::int AS reports,
  count(*) FILTER (WHERE f.kind='too_specific')::int AS too_specific,
  count(*) FILTER (WHERE f.kind='missing_answer')::int AS missing_answer,
  count(*) FILTER (WHERE f.kind='bad_question')::int AS bad_question,
  count(*) FILTER (WHERE f.kind='great')::int AS liked,
  max(f.updated_at) AS latest FROM public.lista_topic_feedback f
  GROUP BY f.topic_id ORDER BY (count(*) FILTER (WHERE f.kind<>'great')) DESC,max(f.updated_at) DESC LIMIT 100`;
  const overrides=await sql`SELECT topic_id,audience,featured,visible FROM public.lista_curations LIMIT 1000`;
  return respond(res,200,{reports:rows.map(r=>({...r,title:catalog.get(r.topic_id)?.title||r.topic_id,category:catalog.get(r.topic_id)?.category||'Outros'})),overrides})
 }
 const body=req.body||{},topicId=String(body.topicId||'');if(!catalog.has(topicId))fail('Tema inválido.',404);
 const aud=body.audience;if(!['casual','fandom','specialist'].includes(aud))fail('Classificação inválida.');
 const visible=body.visible!==false,featured=body.featured!==false;
 const rows=await sql`INSERT INTO public.lista_curations(topic_id,audience,visible,featured,updated_by)
 VALUES(${topicId},${aud},${visible},${featured},${user}::uuid)
 ON CONFLICT(topic_id) DO UPDATE SET audience=excluded.audience,visible=excluded.visible,featured=excluded.featured,updated_by=excluded.updated_by,updated_at=now()
 RETURNING topic_id,audience,featured,visible`;
 return respond(res,200,{saved:rows[0]})
 }catch(e){error(res,e)}};
