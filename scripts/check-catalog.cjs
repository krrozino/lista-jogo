'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const topics=require('../data/topics.json');const quiz=require('../data/quiz.json');
assert.equal(topics.length,828,'816 temas anteriores + 12 novos devem continuar acessíveis');
assert.equal(crypto.createHash('sha256').update(topics.slice(0,704).map(x=>x.id).join('\n')).digest('hex'),'f14454d78c6005efefea2dc6df5a3c54eafee38163d9081b9fbfaee79e5e93cd','IDs de versões antigas foram movidos ou alterados');
assert.equal(crypto.createHash('sha256').update(topics.slice(0,816).map(x=>x.id).join('\n')).digest('hex'),'3a40ddd04dd9699a9712417922df00d232a541fa0a69c5ca1853334dd172026c','IDs de versões até 0.7 foram alterados');
const ids=new Set(),scopes={casual:0,fandom:0,specialist:0};let goals=0;
const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
for(const t of topics){assert(!ids.has(t.id),'ID duplicado '+t.id);ids.add(t.id);
 assert(['casual','fandom','specialist'].includes(t.audience),'público incorreto '+t.id);scopes[t.audience]++;
 assert(['featured','library','review','hidden'].includes(t.curation),'curadoria incorreta '+t.id);
 assert(Number.isInteger(t.goal)&&t.goal>0&&t.goal<=t.answers.length,'meta incorreta '+t.id);
 assert(!t.prompt.includes('itens da lista'),'pergunta artificial: '+t.id);
 const names=new Set(t.answers.map(norm));if(t.id!=='porques')assert.equal(names.size,t.answers.length,'respostas duplicadas: '+t.id);
 if(t.goal<t.answers.length)goals++;
}
assert.equal(topics.find(x=>x.id==='v4-grupos-principais-do-balanco-patrimonial').audience,'specialist');
assert.equal(topics.find(x=>x.id==='v4-metodos-de-conservacao-de-alimentos').goal,5);
assert(scopes.casual>350&&scopes.specialist>100&&goals>160);
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const tmatch=html.match(/<script>const GAME_DATA=(\[.*?\]);<\/script>/s);assert(tmatch,'catálogo incorporado no jogo');
assert.deepEqual(JSON.parse(tmatch[1]),topics,'HTML e servidor devem ter o mesmo catálogo');
assert.equal(quiz.quiz.length,134);assert.equal(quiz.truefalse.length,92);
const qids=new Set();const knownCats=new Set(topics.map(t=>t.category));
for(const q of quiz.quiz){assert(!qids.has(q.id));qids.add(q.id);assert(knownCats.has(q.category));assert(typeof q.question==='string'&&q.question.length>=15);assert(Array.isArray(q.choices)&&q.choices.length===4&&new Set(q.choices.map(norm)).size===4);assert(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<4);assert(q.explanation?.length>=15)}
for(const q of quiz.truefalse){assert(!qids.has(q.id));qids.add(q.id);assert(knownCats.has(q.category));assert(typeof q.correct==='boolean');assert(q.statement?.length>=15&&q.explanation?.length>=12)}
const qmatch=html.match(/<script>window\.LISTA_QUIZ_DATA=(\{.*?\});<\/script>/s);assert(qmatch,'quiz deve funcionar offline');assert.deepEqual(JSON.parse(qmatch[1]),quiz,'quiz HTML e arquivo JSON devem coincidir');
assert(html.includes('data-quiz-mode="relampago"')&&html.includes('data-quiz-mode="revanche"')&&html.includes('data-quiz-mode="sobrevivencia"')&&html.includes('data-quiz-mode="favoritas"'));assert(html.includes('id="quizCategoryPick"')&&html.includes('id="quizStarQuestion"'));
const scriptMatch=html.match(/<script>(\/\* LISTA! Beta 0\.8 — Quiz[\s\S]*?)<\/script>/);assert(scriptMatch,'lógica do Quiz offline não encontrada');
assert.equal(scriptMatch[1].trim(),fs.readFileSync(path.join(__dirname,'../src/quiz.js'),'utf8').trim(),'lógica offline e fonte de Quiz divergentes');
const journeySource=fs.readFileSync(path.join(__dirname,'../src/journey.js'),'utf8').trim();
assert(html.includes('id="journeyPanel"')&&html.includes('id="journeyProfile"')&&html.includes('data-quiz-mode="misturado"'));
assert(html.includes('<script>'+journeySource+'</script>'),'HTML e jornada local estão divergentes');
assert(html.includes('journeyStats:window.LISTA_JOURNEY?.export?.()'),'Backup deve exportar jornada');
assert(html.includes('j.journeyStats'),'Backup deve importar jornada');
assert(quiz.quiz.filter(x=>x.id.startsWith('qv8-')).length===18);
assert(quiz.truefalse.filter(x=>x.id.startsWith('tfv8-')).length===12);
console.log(`PASS: ${topics.length} temas, ${goals} metas flexíveis, ${quiz.quiz.length} questões Quiz, ${quiz.truefalse.length} afirmações V/F. Distribuição: ${JSON.stringify(scopes)}.`);
