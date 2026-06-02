/* ============================================================
   data.js — static game data
   regions, starters, type chart, items, gym layouts
   ============================================================ */

export const REGIONS = [
  { id: 'kanto', apiId: 1, name: 'Kanto', gen: 1, color: '#E63946', accent: '#9F1F2D',
    motto: 'A região clássica. Onde tudo começou.',
    blurb: 'Florestas profundas, cidades vibrantes, vulcões e ruínas — terra natal do Professor Carvalho.',
    starters: [1, 4, 7] },
  { id: 'johto', apiId: 2, name: 'Johto', gen: 2, color: '#F2B939', accent: '#B7872A',
    motto: 'Tradição, torres e lenda.',
    blurb: 'Cidades milenares, criadores de Pokémon e a torre dos sinos. O lar do Professor Olmo.',
    starters: [152, 155, 158] },
  { id: 'hoenn', apiId: 3, name: 'Hoenn', gen: 3, color: '#2D5BD1', accent: '#1A3A99',
    motto: 'Mar, vulcão e tempestade.',
    blurb: 'Arquipélago tropical com mergulhos, dunas e clima extremo. Casa do Professor Bétula.',
    starters: [252, 255, 258] },
  { id: 'sinnoh', apiId: 4, name: 'Sinnoh', gen: 4, color: '#735797', accent: '#4A3263',
    motto: 'Montanhas geladas e mitos antigos.',
    blurb: 'Picos nevados, lagos sagrados e os mitos da criação do mundo. Casa do Professor Sorvo.',
    starters: [387, 390, 393] },
  { id: 'unova', apiId: 5, name: 'Unova', gen: 5, color: '#705746', accent: '#3F2F22',
    motto: 'Metrópole, pontes e ideais.',
    blurb: 'Inspirada em uma megacidade. Linhas de trem, arranha-céus e novas espécies a cada esquina.',
    starters: [495, 498, 501] },
  { id: 'kalos', apiId: 6, name: 'Kalos', gen: 6, color: '#D685AD', accent: '#9C4F75',
    motto: 'Beleza, moda e Mega Evoluções.',
    blurb: 'Inspirada na França. Cafés em Lumiose, castelos e a estreia das Mega Evoluções.',
    starters: [650, 653, 656] },
  { id: 'alola', apiId: 7, name: 'Alola', gen: 7, color: '#79C9F2', accent: '#1F8AB5',
    motto: 'Ilhas, totens e provas.',
    blurb: 'Arquipélago tropical com Pokémon regionais únicos, totens gigantes e provas insulares.',
    starters: [722, 725, 728] },
  { id: 'galar', apiId: 8, name: 'Galar', gen: 8, color: '#6F35FC', accent: '#3F1AA0',
    motto: 'Estádios lotados e Dynamax.',
    blurb: 'Inspirada na Grã-Bretanha. Torcida nos estádios, neves do norte e Pokémon gigantes.',
    starters: [810, 813, 816] },
  { id: 'hisui', apiId: 9, name: 'Hisui', gen: 8, color: '#A8A77A', accent: '#5C5B3F',
    motto: 'Sinnoh antiga, antes da história.',
    blurb: 'A versão antiga de Sinnoh. Ainda sem treinadores — só você, sua noble cause e a Pokédex.',
    starters: [722, 155, 501] },
  { id: 'paldea', apiId: 10, name: 'Paldea', gen: 9, color: '#7AC74C', accent: '#3F7A28',
    motto: 'Mundo aberto, três rotas, um sonho.',
    blurb: 'Inspirada na Península Ibérica. Mundo aberto com três grandes histórias e Terastalização.',
    starters: [906, 909, 912] },
];

/* Hardcoded starters (ID → minimal meta) — sprites fetched live from API */
export const STARTERS = {
  1:   { id:1,   name:'bulbasaur',  types:['grass','poison'],     color:'#7AC74C' },
  4:   { id:4,   name:'charmander', types:['fire'],               color:'#EE8130' },
  7:   { id:7,   name:'squirtle',   types:['water'],              color:'#6390F0' },

  152: { id:152, name:'chikorita',  types:['grass'],              color:'#7AC74C' },
  155: { id:155, name:'cyndaquil',  types:['fire'],               color:'#EE8130' },
  158: { id:158, name:'totodile',   types:['water'],              color:'#6390F0' },

  252: { id:252, name:'treecko',    types:['grass'],              color:'#7AC74C' },
  255: { id:255, name:'torchic',    types:['fire'],               color:'#EE8130' },
  258: { id:258, name:'mudkip',     types:['water','ground'],     color:'#6390F0' },

  387: { id:387, name:'turtwig',    types:['grass'],              color:'#7AC74C' },
  390: { id:390, name:'chimchar',   types:['fire'],               color:'#EE8130' },
  393: { id:393, name:'piplup',     types:['water'],              color:'#6390F0' },

  495: { id:495, name:'snivy',      types:['grass'],              color:'#7AC74C' },
  498: { id:498, name:'tepig',      types:['fire'],               color:'#EE8130' },
  501: { id:501, name:'oshawott',   types:['water'],              color:'#6390F0' },

  650: { id:650, name:'chespin',    types:['grass'],              color:'#7AC74C' },
  653: { id:653, name:'fennekin',   types:['fire'],               color:'#EE8130' },
  656: { id:656, name:'froakie',    types:['water'],              color:'#6390F0' },

  722: { id:722, name:'rowlet',     types:['grass','flying'],     color:'#7AC74C' },
  725: { id:725, name:'litten',     types:['fire'],               color:'#EE8130' },
  728: { id:728, name:'popplio',    types:['water'],              color:'#6390F0' },

  810: { id:810, name:'grookey',    types:['grass'],              color:'#7AC74C' },
  813: { id:813, name:'scorbunny',  types:['fire'],               color:'#EE8130' },
  816: { id:816, name:'sobble',     types:['water'],              color:'#6390F0' },

  906: { id:906, name:'sprigatito', types:['grass'],              color:'#7AC74C' },
  909: { id:909, name:'fuecoco',    types:['fire'],               color:'#EE8130' },
  912: { id:912, name:'quaxly',     types:['water'],              color:'#6390F0' },
};

/* Type effectiveness matrix
   ROW = attacker type
   COL = defender type
   2.0 = super effective, 0.5 = not very, 0 = no effect, 1 = normal
 */
const T = ['normal','fire','water','electric','grass','ice','fighting','poison','ground',
           'flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'];

export const TYPES = T;

const E = (...vals) => Object.fromEntries(T.map((t,i)=>[t, vals[i] ?? 1]));

