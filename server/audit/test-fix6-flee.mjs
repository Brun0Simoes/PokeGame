// Canonical Gen 1+ flee formula
function tryFlee(pSpeed, eSpeed, attempts) {
  const F = Math.floor((pSpeed * 32) / Math.max(1, Math.floor(eSpeed / 4) % 256)) + 30 * attempts;
  return F >= 255 || Math.floor(Math.random() * 256) < F;
}

function rate(pSpeed, eSpeed, attempts) {
  let s = 0;
  const N = 10000;
  for (let i=0;i<N;i++) if (tryFlee(pSpeed, eSpeed, attempts)) s++;
  return (s/N*100).toFixed(1);
}

console.log('=== Fórmula canonical: speed manda ===');
console.log('Equal speed (100v100), attempt 1:', rate(100,100,1)+'%');
console.log('Equal speed (100v100), attempt 2:', rate(100,100,2)+'%');
console.log('Equal speed (100v100), attempt 3:', rate(100,100,3)+'%');

console.log('\n=== Mais rapido ===');
console.log('2x speed (200v100), attempt 1:', rate(200,100,1)+'%');
console.log('4x speed (200v50), attempt 1:', rate(200,50,1)+'%');
console.log('10x speed (300v30), attempt 1:', rate(300,30,1)+'%');

console.log('\n=== Mais lento ===');
console.log('1/2 speed (50v100), attempt 1:', rate(50,100,1)+'%');
console.log('1/4 speed (50v200), attempt 1:', rate(50,200,1)+'%');
console.log('1/4 speed, attempt 5 (cumula):', rate(50,200,5)+'%');

console.log('\n=== Comparacao com canonical Bulbapedia ===');
console.log('A=100, B=100, C=1: F = (3200/25)+30 = 158 → 158/256 = 61.7%');
console.log('A=50,  B=200, C=1: F = (1600/50)+30 = 62 → 62/256 = 24.2%');
console.log('A=200, B=50,  C=1: F = (6400/12)+30 = 563 → SEMPRE foge (>=255)');

console.log('\n=== Speed MUITO importante agora? ===');
const slow = parseFloat(rate(50,200,1));
const fast = parseFloat(rate(200,50,1));
const ratio = fast / slow;
console.log(`Fast/slow ratio: ${ratio.toFixed(1)}x`);
console.log(slow < 30 && fast > 95 ? 'OK — diferenca clara' : 'FAIL');

console.log('\n=== Antes do fix (broken): speed mal afetava ===');
function brokenFlee(pSpeed, eSpeed) {
  const escape = (pSpeed * 32) / Math.max(1, eSpeed) + 30 * Math.random() * 100;
  return Math.random() * 256 < (escape/8);
}
let brSlow=0, brFast=0, N=10000;
for (let i=0;i<N;i++) {
  if (brokenFlee(50,200)) brSlow++;
  if (brokenFlee(200,50)) brFast++;
}
console.log(`Antes: slow=${(brSlow/N*100).toFixed(1)}%, fast=${(brFast/N*100).toFixed(1)}% (problemas: ambos ~65-70%, speed quase invisivel)`);
