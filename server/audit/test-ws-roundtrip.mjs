import { WebSocket } from 'ws';
function open(mark){
  return new Promise(res => {
    const w = new WebSocket('wss://wilhelmina-calvus-overmellowly.ngrok-free.dev/?token=5c06408b9c6f75dd4e6e9fe2a3200e3dd5e1cd02da8b0e818fec50a35138b942', { headers: { Origin: 'https://Brun0Simoes.github.io' } });
    w.on('open', () => w.send(JSON.stringify({t:'hello', me:{email:mark+'@x.com', name:mark, region:'kanto', level:1, party:0, badges:0}})));
    w.on('message', d => { const m = JSON.parse(d); if (m.t==='presence' && m.players.length>=2) res({w, players:m.players}); });
    setTimeout(()=>res({w, players: []}), 5000);
  });
}
const a = await open('userA');
const b = await open('userB');
console.log('A vê:', a.players.map(p=>p.email));
console.log('B vê:', b.players.map(p=>p.email));
a.w.close(); b.w.close();
process.exit(0);
