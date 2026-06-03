// Replica formula battle.js:1077-1081
function tryRun(pSpeed, eSpeed, rngFn = Math.random) {
  const escape = (pSpeed * 32) / Math.max(1, eSpeed) + 30 * rngFn() * 100;
  return rngFn() * 256 < (escape / 8);
}

console.log('=== Foge sempre se MUITO mais rapido ===');
let s=0;
for (let i=0;i<10000;i++) if (tryRun(200, 50)) s++;
console.log(`200vs50: ${(s/100).toFixed(1)}% (esperado ~100%)`);

console.log('\n=== Foge raramente se MUITO mais lento ===');
s=0;
for (let i=0;i<10000;i++) if (tryRun(50, 200)) s++;
console.log(`50vs200: ${(s/100).toFixed(1)}%`);

console.log('\n=== Tie ===');
s=0;
for (let i=0;i<10000;i++) if (tryRun(100, 100)) s++;
console.log(`100vs100: ${(s/100).toFixed(1)}%`);

console.log('\n=== Canonical Gen 1: F = (A*32) / (B/4 % 256) + 30*C ===');
console.log('codigo usa: escape = (pSpeed * 32) / eSpeed + 30 * random * 100');
console.log('OBS: codigo tem "* 100" no termo random — Gen 1 nao tinha *100');
console.log('OBS: codigo NAO incrementa attempt counter (Gen 1 tinha C = attempts+1)');
console.log('Resultado: codigo deve ter taxa de fuga maior que canonical');
