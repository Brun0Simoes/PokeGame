// probe what battle-core needs
try {
  const m = await import('../../js/battle-core.js');
  console.log('OK keys:', Object.keys(m).join(', '));
} catch (e) {
  console.log('FAIL:', e.message);
}
