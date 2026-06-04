/* ============================================================
   data/world.js — full world data: NPCs, Gyms, Elite 4, Champions
   for all 10 regions.

   Each entry includes a `sprite` key resolvable via:
     https://play.pokemonshowdown.com/sprites/trainers/<key>.png
   Falls back to a generated SVG silhouette if the sprite 404s.

   Teams are arrays of { id: speciesId, lvl: number }.
   ============================================================ */

/* Trainer sprite resolver — Showdown CDN + SVG fallback */
export const TRAINER_SPRITE_BASE = 'https://play.pokemonshowdown.com/sprites/trainers/';
export function trainerSprite(key){
  if(!key) return null;
  return TRAINER_SPRITE_BASE + key + '.png';
}

/* ============================================================
   KANTO
   ============================================================ */
export const KANTO_GYMS = [
  { id:'kanto-1', city:'Pewter',    leader:'Brock',    sprite:'brock',     type:'rock',     levelCap:14, badge:{name:'Boulder',color:'#9C8B4A'}, team:[{id:74,lvl:12},{id:95,lvl:14}] },
  { id:'kanto-2', city:'Cerulean',  leader:'Misty',    sprite:'misty',     type:'water',    levelCap:21, badge:{name:'Cascade',color:'#79DAF7'}, team:[{id:120,lvl:18},{id:121,lvl:21}] },
  { id:'kanto-3', city:'Vermilion', leader:'Surge',    sprite:'ltsurge',   type:'electric', levelCap:24, badge:{name:'Thunder',color:'#F7D02C'}, team:[{id:100,lvl:21},{id:25,lvl:18},{id:26,lvl:24}] },
  { id:'kanto-4', city:'Celadon',   leader:'Erika',    sprite:'erika',     type:'grass',    levelCap:29, badge:{name:'Rainbow',color:'#FFA8C8'}, team:[{id:71,lvl:29},{id:114,lvl:24},{id:45,lvl:29}] },
  { id:'kanto-5', city:'Fuchsia',   leader:'Koga',     sprite:'koga',      type:'poison',   levelCap:43, badge:{name:'Soul',   color:'#7B2D86'}, team:[{id:109,lvl:37},{id:89,lvl:39},{id:110,lvl:43}] },
  { id:'kanto-6', city:'Saffron',   leader:'Sabrina',  sprite:'sabrina',   type:'psychic',  levelCap:50, badge:{name:'Marsh',  color:'#FF99AC'}, team:[{id:64,lvl:38},{id:122,lvl:37},{id:65,lvl:43}] },
  { id:'kanto-7', city:'Cinnabar',  leader:'Blaine',   sprite:'blaine',    type:'fire',     levelCap:47, badge:{name:'Volcano',color:'#FB5E2D'}, team:[{id:58,lvl:42},{id:77,lvl:40},{id:78,lvl:42},{id:59,lvl:47}] },
  { id:'kanto-8', city:'Viridian',  leader:'Giovanni', sprite:'giovanni',  type:'ground',   levelCap:50, badge:{name:'Earth',  color:'#7FCC36'}, team:[{id:111,lvl:45},{id:51,lvl:42},{id:31,lvl:44},{id:34,lvl:45},{id:112,lvl:50}] },
];
export const KANTO_ELITE = [
  { id:'kanto-e1', name:'Lorelei', sprite:'lorelei-gen3', type:'ice',      team:[{id:87,lvl:54},{id:91,lvl:53},{id:80,lvl:54},{id:124,lvl:56},{id:131,lvl:56}] },
  { id:'kanto-e2', name:'Bruno',   sprite:'bruno',        type:'fighting', team:[{id:95,lvl:53},{id:107,lvl:55},{id:106,lvl:55},{id:95,lvl:56},{id:68,lvl:58}] },
  { id:'kanto-e3', name:'Agatha',  sprite:'agatha-gen3',  type:'ghost',    team:[{id:94,lvl:56},{id:42,lvl:56},{id:93,lvl:55},{id:24,lvl:58},{id:94,lvl:60}] },
  { id:'kanto-e4', name:'Lance',   sprite:'lance',   type:'dragon',   team:[{id:130,lvl:58},{id:148,lvl:56},{id:142,lvl:60},{id:149,lvl:62}] },
];
export const KANTO_CHAMPION = { id:'kanto-champ', name:'Blue', sprite:'blue', team:[{id:18,lvl:61},{id:65,lvl:59},{id:112,lvl:61},{id:103,lvl:63},{id:130,lvl:63},{id:6,lvl:65}] };
export const KANTO_NPCS = [
  { id:'k-t1', class:'Bug Catcher', name:'Rick',  sprite:'youngster',  team:[{id:10,lvl:6},{id:13,lvl:6}] },
  { id:'k-t2', class:'Lass',        name:'Janice', sprite:'lass',      team:[{id:21,lvl:9},{id:19,lvl:9}] },
  { id:'k-t3', class:'Fisherman',   name:'Ted',   sprite:'fisherman',  team:[{id:129,lvl:10}] },
  { id:'k-t4', class:'Tamer',       name:'Lana',  sprite:'beauty',     team:[{id:39,lvl:14},{id:35,lvl:14}] },
  { id:'k-t5', class:'Scientist',   name:'Tim',   sprite:'scientist',  team:[{id:81,lvl:18},{id:100,lvl:18}] },
  { id:'k-t6', class:'Biker',       name:'Diego', sprite:'biker',      team:[{id:48,lvl:22},{id:46,lvl:22}] },
  { id:'k-t7', class:'Swimmer',     name:'Toni',  sprite:'swimmer',    team:[{id:120,lvl:26},{id:121,lvl:26}] },
  { id:'k-t8', class:'Hiker',       name:'Rio',   sprite:'hiker',      team:[{id:74,lvl:32},{id:75,lvl:30}] },
];

/* ============================================================
   JOHTO
   ============================================================ */
