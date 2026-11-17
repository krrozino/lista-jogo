# Política de versões e GitHub Releases — LISTA!

## Versões

O LISTA! permanece em **0.x.y-<alpha|beta|rc>.N**. A versão `1.0.0` requer decisão expressa do dono do projeto.

1. Concluir alterações com testes proporcionais ao risco e preservar IDs/recordes.
2. Atualizar `package.json`, interface, `CHANGELOG.md` e `releases/v<VERSÃO>.md`.
3. Enviar código à `main`: o GitHub Actions valida a versão e cria tag `v<VERSÃO>` e GitHub Release como **pré-release** (sem `latest` estável).
4. Confirmar deploy da Vercel, ranking e login no endereço público. Registrar limitações conhecidas.
5. Não reescrever tags publicadas; uma correção gera um novo `beta.N` ou versão beta compatível.

Fluxo manual alternativo no GitHub Actions: **Publicar release beta → Run workflow → versão**. O workflow recusa versões estáveis ou notas ausentes.

O banco de dados deve ser atualizado antes de deploys de funcionalidades que dependam de migração. Alterações de dados destrutivas requerem aprovação humana. Não criar PRs fragmentadas nem repetir testes completos sem mudança material.
