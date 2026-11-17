'use strict';
const {db,respond,error,route}=require('./_shared.cjs');
module.exports=async(req,res)=>{if(!route(req,res,['GET']))return;try{
 const sql=db(),rows=await sql`SELECT topic_id,audience,featured,visible FROM public.lista_curations ORDER BY topic_id LIMIT 1000`;
 respond(res,200,{overrides:rows})
 }catch(e){error(res,e)}};