export const JOHTO_GYMS = [
  { id:'johto-1', city:'Violet',     leader:'Falkner',  sprite:'falkner',  type:'flying',   levelCap:9,  badge:{name:'Zephyr', color:'#A98FF3'}, team:[{id:16,lvl:7},{id:17,lvl:9}] },
  { id:'johto-2', city:'Azalea',     leader:'Bugsy',    sprite:'bugsy',    type:'bug',      levelCap:17, badge:{name:'Hive',   color:'#A6B91A'}, team:[{id:11,lvl:14},{id:14,lvl:14},{id:123,lvl:17}] },
  { id:'johto-3', city:'Goldenrod',  leader:'Whitney',  sprite:'whitney',  type:'normal',   levelCap:20, badge:{name:'Plain',  color:'#E0E0AA'}, team:[{id:35,lvl:18},{id:128,lvl:20}] },
  { id:'johto-4', city:'Ecruteak',   leader:'Morty',    sprite:'morty',    type:'ghost',    levelCap:25, badge:{name:'Fog',    color:'#735797'}, team:[{id:92,lvl:21},{id:93,lvl:21},{id:94,lvl:25},{id:93,lvl:23}] },
  { id:'johto-5', city:'Cianwood',   leader:'Chuck',    sprite:'chuck',    type:'fighting', levelCap:30, badge:{name:'Storm',  color:'#C22E28'}, team:[{id:57,lvl:27},{id:62,lvl:30}] },
  { id:'johto-6', city:'Olivine',    leader:'Jasmine',  sprite:'jasmine',  type:'steel',    levelCap:35, badge:{name:'Mineral',color:'#B7B7CE'}, team:[{id:81,lvl:30},{id:81,lvl:30},{id:208,lvl:35}] },
  { id:'johto-7', city:'Mahogany',   leader:'Pryce',    sprite:'pryce',    type:'ice',      levelCap:34, badge:{name:'Glacier',color:'#96D9D6'}, team:[{id:86,lvl:30},{id:221,lvl:32},{id:87,lvl:34}] },
  { id:'johto-8', city:'Blackthorn', leader:'Clair',    sprite:'clair',    type:'dragon',   levelCap:41, badge:{name:'Rising', color:'#6F35FC'}, team:[{id:148,lvl:38},{id:148,lvl:38},{id:148,lvl:38},{id:230,lvl:41}] },
];
export const JOHTO_ELITE = [
  { id:'johto-e1', name:'Will',    sprite:'will',    type:'psychic',  team:[{id:178,lvl:40},{id:103,lvl:41},{id:80,lvl:41},{id:96,lvl:41},{id:178,lvl:42}] },
  { id:'johto-e2', name:'Koga',    sprite:'koga',   type:'poison',   team:[{id:168,lvl:40},{id:49,lvl:41},{id:205,lvl:43},{id:89,lvl:42},{id:169,lvl:44}] },
  { id:'johto-e3', name:'Bruno',   sprite:'bruno',   type:'fighting', team:[{id:237,lvl:42},{id:106,lvl:42},{id:107,lvl:43},{id:95,lvl:43},{id:68,lvl:46}] },
  { id:'johto-e4', name:'Karen',   sprite:'karen',   type:'dark',     team:[{id:197,lvl:42},{id:45,lvl:42},{id:94,lvl:45},{id:198,lvl:44},{id:229,lvl:47}] },
];
export const JOHTO_CHAMPION = { id:'johto-champ', name:'Lance', sprite:'lance', team:[{id:130,lvl:44},{id:149,lvl:47},{id:149,lvl:47},{id:142,lvl:46},{id:148,lvl:46},{id:149,lvl:50}] };
export const JOHTO_NPCS = [
  { id:'j-t1', class:'Schoolboy',    name:'Alan',   sprite:'schoolkid',  team:[{id:21,lvl:5}] },
  { id:'j-t2', class:'Camper',       name:'Roland', sprite:'camper',     team:[{id:43,lvl:11},{id:46,lvl:11}] },
  { id:'j-t3', class:'Pokémaniac',   name:'Larry',  sprite:'pokemaniac', team:[{id:104,lvl:14}] },
  { id:'j-t4', class:'Bird Keeper',  name:'Theo',   sprite:'birdkeeper', team:[{id:163,lvl:16},{id:16,lvl:16}] },
  { id:'j-t5', class:'Sage',         name:'Edmond', sprite:'sage',       team:[{id:96,lvl:18},{id:96,lvl:18}] },
  { id:'j-t6', class:'Beauty',       name:'Cassie', sprite:'beauty',     team:[{id:35,lvl:25}] },
  { id:'j-t7', class:'Black Belt',   name:'Lao',    sprite:'blackbelt',  team:[{id:57,lvl:30}] },
  { id:'j-t8', class:'Kimono Girl',  name:'Naoko',  sprite:'kimonogirl', team:[{id:136,lvl:38}] },
];

/* ============================================================
   HOENN
   ============================================================ */
