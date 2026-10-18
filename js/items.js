/* 漫步勇者 · 玩家狀態、裝備、詞綴、通貨製作、屬性計算 */
'use strict';
/* ================= player & items ================= */
function newGame(){const g={v:5,cls:'novice',lv:1,xp:0,gold:80,crystal:0,hp:60,mp:20,potions:3,ethers:1,inv:[],eq:{},cur:{trans:4,alt:4,aug:2,alch:2,chaos:1,exalt:0,scour:1},tree:['start_novice'],
  lat:START.lat-0.0009,lng:START.lng,walked:0,walkCur:0,bases:[],defeated:{},cleared:{},bought:{},found:{},log:[],timeOffset:0,classOffered:false,music:true,sfx:true,intro:true,trail:[],explMs:0,buff:null,bonusPts:0,treeV2:1};
  SLOTS.forEach(s=>g.eq[s]=null);g.eq.weapon=makeItem('weapon',1,0,0);g.inv.push(makeItem('lantern',1,0,0),makeItem('ring',2,1,0),makeItem('chest',2,0,0),makeItem('boots',2,1,1));return g}
function makeItem(slot,ilvl,rar,baseIdx,r=Math.random){const bl=BASES[slot],bi=baseIdx??fl(r()*bl.length),b=bl[bi];const it={id:uid(),slot,bi,ilvl,r:0,aff:[]};
  if(slot==='weapon'){const k=1+ilvl*.1;it.phys=[Math.round(b.phys[0]*k),Math.round(b.phys[1]*k)];it.crit=b.crit}
  if(b.arm)it.arm=Math.round(b.arm*(6+ilvl*2.5));if(b.imp)it.imp=b.imp;if(b.lure)it.lure=b.lure;
  if(rar===1)toMagic(it,r);else if(rar===2)toRare(it,r);return it}
const baseOf=it=>BASES[it.slot][it.bi];
const slotKey=it=>it.slot==='ring'?'ring':it.slot;
function rollAffix(it,type,r=Math.random){const have=new Set(it.aff.map(a=>a.id));const pool=AFF.filter(a=>a.t===type&&a.slots.includes(slotKey(it))&&!have.has(a.id));if(!pool.length)return false;
  const a=pool[fl(r()*pool.length)],ok=a.tiers.map((t,i)=>({t,i})).filter(o=>o.t[0]<=it.ilvl);let tot=0;ok.forEach(o=>tot+=o.i+1);let x=r()*tot,pick=ok[ok.length-1];for(const o of ok){x-=o.i+1;if(x<0){pick=o;break}}
  const [,lo,hi]=pick.t;it.aff.push({id:a.id,tier:pick.i+1,v:lo+fl(r()*(hi-lo+1))});return true}
