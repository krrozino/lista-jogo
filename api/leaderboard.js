'use strict';
const {db,respond,error,route,catalog}=require('./_shared.cjs');
module.exports=async(req,res)=>{if(!route(req,res,['GET']))return;try{
 const audience=['casual','fandom','specialist','all'].includes(req.query?.audience)?req.query.audience:'casual';
 const mode=['sprint','turbo','all'].includes(req.query?.mode)?req.query.mode:'sprint';
 const ids=[...catalog.values()].filter(t=>audience==='all'||t.audience===audience).map(t=>t.id);
 const sql=db(),allowed=JSON.stringify(ids);
 const rows=await sql`SELECT p.nickname,coalesce(sum(s.score),0)::int AS total_score,coalesce(sum(s.correct_count),0)::int AS correct_answers,count(s.user_id)::int AS challenges
 FROM public.lista_profiles p JOIN public.lista_best_scores s ON s.user_id=p.user_id
 WHERE s.topic_id IN (SELECT jsonb_array_elements_text(${allowed}::jsonb)) AND (${mode}='all' OR s.mode=${mode})
 GROUP BY p.user_id,p.nickname ORDER BY total_score DESC,correct_answers DESC,p.nickname ASC LIMIT 50`;
 return respond(res,200,{rows,ranking:'best-per-topic-and-mode',audience,mode})
 }catch(e){error(res,e)}};