export const HOENN_GYMS = [
  { id:'hoenn-1', city:'Rustboro',     leader:'Roxanne', sprite:'roxanne', type:'rock',     levelCap:15, badge:{name:'Stone',   color:'#B6A136'}, team:[{id:74,lvl:12},{id:299,lvl:15}] },
  { id:'hoenn-2', city:'Dewford',      leader:'Brawly',  sprite:'brawly',  type:'fighting', levelCap:18, badge:{name:'Knuckle', color:'#C22E28'}, team:[{id:66,lvl:16},{id:296,lvl:18}] },
  { id:'hoenn-3', city:'Mauville',     leader:'Wattson', sprite:'wattson', type:'electric', levelCap:22, badge:{name:'Dynamo',  color:'#F7D02C'}, team:[{id:81,lvl:20},{id:309,lvl:20},{id:82,lvl:22}] },
  { id:'hoenn-4', city:'Lavaridge',    leader:'Flannery',sprite:'flannery',type:'fire',     levelCap:29, badge:{name:'Heat',    color:'#EE8130'}, team:[{id:218,lvl:26},{id:218,lvl:26},{id:323,lvl:29}] },
  { id:'hoenn-5', city:'Petalburg',    leader:'Norman',  sprite:'norman',  type:'normal',   levelCap:31, badge:{name:'Balance', color:'#A8A77A'}, team:[{id:264,lvl:27},{id:289,lvl:31},{id:288,lvl:28}] },
  { id:'hoenn-6', city:'Fortree',      leader:'Winona',  sprite:'winona',  type:'flying',   levelCap:33, badge:{name:'Feather', color:'#A98FF3'}, team:[{id:278,lvl:29},{id:227,lvl:29},{id:178,lvl:30},{id:333,lvl:31},{id:334,lvl:33}] },
  { id:'hoenn-7', city:'Mossdeep',     leader:'Tate&Liza',sprite:'tateliza',type:'psychic',levelCap:42, badge:{name:'Mind',  color:'#F95587'}, team:[{id:344,lvl:42},{id:178,lvl:41},{id:337,lvl:42},{id:338,lvl:42}] },
  { id:'hoenn-8', city:'Sootopolis',   leader:'Juan',    sprite:'juan',    type:'water',    levelCap:46, badge:{name:'Rain',    color:'#6390F0'}, team:[{id:319,lvl:41},{id:131,lvl:43},{id:339,lvl:43},{id:340,lvl:43},{id:350,lvl:46}] },
];
export const HOENN_ELITE = [
  { id:'hoenn-e1', name:'Sidney',  sprite:'sidney',  type:'dark',     team:[{id:262,lvl:46},{id:228,lvl:46},{id:319,lvl:48},{id:332,lvl:48},{id:359,lvl:49}] },
  { id:'hoenn-e2', name:'Phoebe',  sprite:'phoebe',  type:'ghost',    team:[{id:355,lvl:48},{id:355,lvl:49},{id:302,lvl:50},{id:353,lvl:51},{id:354,lvl:53}] },
  { id:'hoenn-e3', name:'Glacia',  sprite:'glacia',  type:'ice',      team:[{id:362,lvl:50},{id:364,lvl:50},{id:362,lvl:52},{id:131,lvl:53},{id:365,lvl:53}] },
  { id:'hoenn-e4', name:'Drake',   sprite:'drake',   type:'dragon',   team:[{id:372,lvl:52},{id:330,lvl:54},{id:329,lvl:53},{id:373,lvl:55},{id:373,lvl:55}] },
];
export const HOENN_CHAMPION = { id:'hoenn-champ', name:'Steven', sprite:'steven', team:[{id:227,lvl:57},{id:344,lvl:55},{id:319,lvl:55},{id:75,lvl:56},{id:323,lvl:56},{id:376,lvl:58}] };
export const HOENN_NPCS = [
  { id:'h-t1', class:'Youngster',    name:'Calvin', sprite:'youngster',  team:[{id:263,lvl:5}] },
  { id:'h-t2', class:'Lady',         name:'Cindy',  sprite:'lady',          team:[{id:298,lvl:8}] },
  { id:'h-t3', class:'Hex Maniac',   name:'Patricia',sprite:'hexmaniac',    team:[{id:200,lvl:14},{id:303,lvl:14}] },
  { id:'h-t4', class:'Triathlete',   name:'Jacob', sprite:'cyclist',       team:[{id:309,lvl:24},{id:309,lvl:24}] },
  { id:'h-t5', class:'Aroma Lady',   name:'Daisy', sprite:'aromalady',      team:[{id:43,lvl:11},{id:44,lvl:11}] },
  { id:'h-t6', class:'Bird Keeper',  name:'Coby',  sprite:'birdkeeper',  team:[{id:333,lvl:31}] },
  { id:'h-t7', class:'Tuber',        name:'Ricky', sprite:'tuber',         team:[{id:118,lvl:13}] },
  { id:'h-t8', class:'Magma Grunt',  name:'Drake', sprite:'magmagrunt',     team:[{id:322,lvl:18},{id:38,lvl:18}] },
];

/* ============================================================
   SINNOH
   ============================================================ */
export const SINNOH_GYMS = [
  { id:'sinnoh-1', city:'Oreburgh',    leader:'Roark',       sprite:'roark',       type:'rock',     levelCap:14, badge:{name:'Coal',     color:'#705746'}, team:[{id:74,lvl:12},{id:95,lvl:12},{id:408,lvl:14}] },
  { id:'sinnoh-2', city:'Eterna',      leader:'Gardenia',    sprite:'gardenia',    type:'grass',    levelCap:22, badge:{name:'Forest',   color:'#7AC74C'}, team:[{id:387,lvl:19},{id:46,lvl:20},{id:407,lvl:22}] },
  { id:'sinnoh-3', city:'Veilstone',   leader:'Maylene',     sprite:'maylene',     type:'fighting', levelCap:30, badge:{name:'Cobble',   color:'#C22E28'}, team:[{id:307,lvl:27},{id:67,lvl:27},{id:448,lvl:30}] },
  { id:'sinnoh-4', city:'Pastoria',    leader:'Crasher Wake',sprite:'crasherwake', type:'water',    levelCap:30, badge:{name:'Fen',      color:'#6390F0'}, team:[{id:55,lvl:27},{id:419,lvl:27},{id:195,lvl:30}] },
  { id:'sinnoh-5', city:'Hearthome',   leader:'Fantina',     sprite:'fantina',     type:'ghost',    levelCap:36, badge:{name:'Relic',    color:'#735797'}, team:[{id:200,lvl:32},{id:429,lvl:34},{id:356,lvl:36}] },
  { id:'sinnoh-6', city:'Canalave',    leader:'Byron',       sprite:'byron',       type:'steel',    levelCap:39, badge:{name:'Mine',     color:'#B7B7CE'}, team:[{id:436,lvl:36},{id:208,lvl:36},{id:411,lvl:39}] },
  { id:'sinnoh-7', city:'Snowpoint',   leader:'Candice',     sprite:'candice',     type:'ice',      levelCap:42, badge:{name:'Icicle',   color:'#96D9D6'}, team:[{id:215,lvl:38},{id:461,lvl:38},{id:478,lvl:40},{id:460,lvl:42}] },
  { id:'sinnoh-8', city:'Sunyshore',   leader:'Volkner',     sprite:'volkner',     type:'electric', levelCap:50, badge:{name:'Beacon',   color:'#F7D02C'}, team:[{id:419,lvl:46},{id:310,lvl:47},{id:135,lvl:47},{id:405,lvl:50}] },
];
export const SINNOH_ELITE = [
  { id:'sinnoh-e1', name:'Aaron',  sprite:'aaron',  type:'bug',     team:[{id:415,lvl:53},{id:49,lvl:49},{id:267,lvl:50},{id:168,lvl:51},{id:416,lvl:53}] },
  { id:'sinnoh-e2', name:'Bertha', sprite:'bertha', type:'ground',  team:[{id:195,lvl:50},{id:213,lvl:52},{id:464,lvl:53},{id:91,lvl:53},{id:472,lvl:55}] },
  { id:'sinnoh-e3', name:'Flint',  sprite:'flint',  type:'fire',    team:[{id:392,lvl:55},{id:467,lvl:55},{id:428,lvl:52},{id:425,lvl:54},{id:467,lvl:57}] },
  { id:'sinnoh-e4', name:'Lucian', sprite:'lucian', type:'psychic', team:[{id:178,lvl:53},{id:65,lvl:55},{id:308,lvl:56},{id:64,lvl:55},{id:475,lvl:59}] },
];
export const SINNOH_CHAMPION = { id:'sinnoh-champ', name:'Cynthia', sprite:'cynthia', team:[{id:443,lvl:58},{id:130,lvl:58},{id:467,lvl:58},{id:282,lvl:60},{id:423,lvl:60},{id:445,lvl:62}] };
export const SINNOH_NPCS = [
  { id:'s-t1', class:'Youngster',     name:'Tristan', sprite:'youngster',  team:[{id:396,lvl:5}] },
  { id:'s-t2', class:'Lass',          name:'Natalie', sprite:'lass',       team:[{id:399,lvl:6},{id:401,lvl:6}] },
  { id:'s-t3', class:'Bug Catcher',   name:'Jack',    sprite:'bugcatcher',    team:[{id:401,lvl:5}] },
  { id:'s-t4', class:'Picnicker',     name:'Karina',  sprite:'picnicker',     team:[{id:265,lvl:11},{id:265,lvl:11}] },
  { id:'s-t5', class:'Skier',         name:'Edward',  sprite:'skier',         team:[{id:215,lvl:35}] },
  { id:'s-t6', class:'Ace Trainer',   name:'Felicia', sprite:'acetrainer',   team:[{id:432,lvl:42}] },
  { id:'s-t7', class:'Galactic Grunt',name:'Saturn',  sprite:'galacticgrunt', team:[{id:431,lvl:38},{id:436,lvl:38}] },
  { id:'s-t8', class:'PI',            name:'Carlos',  sprite:'pi',            team:[{id:268,lvl:30},{id:269,lvl:30}] },
];