export const TYPE_CHART = {
  normal:   E(1,1,1,1, 1,1,1,1, 1,1, 1,1, 0.5,0,1, 1,0.5,1),
  fire:     E(1,0.5,0.5,1, 2,2,1,1, 1,1, 1,2, 0.5,1,0.5, 1,2,1),
  water:    E(1,2,0.5,1, 0.5,1,1,1, 2,1, 1,1, 2,1,0.5, 1,1,1),
  electric: E(1,1,2,0.5, 0.5,1,1,1, 0,2, 1,1, 1,1,0.5, 1,1,1),
  grass:    E(1,0.5,2,1, 0.5,1,1,0.5, 2,0.5, 1,0.5, 2,1,0.5, 1,0.5,1),
  ice:      E(1,0.5,0.5,1, 2,0.5,1,1, 2,2, 1,1, 1,1,2, 1,0.5,1),
  fighting: E(2,1,1,1, 1,2,1,0.5, 1,0.5, 0.5,0.5, 2,0,1, 2,2,0.5),
  poison:   E(1,1,1,1, 2,1,1,0.5, 0.5,1, 1,1, 0.5,0.5,1, 1,0,2),
  ground:   E(1,2,1,2, 0.5,1,1,2, 1,0, 1,0.5, 2,1,1, 1,2,1),
  flying:   E(1,1,1,0.5, 2,1,2,1, 1,1, 1,2, 0.5,1,1, 1,0.5,1),
  psychic:  E(1,1,1,1, 1,1,2,2, 1,1, 0.5,1, 1,1,1, 0,0.5,1),
  bug:      E(1,0.5,1,1, 2,1,0.5,0.5, 1,0.5, 2,1, 1,0.5,1, 2,0.5,0.5),
  rock:     E(1,2,1,1, 1,2,0.5,1, 0.5,2, 1,2, 1,1,1, 1,0.5,1),
  ghost:    E(0,1,1,1, 1,1,1,1, 1,1, 2,1, 1,2,1, 0.5,1,1),
  dragon:   E(1,1,1,1, 1,1,1,1, 1,1, 1,1, 1,1,2, 1,0.5,0),
  dark:     E(1,1,1,1, 1,1,0.5,1, 1,1, 2,1, 1,2,1, 0.5,1,0.5),
  steel:    E(1,0.5,0.5,0.5, 1,2,1,1, 1,1, 1,1, 2,1,1, 1,0.5,2),
  fairy:    E(1,0.5,1,1, 1,1,2,0.5, 1,1, 1,1, 1,1,2, 2,0.5,1),
};

export function typeMultiplier(attackType, defenderTypes){
  if(!attackType) return 1;
  let mult = 1;
  for(const t of defenderTypes||[]){
    mult *= (TYPE_CHART[attackType]?.[t] ?? 1);
  }
  return mult;
}

