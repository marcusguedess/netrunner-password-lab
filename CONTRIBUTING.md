# Contribuição

## Preparação

```bash
npm ci
npx playwright install chromium firefox
```

## Antes de enviar uma mudança

```bash
npm run check
npm run test:e2e
```

## Regras de segurança

- Nunca inclua senhas reais, tokens, cookies, chaves, arquivos `.env` ou perfis
  de navegador.
- Não adicione scripts, fontes, analytics ou assets remotos sem uma revisão de
  CSP, privacidade, licença e cadeia de fornecimento.
- Não use `innerHTML`, `document.write`, `eval`, `new Function` ou handlers
  inline.
- Não persista a senha ou qualquer derivação que permita recuperá-la.
- Dados lidos de armazenamento local devem ser validados antes do uso.
- GitHub Actions devem permanecer fixadas por SHA completo.
- Mudanças em `js/password.js`, `sw.js`, CSP e workflows exigem revisão
  específica de segurança.

## Commits

Use commits pequenos e objetivos. Em repositórios públicos, prefira o endereço
`noreply` do GitHub e commits assinados por SSH ou GPG.