/* ============================================================
   UNOVA
   ============================================================ */
export const UNOVA_GYMS = [
  { id:'unova-1', city:'Striaton',    leader:'Cilan',   sprite:'cilan',     type:'grass',    levelCap:14, badge:{name:'Trio',     color:'#7AC74C'}, team:[{id:506,lvl:12},{id:511,lvl:14}] },
  { id:'unova-2', city:'Nacrene',     leader:'Lenora',  sprite:'lenora',    type:'normal',   levelCap:18, badge:{name:'Basic',    color:'#A8A77A'}, team:[{id:505,lvl:18},{id:507,lvl:20}] },
  { id:'unova-3', city:'Castelia',    leader:'Burgh',   sprite:'burgh',     type:'bug',      levelCap:22, badge:{name:'Insect',   color:'#A6B91A'}, team:[{id:542,lvl:21},{id:557,lvl:21},{id:545,lvl:23}] },
  { id:'unova-4', city:'Nimbasa',     leader:'Elesa',   sprite:'elesa',     type:'electric', levelCap:25, badge:{name:'Bolt',     color:'#F7D02C'}, team:[{id:587,lvl:23},{id:587,lvl:23},{id:587,lvl:25}] },
  { id:'unova-5', city:'Driftveil',   leader:'Clay',    sprite:'clay',      type:'ground',   levelCap:31, badge:{name:'Quake',    color:'#E2BF65'}, team:[{id:551,lvl:29},{id:556,lvl:31},{id:537,lvl:33}] },
  { id:'unova-6', city:'Mistralton',  leader:'Skyla',   sprite:'skyla',     type:'flying',   levelCap:39, badge:{name:'Jet',      color:'#A98FF3'}, team:[{id:528,lvl:37},{id:521,lvl:37},{id:581,lvl:39}] },
  { id:'unova-7', city:'Icirrus',     leader:'Brycen',  sprite:'brycen',    type:'ice',      levelCap:43, badge:{name:'Freeze',   color:'#96D9D6'}, team:[{id:583,lvl:41},{id:614,lvl:43}] },
  { id:'unova-8', city:'Opelucid',    leader:'Drayden', sprite:'drayden',   type:'dragon',   levelCap:48, badge:{name:'Legend',   color:'#6F35FC'}, team:[{id:621,lvl:46},{id:611,lvl:46},{id:612,lvl:48}] },
];
export const UNOVA_ELITE = [
  { id:'unova-e1', name:'Shauntal', sprite:'shauntal', type:'ghost',    team:[{id:563,lvl:48},{id:609,lvl:48},{id:354,lvl:50},{id:477,lvl:48}] },
  { id:'unova-e2', name:'Marshal',  sprite:'marshal',  type:'fighting', team:[{id:539,lvl:48},{id:559,lvl:48},{id:534,lvl:50},{id:538,lvl:48}] },
  { id:'unova-e3', name:'Grimsley', sprite:'grimsley', type:'dark',     team:[{id:510,lvl:48},{id:553,lvl:48},{id:625,lvl:50},{id:560,lvl:48}] },
  { id:'unova-e4', name:'Caitlin',  sprite:'caitlin',  type:'psychic',  team:[{id:561,lvl:48},{id:518,lvl:48},{id:576,lvl:50},{id:594,lvl:48}] },
];
export const UNOVA_CHAMPION = { id:'unova-champ', name:'Alder', sprite:'alder', team:[{id:621,lvl:75},{id:534,lvl:75},{id:631,lvl:75},{id:637,lvl:75},{id:635,lvl:77},{id:626,lvl:75}] };
export const UNOVA_NPCS = [
  { id:'u-t1', class:'Youngster',     name:'Reece',  sprite:'youngster',  team:[{id:506,lvl:4}] },
  { id:'u-t2', class:'Lass',          name:'Lori',   sprite:'lass',       team:[{id:519,lvl:6}] },
  { id:'u-t3', class:'Preschooler',   name:'Sarah',  sprite:'preschooler', team:[{id:572,lvl:5},{id:574,lvl:5}] },
  { id:'u-t4', class:'Roughneck',     name:'Maxim',  sprite:'roughneck',    team:[{id:551,lvl:18}] },
  { id:'u-t5', class:'Backpacker',    name:'Stephen',sprite:'backpacker',  team:[{id:511,lvl:14},{id:513,lvl:14}] },
  { id:'u-t6', class:'Dancer',        name:'Brian',  sprite:'dancer',       team:[{id:573,lvl:42}] },
  { id:'u-t7', class:'Plasma Grunt',  name:'Shadow', sprite:'plasmagrunt',  team:[{id:550,lvl:30},{id:624,lvl:30}] },
  { id:'u-t8', class:'Veteran',       name:'Hugo',   sprite:'veteran',     team:[{id:631,lvl:58},{id:530,lvl:58}] },
];

/* ============================================================
   KALOS
   ============================================================ */
