# LISTA! — Jogo de memória e desafios

**LISTA! 0.6.0-beta.1 — versão de testes, sem lançamento 1.0.**

786 desafios de listas (704 anteriores preservados + 82 novos), 86 questões de Quiz, 60 afirmações de Verdadeiro/Falso, Relâmpago 60s, Revanche dos Erros, Contexto, Termo, Dueto, Anagrama e ranking global para Sprint/Turbo.

## Arquitetura
- Interface web: HTML/CSS/JS preservados da versão 4.0; `src/auth-client.js` é empacotado pelo esbuild.
- API em funções Vercel `api/*.js`, autenticação com JWT verificado por JWKS e banco PostgreSQL Neon.
- Banco de dados: Neon `lista-jogo` (projeto independente). `data/topics.json` contém o catálogo server-side.

## Implantação
Na Vercel, definir `DATABASE_URL` (connection string obtida do painel Neon, **somente no servidor**) e `NEON_AUTH_JWKS_URL` (JWKS público do Neon Auth). Build: `npm run build`; diretório de saída: `public`.

O cliente utiliza `@neondatabase/auth` para cadastro/login. **Nunca publique** `DATABASE_URL`, senhas ou chaves privilegiadas.

## Regras de ranking
Somente Sprint (90 s) e Turbo (45 s), com conta e apelido. O servidor cria rodada antes do jogo, registra tempo, verifica as respostas e calcula os pontos, preservando apenas a melhor pontuação por jogador+desafio+modo. Há limites de partidas e janela para submissão. Isso impede a falsificação direta do placar, mas não elimina bots que conheçam as respostas públicas; partidas competitivas futuras devem ocultar respostas e usar detecção adicional.

O jogo sem login continua funcionando offline (contanto que `index.html` seja salvo localmente). Recordes antigos ficam no armazenamento local.

## Novos modos e curadoria 0.6

- **Quiz (10 perguntas):** 4 alternativas por pergunta, explicação após resposta, pontos por sequência.
- **Verdadeiro ou Falso (12):** explicações e desafio diário fixo no navegador.
- **Relâmpago:** perguntas com cronômetro de 60 segundos, sem uso de ranking competitivo online.
- **Revanche:** repete perguntas do Quiz previamente erradas e remove-as do treino quando acertadas.
- **82 temas de listas** sobre vida cotidiana, gastronomia, natureza, jogos, esportes, música e cultura popular; metas flexíveis em novas listas.
- **Persistência local:** jogos novos salvam em `localStorage` (`lista-quiz-beta6`); ranking online continua apenas para Sprint/Turbo e exige conta.
- **Catálogo offline:** Quiz e Verdadeiro/Falso ficam incorporados no HTML. A API online exige conexão.
- **Teste:** `npm test` valida consistência dos 786 temas, IDs antigos, 146 perguntas e dados incorporados ao HTML.

### Notas de revisão editorial

Novas listas abertas apresentam **seleções de respostas**, não listas enciclopédicas exaustivas. Uma resposta plausível ausente pode ser relatada em “Avaliar pergunta”. Perguntas especializadas continuam fora do sorteio popular.
