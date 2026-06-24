# Endurecimento do repositório no GitHub

Estas configurações dependem da conta e precisam ser aplicadas após o primeiro
push.

## Branch `main`

- Exigir pull request antes de merge
- Exigir uma aprovação
- Exigir resolução de conversas
- Exigir branch atualizada antes de merge
- Tornar obrigatórios os checks de validação, E2E e CodeQL
- Bloquear force push e exclusão
- Exigir commits assinados

## Segurança

- Ativar Secret scanning
- Ativar Push protection
- Ativar Dependabot alerts
- Ativar Private vulnerability reporting
- Revisar semanalmente alertas do CodeQL

## Identidade do desenvolvedor

- Usar o e-mail privado `noreply` fornecido pelo GitHub nos commits públicos
- Ativar autenticação em dois fatores
- Preferir chave SSH protegida ou assinatura SSH/GPG para commits
- Não versionar `.env`, chaves, tokens, perfis de navegador ou arquivos pessoais

## CODEOWNERS

Crie `.github/CODEOWNERS` somente depois de confirmar o nome exato da conta do
GitHub. Não use um identificador presumido. Recomenda-se proteger especialmente:

```text
* @SEU-USUARIO
/.github/ @SEU-USUARIO
/js/password.js @SEU-USUARIO
/sw.js @SEU-USUARIO
/index.html @SEU-USUARIO
```