const cnt=(it,t)=>it.aff.filter(a=>AFFI[a.id].t===t).length;
function addRandom(it,r=Math.random){const maxP=it.r===1?1:3,maxS=it.r===1?1:3,opts=[];if(cnt(it,'P')<maxP)opts.push('P');if(cnt(it,'S')<maxS)opts.push('S');if(!opts.length)return false;const t=opts[fl(r()*opts.length)];return rollAffix(it,t,r)||rollAffix(it,t==='P'?'S':'P',r)}
function toMagic(it,r=Math.random){it.r=1;it.aff=[];const n=r()<.5?1:2;for(let i=0;i<n;i++)addRandom(it,r);if(!it.aff.length)addRandom(it,r);it.rn=null}
function toRare(it,r=Math.random,n=4){it.r=2;it.aff=[];for(let i=0;i<n;i++)addRandom(it,r);it.rn=RAREA[fl(r()*RAREA.length)]+RAREB[fl(r()*RAREB.length)]}
function itemTitle(it){const b=baseOf(it);if(it.r===2)return it.rn;if(it.r===1){const p=it.aff.find(a=>AFFI[a.id].t==='P'),s=it.aff.find(a=>AFFI[a.id].t==='S');return`${p?AFFI[p.id].n+'的':''}${b.n}${s?'・'+AFFI[s.id].n:''}`}return b.n}
const itemName=it=>`<span style="color:${RCOL[it.r]}">${esc(itemTitle(it))}</span>`;
function itemSum(it){const out=[];if(it.phys)out.push(`物理 ${it.phys[0]}–${it.phys[1]}`);if(it.arm)out.push(`護甲 ${it.arm}`);it.aff.slice(0,2).forEach(a=>out.push(AFFI[a.id].f(a.v)));return out.join('・')+(it.aff.length>2?`・另 ${it.aff.length-2} 條`:'')}
function itemCard(it,title){const b=baseOf(it);let h=`<div class="icard" style="border-color:${RCOL[it.r]}88"><div class="ihead" style="color:${RCOL[it.r]}">${esc(itemTitle(it))}</div><div class="isub">${it.r===2?esc(b.n)+'・':''}${RNAME[it.r]}${SLOTN[it.slot]}・物品等級 ${it.ilvl}${title?'・'+title:''}</div>`;
  const base=[];if(it.phys)base.push(`物理傷害 ${it.phys[0]}–${it.phys[1]}`,`暴擊率 ${it.crit}%`);if(it.arm)base.push(`護甲 ${it.arm}`);if(it.imp)base.push(STATN[it.imp[0]](it.imp[1]));if(it.lure)base.push(STATN.lure(it.lure));
  if(base.length)h+=`<div class="ibase">${base.map(esc).join('<br>')}</div>`;
  if(it.aff.length)h+=`<div class="iaff">${[...it.aff].sort((a,b)=>AFFI[a.id].t<AFFI[b.id].t?-1:1).map(a=>`<div><span>${esc(AFFI[a.id].f(a.v))}</span><small>${AFFI[a.id].t==='P'?'前綴':'後綴'} T${a.tier}</small></div>`).join('')}</div>`;
  return h+'</div>'}
const sellVal=it=>Math.round((6+it.ilvl*3)*[1,2.5,6,10][it.r]);
function giveItem(it){if(S.inv.length>=30){S.gold+=sellVal(it);addLog(`背包已滿，${itemTitle(it)} 自動賣出`);return}S.inv.push(it)}
function giveCur(id,n=1){S.cur[id]=(S.cur[id]||0)+n}
function rollCur(boost=1){let tot=0;CUR.forEach(c=>tot+=c.id==='chaos'||c.id==='exalt'||c.id==='alch'?c.w*boost:c.w);let x=Math.random()*tot;for(const c of CUR){x-=c.id==='chaos'||c.id==='exalt'||c.id==='alch'?c.w*boost:c.w;if(x<0)return c.id}return'trans'}
const curDot=id=>`<img class="cico" src="${curIcon(id)}" alt="">`;
function craftable(it,id){if(!it)return false;return{trans:it.r===0,alt:it.r===1,aug:it.r===1&&it.aff.length<2,alch:it.r===0,chaos:it.r===2,exalt:it.r===2&&it.aff.length<6,scour:it.r===1||it.r===2}[id]}
function craft(it,id){if(!craftable(it,id)||!(S.cur[id]>0))return false;S.cur[id]--;
  if(id==='trans'||id==='alt')toMagic(it);else if(id==='aug')addRandom(it);else if(id==='alch')toRare(it);else if(id==='chaos'){const r=Math.random();toRare(it,Math.random,r<.6?4:r<.9?5:6)}else if(id==='exalt')addRandom(it);else if(id==='scour'){it.r=0;it.aff=[];it.rn=null}return true}

/* ================= stats ================= */
function sumStats(){const t={life:0,lifePct:0,physPct:0,flatPhys:0,addFire:0,addCold:0,addLight:0,spellPct:0,elePct:0,armor:0,armorPct:0,mana:0,resFire:0,resCold:0,resLight:0,resAll:0,critPct:0,critMulti:0,leech:0,speed:0,regen:0,physMore:0,vision:0,lure:0};
  for(const s of SLOTS){const it=S.eq[s];if(!it)continue;if(it.arm)t.armor+=it.arm;if(it.imp)t[it.imp[0]]+=it.imp[1];if(it.lure)t.lure+=it.lure;it.aff.forEach(a=>t[a.id]+=a.v)}
  for(const id of S.tree){const n=TREE.byId[id];if(n)for(const k in n.st)t[k]+=n.st[k]}return t}