/* Items catalog */
export const ITEMS = {
  // Pokébolas
  'poke-ball':   { id:'poke-ball',   cat:'ball', name:'Poké Ball',   price:200,  mult:1.0, color:'#DC3545',
                   desc:'Bola padrão para capturar Pokémon selvagens.' },
  'great-ball':  { id:'great-ball',  cat:'ball', name:'Great Ball',  price:600,  mult:1.5, color:'#2D5BD1',
                   desc:'Pokébola melhorada — taxa 1.5×.' },
  'ultra-ball':  { id:'ultra-ball',  cat:'ball', name:'Ultra Ball',  price:1200, mult:2.0, color:'#F2B939',
                   desc:'Pokébola superior — taxa 2.0×.' },
  'net-ball':    { id:'net-ball',    cat:'ball', name:'Net Ball',    price:1000, mult:3.0, color:'#2AA9A0', ballTag:'water/bug',
                   desc:'3× contra Pokémon de Água e Inseto.' },
  'dusk-ball':   { id:'dusk-ball',   cat:'ball', name:'Dusk Ball',   price:1000, mult:3.0, color:'#3A4A5A', ballTag:'night',
                   desc:'3× à noite ou em cavernas.' },
  'quick-ball':  { id:'quick-ball',  cat:'ball', name:'Quick Ball',  price:1000, mult:4.0, color:'#3E7CC0', ballTag:'firstturn',
                   desc:'4× se usada no primeiro turno.' },
  'timer-ball':  { id:'timer-ball',  cat:'ball', name:'Timer Ball',  price:1000, mult:3.0, color:'#D8503A', ballTag:'lateturn',
                   desc:'Mais eficaz quanto mais longa a batalha.' },
  'dive-ball':   { id:'dive-ball',   cat:'ball', name:'Dive Ball',   price:1000, mult:3.0, color:'#2E78C8', ballTag:'water',
                   desc:'3.5× para Pokémon encontrados na água.' },
  'nest-ball':   { id:'nest-ball',   cat:'ball', name:'Nest Ball',   price:1000, mult:2.5, color:'#8FBF4A', ballTag:'lowlevel',
                   desc:'Melhor contra Pokémon de nível baixo.' },
  'repeat-ball': { id:'repeat-ball', cat:'ball', name:'Repeat Ball', price:1000, mult:3.0, color:'#E08A2A', ballTag:'caught',
                   desc:'3× para espécies já capturadas.' },
  'luxury-ball': { id:'luxury-ball', cat:'ball', name:'Luxury Ball', price:1000, mult:1.0, color:'#2A2540', ballTag:'friend',
                   desc:'Aumenta a amizade do Pokémon capturado.' },
  'heal-ball':   { id:'heal-ball',   cat:'ball', name:'Heal Ball',   price:300,  mult:1.0, color:'#E879A6', ballTag:'heal',
                   desc:'Cura totalmente o Pokémon ao capturar.' },
  'premier-ball':{ id:'premier-ball',cat:'ball', name:'Premier Ball', price:200, mult:1.0, color:'#F5F2EC', ballTag:'rare',
                   desc:'Uma bola rara e comemorativa.' },
  'dream-ball':  { id:'dream-ball',  cat:'ball', name:'Dream Ball',  price:1000, mult:4.0, color:'#C77ED8', ballTag:'sleep',
                   desc:'4× contra Pokémon adormecidos.' },
  'master-ball': { id:'master-ball', cat:'ball', name:'Master Ball', price:30000,mult:255, color:'#5A2A8A', ballTag:'master',
                   desc:'Captura qualquer Pokémon sem falhar.' },
  // Medicina
  'potion':       { id:'potion',       cat:'med', name:'Poção',           price:300,   heal:20,         desc:'Restaura 20 PS.' },
  'super-potion': { id:'super-potion', cat:'med', name:'Super Poção',     price:700,   heal:60,         desc:'Restaura 60 PS.' },
  'hyper-potion': { id:'hyper-potion', cat:'med', name:'Hiper Poção',     price:1500,  heal:120,        desc:'Restaura 120 PS.' },
  'max-potion':   { id:'max-potion',   cat:'med', name:'Poção Máxima',    price:2500,  heal:9999,       desc:'Recupera todos os PS.' },
  'revive':       { id:'revive',       cat:'med', name:'Revive',          price:1500,  revive:'half',   desc:'Reanima um Pokémon com metade dos PS.' },
  'max-revive':   { id:'max-revive',   cat:'med', name:'Revive Máximo',   price:4000,  revive:'full',   desc:'Reanima com PS cheios.' },
  'antidote':     { id:'antidote',     cat:'med', name:'Antídoto',        price:100,   cure:'poisoned', desc:'Cura envenenamento.' },
  'awakening':    { id:'awakening',    cat:'med', name:'Pó Desperta',     price:250,   cure:'asleep',   desc:'Tira do sono.' },
  'paralyz-heal': { id:'paralyz-heal', cat:'med', name:'Cura Paralisia',  price:200,   cure:'paralyzed',desc:'Cura paralisia.' },
  'burn-heal':    { id:'burn-heal',    cat:'med', name:'Cura Queimadura', price:250,   cure:'burned',   desc:'Cura queimadura.' },
  'ice-heal':     { id:'ice-heal',     cat:'med', name:'Cura Congelamento',price:250,  cure:'frozen',   desc:'Descongela um Pokémon.' },
  'full-heal':    { id:'full-heal',    cat:'med', name:'Cura Total',      price:600,   cure:'all',      desc:'Cura qualquer condição de status.' },
  'ether':        { id:'ether',        cat:'med', name:'Éter',            price:1200,  pp:10,           desc:'Restaura 10 PP de um golpe.' },
  'max-ether':    { id:'max-ether',    cat:'med', name:'Éter Máximo',     price:2000,  pp:9999,         desc:'Restaura todo o PP de um golpe.' },
  'elixir':       { id:'elixir',       cat:'med', name:'Elixir',          price:3000,  ppAll:10,        desc:'Restaura 10 PP de todos os golpes.' },
  'max-elixir':   { id:'max-elixir',   cat:'med', name:'Elixir Máximo',   price:4500,  ppAll:9999,      desc:'Restaura todo o PP de todos os golpes.' },

  // Vitaminas / itens de EV (+10 EV por uso, respeitando limites)
  'hp-up':       { id:'hp-up',       cat:'ev', name:'Mais PS',      price:10000, ev:'hp',              evAmt:10, desc:'+10 EV de PS.' },
  'protein':     { id:'protein',     cat:'ev', name:'Proteína',     price:10000, ev:'attack',          evAmt:10, desc:'+10 EV de Ataque.' },
  'iron':        { id:'iron',        cat:'ev', name:'Ferro',        price:10000, ev:'defense',         evAmt:10, desc:'+10 EV de Defesa.' },
  'calcium':     { id:'calcium',     cat:'ev', name:'Cálcio',       price:10000, ev:'special-attack',  evAmt:10, desc:'+10 EV de Atq. Esp.' },
  'zinc':        { id:'zinc',        cat:'ev', name:'Zinco',        price:10000, ev:'special-defense', evAmt:10, desc:'+10 EV de Def. Esp.' },
  'carbos':      { id:'carbos',      cat:'ev', name:'Carbos',       price:10000, ev:'speed',           evAmt:10, desc:'+10 EV de Velocidade.' },
  'feather-hp':  { id:'feather-hp',  cat:'ev', name:'Pena Saúde',   price:300,   ev:'hp',              evAmt:1,  desc:'+1 EV de PS.' },
  'feather-atk': { id:'feather-atk', cat:'ev', name:'Pena Músculo', price:300,   ev:'attack',          evAmt:1,  desc:'+1 EV de Ataque.' },
  'feather-def': { id:'feather-def', cat:'ev', name:'Pena Resist.', price:300,   ev:'defense',         evAmt:1,  desc:'+1 EV de Defesa.' },
  'feather-spa': { id:'feather-spa', cat:'ev', name:'Pena Gênio',   price:300,   ev:'special-attack',  evAmt:1,  desc:'+1 EV de Atq. Esp.' },
  'feather-spd': { id:'feather-spd', cat:'ev', name:'Pena Clareza', price:300,   ev:'special-defense', evAmt:1,  desc:'+1 EV de Def. Esp.' },
  'feather-spe': { id:'feather-spe', cat:'ev', name:'Pena Veloz',   price:300,   ev:'speed',           evAmt:1,  desc:'+1 EV de Velocidade.' },
  'ev-reset':    { id:'ev-reset',    cat:'ev', name:'Baga Reset (EV)', price:800, evReset:true,        desc:'Zera todos os EVs do Pokémon.' },

  // Itens para segurar (held)
  'leftovers':    { id:'leftovers',    cat:'held', name:'Restos',        price:6000, held:{ effect:'leftovers' },              desc:'Recupera 1/16 dos PS por turno.' },
  'choice-band':  { id:'choice-band',  cat:'held', name:'Faixa Decisão', price:6000, held:{ effect:'atk', mult:1.5 },          desc:'+50% Ataque, mas trava no 1º golpe.' },
  'choice-specs': { id:'choice-specs', cat:'held', name:'Óculos Decisão',price:6000, held:{ effect:'spa', mult:1.5 },          desc:'+50% Atq. Esp., mas trava no 1º golpe.' },
  'choice-scarf': { id:'choice-scarf', cat:'held', name:'Lenço Decisão', price:6000, held:{ effect:'spe', mult:1.5 },          desc:'+50% Velocidade, mas trava no 1º golpe.' },
  'life-orb':     { id:'life-orb',     cat:'held', name:'Orbe Vida',     price:6000, held:{ effect:'lifeorb', mult:1.3 },       desc:'+30% de dano, mas perde PS a cada golpe.' },
  'focus-sash':   { id:'focus-sash',   cat:'held', name:'Faixa Foco',    price:5000, held:{ effect:'sash' },                   desc:'Sobrevive a um golpe fatal com 1 PS (uma vez).' },
  'assault-vest': { id:'assault-vest', cat:'held', name:'Colete Assalto',price:6000, held:{ effect:'spd', mult:1.5 },          desc:'+50% Def. Esp.' },
  'expert-belt':  { id:'expert-belt',  cat:'held', name:'Cinto Perito',  price:5000, held:{ effect:'expertbelt', mult:1.2 },    desc:'+20% em golpes super eficazes.' },
  'rocky-helmet': { id:'rocky-helmet', cat:'held', name:'Elmo Rochoso',  price:5000, held:{ effect:'rockyhelmet' },            desc:'Causa dano a quem o ataca por contato.' },
  'sitrus-berry': { id:'sitrus-berry', cat:'held', name:'Baga Sitrus',   price:1500, held:{ effect:'sitrus' },                 desc:'Recupera 25% dos PS quando abaixo de 50%.' },
  'lum-berry':    { id:'lum-berry',    cat:'held', name:'Baga Lum',       price:1500, held:{ effect:'lumberry' },               desc:'Cura qualquer condição de status uma vez.' },
  'oran-berry':   { id:'oran-berry',   cat:'held', name:'Baga Oran',      price:200,  held:{ effect:'oran' },                   desc:'Recupera 10 PS quando abaixo de 50%.' },
  'lansat-berry': { id:'lansat-berry', cat:'held', name:'Baga Lansat',    price:1500, held:{ effect:'critup' },                 desc:'Aumenta a chance de crítico em PS baixo.' },
  'salac-berry':  { id:'salac-berry',  cat:'held', name:'Baga Salac',     price:1500, held:{ effect:'spe', mult:1.5, lowhp:true },desc:'+Velocidade quando os PS ficam baixos.' },
  'liechi-berry': { id:'liechi-berry', cat:'held', name:'Baga Liechi',    price:1500, held:{ effect:'atk', mult:1.5, lowhp:true },desc:'+Ataque quando os PS ficam baixos.' },
  'leftovers-2':  { id:'leftovers-2',  cat:'held', name:'Casca Preta',    price:4000, held:{ effect:'blacksludge' },            desc:'Cura Pokémon Veneno por turno; fere os demais.' },
  'quick-claw':   { id:'quick-claw',   cat:'held', name:'Garra Rápida',  price:4000, held:{ effect:'quickclaw' },              desc:'Chance de atacar primeiro independente da Velocidade.' },
  'kings-rock':   { id:'kings-rock',   cat:'held', name:'Rocha do Rei',   price:4000, held:{ effect:'flinch' },                 desc:'Chance de fazer o oponente hesitar.' },
  'scope-lens':   { id:'scope-lens',   cat:'held', name:'Lente de Mira',  price:4000, held:{ effect:'critstage' },              desc:'Aumenta a taxa de golpe crítico.' },
  'wide-lens':    { id:'wide-lens',    cat:'held', name:'Lente Ampla',    price:4000, held:{ effect:'accuracy', mult:1.1 },     desc:'+10% de Precisão nos golpes.' },
  'muscle-band':  { id:'muscle-band',  cat:'held', name:'Faixa Músculo', price:4000, held:{ effect:'physboost', mult:1.1 },     desc:'+10% de dano em golpes físicos.' },
  'wise-glasses': { id:'wise-glasses', cat:'held', name:'Óculos Sábios', price:4000, held:{ effect:'specboost', mult:1.1 },    desc:'+10% de dano em golpes especiais.' },
  'flame-orb':    { id:'flame-orb',    cat:'held', name:'Orbe Chama',     price:4000, held:{ effect:'flameorb' },               desc:'Queima o portador no fim do turno.' },
  'toxic-orb':    { id:'toxic-orb',    cat:'held', name:'Orbe Tóxico',   price:4000, held:{ effect:'toxicorb' },               desc:'Envenena o portador no fim do turno.' },
  'eviolite':     { id:'eviolite',     cat:'held', name:'Eviolite',       price:6000, held:{ effect:'eviolite', mult:1.5 },      desc:'+50% Defesas se o Pokémon ainda evolui.' },
  'shell-bell':   { id:'shell-bell',   cat:'held', name:'Sino Concha',    price:4000, held:{ effect:'shellbell' },              desc:'Recupera PS com base no dano causado.' },
  'bright-powder':{ id:'bright-powder',cat:'held', name:'Pó Brilhante',  price:4000, held:{ effect:'evasion', mult:1.1 },      desc:'Reduz a precisão dos ataques inimigos.' },
  'metronome-item':{id:'metronome-item',cat:'held',name:'Metrônomo',     price:4000, held:{ effect:'metronome' },              desc:'Fortalece golpes usados repetidamente.' },
  'power-herb':   { id:'power-herb',   cat:'held', name:'Erva Poder',     price:4000, held:{ effect:'powerherb' },              desc:'Pula a recarga de golpes de 2 turnos (uma vez).' },
  'weakness-policy':{id:'weakness-policy',cat:'held',name:'Política Fraqueza',price:5000,held:{ effect:'weaknesspolicy' },    desc:'Sobe muito o Ataque ao levar golpe super eficaz.' },
  'absorb-bulb':  { id:'absorb-bulb',  cat:'held', name:'Bulbo Absorção',price:3000, held:{ effect:'absorbbulb' },             desc:'+Atq.Esp. ao ser atingido por golpe de Água.' },
  'cell-battery': { id:'cell-battery', cat:'held', name:'Pilha',          price:3000, held:{ effect:'cellbattery' },            desc:'+Ataque ao ser atingido por golpe Elétrico.' },
  'air-balloon':  { id:'air-balloon',  cat:'held', name:'Balão de Ar',   price:4000, held:{ effect:'airballoon' },             desc:'Imune a golpes de Terra até ser atingido.' },
  'red-card':     { id:'red-card',     cat:'held', name:'Cartão Vermelho',price:3000,held:{ effect:'redcard' },               desc:'Força o oponente a trocar ao atacar.' },
  'mental-herb':  { id:'mental-herb',  cat:'held', name:'Erva Mental',    price:3000, held:{ effect:'mentalherb' },             desc:'Cura efeitos que impedem golpes (uma vez).' },
  'light-clay':   { id:'light-clay',   cat:'held', name:'Argila Luz',     price:4000, held:{ effect:'lightclay' },              desc:'Prolonga as barreiras (Reflect/Light Screen).' },
  'heavy-duty-boots':{id:'heavy-duty-boots',cat:'held',name:'Botas Resistentes',price:5000,held:{ effect:'boots' },        desc:'Ignora armadilhas e perigos no campo.' },
  'type-gem-fire':{ id:'type-gem-fire',cat:'held', name:'Gema de Fogo',   price:3000, held:{ effect:'gem', gemType:'fire', mult:1.3 }, desc:'Fortalece um golpe de Fogo uma vez.' },
  'type-gem-water':{id:'type-gem-water',cat:'held',name:'Gema de Água',  price:3000, held:{ effect:'gem', gemType:'water', mult:1.3 },desc:'Fortalece um golpe de Água uma vez.' },
  'type-gem-electric':{id:'type-gem-electric',cat:'held',name:'Gema Elétrica',price:3000,held:{effect:'gem',gemType:'electric',mult:1.3},desc:'Fortalece um golpe Elétrico uma vez.' },
  'charcoal':     { id:'charcoal',     cat:'held', name:'Carvão',         price:2000, held:{ effect:'typeboost', boostType:'fire', mult:1.2 },  desc:'+20% em golpes de Fogo.' },
  'mystic-water': { id:'mystic-water', cat:'held', name:'Água Mística',   price:2000, held:{ effect:'typeboost', boostType:'water', mult:1.2 }, desc:'+20% em golpes de Água.' },
  'magnet':       { id:'magnet',       cat:'held', name:'Ímã',            price:2000, held:{ effect:'typeboost', boostType:'electric', mult:1.2 },desc:'+20% em golpes Elétricos.' },
  'miracle-seed': { id:'miracle-seed', cat:'held', name:'Semente Milagre',price:2000, held:{ effect:'typeboost', boostType:'grass', mult:1.2 }, desc:'+20% em golpes de Grama.' },
  'never-melt-ice':{id:'never-melt-ice',cat:'held',name:'Gelo Eterno',    price:2000, held:{ effect:'typeboost', boostType:'ice', mult:1.2 },   desc:'+20% em golpes de Gelo.' },
  'black-belt':   { id:'black-belt',   cat:'held', name:'Faixa Preta',    price:2000, held:{ effect:'typeboost', boostType:'fighting', mult:1.2 },desc:'+20% em golpes de Luta.' },
  'poison-barb':  { id:'poison-barb',  cat:'held', name:'Espinho Tóxico', price:2000, held:{ effect:'typeboost', boostType:'poison', mult:1.2 },desc:'+20% em golpes de Veneno.' },
  'soft-sand':    { id:'soft-sand',    cat:'held', name:'Areia Macia',    price:2000, held:{ effect:'typeboost', boostType:'ground', mult:1.2 }, desc:'+20% em golpes de Terra.' },
  'sharp-beak':   { id:'sharp-beak',   cat:'held', name:'Bico Afiado',    price:2000, held:{ effect:'typeboost', boostType:'flying', mult:1.2 }, desc:'+20% em golpes Voadores.' },
  'twisted-spoon':{ id:'twisted-spoon',cat:'held', name:'Colher Torta',   price:2000, held:{ effect:'typeboost', boostType:'psychic', mult:1.2 },desc:'+20% em golpes Psíquicos.' },
  'silver-powder':{ id:'silver-powder',cat:'held', name:'Pó Prateado',   price:2000, held:{ effect:'typeboost', boostType:'bug', mult:1.2 },    desc:'+20% em golpes de Inseto.' },
  'hard-stone':   { id:'hard-stone',   cat:'held', name:'Pedra Dura',     price:2000, held:{ effect:'typeboost', boostType:'rock', mult:1.2 },   desc:'+20% em golpes de Pedra.' },
  'spell-tag':    { id:'spell-tag',    cat:'held', name:'Talismã',        price:2000, held:{ effect:'typeboost', boostType:'ghost', mult:1.2 },  desc:'+20% em golpes de Fantasma.' },
  'dragon-fang':  { id:'dragon-fang',  cat:'held', name:'Presa Dragão',  price:2000, held:{ effect:'typeboost', boostType:'dragon', mult:1.2 }, desc:'+20% em golpes de Dragão.' },
  'black-glasses':{ id:'black-glasses',cat:'held', name:'Óculos Escuros', price:2000, held:{ effect:'typeboost', boostType:'dark', mult:1.2 },   desc:'+20% em golpes Noturnos.' },
  'metal-coat':   { id:'metal-coat',   cat:'held', name:'Cobertura Metal',price:2000, held:{ effect:'typeboost', boostType:'steel', mult:1.2 },  desc:'+20% em golpes de Aço.' },
  'silk-scarf':   { id:'silk-scarf',   cat:'held', name:'Cachecol Seda',  price:2000, held:{ effect:'typeboost', boostType:'normal', mult:1.2 }, desc:'+20% em golpes Normais.' },
  'fairy-feather':{ id:'fairy-feather',cat:'held', name:'Pena Féerica',  price:2000, held:{ effect:'typeboost', boostType:'fairy', mult:1.2 },  desc:'+20% em golpes de Fada.' },

  // Pedras de Mega Evolução (roster completo)
  'mega-stone-venusaur':    { id:'mega-stone-venusaur',    cat:'mega', name:'Venusaurita',    price:8000, megaFor:3,   megaName:'Mega Venusaur',    desc:'Permite Mega Evoluir Venusaur.' },
  'mega-stone-charizard-x': { id:'mega-stone-charizard-x', cat:'mega', name:'Charizardita X', price:8000, megaFor:6,   megaName:'Mega Charizard X', desc:'Permite Mega Evoluir Charizard (X).' },
  'mega-stone-charizard-y': { id:'mega-stone-charizard-y', cat:'mega', name:'Charizardita Y', price:8000, megaFor:6,   megaName:'Mega Charizard Y', desc:'Permite Mega Evoluir Charizard (Y).' },
  'mega-stone-blastoise':   { id:'mega-stone-blastoise',   cat:'mega', name:'Blastoisinita',  price:8000, megaFor:9,   megaName:'Mega Blastoise',   desc:'Permite Mega Evoluir Blastoise.' },
  'mega-stone-beedrill':    { id:'mega-stone-beedrill',    cat:'mega', name:'Beedrillita',    price:6000, megaFor:15,  megaName:'Mega Beedrill',    desc:'Permite Mega Evoluir Beedrill.' },
  'mega-stone-pidgeot':     { id:'mega-stone-pidgeot',     cat:'mega', name:'Pidgeotita',     price:6000, megaFor:18,  megaName:'Mega Pidgeot',     desc:'Permite Mega Evoluir Pidgeot.' },
  'mega-stone-alakazam':    { id:'mega-stone-alakazam',    cat:'mega', name:'Alakazita',      price:8000, megaFor:65,  megaName:'Mega Alakazam',    desc:'Permite Mega Evoluir Alakazam.' },
  'mega-stone-slowbro':     { id:'mega-stone-slowbro',     cat:'mega', name:'Slowbronita',    price:6000, megaFor:80,  megaName:'Mega Slowbro',     desc:'Permite Mega Evoluir Slowbro.' },
  'mega-stone-gengar':      { id:'mega-stone-gengar',      cat:'mega', name:'Gengarita',      price:8000, megaFor:94,  megaName:'Mega Gengar',      desc:'Permite Mega Evoluir Gengar.' },
  'mega-stone-kangaskhan':  { id:'mega-stone-kangaskhan',  cat:'mega', name:'Kangaskhanita',  price:7000, megaFor:115, megaName:'Mega Kangaskhan',  desc:'Permite Mega Evoluir Kangaskhan.' },
  'mega-stone-pinsir':      { id:'mega-stone-pinsir',      cat:'mega', name:'Pinsirita',      price:7000, megaFor:127, megaName:'Mega Pinsir',      desc:'Permite Mega Evoluir Pinsir.' },
  'mega-stone-gyarados':    { id:'mega-stone-gyarados',    cat:'mega', name:'Gyaradosita',    price:8000, megaFor:130, megaName:'Mega Gyarados',    desc:'Permite Mega Evoluir Gyarados.' },
  'mega-stone-aerodactyl':  { id:'mega-stone-aerodactyl',  cat:'mega', name:'Aerodactylita',  price:7000, megaFor:142, megaName:'Mega Aerodactyl',  desc:'Permite Mega Evoluir Aerodactyl.' },
  'mega-stone-mewtwo-x':    { id:'mega-stone-mewtwo-x',    cat:'mega', name:'Mewtwonita X',   price:12000,megaFor:150, megaName:'Mega Mewtwo X',    desc:'Permite Mega Evoluir Mewtwo (X).' },
  'mega-stone-mewtwo-y':    { id:'mega-stone-mewtwo-y',    cat:'mega', name:'Mewtwonita Y',   price:12000,megaFor:150, megaName:'Mega Mewtwo Y',    desc:'Permite Mega Evoluir Mewtwo (Y).' },
  'mega-stone-ampharos':    { id:'mega-stone-ampharos',    cat:'mega', name:'Ampharosita',    price:7000, megaFor:181, megaName:'Mega Ampharos',    desc:'Permite Mega Evoluir Ampharos.' },
  'mega-stone-steelix':     { id:'mega-stone-steelix',     cat:'mega', name:'Steelixita',     price:7000, megaFor:208, megaName:'Mega Steelix',     desc:'Permite Mega Evoluir Steelix.' },
  'mega-stone-scizor':      { id:'mega-stone-scizor',      cat:'mega', name:'Scizorita',      price:7000, megaFor:212, megaName:'Mega Scizor',      desc:'Permite Mega Evoluir Scizor.' },
  'mega-stone-heracross':   { id:'mega-stone-heracross',   cat:'mega', name:'Heracronita',    price:7000, megaFor:214, megaName:'Mega Heracross',   desc:'Permite Mega Evoluir Heracross.' },
  'mega-stone-houndoom':    { id:'mega-stone-houndoom',    cat:'mega', name:'Houndoominita',  price:7000, megaFor:229, megaName:'Mega Houndoom',    desc:'Permite Mega Evoluir Houndoom.' },
  'mega-stone-tyranitar':   { id:'mega-stone-tyranitar',   cat:'mega', name:'Tyranitarita',   price:9000, megaFor:248, megaName:'Mega Tyranitar',   desc:'Permite Mega Evoluir Tyranitar.' },
  'mega-stone-blaziken':    { id:'mega-stone-blaziken',    cat:'mega', name:'Blazikenita',    price:8000, megaFor:257, megaName:'Mega Blaziken',    desc:'Permite Mega Evoluir Blaziken.' },
  'mega-stone-gardevoir':   { id:'mega-stone-gardevoir',   cat:'mega', name:'Gardevoirita',   price:8000, megaFor:282, megaName:'Mega Gardevoir',   desc:'Permite Mega Evoluir Gardevoir.' },
  'mega-stone-mawile':      { id:'mega-stone-mawile',      cat:'mega', name:'Mawilita',       price:6000, megaFor:303, megaName:'Mega Mawile',      desc:'Permite Mega Evoluir Mawile.' },
  'mega-stone-aggron':      { id:'mega-stone-aggron',      cat:'mega', name:'Aggronita',      price:7000, megaFor:306, megaName:'Mega Aggron',      desc:'Permite Mega Evoluir Aggron.' },
  'mega-stone-medicham':    { id:'mega-stone-medicham',    cat:'mega', name:'Medichamita',    price:6000, megaFor:308, megaName:'Mega Medicham',    desc:'Permite Mega Evoluir Medicham.' },
  'mega-stone-manectric':   { id:'mega-stone-manectric',   cat:'mega', name:'Manectita',      price:7000, megaFor:310, megaName:'Mega Manectric',   desc:'Permite Mega Evoluir Manectric.' },
  'mega-stone-banette':     { id:'mega-stone-banette',     cat:'mega', name:'Banettita',      price:6000, megaFor:354, megaName:'Mega Banette',     desc:'Permite Mega Evoluir Banette.' },
  'mega-stone-absol':       { id:'mega-stone-absol',       cat:'mega', name:'Absolita',       price:7000, megaFor:359, megaName:'Mega Absol',       desc:'Permite Mega Evoluir Absol.' },
  'mega-stone-garchomp':    { id:'mega-stone-garchomp',    cat:'mega', name:'Garchompita',    price:9000, megaFor:445, megaName:'Mega Garchomp',    desc:'Permite Mega Evoluir Garchomp.' },
  'mega-stone-lucario':     { id:'mega-stone-lucario',     cat:'mega', name:'Lucarionita',    price:8000, megaFor:448, megaName:'Mega Lucario',     desc:'Permite Mega Evoluir Lucario.' },
  'mega-stone-abomasnow':   { id:'mega-stone-abomasnow',   cat:'mega', name:'Abomasita',      price:6000, megaFor:460, megaName:'Mega Abomasnow',   desc:'Permite Mega Evoluir Abomasnow.' },
  'mega-stone-gallade':     { id:'mega-stone-gallade',     cat:'mega', name:'Galladita',      price:8000, megaFor:475, megaName:'Mega Gallade',     desc:'Permite Mega Evoluir Gallade.' },
  'mega-stone-lopunny':     { id:'mega-stone-lopunny',     cat:'mega', name:'Lopunnita',      price:7000, megaFor:428, megaName:'Mega Lopunny',     desc:'Permite Mega Evoluir Lopunny.' },
  'mega-stone-salamence':   { id:'mega-stone-salamence',   cat:'mega', name:'Salamencita',    price:8000, megaFor:373, megaName:'Mega Salamence',   desc:'Permite Mega Evoluir Salamence.' },
  'mega-stone-metagross':   { id:'mega-stone-metagross',   cat:'mega', name:'Metagrossita',   price:9000, megaFor:376, megaName:'Mega Metagross',   desc:'Permite Mega Evoluir Metagross.' },
  'mega-stone-latias':      { id:'mega-stone-latias',      cat:'mega', name:'Latiasita',      price:10000,megaFor:380, megaName:'Mega Latias',      desc:'Permite Mega Evoluir Latias.' },
  'mega-stone-latios':      { id:'mega-stone-latios',      cat:'mega', name:'Latiosita',      price:10000,megaFor:381, megaName:'Mega Latios',      desc:'Permite Mega Evoluir Latios.' },
  'mega-stone-rayquaza':    { id:'mega-stone-rayquaza',    cat:'mega', name:'(Dragon Ascent)', price:15000,megaFor:384, megaName:'Mega Rayquaza',    desc:'Mega Evolui Rayquaza que saiba Dragon Ascent.' },
  'mega-stone-sableye':     { id:'mega-stone-sableye',     cat:'mega', name:'Sablenita',      price:6000, megaFor:302, megaName:'Mega Sableye',     desc:'Permite Mega Evoluir Sableye.' },
  'mega-stone-sharpedo':    { id:'mega-stone-sharpedo',    cat:'mega', name:'Sharpedonita',   price:7000, megaFor:319, megaName:'Mega Sharpedo',    desc:'Permite Mega Evoluir Sharpedo.' },
  'mega-stone-camerupt':    { id:'mega-stone-camerupt',    cat:'mega', name:'Cameruptita',    price:7000, megaFor:323, megaName:'Mega Camerupt',    desc:'Permite Mega Evoluir Camerupt.' },
  'mega-stone-altaria':     { id:'mega-stone-altaria',     cat:'mega', name:'Altarianita',    price:7000, megaFor:334, megaName:'Mega Altaria',     desc:'Permite Mega Evoluir Altaria.' },
  'mega-stone-glalie':      { id:'mega-stone-glalie',      cat:'mega', name:'Glalitita',      price:6000, megaFor:362, megaName:'Mega Glalie',      desc:'Permite Mega Evoluir Glalie.' },
  'mega-stone-swampert':    { id:'mega-stone-swampert',    cat:'mega', name:'Swampertita',    price:8000, megaFor:260, megaName:'Mega Swampert',    desc:'Permite Mega Evoluir Swampert.' },
  'mega-stone-sceptile':    { id:'mega-stone-sceptile',    cat:'mega', name:'Sceptilita',     price:8000, megaFor:254, megaName:'Mega Sceptile',    desc:'Permite Mega Evoluir Sceptile.' },
  'mega-stone-diancie':     { id:'mega-stone-diancie',     cat:'mega', name:'Diancita',       price:12000,megaFor:719, megaName:'Mega Diancie',     desc:'Permite Mega Evoluir Diancie.' },

  // Cristais Z (movimento Z) — um por tipo
  'z-normal':   { id:'z-normal',   cat:'zcrystal', name:'Normalium Z',  price:5000, zType:'normal',   desc:'Permite usar o Movimento Z do tipo Normal.' },
  'z-fire':     { id:'z-fire',     cat:'zcrystal', name:'Firium Z',     price:5000, zType:'fire',     desc:'Movimento Z do tipo Fogo.' },
  'z-water':    { id:'z-water',    cat:'zcrystal', name:'Waterium Z',   price:5000, zType:'water',    desc:'Movimento Z do tipo Água.' },
  'z-electric': { id:'z-electric', cat:'zcrystal', name:'Electrium Z',  price:5000, zType:'electric', desc:'Movimento Z do tipo Elétrico.' },
  'z-grass':    { id:'z-grass',    cat:'zcrystal', name:'Grassium Z',   price:5000, zType:'grass',    desc:'Movimento Z do tipo Grama.' },
  'z-ice':      { id:'z-ice',      cat:'zcrystal', name:'Icium Z',      price:5000, zType:'ice',      desc:'Movimento Z do tipo Gelo.' },
  'z-fighting': { id:'z-fighting', cat:'zcrystal', name:'Fightinium Z', price:5000, zType:'fighting', desc:'Movimento Z do tipo Lutador.' },
  'z-poison':   { id:'z-poison',   cat:'zcrystal', name:'Poisonium Z',  price:5000, zType:'poison',   desc:'Movimento Z do tipo Veneno.' },
  'z-ground':   { id:'z-ground',   cat:'zcrystal', name:'Groundium Z',  price:5000, zType:'ground',   desc:'Movimento Z do tipo Terra.' },
  'z-flying':   { id:'z-flying',   cat:'zcrystal', name:'Flyinium Z',   price:5000, zType:'flying',   desc:'Movimento Z do tipo Voador.' },
  'z-psychic':  { id:'z-psychic',  cat:'zcrystal', name:'Psychium Z',   price:5000, zType:'psychic',  desc:'Movimento Z do tipo Psíquico.' },
  'z-bug':      { id:'z-bug',      cat:'zcrystal', name:'Buginium Z',   price:5000, zType:'bug',      desc:'Movimento Z do tipo Inseto.' },
  'z-rock':     { id:'z-rock',     cat:'zcrystal', name:'Rockium Z',    price:5000, zType:'rock',     desc:'Movimento Z do tipo Pedra.' },
  'z-ghost':    { id:'z-ghost',    cat:'zcrystal', name:'Ghostium Z',   price:5000, zType:'ghost',    desc:'Movimento Z do tipo Fantasma.' },
  'z-dragon':   { id:'z-dragon',   cat:'zcrystal', name:'Dragonium Z',  price:5000, zType:'dragon',   desc:'Movimento Z do tipo Dragão.' },
  'z-dark':     { id:'z-dark',     cat:'zcrystal', name:'Darkinium Z',  price:5000, zType:'dark',     desc:'Movimento Z do tipo Noturno.' },
  'z-steel':    { id:'z-steel',    cat:'zcrystal', name:'Steelium Z',   price:5000, zType:'steel',    desc:'Movimento Z do tipo Aço.' },
  'z-fairy':    { id:'z-fairy',    cat:'zcrystal', name:'Fairium Z',    price:5000, zType:'fairy',    desc:'Movimento Z do tipo Fada.' },
  // Cristais Z exclusivos (assinatura)
  'z-pikachu':    { id:'z-pikachu',    cat:'zcrystal', name:'Pikanium Z',    price:8000, zType:'electric', signature:25,  desc:'Z exclusivo de Pikachu (Catastropika).' },
  'z-eevee':      { id:'z-eevee',      cat:'zcrystal', name:'Eevium Z',      price:8000, zType:'normal',   signature:133, desc:'Z exclusivo de Eevee (Extreme Evoboost).' },
  'z-snorlax':    { id:'z-snorlax',    cat:'zcrystal', name:'Snorlium Z',    price:8000, zType:'normal',   signature:143, desc:'Z exclusivo de Snorlax (Pulverizing Pancake).' },
  'z-mew':        { id:'z-mew',        cat:'zcrystal', name:'Mewnium Z',     price:9000, zType:'psychic',  signature:151, desc:'Z exclusivo de Mew (Genesis Supernova).' },
  'z-decidueye':  { id:'z-decidueye',  cat:'zcrystal', name:'Decidium Z',    price:8000, zType:'ghost',    signature:724, desc:'Z exclusivo de Decidueye (Sinister Arrow Raid).' },
  'z-incineroar': { id:'z-incineroar', cat:'zcrystal', name:'Incinium Z',    price:8000, zType:'dark',     signature:727, desc:'Z exclusivo de Incineroar (Malicious Moonsault).' },
  'z-primarina':  { id:'z-primarina',  cat:'zcrystal', name:'Primarium Z',   price:8000, zType:'water',    signature:730, desc:'Z exclusivo de Primarina (Oceanic Operetta).' },
  'z-lycanroc':   { id:'z-lycanroc',   cat:'zcrystal', name:'Lycanium Z',    price:8000, zType:'rock',     signature:745, desc:'Z exclusivo de Lycanroc (Splintered Stormshards).' },
  'z-mimikyu':    { id:'z-mimikyu',    cat:'zcrystal', name:'Mimikium Z',    price:8000, zType:'ghost',    signature:778, desc:'Z exclusivo de Mimikyu (Let’s Snuggle Forever).' },
  'z-kommo-o':    { id:'z-kommo-o',    cat:'zcrystal', name:'Kommonium Z',   price:8000, zType:'dragon',   signature:784, desc:'Z exclusivo de Kommo-o (Clangorous Soulblaze).' },
  'z-tapu':       { id:'z-tapu',       cat:'zcrystal', name:'Tapunium Z',    price:9000, zType:'fairy',    signature:785, desc:'Z exclusivo dos Tapus (Guardian of Alola).' },
  'z-solgaleo':   { id:'z-solgaleo',   cat:'zcrystal', name:'Solganium Z',   price:10000,zType:'steel',    signature:791, desc:'Z exclusivo de Solgaleo (Searing Sunraze Smash).' },
  'z-lunala':     { id:'z-lunala',     cat:'zcrystal', name:'Lunalium Z',    price:10000,zType:'ghost',    signature:792, desc:'Z exclusivo de Lunala (Menacing Moonraze Maelstrom).' },
  'z-marshadow':  { id:'z-marshadow',  cat:'zcrystal', name:'Marshadium Z',  price:10000,zType:'fighting', signature:802, desc:'Z exclusivo de Marshadow (Soul-Stealing 7-Star Strike).' },
  'z-necrozma':   { id:'z-necrozma',   cat:'zcrystal', name:'Ultranecrozium Z',price:12000,zType:'psychic',signature:800, desc:'Z exclusivo de Necrozma (Light That Burns the Sky).' },
  // Pedras evolutivas (cat:'evo')
  'fire-stone':    { id:'fire-stone',    cat:'evo', name:'Pedra do Fogo',   price:3000, stone:'fire-stone',    desc:'Evolui certos Pokémon de Fogo (Vulpix, Growlithe, Eevee→Flareon).' },
  'water-stone':   { id:'water-stone',   cat:'evo', name:'Pedra da Água',   price:3000, stone:'water-stone',   desc:'Evolui certos Pokémon de Água (Poliwhirl, Eevee→Vaporeon).' },
  'thunder-stone': { id:'thunder-stone', cat:'evo', name:'Pedra do Trovão', price:3000, stone:'thunder-stone', desc:'Evolui certos Pokémon Elétricos (Pikachu, Eevee→Jolteon).' },
  'leaf-stone':    { id:'leaf-stone',    cat:'evo', name:'Pedra da Folha',  price:3000, stone:'leaf-stone',    desc:'Evolui certos Pokémon de Grama (Gloom→Vileplume, Exeggcute).' },
  'moon-stone':    { id:'moon-stone',    cat:'evo', name:'Pedra da Lua',    price:3000, stone:'moon-stone',    desc:'Evolui certos Pokémon (Nidorina, Clefairy, Jigglypuff).' },
  'sun-stone':     { id:'sun-stone',     cat:'evo', name:'Pedra do Sol',    price:3000, stone:'sun-stone',     desc:'Evolui certos Pokémon (Gloom→Bellossom, Sunkern).' },
  'shiny-stone':   { id:'shiny-stone',   cat:'evo', name:'Pedra Lustrosa',  price:3000, stone:'shiny-stone',   desc:'Evolui certos Pokémon (Togetic, Roselia, Minccino).' },
  'dusk-stone':    { id:'dusk-stone',    cat:'evo', name:'Pedra Sombria',   price:3000, stone:'dusk-stone',    desc:'Evolui certos Pokémon (Murkrow, Misdreavus, Doublade).' },
  'dawn-stone':    { id:'dawn-stone',    cat:'evo', name:'Pedra da Aurora', price:3000, stone:'dawn-stone',    desc:'Evolui certos Pokémon (Kirlia→Gallade, Snorunt→Froslass).' },
  'ice-stone':     { id:'ice-stone',     cat:'evo', name:'Pedra do Gelo',   price:3000, stone:'ice-stone',     desc:'Evolui certos Pokémon de Gelo (Alolan Vulpix, Eevee→Glaceon).' },
  'oval-stone':    { id:'oval-stone',    cat:'evo', name:'Pedra Oval',      price:2000, stone:'oval-stone',    desc:'Usada por alguns Pokémon para evoluir (Happiny).' },
  // Chave (decorativos por enquanto)
  'town-map':    { id:'town-map',    cat:'key', name:'Mapa da Região', price:0, desc:'Permite ver o mapa da região atual.' },
  'running-shoes':{ id:'running-shoes', cat:'key', name:'Tênis de Corrida', price:0, desc:'Permite correr.' },
  // Faixas Dynamax / Gigantamax (chave — habilitam o gimmick na batalha)
  'dynamax-band': { id:'dynamax-band', cat:'key', name:'Bracelete Dynamax', price:0, dynamax:true, desc:'Permite Dynamax e Gigantamax em batalha.' },
  'z-ring':       { id:'z-ring',       cat:'key', name:'Anel Z',            price:0, zring:true,   desc:'Necessário para usar Movimentos Z (com um Cristal Z segurado).' },
  'mega-ring':    { id:'mega-ring',    cat:'key', name:'Anel da Chave',     price:0, megaring:true,desc:'Necessário para Mega Evoluir (com uma Mega Pedra segurada).' },
};

