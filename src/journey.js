/* LISTA! Beta 0.8 — jornada local, missões e estatísticas sem depender de login. */
(()=>{'use strict';
const KEY='lista-jornada-v1', $=id=>document.getElementById(id);
const modes={classic:'Clássico',sprint:'Sprint',survival:'3 vidas',turbo:'Turbo',zen:'Zen',marathon:'Maratona',quiz:'Quiz', 'verdadeiro-falso':'Verdadeiro/Falso',relampago:'Relâmpago',sobrevivencia:'Sobrevivência',revanche:'Revanche',favoritas:'Favoritas',misturado:'Quiz Misturado'};
const blank=()=>({version:1,stars:0,history:[],daily:{},weekly:{}});
let state=blank();
const dateKey=(date=new Date())=>date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
function weekKey(date=new Date()){const d=new Date(date.getFullYear(),date.getMonth(),date.getDate());d.setDate(d.getDate()-((d.getDay()+6)%7));return dateKey(d)}
const safeNumber=(v,max=1000000)=>Math.max(0,Math.min(max,Math.floor(Number(v)||0)));
function sanitize(raw){const clean=blank();if(!raw||typeof raw!=='object'||Array.isArray(raw))return clean;
 clean.stars=safeNumber(raw.stars,1e8);
 if(Array.isArray(raw.history))clean.history=raw.history.slice(-500).filter(x=>x&&typeof x==='object'&&/^\d{4}-\d{2}-\d{2}$/.test(x.date)&&typeof x.mode==='string'&&Object.hasOwn(modes,x.mode)).map(x=>({date:x.date,mode:x.mode,category:String(x.category||'Geral').slice(0,65),correct:safeNumber(x.correct,300),answered:safeNumber(x.answered,300),score:safeNumber(x.score,1e7)}));
 if(raw.daily&&typeof raw.daily==='object'&&!Array.isArray(raw.daily))for(const [day,value] of Object.entries(raw.daily).slice(-90)){if(/^\d{4}-\d{2}-\d{2}$/.test(day)&&value&&typeof value==='object'){clean.daily[day]={};for(const id of ['play','answers','variety'])if(value[id]===true)clean.daily[day][id]=true}}
 if(raw.weekly&&typeof raw.weekly==='object'&&!Array.isArray(raw.weekly))for(const [day,value] of Object.entries(raw.weekly).slice(-30))if(/^\d{4}-\d{2}-\d{2}$/.test(day)&&value===true)clean.weekly[day]=true;
 return clean}
try{state=sanitize(JSON.parse(localStorage.getItem(KEY)||'null'))}catch{}
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}};
const dayRecords=(day=dateKey())=>state.history.filter(x=>x.date===day);
function metrics(records){const modesUsed=new Set(records.map(x=>x.mode));return {plays:records.length,correct:records.reduce((s,x)=>s+x.correct,0),modes:modesUsed.size}}
const missions=[{id:'play',title:'Primeiro desafio',desc:'Termine 1 partida hoje',max:1,stars:10,metric:m=>m.plays},{id:'answers',title:'Mente afiada',desc:'Acerte 5 respostas hoje',max:5,stars:20,metric:m=>m.correct},{id:'variety',title:'Um pouco de tudo',desc:'Jogue 2 modos diferentes',max:2,stars:20,metric:m=>m.modes}];
function weekDays(){const week=weekKey();return new Set(state.history.filter(x=>x.date>=week&&x.date<=dateKey()).map(x=>x.date)).size}
function award(){const day=dateKey(),d=state.daily[day]||(state.daily[day]={}),m=metrics(dayRecords(day));let unlocked=0;
 for(const task of missions)if(!d[task.id]&&task.metric(m)>=task.max){d[task.id]=true;state.stars+=task.stars;unlocked++}
 const w=weekKey();if(!state.weekly[w]&&weekDays()>=3){state.weekly[w]=true;state.stars+=30;unlocked++}
 return unlocked;
}
function record(entry){if(!entry||safeNumber(entry.answered,300)===0)return;
 const mode=String(entry.mode||'');if(!Object.hasOwn(modes,mode))return;
 const category=String(entry.category||'Geral').slice(0,65);
 state.history.push({date:dateKey(),mode,category,correct:safeNumber(entry.correct,300),answered:safeNumber(entry.answered,300),score:safeNumber(entry.score,1e7)});state.history=state.history.slice(-500);
 const newly=award();persist();render();if(newly){const status=$('journeyLive');if(status)status.textContent='Missão ou meta semanal concluída! Estrelas adicionadas ao perfil.'}
}
function badges(){const h=state.history,allModes=new Set(h.map(x=>x.mode)),cats=new Set(h.map(x=>x.category)),dates=new Set(h.map(x=>x.date));const quizWins=h.filter(x=>['quiz','misturado','verdadeiro-falso'].includes(x.mode)&&x.answered>=5&&x.correct/x.answered>=.8).length;
 return [
 ['start','Primeira conquista','Terminar 1 partida',h.length>=1],
 ['learner','Aprendiz persistente','Acertar 50 respostas',h.reduce((s,x)=>s+x.correct,0)>=50],
 ['explorer','Explorador de modos','Jogar 4 modos diferentes',allModes.size>=4],
 ['curious','Curiosidade sem fim','Jogar em 6 categorias',cats.size>=6],
 ['accurate','Olho clínico','Obter 80%+ em 3 rodadas de Quiz',quizWins>=3],
 ['mix','Mente versátil','Jogar 3 rodadas de Quiz Misturado',h.filter(x=>x.mode==='misturado').length>=3],
 ['review','Quem erra aprende','Fazer 3 rodadas de Revanche',h.filter(x=>x.mode==='revanche').length>=3],
 ['habit','Hábito de jogar','Jogar em 7 dias diferentes',dates.size>=7]
 ];}