function stats(){const g=CLASSES[S.cls].g,L=S.lv-1,t=sumStats(),w=S.eq.weapon,ph=w?w.phys:[1,3];const flat=4+g.atk*L+t.flatPhys;
  const eleMul=1+t.elePct/100;
  return{maxhp:Math.round((80+g.hp*L+t.life)*(1+t.lifePct/100)),maxmp:Math.round(20+g.mp*L+t.mana),armor:Math.round((15+g.def*L*4+t.armor)*(1+t.armorPct/100)),
    res:{fire:Math.min(75,t.resFire+t.resAll),cold:Math.min(75,t.resCold+t.resAll),light:Math.min(75,t.resLight+t.resAll)},
    physLo:(ph[0]+flat)*(1+t.physPct/100)*(1+t.physMore/100),physHi:(ph[1]+flat)*(1+t.physPct/100)*(1+t.physMore/100),
    fire:t.addFire*eleMul,cold:t.addCold*eleMul,light:t.addLight*eleMul,spell:(9+3.4*L+g.mag*L*1.2)*(1+t.spellPct/100)*eleMul,
    crit:Math.max(0,Math.min(75,(w?w.crit:5)+t.critPct)),critMulti:Math.max(110,150+t.critMulti),leech:t.leech,speed:10+t.speed,regen:t.regen,
    dodge:Math.max(0,Math.min(30,(t.speed)*1.5)),vision:Math.round((dayPhase().night>.5?260:600)*(1+t.vision/100)),lure:t.lure}}
const xpNeed=lv=>Math.round(20*Math.pow(lv,1.5));
function fullHeal(){const st=stats();S.hp=st.maxhp;S.mp=st.maxmp}
function clampHP(){const st=stats();S.hp=Math.min(S.hp,st.maxhp);S.mp=Math.min(S.mp,st.maxmp)}
function addLog(t){S.log.unshift(t);if(S.log.length>60)S.log.length=60}
function gainXP(n){let up=false;S.xp+=n;while(S.xp>=xpNeed(S.lv)){S.xp-=xpNeed(S.lv);S.lv++;fullHeal();up=true;addLog(`升級了！現在是 Lv${S.lv}，獲得 1 天賦點`)}return up}
const treePts=()=>(S.lv-1)+(S.bonusPts||0)-(S.tree.length-1);
function dayPhase(){const d=new Date(now()),hr=d.getHours()+d.getMinutes()/60;let night=hr>=19.5||hr<4.5?1:hr>=17.5?(hr-17.5)/2:hr<6.5?(6.5-hr)/2:0;return{hr,night,label:night>=1?'夜晚':night>0?(hr>12?'黃昏':'清晨'):'白天'}}
const buffOn=()=>S.buff&&S.buff.until>now();

/* ================= enemies ================= */
function pickMon(r,lv){const pool=MONS.filter(q=>!q.min||q.min<=lv+1);let tot=pool.reduce((a,q)=>a+q.w,0),x=r%tot;for(const q of pool){x-=q.w;if(x<0)return q}return pool[0]}
function makeEnemy(b,lv,rar=0,mods=[]){const f=lv-1,e={name:b.name,lv,spr:b.spr,pal:b.pal,bg:b.bg,el:b.el,res:[...b.res],rar,mods,
  maxhp:Math.round(b.hp*(1+.38*f)),atk:Math.round(b.atk*.8*(1+.2*f)),arm:Math.round(b.arm*(1+.25*f)),xp:Math.round(b.xp*(1+.5*f)),gold:Math.round(b.gold*(1+.4*f)),speed:10};
  const hm=[1,1.5,2.4][rar]||1,am=[1,1.15,1.3][rar]||1,rm=[1,2.5,5][rar]||1;e.maxhp=Math.round(e.maxhp*hm);e.atk=Math.round(e.atk*am);e.xp=Math.round(e.xp*rm);e.gold=Math.round(e.gold*rm);
  if(mods.includes('tough'))e.maxhp=Math.round(e.maxhp*1.6);if(mods.includes('armored'))e.arm=e.arm*2+10;if(mods.includes('swift'))e.speed=18;
  if(rar===2)e.name=`${RAREA[h(lv,b.hp,mods.length)%RAREA.length]}之${b.name}`;else if(rar===1)e.name=`${EMODS.find(m=>m.id===mods[0]).n}的${b.name}`;e.hp=e.maxhp;return e}