/* TMs / HMs — generated from a curated list of move names.
   Each teaches a move; buyable in the shop. */
export const TMS = [
  { id:'tm01', move:'thunderbolt',   type:'electric', price:3000 },
  { id:'tm02', move:'flamethrower',  type:'fire',     price:3000 },
  { id:'tm03', move:'surf',          type:'water',    price:3000, hm:true },
  { id:'tm04', move:'ice-beam',      type:'ice',      price:3000 },
  { id:'tm05', move:'earthquake',    type:'ground',   price:3000 },
  { id:'tm06', move:'psychic',       type:'psychic',  price:3000 },
  { id:'tm07', move:'shadow-ball',   type:'ghost',    price:3000 },
  { id:'tm08', move:'energy-ball',   type:'grass',    price:3000 },
  { id:'tm09', move:'dragon-claw',   type:'dragon',   price:3000 },
  { id:'tm10', move:'dazzling-gleam',type:'fairy',    price:3000 },
  { id:'tm11', move:'sludge-bomb',   type:'poison',   price:3000 },
  { id:'tm12', move:'rock-slide',    type:'rock',     price:3000 },
  { id:'tm13', move:'x-scissor',     type:'bug',      price:3000 },
  { id:'tm14', move:'brick-break',   type:'fighting', price:3000 },
  { id:'tm15', move:'air-slash',     type:'flying',   price:3000 },
  { id:'tm16', move:'crunch',        type:'dark',     price:3000 },
  { id:'tm17', move:'flash-cannon',  type:'steel',    price:3000 },
  { id:'tm18', move:'hyper-beam',    type:'normal',   price:5000 },
  { id:'hm01', move:'cut',           type:'normal',   price:0, hm:true },
  { id:'hm02', move:'fly',           type:'flying',   price:0, hm:true },
  { id:'hm03', move:'strength',      type:'normal',   price:0, hm:true },
  { id:'hm04', move:'waterfall',     type:'water',    price:0, hm:true },
  { id:'hm05', move:'rock-smash',    type:'fighting', price:0, hm:true },
];
/* register TMs into ITEMS so the bag/shop can resolve them uniformly */
for(const tm of TMS){
  ITEMS[tm.id] = {
    id: tm.id, cat:'tm', name:(tm.hm?'HM':'TM')+' · '+tm.move.replace(/-/g,' ').toUpperCase(),
    price: tm.price, move: tm.move, moveType: tm.type, hm: !!tm.hm,
    desc:`Ensina ${tm.move.replace(/-/g,' ').toUpperCase()} (${tm.type}).`,
  };
}

