# Revisão de segurança

Data da revisão: 23 de junho de 2026

## Resumo executivo

Nenhuma vulnerabilidade crítica ou alta foi identificada no código atual. A
aplicação é estática, não recebe conteúdo remoto, não processa autenticação e
não persiste a senha gerada.

Os controles principais estão implementados: Web Crypto API, CSP restritiva,
Trusted Types, ausência de dependências de execução, validação automatizada,
CodeQL e limpeza da credencial por expiração ou encerramento da página.

## Controles verificados

- Não há `innerHTML`, `document.write`, `eval`, `new Function` ou handlers
  inline.
- Não há scripts, fontes ou estilos carregados de terceiros.
- Não há armazenamento de segredos. O `localStorage` é usado somente para
  pontuação, tempo, dificuldade e data, com esquema validado e limite de cinco
  registros.
- A senha é gerada com `crypto.getRandomValues`.
- A senha não é enviada pela rede.
- O Service Worker aceita somente requisições `GET` da mesma origem.
- O workflow de publicação só executa após validação e testes.
- As permissões de GitHub Actions seguem o princípio de menor privilégio por
  job.
- O CodeQL analisa JavaScript em pushes, pull requests e semanalmente.

## Riscos residuais

### SR-01 — Bloqueio narrativo do ICE

**Severidade:** informativa

A senha precisa existir na memória do navegador antes da vitória. Um usuário
que controla as ferramentas de desenvolvimento pode inspecionar a execução.
O projeto documenta explicitamente que o minijogo não representa criptografia
contra o próprio operador do navegador.

### SR-02 — Área de transferência

**Severidade:** baixa

Após a cópia, a senha passa a existir no clipboard do sistema operacional. A
aplicação não substitui nem limpa esse conteúdo automaticamente, evitando uma
alteração inesperada fora do contexto da página.

### SR-03 — Limitações do GitHub Pages

**Severidade:** baixa

A CSP é entregue por `<meta>`, pois o GitHub Pages não permite definir todos os
headers livremente por repositório. Diretivas como `frame-ancestors` precisam
ser aplicadas por uma camada de hospedagem com controle de headers caso o
projeto migre no futuro.

### SR-04 — Cache offline

**Severidade:** baixa

O Service Worker pode manter uma versão anterior até sua ativação. O nome do
cache deve ser incrementado quando alterações de segurança exigirem invalidação
imediata do app shell.

## Recomendações de manutenção

1. Executar `npm run check` antes de cada envio.
2. Revisar alertas do CodeQL e do Dependabot, caso dependências sejam adicionadas.
3. Não incluir analytics, fontes remotas ou scripts de terceiros sem revisar
   CSP, privacidade e cadeia de fornecimento.
4. Nunca persistir senhas reais, mesmo em funcionalidades futuras de histórico.
5. Atualizar `CACHE_NAME` ao publicar correções críticas.