export const KALOS_GYMS = [
  { id:'kalos-1', city:'Santalune',  leader:'Viola',    sprite:'viola',    type:'bug',     levelCap:14, badge:{name:'Bug',      color:'#A6B91A'}, team:[{id:283,lvl:10},{id:666,lvl:12}] },
  { id:'kalos-2', city:'Cyllage',    leader:'Grant',    sprite:'grant',    type:'rock',    levelCap:25, badge:{name:'Cliff',    color:'#B6A136'}, team:[{id:696,lvl:25},{id:698,lvl:25}] },
  { id:'kalos-3', city:'Shalour',    leader:'Korrina',  sprite:'korrina',  type:'fighting',levelCap:32, badge:{name:'Rumble',   color:'#C22E28'}, team:[{id:619,lvl:29},{id:67,lvl:28},{id:701,lvl:32}] },
  { id:'kalos-4', city:'Coumarine',  leader:'Ramos',    sprite:'ramos',    type:'grass',   levelCap:34, badge:{name:'Plant',    color:'#7AC74C'}, team:[{id:189,lvl:30},{id:70,lvl:31},{id:673,lvl:34}] },
  { id:'kalos-5', city:'Lumiose',    leader:'Clemont',  sprite:'clemont',  type:'electric',levelCap:37, badge:{name:'Voltage',  color:'#F7D02C'}, team:[{id:587,lvl:35},{id:181,lvl:35},{id:695,lvl:37}] },
  { id:'kalos-6', city:'Laverre',    leader:'Valerie',  sprite:'valerie',  type:'fairy',   levelCap:42, badge:{name:'Fairy',    color:'#D685AD'}, team:[{id:303,lvl:38},{id:683,lvl:39},{id:282,lvl:42}] },
  { id:'kalos-7', city:'Anistar',    leader:'Olympia',  sprite:'olympia',  type:'psychic', levelCap:48, badge:{name:'Psychic',  color:'#F95587'}, team:[{id:518,lvl:44},{id:561,lvl:45},{id:678,lvl:48}] },
  { id:'kalos-8', city:'Snowbelle',  leader:'Wulfric',  sprite:'wulfric',  type:'ice',     levelCap:59, badge:{name:'Iceberg',  color:'#96D9D6'}, team:[{id:584,lvl:56},{id:460,lvl:55},{id:713,lvl:59}] },
];
export const KALOS_ELITE = [
  { id:'kalos-e1', name:'Malva',     sprite:'malva',     type:'fire',   team:[{id:668,lvl:63},{id:38,lvl:63},{id:663,lvl:63},{id:609,lvl:65}] },
  { id:'kalos-e2', name:'Siebold',   sprite:'siebold',   type:'water',  team:[{id:91,lvl:63},{id:222,lvl:63},{id:121,lvl:63},{id:693,lvl:65}] },
  { id:'kalos-e3', name:'Wikstrom',  sprite:'wikstrom',  type:'steel',  team:[{id:707,lvl:63},{id:476,lvl:63},{id:227,lvl:63},{id:681,lvl:65}] },
  { id:'kalos-e4', name:'Drasna',    sprite:'drasna',    type:'dragon', team:[{id:715,lvl:63},{id:330,lvl:63},{id:691,lvl:63},{id:706,lvl:65}] },
];
export const KALOS_CHAMPION = { id:'kalos-champ', name:'Diantha', sprite:'diantha', team:[{id:701,lvl:64},{id:330,lvl:65},{id:609,lvl:65},{id:687,lvl:66},{id:282,lvl:66},{id:719,lvl:68}] };
export const KALOS_NPCS = [
  { id:'kl-t1', class:'Youngster',  name:'Austin', sprite:'youngster',  team:[{id:519,lvl:5}] },
  { id:'kl-t2', class:'Lass',       name:'Bridget',sprite:'lass',       team:[{id:684,lvl:6}] },
  { id:'kl-t3', class:'Roller Skater',name:'Yuna',sprite:'rollerskater',team:[{id:702,lvl:11}] },
  { id:'kl-t4', class:'Fairy Tale Girl',name:'Lillian',sprite:'fairytalegirl',team:[{id:280,lvl:24}] },
  { id:'kl-t5', class:'Punk Girl',  name:'Joline',sprite:'punkgirl',     team:[{id:551,lvl:30},{id:455,lvl:30}] },
  { id:'kl-t6', class:'Ace Trainer',name:'Sasha',sprite:'acetrainer',team:[{id:359,lvl:50}] },
  { id:'kl-t7', class:'Sky Trainer',name:'Aidan',sprite:'skytrainer',  team:[{id:587,lvl:45},{id:227,lvl:45}] },
  { id:'kl-t8', class:'Hex Maniac', name:'Patty',sprite:'hexmaniac',  team:[{id:609,lvl:52}] },
];

/* ============================================================
   ALOLA — trial captains + Kahunas instead of gyms
   ============================================================ */
