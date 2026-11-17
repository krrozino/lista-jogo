'use strict';
const assert=require('node:assert/strict'),topics=require('../data/topics.json');
assert.equal(topics.length,704,'não excluir temas nem perder recordes');
const ids=new Set();const scopes={casual:0,fandom:0,specialist:0};let goals=0;
for(const t of topics){assert(!ids.has(t.id),'ID duplicado '+t.id);ids.add(t.id);
 assert(['casual','fandom','specialist'].includes(t.audience),'público incorreto '+t.id);scopes[t.audience]++;
 assert(['featured','library','review','hidden'].includes(t.curation),'curadoria incorreta '+t.id);
 assert(Number.isInteger(t.goal)&&t.goal>0&&t.goal<=t.answers.length,'meta incorreta '+t.id);
 assert(!t.prompt.includes('itens da lista'),'pergunta artificial: '+t.id);
 const names=new Set(t.answers.map(a=>a.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()));if(t.id!=='porques')assert.equal(names.size,t.answers.length,'respostas duplicadas: '+t.id);
 if(t.goal<t.answers.length)goals++;
}
assert.equal(topics.find(x=>x.id==='v4-grupos-principais-do-balanco-patrimonial').audience,'specialist');
assert.equal(topics.find(x=>x.id==='v4-metodos-de-conservacao-de-alimentos').goal,5);
assert(scopes.casual>300&&scopes.specialist>100&&goals>100);
const fs=require('node:fs'),html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const m=html.match(/<script>const GAME_DATA=(\[.*?\]);<\/script>/s);assert(m,'catálogo incorporado no jogo');
const built=JSON.parse(m[1]);assert.deepEqual(built,topics,'HTML e servidor devem pontuar a mesma lista');
console.log(`PASS: 704 temas, ${goals} metas flexíveis, distribuição ${JSON.stringify(scopes)}, catálogo sincronizado.`);
