/* LISTA! Beta 0.7 — Quiz, Sobrevivência, favoritos, filtros e revisão offline. */
(()=>{'use strict';
const qdata=window.LISTA_QUIZ_DATA;if(!qdata||!Array.isArray(qdata.quiz)||!Array.isArray(qdata.truefalse))return;
const $=id=>document.getElementById(id),KEY='lista-quiz-beta6';
const defaults={played:0,wins:0,best:0,totalCorrect:0,daily:{},misses:[],recent:[],byMode:{},starred:[],dayHistory:[],lastCategory:'all'};
let saved={...defaults};try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&typeof v==='object'&&!Array.isArray(v))saved={...defaults,...v}}catch{}
if(!Array.isArray(saved.misses))saved.misses=[];if(!Array.isArray(saved.recent))saved.recent=[];if(!Array.isArray(saved.starred))saved.starred=[];if(!Array.isArray(saved.dayHistory))saved.dayHistory=[];
if(!saved.daily||typeof saved.daily!=='object')saved.daily={};if(!saved.byMode||typeof saved.byMode!=='object')saved.byMode={};
function persist(){try{localStorage.setItem(KEY,JSON.stringify(saved))}catch{}}
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),today=()=>{let d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
function seedFn(text){let n=2166136261;for(const c of text){n^=c.charCodeAt(0);n=Math.imul(n,16777619)}return n>>>0}
function rand(seed){let s=seed||1;return()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296}}
function shuffle(items,r){const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const modal=$('quizModal'),categoryPicker=$('quizCategoryPick'),starButton=$('quizStarQuestion'),elements={title:$('quizTitle'),desc:$('quizDescription'),kind:$('quizKind'),counter:$('quizCounter'),clock:$('quizClock'),score:$('quizScore'),bar:$('quizProgress'),question:$('quizQuestion'),category:$('quizCategory'),answers:$('quizAnswers'),feedback:$('quizFeedback'),next:$('quizNext'),summary:$('quizSummary'),body:$('quizBody'),subtitle:$('quizSummarySubtitle'),stats:$('quizSummaryStats'),learn:$('quizSummaryLearn'),daily:$('quizDailyNotice')};
let game=null,timer=null;
const allCategories=[...new Set([...qdata.quiz,...qdata.truefalse].map(q=>q.category))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
if(categoryPicker){for(const cat of allCategories){const option=document.createElement('option');option.value=cat;option.textContent=cat;categoryPicker.append(option)}categoryPicker.value=allCategories.includes(saved.lastCategory)?saved.lastCategory:'all';categoryPicker.addEventListener('change',()=>{saved.lastCategory=categoryPicker.value;persist()})}
function currentCategory(){return categoryPicker?.value||'all'}
function updateStar(){if(!starButton||!game||game.finished)return;const id=game.questions[game.idx]?.id,isSaved=saved.starred.includes(id);starButton.hidden=!id;starButton.textContent=isSaved?'★ Favorita':'☆ Favoritar pergunta';starButton.setAttribute('aria-pressed',String(isSaved))}
if(starButton)starButton.addEventListener('click',()=>{if(!game||game.finished)return;const id=game.questions[game.idx]?.id;if(!id)return;const found=saved.starred.includes(id);saved.starred=found?saved.starred.filter(x=>x!==id):[...saved.starred,id].slice(-250);persist();updateStar()});
function streak(){const days=new Set(saved.dayHistory);let d=new Date(),n=0;for(let i=0;i<365;i++){let key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');if(!days.has(key)){if(i===0){d.setDate(d.getDate()-1);continue}break}n++;d.setDate(d.getDate()-1)}return n}
function updateHistory(){const mine=$('quizHistoryStatus');if(mine)mine.textContent=saved.played+' rodadas • '+saved.best.toLocaleString('pt-BR')+' pts de recorde • '+saved.misses.length+' para revisar • '+saved.starred.length+' favoritas • '+streak()+' dia(s) de sequência'};

function clearClock(){if(timer){clearInterval(timer);timer=null}}
function stop(){clearClock();game=null;modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('quiz-lock');if(starButton)starButton.hidden=true}
function message(s){const m=$('quizStartStatus');if(m){m.textContent=s;m.hidden=false}}
function open(mode,daily=false){clearClock();const type=mode==='verdadeiro-falso'?'truefalse':'quiz';let pool=qdata[type];
 const category=currentCategory();if(!daily&&mode!=='revanche'&&mode!=='favoritas'&&category!=='all')pool=pool.filter(q=>q.category===category);
 const tday=today(),key=mode+':'+tday,prior=(saved.daily||{})[key];
 if(mode==='favoritas'){const fav=new Set(saved.starred);pool=qdata.quiz.filter(x=>fav.has(x.id));if(category!=='all')pool=pool.filter(q=>q.category===category);if(!pool.length){message('Você ainda não marcou perguntas favoritas nesta categoria. Use ☆ Favoritar durante o Quiz.');return}}

 if(mode==='revanche'){
  const misses=new Set(saved.misses);pool=qdata.quiz.filter(x=>misses.has(x.id));if(category!=='all')pool=pool.filter(q=>q.category===category);
  if(!pool.length){message('Sem erros para revisar! Jogue o Quiz primeiro e volte quando quiser treinar.');return}
 }
 const seed=daily?seedFn('lista-beta6|'+key):Math.floor(Math.random()*4294967295),r=rand(seed);
 if(!daily&&mode!=='revanche'){const recent=new Set(saved.recent.slice(-35));const fresh=pool.filter(q=>!recent.has(q.id));if(fresh.length>=10)pool=fresh}
 const count=mode==='revanche'||mode==='favoritas'?Math.min(10,pool.length):mode==='sobrevivencia'?Math.min(20,pool.length):mode==='verdadeiro-falso'?12:mode==='relampago'?Math.min(18,pool.length):10;
 const questions=shuffle(pool,r).slice(0,count);
 if(!questions.length){message('Não há perguntas disponíveis para essa seleção. Escolha outra categoria.');return}
 game={mode,type,daily,date:tday,dailyKey:key,questions,idx:0,correct:0,score:0,streak:0,lives:mode==='sobrevivencia'?3:null,answered:false,finished:false,mistakes:[],answeredIds:[],elapsed:0,remaining:mode==='relampago'?60:null,started:Date.now(),seed};
 modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.classList.add('quiz-lock');
 elements.summary.hidden=true;elements.body.hidden=false;elements.next.hidden=true;
 elements.title.textContent=({quiz:'Quiz de 10', 'verdadeiro-falso':'Verdadeiro ou Falso',relampago:'Relâmpago de 60s',revanche:'Revanche dos erros',sobrevivencia:'Sobrevivência · 3 vidas',favoritas:'Minhas favoritas'})[mode];
 elements.desc.textContent=mode==='relampago'?'Responda rapidamente. O cronômetro não para durante a rodada.':mode==='revanche'?'Treine as perguntas que você errou em partidas anteriores.':mode==='sobrevivencia'?'Você tem três vidas. Cada erro tira uma vida; quanto mais longe chegar, maior a pontuação.':mode==='favoritas'?'Rejogue as perguntas que você salvou.':'Cada resposta traz uma explicação curta. Acerte, aprenda e continue.';
 elements.daily.textContent=daily?(prior?'Você já jogou o desafio diário. É possível praticar novamente, sem apagar seu recorde.':'Desafio diário: a mesma sequência de perguntas para todos neste dia.'):'Perguntas sorteadas do acervo curado.';
 elements.kind.textContent=daily?'DESAFIO DIÁRIO':mode==='relampago'?'CONTRA O RELÓGIO':mode==='revanche'||mode==='favoritas'?'REVISÃO':mode==='sobrevivencia'?'3 VIDAS':'JOGO LIVRE';
 elements.clock.hidden=mode!=='relampago';elements.clock.textContent='60s';
 render();if(mode==='relampago'){timer=setInterval(()=>{if(!game||game.finished){clearClock();return}game.remaining=clamp(60-Math.floor((Date.now()-game.started)/1000),0,60);elements.clock.textContent=game.remaining+'s';if(game.remaining===0)finish();},200)}
 }
function choiceList(q){if(game.type==='truefalse')return[{label:'Verdadeiro',correct:q.correct===true},{label:'Falso',correct:q.correct===false}];
 const labels=shuffle(q.choices,rand(game.seed^seedFn(q.id)));return labels.map(label=>({label,correct:label===q.choices[q.correct]}))}
function render(){if(!game)return;const q=game.questions[game.idx];if(!q){finish();return}
 game.answered=false;elements.next.hidden=true;elements.feedback.hidden=true;elements.feedback.replaceChildren();
 elements.question.textContent=game.type==='truefalse'?q.statement:q.question;elements.category.textContent=q.category;
 elements.counter.textContent=(game.idx+1)+' / '+game.questions.length;elements.score.textContent=game.score.toLocaleString('pt-BR')+' pts'+(game.lives!==null?' • '+game.lives+' ♥':'');
 updateStar();elements.bar.style.width=(game.idx/game.questions.length*100)+'%';elements.bar.setAttribute('aria-valuenow',String(Math.round(game.idx/game.questions.length*100)));
 elements.answers.replaceChildren();const choices=choiceList(q);
 choices.forEach((entry,i)=>{const b=document.createElement('button');b.type='button';b.className='quiz-choice';b.dataset.correct=String(entry.correct);
 const index=document.createElement('span');index.className='quiz-choice-index';index.textContent=String(i+1);
 const label=document.createElement('span');label.textContent=entry.label;b.append(index,label);b.addEventListener('click',()=>answer(i));elements.answers.append(b)});
 elements.next.textContent=game.idx===game.questions.length-1?'Ver resultado':'Próxima pergunta';
}
function answer(index){if(!game||game.answered||game.finished)return;const buttons=[...elements.answers.querySelectorAll('button')],b=buttons[index];if(!b)return;
 game.answered=true;game.answeredIds.push(game.questions[game.idx].id);const correct=b.dataset.correct==='true';if(correct){game.correct++;game.streak++;game.score+=100+Math.min(game.streak-1,5)*20}else{game.streak=0;game.mistakes.push(game.questions[game.idx].id);if(game.lives!==null)game.lives--}
 const q=game.questions[game.idx];for(const button of buttons){button.disabled=true;if(button.dataset.correct==='true')button.classList.add('is-correct');else if(button===b)button.classList.add('is-wrong')}
 elements.feedback.hidden=false;const strong=document.createElement('strong');strong.textContent=correct?'Acertou!':'Não foi dessa vez.';elements.feedback.append(strong);
 const note=document.createElement('p');note.textContent=q.explanation;elements.feedback.append(note);elements.feedback.dataset.state=correct?'success':'error';elements.score.textContent=game.score.toLocaleString('pt-BR')+' pts'+(game.lives!==null?' • '+game.lives+' ♥':'');elements.next.hidden=false;if(game.lives===0)elements.next.textContent='Ver resultado';
 if(game.mode==='relampago'&&game.remaining<1)finish();
}
function next(){if(!game||!game.answered)return;if(game.lives===0){finish();return}game.idx++;if(game.idx>=game.questions.length){finish();return}render()}
function finish(){if(!game||game.finished)return;clearClock();game.finished=true;elements.body.hidden=true;elements.summary.hidden=false;elements.bar.style.width='100%';elements.bar.setAttribute('aria-valuenow','100');
 const answered=game.answeredIds.length,total=game.questions.length,accuracy=answered?Math.round(game.correct/answered*100):0;
 const modeName=({quiz:'Quiz', 'verdadeiro-falso':'Verdadeiro ou Falso',relampago:'Relâmpago',revanche:'Revanche',sobrevivencia:'Sobrevivência',favoritas:'Favoritas'})[game.mode];
 elements.subtitle.textContent=modeName+' concluído: '+game.correct+' de '+answered+' respostas corretas ('+accuracy+'%).';
 elements.stats.textContent=game.score.toLocaleString('pt-BR')+' pontos • '+(game.mode==='relampago'?'60 segundos':game.mode==='sobrevivencia'?'3 vidas • '+game.questions.length+' perguntas possíveis':'sem limite de tempo');
 elements.learn.replaceChildren();const h=document.createElement('h3');h.textContent=game.mistakes.length?'Vale revisar estas perguntas:':'Bom trabalho!';elements.learn.append(h);
 game.mistakes.slice(0,5).forEach(id=>{const x=qdata.quiz.find(q=>q.id===id)||qdata.truefalse.find(q=>q.id===id);if(!x)return;const p=document.createElement('p');p.textContent=(x.question||x.statement)+' — '+x.explanation;elements.learn.append(p)});
 saved.played++;if(!saved.dayHistory.includes(today()))saved.dayHistory.push(today());saved.dayHistory=saved.dayHistory.slice(-366);saved.totalCorrect+=game.correct;saved.best=Math.max(saved.best,game.score);if(accuracy>=80&&answered>=5)saved.wins++;
 if(!saved.byMode[game.mode])saved.byMode[game.mode]={plays:0,best:0};saved.byMode[game.mode].plays++;saved.byMode[game.mode].best=Math.max(saved.byMode[game.mode].best,game.score);
 const missed=new Set(saved.misses);for(const id of game.questions.filter(q=>game.mistakes.includes(q.id)).map(q=>q.id))if(id.startsWith('q'))missed.add(id);
 for(const q of game.questions)if(game.answeredIds.includes(q.id)&&!game.mistakes.includes(q.id)&&q.id.startsWith('q'))missed.delete(q.id);
 saved.misses=[...missed].slice(-100);saved.recent=[...saved.recent,...game.answeredIds].slice(-100);
 if(game.daily){const previous=saved.daily[game.dailyKey];if(!previous||previous.score<game.score)saved.daily[game.dailyKey]={score:game.score,correct:game.correct,total};}
 persist();updateHistory();
}
$('quizNext').addEventListener('click',next);$('quizClose').addEventListener('click',stop);$('quizAgain').addEventListener('click',()=>{const mode=game?.mode||'quiz';open(mode,false)});$('quizBack').addEventListener('click',stop);
$('quizShare').addEventListener('click',async()=>{const txt=`LISTA! — ${elements.subtitle.textContent} ${elements.stats.textContent}\n${location.origin}`;try{await navigator.clipboard.writeText(txt);$('quizShare').textContent='Resultado copiado!'}catch{$('quizShare').textContent='Use o botão de copiar do seu navegador.'}setTimeout(()=>{$('quizShare').textContent='Compartilhar resultado'},2500)});
for(const b of document.querySelectorAll('[data-quiz-mode]'))b.addEventListener('click',()=>{const isDaily=b.dataset.daily==='1';open(b.dataset.quizMode,isDaily)});
window.addEventListener('keydown',e=>{if(!game||!modal.classList.contains('open')||e.altKey||e.ctrlKey||e.metaKey)return;
 if(e.key==='Escape'){e.preventDefault();stop();return}
 if(e.target&&['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
 if(e.key==='Enter'&&game.answered&&!game.finished){e.preventDefault();next();return}
 if(!game.answered&&!game.finished&&/^[1-4]$/.test(e.key)){e.preventDefault();answer(Number(e.key)-1)}
});
window.addEventListener('lista:quiz-stats-restored',()=>{try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&typeof v==='object'&&!Array.isArray(v))saved={...defaults,...v};}catch{}
 if(!Array.isArray(saved.starred))saved.starred=[];if(!Array.isArray(saved.dayHistory))saved.dayHistory=[];updateHistory();});
window.LISTA_QUIZ_TEST={seedFn,rand,shuffle,questions:qdata.quiz.length,statements:qdata.truefalse.length,categories:allCategories.length,getSaved:()=>saved,open};
updateHistory();
})();
