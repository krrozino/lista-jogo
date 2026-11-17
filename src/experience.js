/* LISTA! Beta 0.5 - curadoria, avaliações e convites em tempo real. */
const $=id=>document.getElementById(id),app=window.LISTA_APP;
const text=(id,v)=>{if($(id))$(id).textContent=v};
const PORTAL='https://lista-jogo.vercel.app/';
let pendingInvite=null,adminEligible=false,pendingFeedback=readQueued();
function readQueued(){try{const r=JSON.parse(localStorage.getItem('lista-feedback-queue')||'[]');return Array.isArray(r)?r.slice(-20):[]}catch{return []}}
function saveQueued(){try{localStorage.setItem('lista-feedback-queue',JSON.stringify(pendingFeedback.slice(-20)))}catch{}}
async function api(path,method='GET',payload){const response=await fetch('/api/'+path,{method,headers:{'content-type':'application/json'},credentials:'same-origin',body:payload===undefined?undefined:JSON.stringify(payload),cache:'no-store'});
 const j=await response.json().catch(()=>({}));if(!response.ok)throw Object.assign(new Error(j.error||'HTTP '+response.status),{status:response.status});return j}
function status(id,value,kind=''){text(id,value);if($(id))$(id).dataset.state=kind}
async function clipboard(value){try{await navigator.clipboard.writeText(value);return true}catch{const el=document.createElement('textarea');el.value=value;document.body.append(el);el.select();const ok=document.execCommand?.('copy');el.remove();return Boolean(ok)}}
function openDialog(id){const d=$(id);if(!d.open)d.showModal()}
function closeDialog(id){$(id).close()}
for(const id of ['shareChallengeBtn','challengeOpenBtn'])$(id)?.addEventListener('click',()=>{openDialog('shareChallengeDialog');if(pendingInvite)showInvite(pendingInvite)});
$('feedbackBtn')?.addEventListener('click',()=>{const topic=app.getTopic();if(!topic)return;text('feedbackTopicTitle',topic.title);$('feedbackStatus').textContent='';$('feedbackComment').value='';openDialog('topicFeedbackDialog')});
$('feedbackForm')?.addEventListener('submit',async event=>{event.preventDefault();const t=app.getTopic();if(!t)return;
 const kind=$('feedbackKind').value,comment=$('feedbackComment').value.trim();$('feedbackSend').disabled=true;app.localRating(t.id,kind);
 try{const r=await api('feedback','POST',{topicId:t.id,kind,comment});status('feedbackStatus',r.message||'Avaliação enviada.','success');}
 catch(e){if(e.status===401){pendingFeedback.push({topicId:t.id,kind,comment});saveQueued();status('feedbackStatus','Sua avaliação foi salva neste navegador. Para enviá-la ao projeto, entre na sua conta.','success')}
 else status('feedbackStatus','Não conseguimos enviar: '+e.message,'error')}
 finally{$('feedbackSend').disabled=false}
});
async function flushQueue(){if(!pendingFeedback.length)return;let remaining=[];for(const item of pendingFeedback){try{await api('feedback','POST',item)}catch(e){remaining.push(item);if(e.status===401)break}}pendingFeedback=remaining;saveQueued()}
function randomFive(){let list=app.allTopics().filter(t=>t.audience==='casual'&&t.curation==='featured'&&t.level==='Fácil'&&t.answers.length>=4&&t.answers.length<=20);const picks=[],seen=new Set();while(list.length&&picks.length<5){const i=Math.floor(Math.random()*list.length),t=list.splice(i,1)[0];if(seen.has(t.category))continue;seen.add(t.category);picks.push(t.id)}return picks}
function invitationUrl(invite){const url=new URL(PORTAL);if(invite.code)url.searchParams.set('desafio',invite.code);else url.searchParams.set('lista',invite.topics.join(','));return url.toString()}
function showInvite(invite){pendingInvite=invite;let url=invitationUrl(invite);$('challengeLink').hidden=false;text('challengeLink',url);$('challengeCopy').hidden=false;$('challengeStart').hidden=false;
 text('shareStatus',invite.code?'Convite online criado! Entre com uma conta para aparecer na classificação dos amigos.':'Convite local pronto! Para comparar pontuações automaticamente, faça login e gere um convite online.');
 if(invite.code)loadStandings(invite.code)}
async function loadStandings(code){try{const d=await api('challenge?code='+encodeURIComponent(code));const root=$('challengeLeaderboard');root.replaceChildren();if(!d.rows?.length){root.textContent='Ainda não há resultados classificados. Participe para inaugurar o placar.';return}
  d.rows.forEach((r,i)=>{const line=document.createElement('div');line.className='rank-line';const b=document.createElement('b'),n=document.createElement('span'),p=document.createElement('strong');b.textContent='#'+(i+1);n.textContent=r.nickname+' ('+r.rounds+'/5)';p.textContent=Number(r.total_score||0).toLocaleString('pt-BR')+' pts';line.append(b,n,p);root.append(line)})
 }catch(e){text('challengeLeaderboard','Placar temporariamente indisponível: '+e.message)}}
