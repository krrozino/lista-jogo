const {db,auth,respond,error,route,nickname,fail}=require('./_shared.cjs');
module.exports=async(req,res)=>{if(!route(req,res,['GET','POST']))return;try{const user=await auth(req),sql=db();
if(req.method==='GET'){const rows=await sql`SELECT user_id,nickname,created_at FROM public.lista_profiles WHERE user_id=${user}::uuid`;return respond(res,200,{profile:rows[0]||null})}
const nick=nickname(req.body?.nickname); const userRow=await sql`SELECT name FROM neon_auth."user" WHERE id=${user}::uuid`;if(!userRow.length)fail('Conta inválida.',401);
try{const rows=await sql`INSERT INTO public.lista_profiles(user_id,nickname) VALUES(${user}::uuid,${nick}) ON CONFLICT(user_id) DO UPDATE SET nickname=excluded.nickname,updated_at=now() RETURNING user_id,nickname,created_at`;return respond(res,200,{profile:rows[0]})}
catch(e){if(e.code==='23505'||/unique|duplicate/i.test(e.message))fail('Esse apelido já está em uso.',409);throw e}
}catch(e){error(res,e)}};
