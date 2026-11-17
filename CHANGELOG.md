# Histórico de versões — LISTA!

Todas as entregas importantes serão registradas aqui e publicadas como **pre-release** no GitHub enquanto o jogo estiver em beta.

## [Não lançado]

### Ajustes previstos
- Seguir validando autenticação, proteção de partidas e cadastro sem exigir confirmação de e-mail ainda não ativada.

## [0.4.1-beta.2] — correção de autenticação (17/11/2026)

- Corrigidas no Neon Auth as origens estáveis de produção usadas pela Vercel.
- Mensagens visíveis para login, cadastro, erros de credenciais, criação de apelido e saída da conta.
- Senha mínima de 8 caracteres na criação de conta, aviso sobre confirmação de e-mail não obrigatória e correção dos campos obrigatórios ao salvar apelido.
- Cadastro e ranking seguem em beta; testes reais com contas são necessários antes de declarar homologação completa.


- Corrigir e homologar os fluxos de cadastro e ranking com Neon/Vercel antes de declarar estabilidade.
- Expandir desafios e aprimorar os modos de palavras com validação proporcional ao risco.

## [0.4.1-beta.1] — base de pré-lançamento (17/11/2026)

### Adicionado
- 704 desafios e modos Clássico, Sprint, Turbo, Contexto, Termo, Dueto e Anagrama.
- Código da integração Neon Auth, API Vercel e estrutura de ranking global para Sprint/Turbo.
- Repositório GitHub, documentação de versões e pipeline de release beta.

### Observações
- A presença de integrações no código não garante que cadastro e ranking tenham sido homologados em produção.
- A versão **1.0.0** não está planejada como próxima entrega automática.

[0.4.1-beta.1]: https://github.com/krrozino/lista-jogo/releases/tag/v0.4.1-beta.1
