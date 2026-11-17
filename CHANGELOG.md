# Histórico de versões — LISTA!

Todas as entregas antes de 1.0 são **pré-lançamentos** acompanhados pelo [GitHub Releases](https://github.com/krrozino/lista-jogo/releases).

## Não lançado

- Revisar sugestões da comunidade e avaliar novas formas de competição equilibradas.

## 0.6.0-beta.1 — 17/11/2026

### Novos jogos
- Quiz de alternativas com 86 perguntas curadas, quatro opções e explicações.
- Verdadeiro ou Falso com 60 afirmações explicadas.
- Relâmpago de 60 segundos e Revanche para praticar perguntas erradas.
- Desafios diários determinísticos para Quiz e Verdadeiro/Falso, atalhos do teclado e histórico local.

### Conteúdo e experiência
- 82 novas listas de assuntos acessíveis; 786 temas no total, preservando IDs anteriores.
- Novos desafios com metas alcançáveis, seleção casual e compatibilidade com o catálogo da API.
- Modos novos independentes do ranking competitivo: não misturam pontos de questionários com Sprint/Turbo.
- Testes de paridade entre HTML e JSON de listas/perguntas.


- Ampliar sinônimos a partir de avaliações reais, ajustar taxa de aceitação e dificuldade observada.
- Implementar monitoramento anti-cheat mais rigoroso e duelos síncronos após estabilizar o ranking.

## 0.5.0-beta.2 — 17/11/2026

- Convites entre amigos agora sorteiam somente questões casuais e fáceis, de categorias diferentes, em vez de listas muito específicas.
- Países insulares do Caribe passam à biblioteca Especialista (sem apagar o desafio nem recordes).
- Texto do ranking atualizado para refletir a integração Neon já ativa.
- Revalidados filtros, objetivos flexíveis e interface de convites.

## 0.5.0-beta.1 — 17/11/2026

### Curadoria e jogabilidade
- 704 temas preservados com classificação editorial: 311 Casuais, 162 Fãs/Entusiastas, 231 Especialistas.
- Temas especializados fora do sorteio padrão; acessíveis no filtro Especialista e Todo o catálogo.
- Perguntas genéricas reformuladas; conservação de alimentos ampliada; metas flexíveis em 141 listas grandes.
- Dicas progressivas e sorteio ponderado por histórico, evitando temas repetidos e avaliações negativas.
- Ajuste das estatísticas locais para reconhecer meta atingida sem exigir 100%.

### Social e segurança
- Avaliação de pergunta/resposta, armazenamento local para visitantes e registro online para usuários autenticados.
- Rankings separados por Casual/Fãs/Especialista e Sprint/Turbo, com validação de pontos no servidor.
- Convites de cinco temas para amigos, comparação de pontos para jogadores com conta, fallback de link local.
- Painel de moderação com autorização explícita no banco; sem administradores automáticos.
- Backend e dados em Neon; funcionalidades da beta dependem de homologação em produção.

### Verificações
- Paridade de 704 temas entre HTML e API, validação de IDs e 141 metas, testes de interface no desktop e celular.
- Pendências de homologação online e anti-cheat descritas no README.

## 0.4.1-beta.4 — 17/11/2026
- Correções de cookies, proxy Neon Auth e validação de sessão em Vercel.

## 0.4.1-beta.3 — 17/11/2026
- Tentativa de sessão same-origin via reescrita; substituída pelo proxy da beta.4.

## 0.4.1-beta.2 — 17/11/2026
- Domínios confiáveis de autenticação e notificações de cadastro/login.

## 0.4.1-beta.1 — 17/11/2026
- Base beta com 704 desafios, Contexto, Termo, Dueto, Anagrama e estrutura Neon Auth/ranking.