/* Starting bag for a new trainer */
export const STARTING_BAG = {
  balls:    { 'poke-ball': 5 },
  medicine: { 'potion': 3 },
  ev:       {},
  held:     {},
  mega:     {},
  zcrystal: {},
  tm:       {},
  evo:      {},
  key:      ['town-map','running-shoes','mega-ring','z-ring','dynamax-band'],
};
export const STARTING_MONEY = 3000;

/* Gym leaders, Elite 4, Champions and NPC trainers live in
   js/data/world.js — re-exported below as legacy aliases. */
export { WORLD, gymsFor, elite4For, championFor, npcsFor, trainerSprite, TRAINER_SPRITE_BASE } from './data/world.js';

/* legacy shape some code still reads */
import { WORLD as _WORLD } from './data/world.js';
export const GYMS         = Object.fromEntries(Object.entries(_WORLD).map(([k,v])=>[k, v.gyms]));
export const NPC_TRAINERS = Object.fromEntries(Object.entries(_WORLD).map(([k,v])=>[k, v.npcs]));
export const ELITE_FOUR   = Object.fromEntries(Object.entries(_WORLD).map(([k,v])=>[k, v.elite4]));
ELITE_FOUR.champion       = Object.fromEntries(Object.entries(_WORLD).map(([k,v])=>[k, v.champion]));

