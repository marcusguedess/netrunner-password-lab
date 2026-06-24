import test from "node:test";
import assert from "node:assert/strict";
import { analyzePassword, generatePassword, maskPassword } from "../js/password.js";

test("gera uma senha com o tamanho solicitado", () => {
  const password = generatePassword({
    length: 24,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });

  assert.equal(password.length, 24);
});

test("inclui pelo menos um caractere de cada protocolo selecionado", () => {
  const password = generatePassword({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });

  assert.match(password, /[A-Z]/);
  assert.match(password, /[a-z]/);
  assert.match(password, /\d/);
  assert.match(password, /[^A-Za-z0-9]/);
});

test("recusa configuração sem protocolos", () => {
  assert.throws(
    () =>
      generatePassword({
        length: 16,
        uppercase: false,
        lowercase: false,
        numbers: false,
        symbols: false,
      }),
    /Selecione pelo menos um/,
  );
});

test("máscara preserva apenas o comprimento", () => {
  assert.equal(maskPassword("Vault-42"), "••••••••");
});

test("senha longa e variada recebe classificação alta", () => {
  const analysis = analyzePassword("aB3!xY7@kL9#pQ2$zN5%");
  assert.ok(analysis.score >= 60);
  assert.match(analysis.label, /Forte|Ultra/);
});

test("padrões previsíveis recebem penalidade", () => {
  const predictable = analyzePassword("Password1234!!!!");
  const randomLike = analyzePassword("vQ7!mZ2@rT9#xP4$");
  assert.ok(predictable.score < randomLike.score);
});

test("amostra de geração apresenta variedade", () => {
  const generated = new Set();

  for (let index = 0; index < 200; index += 1) {
    generated.add(
      generatePassword({
        length: 16,
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
      }),
    );
  }

  assert.ok(generated.size > 195);
});