export const ALOLA_GYMS = [
  { id:'alola-1', city:'Verdant Cavern',leader:'Ilima',  sprite:'ilima',  type:'normal',   levelCap:12, badge:{name:'Normalium Z', color:'#A8A77A'}, team:[{id:751,lvl:10},{id:734,lvl:12}] },
  { id:'alola-2', city:'Brooklet Hill', leader:'Lana',   sprite:'lana',   type:'water',    levelCap:21, badge:{name:'Waterium Z',  color:'#6390F0'}, team:[{id:777,lvl:20},{id:746,lvl:21}] },
  { id:'alola-3', city:'Wela Volcano',  leader:'Kiawe',  sprite:'kiawe',  type:'fire',     levelCap:24, badge:{name:'Firium Z',    color:'#EE8130'}, team:[{id:758,lvl:22},{id:757,lvl:24}] },
  { id:'alola-4', city:'Lush Jungle',   leader:'Mallow', sprite:'mallow', type:'grass',    levelCap:25, badge:{name:'Grassium Z',  color:'#7AC74C'}, team:[{id:752,lvl:24},{id:756,lvl:25}] },
  { id:'alola-5', city:'Hokulani',      leader:'Sophocles',sprite:'sophocles',type:'electric',levelCap:33,badge:{name:'Electrium Z',color:'#F7D02C'},team:[{id:738,lvl:33},{id:780,lvl:33}] },
  { id:'alola-6', city:'Thrifty Mega',  leader:'Acerola',sprite:'acerola',type:'ghost',    levelCap:35, badge:{name:'Ghostium Z',  color:'#735797'}, team:[{id:710,lvl:34},{id:778,lvl:35}] },
  { id:'alola-7', city:'Vast Poni',     leader:'Mina',   sprite:'mina',   type:'fairy',    levelCap:51, badge:{name:'Fairium Z',   color:'#D685AD'}, team:[{id:778,lvl:50},{id:730,lvl:51}] },
  { id:'alola-8', city:'Exeggutor Island',leader:'Hapu', sprite:'hapu',   type:'ground',   levelCap:55, badge:{name:'Groundium Z', color:'#E2BF65'}, team:[{id:330,lvl:51},{id:464,lvl:53},{id:330,lvl:53},{id:450,lvl:55}] },
];
export const ALOLA_ELITE = [
  { id:'alola-e1', name:'Hala',     sprite:'hala',     type:'fighting', team:[{id:62,lvl:54},{id:701,lvl:54},{id:766,lvl:54},{id:740,lvl:54},{id:767,lvl:56}] },
  { id:'alola-e2', name:'Olivia',   sprite:'olivia',   type:'rock',     team:[{id:745,lvl:54},{id:558,lvl:54},{id:464,lvl:54},{id:738,lvl:56}] },
  { id:'alola-e3', name:'Acerola',  sprite:'acerola',  type:'ghost',    team:[{id:563,lvl:54},{id:475,lvl:54},{id:711,lvl:54},{id:778,lvl:56}] },
  { id:'alola-e4', name:'Kahili',   sprite:'kahili',   type:'flying',   team:[{id:741,lvl:54},{id:227,lvl:54},{id:628,lvl:54},{id:701,lvl:56}] },
];
export const ALOLA_CHAMPION = { id:'alola-champ', name:'Kukui', sprite:'kukui', team:[{id:5,lvl:57},{id:745,lvl:57},{id:323,lvl:57},{id:227,lvl:57},{id:248,lvl:58},{id:745,lvl:60}] };
export const ALOLA_NPCS = [
  { id:'al-t1', class:'Youngster',  name:'Joey',  sprite:'youngster',  team:[{id:744,lvl:8}] },
  { id:'al-t2', class:'Preschooler',name:'Mia',   sprite:'preschooler', team:[{id:735,lvl:10}] },
  { id:'al-t3', class:'Surfer',     name:'Frank', sprite:'rollerskater', team:[{id:118,lvl:14}] },
  { id:'al-t4', class:'Aether Foundation',name:'Lily',sprite:'aetherfoundation',team:[{id:736,lvl:24}] },
  { id:'al-t5', class:'Hiker',      name:'Calvin',sprite:'hiker',    team:[{id:74,lvl:28}] },
  { id:'al-t6', class:'Office Worker',name:'Royce',sprite:'officeworker',team:[{id:677,lvl:40}] },
  { id:'al-t7', class:'Team Skull', name:'Dan',   sprite:'teamskullgrunt',team:[{id:752,lvl:30}] },
  { id:'al-t8', class:'Master Trainer',name:'Aila',sprite:'mastertrainer',team:[{id:730,lvl:55}] },
];

/* ============================================================
   GALAR
   ============================================================ */
export const GALAR_GYMS = [
  { id:'galar-1', city:'Turffield',  leader:'Milo',    sprite:'milo',    type:'grass',    levelCap:20, badge:{name:'Grass',     color:'#7AC74C'}, team:[{id:830,lvl:19},{id:830,lvl:20}] },
  { id:'galar-2', city:'Hulbury',    leader:'Nessa',   sprite:'nessa',   type:'water',    levelCap:24, badge:{name:'Water',     color:'#6390F0'}, team:[{id:846,lvl:22},{id:340,lvl:23},{id:834,lvl:24}] },
  { id:'galar-3', city:'Motostoke',  leader:'Kabu',    sprite:'kabu',    type:'fire',     levelCap:29, badge:{name:'Fire',      color:'#EE8130'}, team:[{id:58,lvl:25},{id:838,lvl:27},{id:851,lvl:29}] },
  { id:'galar-4', city:'Stow-on-Side',leader:'Bea',    sprite:'bea',     type:'fighting', levelCap:34, badge:{name:'Fighting',  color:'#C22E28'}, team:[{id:106,lvl:32},{id:237,lvl:32},{id:107,lvl:34}] },
  { id:'galar-5', city:'Ballonlea',  leader:'Opal',    sprite:'opal',    type:'fairy',    levelCap:38, badge:{name:'Fairy',     color:'#D685AD'}, team:[{id:864,lvl:36},{id:756,lvl:36},{id:858,lvl:38}] },
  { id:'galar-6', city:'Circhester', leader:'Gordie',  sprite:'gordie',  type:'rock',     levelCap:42, badge:{name:'Rock',      color:'#B6A136'}, team:[{id:837,lvl:40},{id:874,lvl:40},{id:526,lvl:42}] },
  { id:'galar-7', city:'Spikemuth',  leader:'Piers',   sprite:'piers',   type:'dark',     levelCap:48, badge:{name:'Dark',      color:'#705746'}, team:[{id:553,lvl:45},{id:435,lvl:46},{id:861,lvl:48}] },
  { id:'galar-8', city:'Hammerlocke',leader:'Raihan',  sprite:'raihan',  type:'dragon',   levelCap:52, badge:{name:'Dragon',    color:'#6F35FC'}, team:[{id:526,lvl:48},{id:843,lvl:48},{id:884,lvl:50},{id:884,lvl:52}] },
];
export const GALAR_ELITE = [
  { id:'galar-e1', name:'Marnie',  sprite:'marnie',  type:'dark',     team:[{id:861,lvl:51},{id:435,lvl:51},{id:880,lvl:53},{id:842,lvl:53}] },
  { id:'galar-e2', name:'Hop',     sprite:'hop',     type:'normal',   team:[{id:813,lvl:52},{id:836,lvl:54},{id:680,lvl:54},{id:863,lvl:55}] },
  { id:'galar-e3', name:'Bede',    sprite:'bede',    type:'fairy',    team:[{id:864,lvl:54},{id:756,lvl:54},{id:858,lvl:56},{id:282,lvl:55}] },
  { id:'galar-e4', name:'Nessa',   sprite:'nessa',   type:'water',    team:[{id:846,lvl:54},{id:341,lvl:54},{id:834,lvl:56},{id:340,lvl:55}] },
];
export const GALAR_CHAMPION = { id:'galar-champ', name:'Leon', sprite:'leon', team:[{id:823,lvl:62},{id:887,lvl:63},{id:849,lvl:63},{id:184,lvl:62},{id:530,lvl:64},{id:6,lvl:65}] };
export const GALAR_NPCS = [
  { id:'gl-t1', class:'Youngster',  name:'Caleb',sprite:'youngster',team:[{id:813,lvl:5}] },
  { id:'gl-t2', class:'Lass',       name:'Sue',  sprite:'lass',     team:[{id:828,lvl:9}] },
  { id:'gl-t3', class:'Cabbie',     name:'Tony', sprite:'cabbie',       team:[{id:884,lvl:18}] },
  { id:'gl-t4', class:'Worker',     name:'Frank',sprite:'worker',   team:[{id:874,lvl:30}] },
  { id:'gl-t5', class:'Postman',    name:'Mike', sprite:'postman',      team:[{id:822,lvl:33}] },
  { id:'gl-t6', class:'Reporter',   name:'Pam',  sprite:'reporter',     team:[{id:836,lvl:34}] },
  { id:'gl-t7', class:'Doctor',     name:'Hugo', sprite:'doctor',       team:[{id:835,lvl:36}] },
  { id:'gl-t8', class:'Macro Cosmos',name:'Oleana',sprite:'oleana',     team:[{id:870,lvl:48},{id:879,lvl:48}] },
];

