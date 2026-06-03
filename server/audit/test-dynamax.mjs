import * as core from '../../js/battle-core.js';

console.log('=== Max base power curve ===');
const tests = [
  [40, 90], [50, 100], [60, 110], [70, 120], [100, 130], [140, 140], [200, 150],
];
for (const [bp, exp] of tests) {
  const got = core.maxBasePower(bp);
  console.log(`BP ${bp} -> ${got} (esperado ${exp})`, got===exp?'OK':'FAIL');
}

console.log('\n=== Max move side effects ===');
const want = {
  fire:'weather', water:'weather', rock:'weather', ice:'weather',
  grass:'enemyStat', poison:'enemyStat', ground:'enemyStat', bug:'enemyStat',
  fighting:'selfStat', flying:'selfStat', psychic:'selfStat', dragon:'selfStat',
};
for (const [t, kind] of Object.entries(want)) {
  const fx = core.maxMoveEffect(t);
  console.log(`${t}: ${fx?.kind} (esperado ${kind})`, fx?.kind===kind?'OK':'FAIL');
}

console.log('\n=== Max move names PT-BR ===');
for (const t of ['fire','water','grass','psychic']) {
  console.log(`max ${t}:`, core.maxMoveName(t, false));
  console.log(`gmax ${t}:`, core.maxMoveName(t, true));
}

console.log('\n=== HP × 2 + reversao proporcional simulada ===');
const mon = { hp:80, maxHp:100, level:50 };
const backup = { hp: mon.hp, maxHp: mon.maxHp };
// _doDynamax: maxHp = round(maxHp * 2); hp = round(hp * 2)
mon.maxHp = Math.round(mon.maxHp * 2);
mon.hp = Math.round(mon.hp * 2);
console.log('apos dynamax:', mon, '(esperado hp=160, maxHp=200)');
// supor que o mon levou 50 dano
mon.hp -= 50;
console.log('apos dano 50:', mon, '(hp=110, ratio=0.55)');
// _endMaxIfNeeded:
const ratio = mon.hp / mon.maxHp;
mon.maxHp = backup.maxHp;
mon.hp = Math.max(1, Math.min(mon.maxHp, Math.round(mon.maxHp * ratio)));
console.log('apos revert:', mon, '(esperado hp=55 (0.55*100), maxHp=100)');
