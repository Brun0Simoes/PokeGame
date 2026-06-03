// regex de validacao do email
const r = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const tests = [
  ['ok@email.com', true],
  ['bruno.simoes@gmail.com', true],
  ['no-at-sign', false],
  ['no@dot', false],
  ['', false],
  ['@no-local.com', false],
  ['has space@e.com', false],
  ['valid@x.io', true],
  ['unicode@émail.com', true], // accents allowed
];
console.log('=== Email regex ===');
let pass=0;
for (const [e, exp] of tests) {
  const got = r.test(e);
  console.log(`${exp===got?'OK':'FAIL'} '${e}': ${got}`);
  if (got===exp) pass++;
}
console.log(`${pass}/${tests.length} pass`);

console.log('\n=== Constraints documentadas ===');
console.log('Nome treinador: >= 2 chars, maxlength 14');
console.log('Senha: >= 4 chars');
console.log('Confirmação igual à senha');