function create(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el}
function renderMissions(){const root=$('journeyMissions');if(!root)return;root.replaceChildren();const m=metrics(dayRecords());const done=state.daily[dateKey()]||{};
 for(const task of missions){const box=create('div','journey-task'+(done[task.id]?' is-done':'')),head=create('div','journey-task-head');head.append(create('strong','',task.title),create('span','',done[task.id]?'Concluída':task.stars+' ★'));box.append(head,create('p','',task.desc));const track=create('div','journey-meter');const bar=create('span');bar.style.width=Math.round(Math.min(task.max,task.metric(m))/task.max*100)+'%';track.append(bar);box.append(track,create('small','',Math.min(task.max,task.metric(m))+' / '+task.max));root.append(box)}
 const week=$('journeyWeekStatus');if(week)week.textContent='Meta semanal: '+Math.min(3,weekDays())+'/3 dias com partidas concluídas · '+(state.weekly[weekKey()]?'30 ★ conquistadas':'30 ★ ao completar');}
function renderProfile(){const root=$('journeyProfile');if(!root)return;const total=state.history.length,correct=state.history.reduce((n,x)=>n+x.correct,0),answered=state.history.reduce((n,x)=>n+x.answered,0);root.replaceChildren();
 const head=create('div','journey-profile-head');head.append(create('strong','','Sua jornada: '+state.stars+' ★'),create('span','',total+' partidas registradas desde esta beta'));root.append(head);
 const summary=create('div','journey-profile-kpis');for(const [n,label] of [[total,'Rodadas'],[correct,'Acertos'],[answered?Math.round(correct/answered*100)+'%':'—','Precisão']]){const box=create('div');box.append(create('strong','',String(n)),create('span','',label));summary.append(box)}root.append(summary);
 const chart=create('div','journey-chart');const today=new Date();for(let i=6;i>=0;i--){const d=new Date(today.getFullYear(),today.getMonth(),today.getDate()-i),day=dateKey(d),count=dayRecords(day).length;const col=create('div','journey-day');const fill=create('div','journey-day-fill');fill.style.height=(Math.max(8,Math.min(count,6)*16))+'%';fill.title=count+' partidas em '+day;col.append(fill,create('small','',d.toLocaleDateString('pt-BR',{weekday:'short'}).replace('.','')));chart.append(col)}root.append(create('h4','','Atividade nos últimos 7 dias'),chart);
 const categoryMap=new Map(),modeMap=new Map();for(const h of state.history){for(const [key,map] of [[h.category,categoryMap],[h.mode,modeMap]]){const v=map.get(key)||{plays:0,correct:0,answered:0};v.plays++;v.correct+=h.correct;v.answered+=h.answered;map.set(key,v)}}
 function lines(label,map,formatKey){root.append(create('h4','',label));const entries=[...map.entries()].sort((a,b)=>b[1].plays-a[1].plays).slice(0,6);if(!entries.length){root.append(create('p','journey-muted','Jogue uma partida para começar suas estatísticas.'));return}for(const [key,x] of entries)root.append(create('div','journey-stat-line',formatKey(key)+' · '+x.plays+' partida(s) · '+(x.answered?Math.round(x.correct/x.answered*100)+'% de acertos':'sem respostas')))}
 lines('Desempenho por modo',modeMap,key=>modes[key]||key);lines('Desempenho por categoria',categoryMap,key=>key);
 const candidates=[...categoryMap.entries()].filter(([_,v])=>v.answered>=5).sort((a,b)=>(a[1].correct/a[1].answered)-(b[1].correct/b[1].answered));const tip=create('p','journey-tip',candidates.length?'Sugestão de treino: pratique '+candidates[0][0]+', onde seus acertos foram '+Math.round(candidates[0][1].correct/candidates[0][1].answered*100)+'%.':'Dica: experimente dois modos diferentes para completar uma missão de hoje.');root.append(tip);
 root.append(create('h4','','Medalhas da jornada'));const medals=create('div','journey-badges');for(const [id,label,desc,unlocked] of badges()){const b=create('div','journey-badge'+(unlocked?' unlocked':''));b.append(create('b','',unlocked?'★':'☆'),create('strong','',label),create('small','',desc));medals.append(b)}root.append(medals);
 root.append(create('p','journey-muted','Estatísticas locais de partidas jogadas desde a beta 0.8. Não alteram o ranking global.'));
}
function render(){const stars=$('journeyStars');if(stars)stars.textContent=state.stars+' ★';renderMissions();renderProfile()}
window.addEventListener('lista:roundend',event=>{const d=event.detail||{},topic=window.LISTA_APP?.allTopics?.().find(x=>x.id===d.topicId);record({mode:d.mode,category:topic?.category||'Geral',correct:d.correct,answered:Array.isArray(d.guesses)?d.guesses.length:0,score:d.clientScore})});
window.addEventListener('lista:quizfinish',event=>{const d=event.detail||{},count=d.categories||{};let bestCategory='Geral',bestCount=0;for(const [cat,n] of Object.entries(count)){if(n>bestCount){bestCount=n;bestCategory=cat}}record({mode:d.mode,category:bestCategory,correct:d.correct,answered:d.answered,score:d.score})});
$('journeyDetails')?.addEventListener('click',()=>{$('openProfile')?.click()});$('openProfile')?.addEventListener('click',render);$('headerGames')?.addEventListener('click',render);
window.LISTA_JOURNEY={export:()=>JSON.parse(JSON.stringify(state)),restore:raw=>{if(!raw)return;state=sanitize(raw);persist();render()},getState:()=>JSON.parse(JSON.stringify(state)),metrics,weekKey,dateKey};
render();
})();
