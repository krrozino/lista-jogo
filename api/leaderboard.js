const {db,respond,error,route}=require('./_shared.cjs');
module.exports=async(req,res)=>{if(!route(req,res,['GET']))return;try{const sql=db();const rows=await sql`
 SELECT p.nickname,coalesce(sum(s.score),0)::int AS total_score,coalesce(sum(s.correct_count),0)::int AS correct_answers,count(s.user_id)::int AS challenges
 FROM public.lista_profiles p JOIN public.lista_best_scores s ON s.user_id=p.user_id
 GROUP BY p.user_id,p.nickname ORDER BY total_score DESC,correct_answers DESC,p.nickname ASC LIMIT 50`;
 respond(res,200,{rows,ranking:'best-per-topic-and-mode'})}catch(e){error(res,e)}};