/* ============================================================
   HISUI — Wardens instead of Gyms
   ============================================================ */
export const HISUI_GYMS = [
  { id:'hisui-1', city:'Obsidian Fieldlands',leader:'Lian',    sprite:'lian',    type:'grass',    levelCap:18, badge:{name:'Kleavor Memento',color:'#7AC74C'}, team:[{id:900,lvl:18}] },
  { id:'hisui-2', city:'Crimson Mirelands', leader:'Calaba',  sprite:'calaba',  type:'water',    levelCap:25, badge:{name:'Lilligant Memento',color:'#6390F0'}, team:[{id:903,lvl:25}] },
  { id:'hisui-3', city:'Cobalt Coastlands', leader:'Palina',  sprite:'palina',  type:'water',    levelCap:30, badge:{name:'Basculegion Memento',color:'#6390F0'}, team:[{id:902,lvl:30}] },
  { id:'hisui-4', city:'Coronet Highlands', leader:'Gaeric',  sprite:'gaeric',  type:'ice',      levelCap:38, badge:{name:'Avalugg Memento',color:'#96D9D6'}, team:[{id:899,lvl:38}] },
  { id:'hisui-5', city:'Alabaster Icelands',leader:'Sabi',    sprite:'sabi',    type:'fairy',    levelCap:45, badge:{name:'Sneasler Memento',color:'#D685AD'}, team:[{id:903,lvl:45}] },
  { id:'hisui-6', city:'Coronet Highlands', leader:'Iscan',   sprite:'iscan',   type:'rock',     levelCap:50, badge:{name:'Hisuian Memento',color:'#B6A136'}, team:[{id:904,lvl:50}] },
  { id:'hisui-7', city:'Coronet Highlands', leader:'Mai',     sprite:'mai',     type:'normal',   levelCap:55, badge:{name:'Wyrdeer Memento',color:'#A8A77A'}, team:[{id:899,lvl:55}] },
  { id:'hisui-8', city:'Temple of Sinnoh',  leader:'Volo',    sprite:'volo',    type:'dragon',   levelCap:68, badge:{name:'Garchomp Memento',color:'#6F35FC'}, team:[{id:467,lvl:65},{id:282,lvl:65},{id:38,lvl:65},{id:121,lvl:65},{id:184,lvl:66},{id:445,lvl:68}] },
];
export const HISUI_ELITE = [
  { id:'hisui-e1', name:'Akari',   sprite:'akari',  type:'fire',    team:[{id:157,lvl:62},{id:550,lvl:62},{id:248,lvl:62},{id:6,lvl:64}] },
  { id:'hisui-e2', name:'Adaman',  sprite:'adaman', type:'steel',   team:[{id:467,lvl:62},{id:485,lvl:62},{id:483,lvl:64},{id:101,lvl:62}] },
  { id:'hisui-e3', name:'Irida',   sprite:'irida',  type:'ice',     team:[{id:131,lvl:62},{id:482,lvl:62},{id:484,lvl:64},{id:362,lvl:62}] },
  { id:'hisui-e4', name:'Cogita',  sprite:'cogita', type:'psychic', team:[{id:480,lvl:62},{id:481,lvl:62},{id:494,lvl:62},{id:251,lvl:65}] },
];
export const HISUI_CHAMPION = { id:'hisui-champ', name:'Arceus', sprite:'volo', team:[{id:493,lvl:75},{id:483,lvl:70},{id:484,lvl:70},{id:487,lvl:70},{id:480,lvl:68},{id:494,lvl:68}] };
export const HISUI_NPCS = [
  { id:'hi-t1', class:'Survey Corps',  name:'Sanqua',sprite:'galaxyteam', team:[{id:155,lvl:8}] },
  { id:'hi-t2', class:'Medical Corps', name:'Pesselle',sprite:'medicalcorps',team:[{id:131,lvl:14}] },
  { id:'hi-t3', class:'Security Corps',name:'Beni', sprite:'securitycorps',team:[{id:38,lvl:20}] },
  { id:'hi-t4', class:'Diamond Clan',  name:'Mai',  sprite:'diamondclan',  team:[{id:899,lvl:28}] },
  { id:'hi-t5', class:'Pearl Clan',    name:'Palina',sprite:'pearlclan',   team:[{id:902,lvl:30}] },
  { id:'hi-t6', class:'Ginkgo Guild',  name:'Volo', sprite:'ginkgoguild',  team:[{id:160,lvl:32}] },
  { id:'hi-t7', class:'Ranch Hand',    name:'Carson',sprite:'ranchhand',   team:[{id:128,lvl:35}] },
  { id:'hi-t8', class:'Origin Form',   name:'Akari',sprite:'akari',        team:[{id:158,lvl:60}] },
];

/* ============================================================
   PALDEA
   ============================================================ */
