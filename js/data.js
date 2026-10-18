/* 漫步勇者 · 遊戲資料：地點、怪物、詞綴、通貨、天賦樹、版本號 */
'use strict';
/* ================= state ================= */
const KEY='wayfarer_art_v6';
let S, B=null, D=null, modalFns=[], sheetName=null, ENT=new Map(), simTarget=null, follow=true, resetArm=false, selItem=null, selSlot=null, selNode=null;

/* ================= game data ================= */
const CLASSES={
  novice:{name:'冒險者',color:'#a9a3b8',g:{hp:8,mp:2,atk:1.2,mag:1,def:1},skills:['attack','power','heal'],desc:'平衡型，起點在天賦樹中央，能往任何方向發展',wep:'sword'},
  knight:{name:'劍士',color:'#c94a4a',g:{hp:12,mp:2,atk:1.6,mag:.4,def:2},skills:['attack','bash','whirl'],desc:'高血量高護甲，正面硬戰',wep:'sword'},
  mage:{name:'術士',color:'#5865d6',g:{hp:6,mp:5,atk:.6,mag:3.2,def:.6},skills:['attack','fire','ice','heal'],desc:'法術傷害吃「法術傷害」詞綴',wep:'staff'},
  ranger:{name:'遊俠',color:'#3f9a52',g:{hp:9,mp:3,atk:1.4,mag:.8,def:1.1},skills:['attack','double','poison'],desc:'連擊與毒傷，配暴擊很強',wep:'bow'}
};
const SKILLS={
  attack:{name:'攻擊',mp:0,kind:'attack',mult:1,icon:'axe'},
  power:{name:'強力一擊',mp:4,kind:'attack',mult:1.6,icon:'sword'},
  bash:{name:'盾擊',mp:5,kind:'attack',mult:1.3,guard:2,icon:'shield'},
  whirl:{name:'旋風斬',mp:10,kind:'attack',mult:2.3,fx:'whirl',icon:'sword'},
  fire:{name:'火球術',mp:5,kind:'spell',el:'fire',mult:2,fx:'fire',icon:'flame'},
  ice:{name:'冰矛',mp:8,kind:'spell',el:'cold',mult:1.7,fx:'ice',freeze:.3,icon:'ice'},
  heal:{name:'治癒',mp:6,kind:'heal',icon:'heart'},
  double:{name:'連射',mp:6,kind:'attack',mult:1.05,hits:2,fx:'arrow',icon:'arrow'},
  poison:{name:'毒箭',mp:5,kind:'attack',mult:1.1,poison:3,fx:'arrow',icon:'leaf'}
};
const EL={phys:'物理',fire:'火焰',cold:'冰冷',light:'閃電'};
const MONS=[
  {name:'綠史萊姆',bg:'meadow',spr:'slime',pal:{g:'#62b844',w:'#ffffff',e:'#173010'},hp:28,atk:6,arm:5,el:'phys',res:[0,0,0],xp:8,gold:6,w:5},
  {name:'霓虹史萊姆',bg:'city',spr:'slime',pal:{g:'#d65ac4',w:'#ffffff',e:'#2a1030'},hp:30,atk:7,arm:4,el:'light',res:[0,0,40],xp:9,gold:8,w:3},
  {name:'夜蝠',bg:'city',spr:'bat',pal:{p:'#6e4bb0',e:'#ffd166',w:'#ffffff'},hp:22,atk:8,arm:0,el:'phys',res:[0,0,0],xp:9,gold:7,w:4},
  {name:'稻草人魔',bg:'meadow',spr:'scare',pal:{y:'#e6c35c',t:'#c9a878',e:'#2a1a10',m:'#c0392b',w:'#8a6a40',r:'#b8433d'},hp:38,atk:9,arm:10,el:'phys',res:[-30,0,0],xp:12,gold:10,w:3},
  {name:'眼鏡蛇',bg:'forest',spr:'snake',pal:{s:'#c9a03a',b:'#8a6a2a',e:'#e5484d',w:'#f4e3a8'},hp:34,atk:10,arm:6,el:'phys',res:[0,0,0],xp:12,gold:9,w:3},
  {name:'狂暴山豬',bg:'forest',spr:'boar',pal:{b:'#6b4a35',e:'#ffdd55',n:'#c99a85',w:'#f4ead2'},hp:55,atk:12,arm:25,el:'phys',res:[0,10,0],xp:20,gold:14,w:2,min:3},
  {name:'魔神仔',bg:'forest',spr:'spirit',pal:{v:'#8fcdbd',e:'#102a24',m:'#c0392b'},hp:45,atk:13,arm:0,el:'cold',res:[0,40,0],xp:22,gold:16,w:2,min:4},
  {name:'雪原狼',bg:'mountain',spr:'wolf',pal:{g:'#c3cddb',e:'#e5484d',n:'#2a2a35',w:'#ffffff'},hp:60,atk:15,arm:12,el:'cold',res:[0,50,-10],xp:28,gold:20,w:2,min:5},
  {name:'岩石魔像',bg:'mountain',spr:'golem',pal:{r:'#8a8070',y:'#7fe0ff'},hp:80,atk:14,arm:60,el:'phys',res:[20,20,20],xp:32,gold:24,w:1,min:6}
];
const MIMIC={name:'寶箱怪',bg:'city',spr:'mimic',pal:{b:'#9a5a2a',y:'#f2c14e',e:'#ff3a3a',w:'#ffffff'},hp:50,atk:12,arm:20,el:'phys',res:[10,10,10],xp:20,gold:30};
const EMODS=[
  {id:'swift',n:'迅捷',d:'有機率行動兩次'},{id:'tough',n:'堅韌',d:'生命 +60%'},{id:'fire',n:'烈焰',d:'攻擊附帶火焰傷害'},
  {id:'cold',n:'冰霜',d:'攻擊附帶冰冷傷害，可能凍結你'},{id:'shock',n:'雷暴',d:'攻擊附帶閃電傷害'},{id:'leech',n:'吸血',d:'造成傷害時回復生命'},
  {id:'reflect',n:'反射',d:'反彈 15% 受到的傷害'},{id:'fury',n:'狂暴',d:'生命低於一半時攻擊 +50%'},{id:'armored',n:'鐵甲',d:'護甲大幅提高'}
];
const RCOL=['#e8e2d4','#7fa8ff','#f2d25e','#e8873a'], RNAME=['普通','魔法','稀有','傳奇'];
const RAREA=['腐朽','暴怒','深淵','雷霆','血色','古老','狂嘯','幽影'], RAREB=['獠牙','之握','之心','咆哮','之眼','守望','裂痕','之刃'];
const SLOTS=['weapon','offhand','helm','chest','gloves','boots','belt','ring1','ring2','amulet'];
const SLOTN={weapon:'武器',offhand:'副手',helm:'頭盔',chest:'胸甲',gloves:'手套',boots:'鞋子',belt:'腰帶',ring:'戒指',ring1:'戒指',ring2:'戒指',amulet:'護身符'};
const BASES={
  weapon:[{n:'短劍',phys:[3,7],crit:6},{n:'長劍',phys:[5,11],crit:5},{n:'戰斧',phys:[8,15],crit:4},{n:'獵弓',phys:[4,10],crit:6},{n:'法杖',phys:[2,5],crit:5,imp:['spellPct',20]}],
  helm:[{n:'皮帽',arm:1},{n:'鐵盔',arm:1.6}],chest:[{n:'皮甲',arm:2},{n:'鎖子甲',arm:3}],gloves:[{n:'皮手套',arm:.8},{n:'鐵手甲',arm:1.2}],boots:[{n:'皮靴',arm:.8,imp:['speed',2]},{n:'鐵靴',arm:1.2}],
  ring:[{n:'紅寶石戒指',imp:['resFire',12]},{n:'藍寶石戒指',imp:['resCold',12]},{n:'黃玉戒指',imp:['resLight',12]},{n:'鐵戒指',imp:['flatPhys',2]}],
  amulet:[{n:'琥珀護身符',imp:['life',20]},{n:'翡翠護身符',imp:['critPct',2]},{n:'青金護身符',imp:['mana',15]}],
  belt:[{n:'皮腰帶',imp:['life',15]},{n:'重腰帶',arm:.6},{n:'鏈腰帶',imp:['regen',2]}],
  /* 副手：k 是副手種類，詞綴可以只開放給某一種（例如誘引只出現在提燈） */
  offhand:[{n:'提燈',k:'lantern',imp:['vision',30],lure:20},{n:'聖光提燈',k:'lantern',imp:['vision',45],lure:35},{n:'木盾',k:'shield',arm:1.4},{n:'塔盾',k:'shield',arm:2.2},{n:'符文法珠',k:'focus',imp:['spellPct',15]}]
};
const DROPS=['weapon','offhand','helm','chest','gloves','boots','belt','ring','amulet'];
const T5=(a,b,c,d,e)=>[[40,...a],[28,...b],[18,...c],[8,...d],[1,...e]];
const ARMOR=['helm','chest','gloves','boots','belt','shield'], JEW=['ring','amulet','offhand'];
const AFF=[
  {id:'physPct',t:'P',n:'鋒利',slots:['weapon'],tiers:T5([60,79],[45,59],[30,44],[18,29],[8,17]),f:v=>`物理傷害 +${v}%`},
  {id:'flatPhys',t:'P',n:'沉重',slots:['weapon','gloves','ring'],tiers:T5([12,16],[8,11],[5,7],[3,4],[1,2]),f:v=>`附加 ${v} 物理傷害`},
  {id:'addFire',t:'P',n:'灼熱',slots:['weapon','gloves','ring','amulet'],tiers:T5([18,24],[12,17],[8,11],[4,7],[2,3]),f:v=>`附加 ${v} 火焰傷害`},
  {id:'addCold',t:'P',n:'冰冷',slots:['weapon','gloves','ring','amulet'],tiers:T5([16,22],[11,15],[7,10],[4,6],[2,3]),f:v=>`附加 ${v} 冰冷傷害`},
  {id:'addLight',t:'P',n:'雷鳴',slots:['weapon','gloves','ring','amulet'],tiers:T5([10,30],[7,21],[4,14],[2,8],[1,4]),f:v=>`附加 ${v} 閃電傷害`},
  {id:'spellPct',t:'P',n:'博學',slots:['weapon','amulet','ring','helm','focus'],tiers:T5([50,64],[36,49],[24,35],[14,23],[6,13]),f:v=>`法術傷害 +${v}%`},
  {id:'life',t:'P',n:'健壯',slots:[...ARMOR,...JEW],tiers:T5([70,89],[50,69],[35,49],[20,34],[8,19]),f:v=>`最大生命 +${v}`},
  {id:'armor',t:'P',n:'堅固',slots:ARMOR,tiers:T5([80,110],[55,79],[35,54],[20,34],[8,19]),f:v=>`護甲 +${v}`},
  {id:'mana',t:'P',n:'睿智',slots:['helm','ring','amulet','belt','focus'],tiers:T5([40,50],[30,39],[20,29],[12,19],[5,11]),f:v=>`最大魔力 +${v}`},
  {id:'resFire',t:'S',n:'抗火',slots:[...ARMOR,...JEW],tiers:T5([36,45],[28,35],[20,27],[12,19],[6,11]),f:v=>`火焰抗性 +${v}%`},
  {id:'resCold',t:'S',n:'抗寒',slots:[...ARMOR,...JEW],tiers:T5([36,45],[28,35],[20,27],[12,19],[6,11]),f:v=>`冰冷抗性 +${v}%`},
  {id:'resLight',t:'S',n:'抗雷',slots:[...ARMOR,...JEW],tiers:T5([36,45],[28,35],[20,27],[12,19],[6,11]),f:v=>`閃電抗性 +${v}%`},
  {id:'critPct',t:'S',n:'精準',slots:['weapon','ring','amulet','helm'],tiers:T5([6,7],[5,5],[4,4],[3,3],[1,2]),f:v=>`暴擊率 +${v}%`},
  {id:'critMulti',t:'S',n:'暴虐',slots:['weapon','amulet','gloves'],tiers:T5([32,38],[25,31],[18,24],[12,17],[6,11]),f:v=>`暴擊傷害 +${v}%`},
  {id:'leech',t:'S',n:'吸血',slots:['weapon','gloves','ring'],tiers:T5([5,6],[4,4],[3,3],[2,2],[1,1]),f:v=>`傷害的 ${v}% 轉為生命`},
  {id:'speed',t:'S',n:'迅捷',slots:['boots','gloves','amulet'],tiers:T5([10,12],[8,9],[6,7],[4,5],[2,3]),f:v=>`速度 +${v}`},
  {id:'vision',t:'S',n:'遠見',slots:['helm','lantern','amulet'],tiers:T5([26,30],[20,25],[14,19],[9,13],[4,8]),f:v=>`視線範圍 +${v}%`},
  {id:'lure',t:'P',n:'誘引',slots:['lantern'],tiers:T5([36,45],[28,35],[20,27],[12,19],[6,11]),f:v=>`吸引的怪物 +${v}%`},
  {id:'regen',t:'S',n:'再生',slots:['chest','helm','amulet','ring','belt'],tiers:T5([10,13],[7,9],[5,6],[3,4],[1,2]),f:v=>`每回合回復 ${v} 生命`}
];
const AFFI=Object.fromEntries(AFF.map(a=>[a.id,a]));
const STATN={life:v=>`最大生命 +${v}`,lifePct:v=>`最大生命 +${v}%`,physPct:v=>`物理傷害 +${v}%`,flatPhys:v=>`附加 ${v} 物理傷害`,armor:v=>`護甲 +${v}`,armorPct:v=>`護甲 +${v}%`,critPct:v=>`暴擊率 +${v}%`,critMulti:v=>`暴擊傷害 ${v>0?'+':''}${v}%`,
  speed:v=>`速度 ${v>0?'+':''}${v}`,leech:v=>`傷害的 ${v}% 轉為生命`,spellPct:v=>`法術傷害 +${v}%`,elePct:v=>`元素傷害 +${v}%`,mana:v=>`最大魔力 +${v}`,regen:v=>`每回合回復 ${v} 生命`,resAll:v=>`全部抗性 +${v}%`,
  physMore:v=>`物理傷害 ${v}%（總乘）`,resFire:v=>`火焰抗性 +${v}%`,vision:v=>`視線範圍 +${v}%`,lure:v=>`吸引的怪物 +${v}%`,resCold:v=>`冰冷抗性 +${v}%`,resLight:v=>`閃電抗性 +${v}%`,addFire:v=>`附加 ${v} 火焰傷害`};
