import { createAuthClient } from '@neondatabase/auth';
const AUTH_URL='https://ep-restless-pond-bdvrz7ad.neonauth.c-8.us-east-2.aws.neon.tech/lista_jogo/auth';
const auth=createAuthClient(new URL('/api/auth',window.location.origin).toString());
const $=id=>document.getElementById(id);
let currentUser=null,signup=false,roundRequest=null,roundInfo=null;
const onlineStatus=$('onlineStatus'),accountState=$('accountState');
const notice=$('accountNotice');
const text=(el,message)=>{if(el)el.textContent=message};
function feedback(kind,message){if(!notice)return;notice.hidden=false;notice.dataset.type=kind;notice.setAttribute('role',kind==='error'?'alert':'status');text(notice,message);}
function resetFeedback(){if(notice){notice.hidden=true;text(notice,'');notice.removeAttribute('data-type')}}
function friendlyError(error){const message=String(error?.message||error||'Erro desconhecido');
 if(/invalid.origin|untrusted.origin|trusted.origin/i.test(message))return 'Este endereço não está liberado para login. Use https://lista-jogo-web.vercel.app';
 if(/invalid email or password|invalid credentials|invalid password/i.test(message))return 'E-mail ou senha incorretos. Confira os dados e tente novamente.';
 if(/already.exists|already.registered|email.*in.use|user.already/i.test(message))return 'Este e-mail já foi cadastrado. Entre com sua conta ou use outro endereço.';
 if(/too.many|rate.limit|429/i.test(message))return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
 if(/password.*(short|characters|least)/i.test(message))return 'Use uma senha com pelo menos 8 caracteres.';
 if(/failed to fetch|networkerror|network.request.failed/i.test(message))return 'Falha de conexão. Verifique sua internet e tente novamente.';
 return message.length<220?message:'Não foi possível concluir a ação. Tente novamente.';
}
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

function setForm(mode){const nick=$('accountNick'),email=$('accountEmail'),pass=$('accountPass'),nickOnly=mode==='nickname',creating=mode==='signup';
 nick.parentElement.hidden=!(creating||nickOnly);email.parentElement.hidden=nickOnly;pass.parentElement.hidden=nickOnly;
 nick.required=creating||nickOnly;email.required=!nickOnly;pass.required=!nickOnly;
 pass.autocomplete=creating?'new-password':'current-password';pass.minLength=creating?8:6;
 $('accountForm').dataset.mode=mode;$('accountToggle').hidden=nickOnly;
 $('accountToggle').textContent=creating?'Já tenho conta':'Criar conta';
 $('accountSubmit').textContent=nickOnly?'Salvar apelido':creating?'Criar conta':'Entrar';
}
setForm('login');
$('accountToggle').addEventListener('click',()=>{signup=!signup;setForm(signup?'signup':'login');resetFeedback();text(accountState,signup?'Escolha e-mail, senha e apelido público.':'Entre com e-mail e senha.')});
async function refreshAccount(){try{await getUser();$('accountForm').hidden=!!currentUser;$('accountLogout').hidden=!currentUser;
 if(!currentUser){setForm(signup?'signup':'login');text(accountState,'Entre ou cadastre-se para participar do ranking mundial.');return false}
 const p=await api('profile','GET',null,true);
 if(p.profile){text(accountState,'Conectado como '+p.profile.nickname+'. Sprint e Turbo valem para o ranking.');$('accountForm').hidden=true}
 else{setForm('nickname');$('accountForm').hidden=false;text(accountState,'Conta autenticada! Escolha um apelido público para começar.')}
 return true;
}catch(error){text(accountState,'Não foi possível carregar todos os dados da conta.');feedback('error','Erro ao verificar a sessão/perfil: '+friendlyError(error));return false}}
$('accountForm').addEventListener('submit',async event=>{event.preventDefault();const btn=$('accountSubmit');if(btn.disabled)return;
 btn.disabled=true;const mode=$('accountForm').dataset.mode;btn.textContent='Aguarde…';resetFeedback();
 try{const email=$('accountEmail').value.trim(),password=$('accountPass').value,nick=$('accountNick').value.trim();
 if(mode==='nickname'){await api('profile','POST',{nickname:nick},true);await refreshAccount();feedback('success','Apelido salvo! Você já pode disputar o ranking.')}
 else if(mode==='signup'){
  if(!/^[A-Za-z0-9_]{3,20}$/.test(nick))throw new Error('Apelido deve ter de 3 a 20 caracteres, com letras, números e _.');
  if(password.length<8)throw new Error('Escolha uma senha com pelo menos 8 caracteres.');
  unwrap(await auth.signUp.email({email,password,name:nick}));$('accountPass').value='';
  try{await getUser();if(currentUser)await api('profile','POST',{nickname:nick},true)}
  catch(err){feedback('info','Conta criada! Falta finalizar seu perfil ou sua sessão: '+friendlyError(err));return}
  if(currentUser){await refreshAccount();feedback('success','Conta criada com sucesso! Você já está conectado e pode participar do ranking.')}
  else{signup=false;setForm('login');feedback('success','Cadastro realizado! Entre com seu e-mail e senha para continuar.')}
 }else{
  unwrap(await auth.signIn.email({email,password}));$('accountPass').value='';
  const ready=await refreshAccount();
  if(ready)feedback('success','Login realizado com sucesso! Bem-vindo de volta.');
  // refreshAccount já exibiu o motivo específico do erro; não substitua o aviso.
 }
 }catch(error){feedback('error',friendlyError(error))}
 finally{btn.disabled=false;const m=$('accountForm').dataset.mode;btn.textContent=m==='nickname'?'Salvar apelido':m==='signup'?'Criar conta':'Entrar'}});
