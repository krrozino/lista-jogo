import { createAuthClient } from '@neondatabase/auth';
const AUTH_URL='https://ep-restless-pond-bdvrz7ad.neonauth.c-8.us-east-2.aws.neon.tech/lista_jogo/auth';
const auth=createAuthClient(AUTH_URL);
const $=id=>document.getElementById(id);
let currentUser=null,signup=false,roundRequest=null,roundInfo=null;
const onlineStatus=$('onlineStatus'),accountState=$('accountState');
const text=(el,message)=>{if(el)el.textContent=message};
const unwrap=result=>{if(result?.error)throw new Error(result.error.message||'Falha no serviço de autenticação.');return result?.data??result};
async function getUser(){const s=unwrap(await auth.getSession());currentUser=s?.user||null;return currentUser}
async function token(){const jwt=await auth.getJWTToken?.();if(!jwt)throw new Error('Faça login antes de jogar no ranking.');return jwt}
async function api(path,method='GET',body=null,protectedRequest=false){const h={'Content-Type':'application/json'};if(protectedRequest)h.Authorization='Bearer '+await token();const response=await fetch('/api/'+path,{method,headers:h,body:body===null?undefined:JSON.stringify(body),cache:'no-store'});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'Falha na API ('+response.status+')');return data}
const btns=['onlineBtn','rankCall','rankView'];for(const id of btns)$(id)?.addEventListener('click',()=>open('leaderboard'));
$('onlineClose').addEventListener('click',()=>$('onlineDialog').close());
$('onlineDialog').addEventListener('click',e=>{if(e.target===$('onlineDialog'))$('onlineDialog').close()});
function showTab(name){$('onlineLeaderboard').hidden=name!=='leaderboard';$('onlineAccount').hidden=name!=='account';$('onlineLeaderboardTab').classList.toggle('active',name==='leaderboard');$('onlineAccountTab').classList.toggle('active',name==='account');if(name==='leaderboard')leaderboard();else refreshAccount()}
function open(name){$('onlineDialog').showModal();showTab(name)}
$('onlineLeaderboardTab').addEventListener('click',()=>showTab('leaderboard'));
$('onlineAccountTab').addEventListener('click',()=>showTab('account'));
$('accountNick').parentElement.hidden=true;
$('accountToggle').addEventListener('click',()=>{signup=!signup;$('accountNick').parentElement.hidden=!signup;$('accountSubmit').textContent=signup?'Criar conta':'Entrar';$('accountToggle').textContent=signup?'Já tenho conta':'Criar conta';text(accountState,signup?'Escolha e-mail, senha e apelido público.':'Entre com e-mail e senha.')});
async function refreshAccount(){try{await getUser();$('accountForm').hidden=!!currentUser;$('accountLogout').hidden=!currentUser;if(!currentUser){text(accountState,'Entre ou cadastre-se para participar do ranking mundial.');return}
 const p=await api('profile','GET',null,true);text(accountState,p.profile?'Conectado como '+p.profile.nickname+'. Sprint e Turbo valem para o ranking.':'Conta autenticada. Escolha um apelido para entrar no ranking.');
 if(!p.profile){$('accountForm').hidden=false;signup=true;$('accountNick').parentElement.hidden=false;$('accountEmail').parentElement.hidden=true;$('accountPass').parentElement.hidden=true;$('accountSubmit').textContent='Salvar apelido';$('accountToggle').hidden=true;}
 else{$('accountEmail').parentElement.hidden=false;$('accountPass').parentElement.hidden=false;$('accountToggle').hidden=false;}
}catch(e){text(accountState,'Não foi possível verificar a sessão: '+e.message)}}
$('accountForm').addEventListener('submit',async e=>{e.preventDefault();const btn=$('accountSubmit');btn.disabled=true;try{const email=$('accountEmail').value.trim(),password=$('accountPass').value,nick=$('accountNick').value.trim();
 if(currentUser){await api('profile','POST',{nickname:nick},true)}
 else if(signup){if(!/^[A-Za-z0-9_]{3,20}$/.test(nick))throw new Error('Apelido de 3 a 20 caracteres, usando letras, números e _.');unwrap(await auth.signUp.email({email,password,name:nick}));await getUser();if(!currentUser){text(accountState,'Conta criada. Faça login ou confirme sua conta se solicitado.');return}await api('profile','POST',{nickname:nick},true)}
 else{unwrap(await auth.signIn.email({email,password}));await getUser()}
 await refreshAccount();
 }catch(err){text(accountState,err.message)}finally{btn.disabled=false}});
$('accountLogout').addEventListener('click',async()=>{try{unwrap(await auth.signOut())}catch(e){text(accountState,e.message)}currentUser=null;await refreshAccount()});
async function leaderboard(){const el=$('rankRows');el.replaceChildren();text(onlineStatus,'Carregando classificação mundial…');try{const out=await api('leaderboard');if(!out.rows?.length){text(onlineStatus,'Ainda não há partidas classificadas. Você pode ser o primeiro!');return}text(onlineStatus,'Ranking de recordes validados por desafio em Sprint e Turbo.');out.rows.forEach((r,i)=>{const div=document.createElement('div');div.className='rank-line';const p=document.createElement('b'),n=document.createElement('span'),s=document.createElement('strong');p.textContent='#'+(i+1);n.textContent=r.nickname;s.textContent=Number(r.total_score||0).toLocaleString('pt-BR')+' pts';div.append(p,n,s);el.append(div)})}catch(e){text(onlineStatus,'Ranking indisponível: '+e.message)}}
window.addEventListener('lista:roundstart',e=>{const d=e.detail;roundRequest=null;roundInfo=null;if(!currentUser||d.custom||!['sprint','turbo'].includes(d.mode))return;roundInfo={topicId:d.topicId,mode:d.mode};roundRequest=api('round','POST',{action:'start',topicId:d.topicId,mode:d.mode},true).catch(err=>({error:err.message}))});
window.addEventListener('lista:roundend',async e=>{const d=e.detail,req=roundRequest,info=roundInfo;roundRequest=null;roundInfo=null;if(!req||!info||d.custom||d.mode!==info.mode||d.topicId!==info.topicId)return;const result=$('resultText');try{const started=await req;if(started.error)throw new Error(started.error);const output=await api('round','POST',{action:'finish',roundId:started.roundId,guesses:d.guesses},true);if(result)result.textContent+=' • Ranking global: '+output.score.toLocaleString('pt-BR')+' pontos validados!'}catch(err){if(result)result.textContent+=' • Pontuação local salva; ranking: '+err.message}});
refreshAccount();