const CUR=[
  {id:'trans',n:'蛻變石',d:'普通 → 魔法，1 個詞綴',c:'#8fb7ff',w:30},{id:'aug',n:'增幅石',d:'魔法裝備未滿時加 1 個詞綴',c:'#a8d8ff',w:26},
  {id:'regal',n:'富豪石',d:'魔法 → 稀有，保留原詞綴再加 1 個',c:'#7fd6c2',w:14},{id:'alch',n:'點金石',d:'普通 → 稀有，4 個詞綴',c:'#f2c14e',w:8},
  {id:'chaos',n:'混沌石',d:'稀有裝備隨機移除 1 個詞綴，再加 1 個',c:'#e58a3a',w:7},{id:'exalt',n:'崇高石',d:'稀有裝備未滿時加 1 個詞綴',c:'#fff2b0',w:1.2},
  {id:'scour',n:'洗淨石',d:'清除全部詞綴，回到普通',c:'#cfcfcf',w:4}
];
const CURI=Object.fromEntries(CUR.map(c=>[c.id,c]));
/* passive tree: PoE-style wheel. Center = 冒險者, ring of class starts, sectors + hybrid sectors + outer ring */
const TREE=(()=>{const N=[],E=[],byId={};const P=(r,a)=>[r*Math.cos(a*Math.PI/180),r*Math.sin(a*Math.PI/180)];
  const add=(id,x,y,def,type,extra)=>{const n={id,x,y,n:def[0],st:def[1],ic:def[2],type,...(extra||{})};N.push(n);byId[id]=n;return id};
  const ln=(a,b)=>{if(a&&b&&a!==b)E.push([a,b])};
  const SM={s:[['體魄',{life:10},'heart'],['鋼甲',{armorPct:12},'shield'],['力道',{physPct:8},'sword'],['堅韌',{regen:1},'plus']],
    d:[['敏銳',{critPct:1},'target'],['輕盈',{speed:2},'boot'],['殘暴',{critMulti:8},'skull'],['渴血',{leech:1},'blood']],
    i:[['博學',{spellPct:8},'book'],['冥想',{mana:8},'mana'],['護符',{resAll:4},'prism'],['元素',{elePct:6},'flame']],
    si:[['守護',{life:8,resAll:2},'prism'],['魔甲',{armorPct:8,spellPct:4},'shield'],['生機',{regen:1,mana:4},'plus']],
    id:[['秘眼',{critPct:1,spellPct:4},'target'],['迅思',{speed:1,mana:6},'boot'],['元素鋒芒',{elePct:4,critMulti:5},'flame']],
    ds:[['獵殺',{physPct:5,critPct:1},'sword'],['靈巧',{life:6,speed:1},'boot'],['血刃',{physPct:4,leech:1},'blood']]};
  const NT={s:[['鋼鐵之軀',{lifePct:10,armorPct:25},'shield'],['重擊',{physPct:18,critMulti:10},'sword'],['戰鬥狂熱',{physPct:15,leech:1},'blood'],['堅毅不拔',{life:30,regen:3},'heart']],
    d:[['獵手直覺',{critPct:2,critMulti:15},'target'],['疾風',{speed:5},'boot'],['嗜血',{leech:2,critMulti:10},'blood'],['鷹眼',{vision:20,critPct:1},'lantern']],
    i:[['元素掌握',{spellPct:18,elePct:10},'flame'],['魔力奔流',{mana:20,regen:2},'mana'],['元素護符',{resAll:12},'prism'],['秘術專注',{spellPct:15,critPct:1},'book']],
    si:[['聖騎士之心',{lifePct:8,resAll:8},'prism'],['符文鎧甲',{armorPct:20,spellPct:10},'shield']],
    id:[['星辰之眼',{critPct:2,spellPct:12},'target'],['風暴術士',{elePct:15,speed:2},'flame']],
    ds:[['刺客之道',{critMulti:20,physPct:10},'skull'],['游擊戰術',{speed:3,leech:1,life:15},'boot']]};
  const KEY={s:['不屈意志',{lifePct:40,speed:-4},'heart'],d:['致命節奏',{critPct:8,critMulti:-30},'target'],i:['元素親和',{resAll:15,elePct:30,physMore:-40},'flame']};
  const BIG={si:['神聖壁壘',{lifePct:12,armorPct:20,resAll:6},'shield'],id:['奧術風暴',{spellPct:20,critPct:2,elePct:10},'flame'],ds:['影刃',{physPct:20,critPct:2,leech:1},'sword']};
  const CLS={knight:{a:150,k:'s',name:'劍士',st:{life:20,armorPct:10},ic:'shield'},ranger:{a:30,k:'d',name:'遊俠',st:{critPct:1,speed:2},ic:'target'},mage:{a:-90,k:'i',name:'術士',st:{spellPct:10,mana:10},ic:'book'}};
  add('start_novice',0,0,['冒險者起點',{life:8,physPct:4,spellPct:4},'star'],'start',{cls:'novice'});
  const R0=125;
  for(const [c,v] of Object.entries(CLS)){const [x,y]=P(R0,v.a);add('start_'+c,x,y,[v.name+'起點',v.st,v.ic],'start',{cls:c})}
  const spineFirst={};
  // class sectors
  for(const [c,v] of Object.entries(CLS)){const A=v.a,k=v.k;let prev='start_'+c;const spine=[];
    for(let i=0;i<7;i++){const [x,y]=P(R0+42+i*34,A);const id=add(`${k}p${i}`,x,y,SM[k][i%4],'small');ln(prev,id);prev=id;spine.push(id)}
    spineFirst[c]=spine[0];
    const [kx,ky]=P(R0+42+7*34+14,A);add(`${k}K`,kx,ky,KEY[k],'key');ln(prev,`${k}K`);
    [[1,-1],[2,1],[4,-1],[5,1]].forEach(([si,side],ci)=>{const r=R0+42+si*34,ang=A+side*(16-si*.9),[cx,cy]=P(r+18,ang),rr=19,ids=[];
      for(let q=0;q<5;q++){const a=q/5*360+A+side*90,x=cx+rr*Math.cos(a*Math.PI/180),y=cy+rr*Math.sin(a*Math.PI/180),nb=q===2;ids.push(add(`${k}c${ci}_${q}`,x,y,nb?NT[k][ci]:SM[k][(q+ci)%4],nb?'notable':'small'))}
      ln(spine[si],ids[0]);for(let q=0;q<5;q++)ln(ids[q],ids[(q+1)%5])})}
  // inner ring arcs between class starts, plus hybrid sectors and spokes to the center
  const pairs=[['knight','mage','si',210],['mage','ranger','id',-30],['ranger','knight','ds',90]];
  for(const [a,b,h,mid] of pairs){const A1=CLS[a].a,A2=A1+((CLS[b].a-A1+540)%360-180);const arc=[];
    for(let q=0;q<5;q++){const t=(q+1)/6,[x,y]=P(R0,A1+(A2-A1)*t);arc.push(add(`r${h}${q}`,x,y,SM[h][q%3],'small'))}
    ln('start_'+a,arc[0]);ln(spineFirst[a],arc[0]);for(let q=0;q<4;q++)ln(arc[q],arc[q+1]);ln(arc[4],'start_'+b);ln(arc[4],spineFirst[b]);
    const hub=arc[2];let pv='start_novice';for(let q=0;q<2;q++){const [x,y]=P(42+q*40,mid);const id=add(`sp${h}${q}`,x,y,SM[h][(q+1)%3],'small');ln(pv,id);pv=id}ln(pv,hub);
    let prev=hub;const sp=[];for(let i=0;i<5;i++){const [x,y]=P(R0+44+i*36,mid);const id=add(`${h}p${i}`,x,y,SM[h][i%3],'small');ln(prev,id);prev=id;sp.push(id)}
    const [bx,by]=P(R0+44+5*36+12,mid);add(`${h}B`,bx,by,BIG[h],'notable');ln(prev,`${h}B`);
    [[1,1],[3,-1]].forEach(([si,side],ci)=>{const r=R0+44+si*36,ang=mid+side*14,[cx,cy]=P(r+16,ang),rr=19,ids=[];
      for(let q=0;q<5;q++){const a2=q/5*360+mid+side*90,x=cx+rr*Math.cos(a2*Math.PI/180),y=cy+rr*Math.sin(a2*Math.PI/180),nb=q===2;ids.push(add(`${h}c${ci}_${q}`,x,y,nb?NT[h][ci]:SM[h][(q+ci)%3],nb?'notable':'small'))}
      ln(sp[si],ids[0]);for(let q=0;q<5;q++)ln(ids[q],ids[(q+1)%5])})}
  // outer ring linking every sector tip
  const tips=[['sK',150],['siB',210],['iK',270],['idB',330],['dK',390],['dsB',450]];
  for(let t=0;t<6;t++){const [a,aa]=tips[t],[b,ab]=tips[(t+1)%6];let prev=a;const R=410;
    for(let q=0;q<3;q++){const tt=(q+1)/4,[x,y]=P(R,aa+(ab-aa)*tt),kind=['s','si','i','id','d','ds'][t];const pool=SM[kind]||SM.s;const id=add(`o${t}_${q}`,x,y,pool[q%pool.length],'small');ln(prev,id);prev=id}ln(prev,b)}
  return{N,E,byId}})();
const VER='0.1.5';
const START={lat:24.1372,lng:120.6869,name:'台中車站'};