export const PALDEA_GYMS = [
  { id:'paldea-1', city:'Cortondo',   leader:'Katy',     sprite:'katy',     type:'bug',      levelCap:15, badge:{name:'Bug',      color:'#A6B91A'}, team:[{id:919,lvl:14},{id:917,lvl:14},{id:415,lvl:15}] },
  { id:'paldea-2', city:'Artazon',    leader:'Brassius', sprite:'brassius', type:'grass',    levelCap:17, badge:{name:'Grass',    color:'#7AC74C'}, team:[{id:331,lvl:16},{id:407,lvl:16},{id:946,lvl:17}] },
  { id:'paldea-3', city:'Levincia',   leader:'Iono',     sprite:'iono',     type:'electric', levelCap:24, badge:{name:'Electric', color:'#F7D02C'}, team:[{id:25,lvl:23},{id:944,lvl:23},{id:298,lvl:23},{id:939,lvl:24}] },
  { id:'paldea-4', city:'Cascarrafa', leader:'Kofu',     sprite:'kofu',     type:'water',    levelCap:30, badge:{name:'Water',    color:'#6390F0'}, team:[{id:99,lvl:29},{id:976,lvl:29},{id:902,lvl:30}] },
  { id:'paldea-5', city:'Medali',     leader:'Larry',    sprite:'larry',    type:'normal',   levelCap:36, badge:{name:'Normal',   color:'#A8A77A'}, team:[{id:217,lvl:35},{id:864,lvl:35},{id:973,lvl:36}] },
  { id:'paldea-6', city:'Montenevera',leader:'Ryme',     sprite:'ryme',     type:'ghost',    levelCap:42, badge:{name:'Ghost',    color:'#735797'}, team:[{id:778,lvl:41},{id:778,lvl:41},{id:864,lvl:41},{id:972,lvl:42}] },
  { id:'paldea-7', city:'Alfornada',  leader:'Tulip',    sprite:'tulip',    type:'psychic',  levelCap:45, badge:{name:'Psychic',  color:'#F95587'}, team:[{id:956,lvl:44},{id:758,lvl:44},{id:561,lvl:44},{id:858,lvl:45}] },
  { id:'paldea-8', city:'Glaseado',   leader:'Grusha',   sprite:'grusha',   type:'ice',      levelCap:48, badge:{name:'Ice',      color:'#96D9D6'}, team:[{id:614,lvl:47},{id:460,lvl:47},{id:613,lvl:47},{id:975,lvl:48}] },
];
export const PALDEA_ELITE = [
  { id:'paldea-e1', name:'Rika',    sprite:'rika',    type:'ground',   team:[{id:980,lvl:57},{id:949,lvl:57},{id:769,lvl:57},{id:917,lvl:57},{id:953,lvl:58}] },
  { id:'paldea-e2', name:'Poppy',   sprite:'poppy',   type:'steel',    team:[{id:983,lvl:58},{id:884,lvl:58},{id:625,lvl:58},{id:777,lvl:58},{id:966,lvl:58}] },
  { id:'paldea-e3', name:'Larry',   sprite:'larry',type:'flying', team:[{id:567,lvl:59},{id:826,lvl:59},{id:741,lvl:59},{id:778,lvl:59},{id:973,lvl:59}] },
  { id:'paldea-e4', name:'Hassel',  sprite:'hassel',  type:'dragon',   team:[{id:691,lvl:60},{id:887,lvl:60},{id:935,lvl:60},{id:706,lvl:60},{id:998,lvl:60}] },
];
export const PALDEA_CHAMPION = { id:'paldea-champ', name:'Geeta', sprite:'geeta', team:[{id:976,lvl:61},{id:849,lvl:61},{id:973,lvl:61},{id:289,lvl:61},{id:962,lvl:61},{id:998,lvl:62}] };
export const PALDEA_NPCS = [
  { id:'pa-t1', class:'Schoolkid',   name:'Mateo',sprite:'schoolkid',  team:[{id:909,lvl:5}] },
  { id:'pa-t2', class:'Schoolkid',   name:'Sara', sprite:'schoolkid', team:[{id:912,lvl:5},{id:906,lvl:5}] },
  { id:'pa-t3', class:'Officer',     name:'Vega', sprite:'officer',    team:[{id:507,lvl:12}] },
  { id:'pa-t4', class:'Athlete',     name:'Sirio',sprite:'athlete',    team:[{id:962,lvl:22}] },
  { id:'pa-t5', class:'Ace Trainer', name:'Erin', sprite:'acetrainer', team:[{id:430,lvl:30}] },
  { id:'pa-t6', class:'Team Star',   name:'Eri',  sprite:'teamstar',     team:[{id:944,lvl:18},{id:921,lvl:18}] },
  { id:'pa-t7', class:'Backpacker',  name:'Goran',sprite:'backpacker', team:[{id:769,lvl:32}] },
  { id:'pa-t8', class:'PokéLeague Champ',name:'Nemona',sprite:'nemona', team:[{id:914,lvl:65},{id:887,lvl:64},{id:776,lvl:64},{id:945,lvl:64},{id:308,lvl:64},{id:910,lvl:64}] },
];

/* ============================================================
   World registry
   ============================================================ */
export const WORLD = {
  kanto:  { gyms: KANTO_GYMS,  elite4: KANTO_ELITE,  champion: KANTO_CHAMPION,  npcs: KANTO_NPCS  },
  johto:  { gyms: JOHTO_GYMS,  elite4: JOHTO_ELITE,  champion: JOHTO_CHAMPION,  npcs: JOHTO_NPCS  },
  hoenn:  { gyms: HOENN_GYMS,  elite4: HOENN_ELITE,  champion: HOENN_CHAMPION,  npcs: HOENN_NPCS  },
  sinnoh: { gyms: SINNOH_GYMS, elite4: SINNOH_ELITE, champion: SINNOH_CHAMPION, npcs: SINNOH_NPCS },
  unova:  { gyms: UNOVA_GYMS,  elite4: UNOVA_ELITE,  champion: UNOVA_CHAMPION,  npcs: UNOVA_NPCS  },
  kalos:  { gyms: KALOS_GYMS,  elite4: KALOS_ELITE,  champion: KALOS_CHAMPION,  npcs: KALOS_NPCS  },
  alola:  { gyms: ALOLA_GYMS,  elite4: ALOLA_ELITE,  champion: ALOLA_CHAMPION,  npcs: ALOLA_NPCS  },
  galar:  { gyms: GALAR_GYMS,  elite4: GALAR_ELITE,  champion: GALAR_CHAMPION,  npcs: GALAR_NPCS  },
  hisui:  { gyms: HISUI_GYMS,  elite4: HISUI_ELITE,  champion: HISUI_CHAMPION,  npcs: HISUI_NPCS  },
  paldea: { gyms: PALDEA_GYMS, elite4: PALDEA_ELITE, champion: PALDEA_CHAMPION, npcs: PALDEA_NPCS },
};

export function gymsFor(regionId)     { return WORLD[regionId]?.gyms     || []; }
export function elite4For(regionId)   { return WORLD[regionId]?.elite4   || []; }
export function championFor(regionId) { return WORLD[regionId]?.champion || null; }
export function npcsFor(regionId)     { return WORLD[regionId]?.npcs     || []; }
