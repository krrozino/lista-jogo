# Política de versões e publicação — LISTA!

## Situação atual

O jogo está em **beta**. A série atual começa em `0.4.1-beta.1`; **não existe aprovação para uma release final 1.0.0**.

- `0.x.y-alpha.N`: integração inicial/experimento testável.
- `0.x.y-beta.N`: funcionalidades utilizáveis para testes externos, com limitações conhecidas.
- `0.x.y-rc.N`: candidato a lançamento, somente após decisão específica.
- `1.0.0`: lançamento estável, nunca gerado automaticamente pela automação beta.

O número de versão é definido exclusivamente em `package.json`; a interface e as notas devem refletir a mesma versão.

## Cada entrega beta

1. Implementar a alteração e validar os caminhos afetados, sem repetir testes desnecessários.
2. Atualizar a versão em `package.json`, a identificação visual e o `CHANGELOG.md`.
3. Criar `releases/v<VERSÃO>.md` com recursos, correções, testes e limitações conhecidas.
4. Enviar o código revisado para a branch `main` (ou mesclar a PR).
5. Em **GitHub → Actions → Publicar release beta → Run workflow**, selecionar `main` e informar a versão idêntica ao `package.json`, **sem `v`**. O fluxo cria a tag `v<VERSÃO>` e a GitHub Release marcada como pré-lançamento. Alternativamente, criar e enviar a tag com `git tag v<VERSÃO>` e `git push origin v<VERSÃO>`.
6. Conferir o link em `https://github.com/krrozino/lista-jogo/releases`, a implantação na Vercel e os fluxos relevantes. Registrar falhas conhecidas nas notas da próxima beta.

O workflow recusa versões fora da série `0.x.y-(alpha|beta|rc).N`, divergência entre tag e `package.json` e notas ausentes. Não move tags já existentes e não publica uma versão estável sem revisão dessa política.

## Regras de transparência

- Git commit ≠ release; deploy ≠ release; release beta ≠ 1.0 estável.
- Cada GitHub Release aponta para uma tag imutável do código e possui notas de mudanças.
- Ranking, pagamentos ou dados pessoais exigem verificação no backend antes de marcá-los como prontos.
- Ao reverter uma versão, registrar o motivo e criar nova tag; não regravar uma tag publicada.