$('challengeCreate')?.addEventListener('click',async()=>{
 $('challengeCreate').disabled=true;status('shareStatus','Gerando convite…');
 try{const data=await api('challenge','POST',{});showInvite(data.challenge)}
 catch(e){const ids=randomFive();if(ids.length!==5){status('shareStatus','Não foi possível escolher cinco desafios diferentes.','error');return}showInvite({topics:ids,code:null});}
 finally{$('challengeCreate').disabled=false}
});
$('challengeCopy')?.addEventListener('click',async()=>{if(!pendingInvite)return;const url=invitationUrl(pendingInvite);status('shareStatus',(await clipboard(url))?'Link copiado! Envie aos seus amigos.':'Copie o endereço exibido abaixo.');});
$('challengeStart')?.addEventListener('click',()=>{if(!pendingInvite)return;const valid=app.startFriendChallenge(pendingInvite.topics,pendingInvite.code||null);if(valid)closeDialog('shareChallengeDialog')});
window.addEventListener('lista:roundsaved',e=>{if(e.detail?.challengeCode)loadStandings(e.detail.challengeCode)});
window.addEventListener('lista:challengeroundend',e=>{if(e.detail.index===4){const el=$('challengeResult');if(el)el.textContent+=' Resultado das cinco rodadas: '+Number(e.detail.total).toLocaleString('pt-BR')+' pontos. Compartilhe seu link e confira a classificação!';}});
async function inspectUrl(){const url=new URL(location.href),code=url.searchParams.get('desafio'),local=url.searchParams.get('lista');
 if(code){try{const r=await api('challenge?code='+encodeURIComponent(code));showInvite(r.challenge);openDialog('shareChallengeDialog')}
  catch(e){status('shareStatus','Convite indisponível: '+e.message,'error');openDialog('shareChallengeDialog')}return}
 if(local){const ids=local.split(',');if(ids.length===5&&new Set(ids).size===5&&ids.every(id=>app.allTopics().some(x=>x.id===id))){showInvite({topics:ids,code:null});openDialog('shareChallengeDialog')}}
}
async function checkAdmin(){try{const data=await api('admin');adminEligible=true;$('curationAdminBtn').hidden=false;return data}
 catch{return null}}
$('curationAdminBtn')?.addEventListener('click',async()=>{openDialog('curationAdminDialog');await showAdmin()});
async function showAdmin(){status('curationAdminStatus','Carregando sinais da comunidade…');const data=await checkAdmin();if(!data){status('curationAdminStatus','Somente administradores habilitados podem moderar o catálogo.','error');return}
 status('curationAdminStatus',`Avaliações agrupadas por tema (${data.reports.length}). A alteração é registrada no banco e atualiza os filtros.`);
 const root=$('curationAdminTopics');root.replaceChildren();if(!data.reports.length){root.textContent='Ainda não existem avaliações online. Sem denúncias para revisar.';return}
 for(const t of data.reports){const topic=app.allTopics().find(x=>x.id===t.topic_id);if(!topic)continue;const o=data.overrides?.find(x=>x.topic_id===topic.id);
  const line=document.createElement('div');line.className='admin-line';const title=document.createElement('strong');title.textContent=t.title;
  const summary=document.createElement('small');summary.textContent=`${t.reports} avaliações • ${t.too_specific} específicas • ${t.missing_answer} respostas não aceitas • ${t.bad_question} confusas`;
  const controls=document.createElement('div');controls.className='admin-controls';const select=document.createElement('select');select.setAttribute('aria-label','Perfil do tema '+t.title);
  for(const [value,label] of [['casual','Casual'],['fandom','Fãs'],['specialist','Especialista']]){const opt=document.createElement('option');opt.value=value;opt.textContent=label;select.append(opt)}select.value=o?.audience||topic.audience||'casual';
  const visible=document.createElement('input');visible.type='checkbox';visible.checked=o?.visible!==false;visible.setAttribute('aria-label','Tema visível');const label=document.createElement('span');label.textContent='Disponível';
  const featured=document.createElement('input');featured.type='checkbox';featured.checked=o?.featured!==false;featured.setAttribute('aria-label','Em destaque');const featuredLabel=document.createElement('span');featuredLabel.textContent='Destaque';
  const button=document.createElement('button');button.className='btn btn-sm primary';button.type='button';button.textContent='Salvar';button.onclick=async()=>{button.disabled=true;try{await api('admin','POST',{topicId:topic.id,audience:select.value,visible:visible.checked,featured:featured.checked});status('curationAdminStatus','Classificação de “'+topic.title+'” atualizada!','success');app.applyCuration([{topic_id:topic.id,audience:select.value,visible:visible.checked,featured:featured.checked}])}catch(e){status('curationAdminStatus','Erro: '+e.message,'error')}finally{button.disabled=false}};
  controls.append(select,visible,label,featured,featuredLabel,button);line.append(title,summary,controls);root.append(line)
 }
}
window.addEventListener('lista:account',()=>{checkAdmin().then(()=>flushQueue())});
async function start(){try{const r=await api('curation');app.applyCuration(r.overrides||[])}catch(e){console.warn('Curadoria online indisponível; usando catálogo embutido.',e?.message)}
 await inspectUrl();checkAdmin()}
start();