$('accountLogout').addEventListener('click',async()=>{try{unwrap(await auth.signOut());currentUser=null;signup=false;await refreshAccount();feedback('success','Você saiu da conta com segurança.')}catch(error){feedback('error','Erro ao sair: '+friendlyError(error))}});
async function leaderboard(){const el=$('rankRows');el.replaceChildren();text(onlineStatus,'Carregando classificação mundial…');try{const out=await api('leaderboard');if(!out.rows?.length){text(onlineStatus,'Ainda não há partidas classificadas. Você pode ser o primeiro!');return}text(onlineStatus,'Ranking de recordes validados por desafio em Sprint e Turbo.');out.rows.forEach((r,i)=>{const div=document.createElement('div');div.className='rank-line';const p=document.createElement('b'),n=document.createElement('span'),s=document.createElement('strong');p.textContent='#'+(i+1);n.textContent=r.nickname;s.textContent=Number(r.total_score||0).toLocaleString('pt-BR')+' pts';div.append(p,n,s);el.append(div)})}catch(e){text(onlineStatus,'Ranking indisponível: '+e.message)}}
window.addEventListener('lista:roundstart',e=>{const d=e.detail;roundRequest=null;roundInfo=null;if(!currentUser||d.custom||!['sprint','turbo'].includes(d.mode))return;roundInfo={topicId:d.topicId,mode:d.mode};roundRequest=api('round','POST',{action:'start',topicId:d.topicId,mode:d.mode},true).catch(err=>({error:err.message}))});
window.addEventListener('lista:roundend',async e=>{const d=e.detail,req=roundRequest,info=roundInfo;roundRequest=null;roundInfo=null;if(!req||!info||d.custom||d.mode!==info.mode||d.topicId!==info.topicId)return;const result=$('resultText');try{const started=await req;if(started.error)throw new Error(started.error);const output=await api('round','POST',{action:'finish',roundId:started.roundId,guesses:d.guesses},true);if(result)result.textContent+=' • Ranking global: '+output.score.toLocaleString('pt-BR')+' pontos validados!'}catch(err){if(result)result.textContent+=' • Pontuação local salva; ranking: '+err.message}});
refreshAccount();