/* "Habilidades" simplificadas — usadas pra exibir info do Pokémon. */
export const SIMPLE_ABILITIES = {
  // mapeamento mínimo; o jogo lê do PokéAPI quando disponível
};

/* Cor por tipo (CSS hex) — para chips, auras, badges */
export const TYPE_COLOR = {
  normal:'#A8A77A', fire:'#EE8130', water:'#6390F0', electric:'#F7D02C',
  grass:'#7AC74C',  ice:'#96D9D6',  fighting:'#C22E28', poison:'#A33EA1',
  ground:'#E2BF65', flying:'#A98FF3', psychic:'#F95587', bug:'#A6B91A',
  rock:'#B6A136',   ghost:'#735797', dragon:'#6F35FC', dark:'#705746',
  steel:'#B7B7CE',  fairy:'#D685AD',
};

/* Curvas de XP simplificadas */
export function xpForLevel(lvl){ return Math.floor(0.8 * lvl*lvl*lvl); }
export function levelFromXp(xp){
  let lvl = 1;
  while(xpForLevel(lvl+1) <= xp) lvl++;
  return Math.min(100, lvl);
}

/* ============================================================
   REGIONAL ENCOUNTER POOL
   Each region maps to a contiguous species ID range so encounters
   only spawn region-appropriate Pokémon. Special-case Hisui to
   share Sinnoh's range + its own forms.
   ============================================================ */
export const REGION_POOL = {
  kanto:  [1, 151],
  johto:  [152, 251],
  hoenn:  [252, 386],
  sinnoh: [387, 493],
  unova:  [494, 649],
  kalos:  [650, 721],
  alola:  [722, 809],
  galar:  [810, 898],
  hisui:  [387, 905],   // Sinnoh range + Hisui-specific forms (899-905)
  paldea: [906, 1010],
};
export function regionRange(regionId){ return REGION_POOL[regionId] || null; }
