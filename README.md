# LISTA! — Jogo de memória e desafios

Versão 4.1: 704 desafios de listas, Contexto, Termo, Dueto, Anagrama, contas Neon Auth, ranking global com pontuação calculada na API.

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
