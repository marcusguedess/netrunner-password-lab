# Segurança

## Modelo do projeto

O Netrunner Password Lab é uma aplicação estática executada integralmente no
navegador. Não há backend, contas, cookies de sessão, banco de dados ou chaves
de API. A principal informação sensível é a senha gerada durante a sessão.

## Controles adotados

- A senha usa `crypto.getRandomValues`, com rejeição de valores fora do limite
  para evitar viés na seleção de caracteres.
- Cada grupo de caracteres selecionado contribui com pelo menos um caractere.
- A senha não é enviada pela rede e não é salva em `localStorage`,
  `sessionStorage`, IndexedDB ou cookies. O `localStorage` guarda apenas um
  ranking opcional de pontuação, tempo, dificuldade e data, validado antes do
  uso.
- A referência da senha é apagada no evento `pagehide`.
- A interface usa `textContent`, `value` e criação explícita de elementos. Não
  há uso de `innerHTML`, `document.write`, `eval` ou handlers inline.
- Não há JavaScript, CSS, fontes ou bibliotecas carregadas de terceiros.
- Uma Content Security Policy em `<meta>` restringe scripts e estilos ao
  próprio site, bloqueia objetos e formulários, limita conexões e workers à
  mesma origem e exige Trusted Types para sinks de script.
- O botão de cópia só é habilitado depois da vitória no ICEbreaker.
- O jogo pausa quando a aba perde visibilidade.
- A senha expira após cinco minutos de inatividade depois de revelada.
- O Service Worker ignora métodos diferentes de `GET` e outras origens.
- O CI executa validação, testes e CodeQL antes da publicação.

## Limitações da hospedagem estática

A política CSP em `<meta>` não suporta todas as diretivas disponíveis em um
header HTTP. Em particular, proteção de framing deve ser configurada na camada
de hospedagem quando houver controle sobre os headers. O GitHub Pages fornece
HTTPS, mas não permite configurar livremente todos os headers por repositório.

O conteúdo copiado passa para a área de transferência do sistema, que fica fora
do controle da aplicação. O projeto não limpa o clipboard automaticamente para
não substituir conteúdo do usuário sem uma ação explícita.

## Relato de vulnerabilidades

Ao encontrar uma falha, evite incluir senhas reais, tokens ou outros segredos no
relato. Descreva o cenário, o navegador utilizado e os passos mínimos para
reprodução.

A revisão técnica atual está documentada em [SECURITY-REVIEW.md](SECURITY-REVIEW.md).