function rollMods(r,n){const ids=[],pool=EMODS.map(m=>m.id);for(let i=0;i<n;i++){const k=(r>>>(i*5))%pool.length;ids.push(pool.splice(k,1)[0])}return ids}
const modNames=e=>e.mods.map(id=>EMODS.find(m=>m.id===id).n).join('・');

/* ================= modal ================= */
function showModal(title,html,btns){modalFns=btns.map(b=>b.fn);$('dlg').innerHTML=`<h2>${title}</h2><div style="display:grid;gap:8px">${html}</div><div class="btns">${btns.map((b,i)=>`<button class="btn ${b.pri?'pri':''}" data-act="mbtn" data-i="${i}" ${b.dis?'disabled':''}>${b.label}</button>`).join('')}</div>`;$('modal').hidden=false}
function hideModal(){$('modal').hidden=true}
const busy=()=>!$('modal').hidden||!!B;
function classModal(after){const opts=['knight','mage','ranger'];
  showModal('選擇進階職業',`<p class="sub">職業決定技能；成長方向交給天賦樹。demo 中轉職後無法再更換。</p>${opts.map((k,i)=>`<button class="btn" style="text-align:left;display:grid;gap:2px" data-act="mbtn" data-i="${i+1}"><span style="color:${CLASSES[k].color}">${CLASSES[k].name}</span><small class="sub">${CLASSES[k].desc}・技能：${CLASSES[k].skills.slice(1).map(s=>SKILLS[s].name).join('、')}</small></button>`).join('')}`,
    [{label:'稍後再選',fn:()=>{hideModal();after&&after()}}]);
  modalFns.push(...opts.map(k=>()=>{S.cls=k;S.tree=[startOf(k)];fullHeal();sfx('level');addLog(`轉職為 ${CLASSES[k].name}！`);toast(`成為 ${CLASSES[k].name}`);hideModal();renderHud();after&&after()}))}
function openShop(e,merchant){const he=hourEp(),r=rng(h(fl(e.lat*1e4),fl(e.lng*1e4),he)),lv=S.lv+(merchant?2:0);
  const slots=['weapon','helm','chest','gloves','boots','ring','amulet'],stock=[0,1,2].map(()=>makeItem(slots[fl(r()*slots.length)],lv,merchant?2:(r()<.3?2:1),undefined,r));
  const price=it=>sellVal(it)*(merchant?3:4);
  const render=()=>{showModal(esc(e.name),`<div class="card"><div class="rowx"><div class="t"><b>生命藥水</b><small>恢復 40% 生命・持有 ${S.potions}</small></div><button class="btn sm" data-act="mbtn" data-i="1" ${S.gold<20?'disabled':''}>20 金</button></div>
      <div class="rowx"><div class="t"><b>魔力藥水</b><small>恢復 50% 魔力・持有 ${S.ethers}</small></div><button class="btn sm" data-act="mbtn" data-i="2" ${S.gold<30?'disabled':''}>30 金</button></div>
      ${merchant?`<div class="rowx"><div class="t"><b>${curDot('chaos')}混沌石</b><small>流浪商人限定</small></div><button class="btn sm" data-act="mbtn" data-i="6" ${S.gold<120?'disabled':''}>120 金</button></div>`:''}</div>
      ${stock.map((it,i)=>{const sold=S.bought[`${e.id},${he},${i}`],p=price(it);return`${itemCard(it)}<div class="btns" style="margin-top:-4px"><button class="btn sm" data-act="mbtn" data-i="${3+i}" ${sold||S.gold<p?'disabled':''}>${sold?'已售出':'購買 '+p+' 金'}</button></div>`}).join('')}
      <p class="sub">持有 <span style="color:var(--gold)">${S.gold}</span> 金・商品每小時更換</p>`,[{label:'離開',fn:()=>{hideModal();renderHud()}}]);
    modalFns.push(()=>{S.gold-=20;S.potions++;sfx('coin');render()},()=>{S.gold-=30;S.ethers++;sfx('coin');render()},...stock.map((it,i)=>()=>{S.gold-=price(it);S.bought[`${e.id},${he},${i}`]=1;giveItem({...it,id:uid(),aff:it.aff.map(a=>({...a}))});sfx('coin');addLog(`購買了 ${itemTitle(it)}`);render()}),()=>{S.gold-=120;giveCur('chaos');sfx('coin');render()})};
  sfx('door');render()}
