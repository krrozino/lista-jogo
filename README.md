# LISTA! — Jogo de memória e desafios

**LISTA! 0.8.0-beta.1 — versão beta, sem lançamento 1.0.**

828 desafios de listas (816 anteriores preservados + 12 novos), 134 questões de Quiz, 92 afirmações de Verdadeiro/Falso, Relâmpago 60s, Revanche dos Erros, Contexto, Termo, Dueto, Anagrama e ranking global para Sprint/Turbo.

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

## Atualização 0.7 — experiência de Quiz

- **Sobrevivência**: até 20 perguntas, três vidas; o jogo termina quando as três acabam.
- **Minhas favoritas**: salva perguntas durante a rodada e permite praticar apenas a seleção pessoal.
- **Filtros por categoria**: Quiz, verdadeiro/falso, Relâmpago, Sobrevivência, Revanche e Favoritas respeitam a categoria escolhida; se faltar perguntas, a seleção é reduzida ou exibe aviso.
- **Sequência de dias**: mostra dias consecutivos em que partidas de Quiz foram concluídas.
- **30 novas listas** com metas flexíveis e temas casuais; **30 perguntas de Quiz e 20 afirmações V/F**, com explicações.
- **Compatibilidade**: preserva o armazenamento `lista-quiz-beta6`, os 786 IDs antigos e os recordes; importação de backup inclui favoritas e histórico de dias com sanitização.
- **Ranking global**: continua exclusivamente em Sprint/Turbo, com verificação na API; novos modos continuam locais.

A curadoria de conteúdo é contínua: a seleção de respostas das listas abertas não é exaustiva; o feedback de respostas ausentes permanece disponível.

## Atualização 0.8 — jornada do jogador

- **Quiz Misturado**: rodada de até 14 perguntas alternando Quiz e Verdadeiro/Falso; continua local/offline.
- **Revanche ampliada**: recupera também erros de Verdadeiro/Falso.
- **Missões diárias**: uma partida, cinco acertos e dois modos diferentes, com estrelas **exclusivamente locais**, sem efeito no ranking competitivo.
- **Meta semanal**: jogar em três dias diferentes na semana, sem exigência de login.
- **Estatísticas e medalhas**: partidas, precisão, evolução de sete dias, modos e categorias, sugestão personalizada de treino. Contagem iniciada nesta beta, sem inventar dados passados.
- **Backup**: exporta/importa a jornada nova com validação e mantém os dados anteriores (`lista-v3-state` e `lista-quiz-beta6`).
- **Conteúdo**: doze novas listas casuais de metas flexíveis, dezoito perguntas Quiz e doze afirmações V/F.
- **Código**: `src/journey.js` opera sem serviços externos; app continua funcionando offline para os modos locais.
- **Validação**: `npm test` garante a preservação de todos os 816 IDs da beta anterior, alinhamento dos dados incorporados ao HTML e scripts de jogo.

As estrelas e medalhas não têm valor monetário, não alteram ranking global e não representam prêmio.


## Pacote de desenvolvimento 01 — Cultura pop e navegação (não publicado)

- 27 novas listas, 72 questões de alternativas e 42 afirmações V/F, com coleções dedicadas a Terra-média, Harry Potter, Marvel, Animes, Filmes e Séries.
- 27 listas anteriores vinculadas às coleções, sem alterar IDs ou pontuações.
- Filtros por coleção na biblioteca e Quiz; botões para jogar diretamente.
- Marca LISTA! retorna ao início sem recarregar; confirmação ao abandonar uma partida ativa e botões equivalentes em diálogos.
- Desenvolvimento na branch dev-pacotes; preview automático desativado em dev-*. Não criar tag, release ou deploy por mudança individual.

Veja [o planejamento dos pacotes](docs/pacotes/01-cultura-pop.md). A versão publicada permanece 0.8.0-beta.1 até o fechamento do lote.
