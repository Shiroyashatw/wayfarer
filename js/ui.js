/* 漫步勇者 · HUD、底部面板、互動、據點、動作表 */
'use strict';
/* ================= HUD & sheets ================= */
function renderHud(){clampHP();const st=stats();$('hpb').style.width=(S.hp/st.maxhp*100)+'%';$('mpb').style.width=(S.mp/st.maxmp*100)+'%';$('lvTag').textContent='Lv'+S.lv;
  $('gold').innerHTML=`<span style="color:var(--gold)">●</span> ${S.gold}`;$('cry').innerHTML=`<span style="color:#9fe7ff">◆</span> ${S.crystal}`;
  const a=$('ava').getContext('2d');a.clearRect(0,0,18,18);a.drawImage(sprite('heroF',heroPal()),0,0);$('ptDot').hidden=treePts()<=0}
let toastT;function toast(t){const el=$('toast');el.textContent=t;el.style.opacity=1;clearTimeout(toastT);toastT=setTimeout(()=>el.style.opacity=0,2400)}
function openSheet(name,title){sheetName=name;$('stitle').textContent=title||TITLES[name];$('scrim').hidden=false;$('sheet').classList.remove('off');renderSheet()}
function closeSheet(){sheetName=null;$('scrim').hidden=true;$('sheet').classList.add('off')}
const TITLES={hero:'角色',bag:'背包',item:'裝備',tree:'天賦樹',base:'據點',near:'附近',settings:'設定',log:'冒險日誌'};
const KIND={monster:'怪物',dungeon:'洞窟',shrine:'廟宇',town:'城鎮',base:'據點',chest:'寶箱',event:'限時事件'};
function bar(label,v,max,col){return`<div style="display:grid;gap:3px"><div class="rowx" style="font-size:12px;color:var(--dim)"><span>${label}</span><span>${Math.ceil(v)} / ${max}</span></div><div class="mbar" style="height:8px"><i style="width:${Math.max(0,Math.min(100,v/max*100))}%;background:${col}"></i></div></div>`}
function entIcon(e){const c=document.createElement('canvas');c.width=18;c.height=18;const x=c.getContext('2d');let n,p;
  if(e.kind==='monster'){n=e.base.spr;p=e.base.pal}else if(e.kind==='town'){n=e.t.svc.includes('temple')?'shrine':'crystal';p=e.t.svc.includes('temple')?PAL.shrine:PAL.crystal}else if(e.kind==='base'){n=e.b.type==='main'?'castle':'camp';p=PAL[n]}else if(e.kind==='event'){n=e.sub;p=PAL[e.sub]}else{n=e.kind;p=PAL[e.kind]}x.drawImage(sprite(n,p),0,0);return c}
const fmt1=v=>Math.round(v);
function curRow(){return`<div class="curs">${CUR.map(c=>`<span title="${c.d}"><img class="cico lg" src="${curIcon(c.id)}" alt=""><span>${c.n}<b>${S.cur[c.id]||0}</b></span></span>`).join('')}</div>`}
function renderSheet(){if(!sheetName||sheetName==='ent')return;const el=$('sbody'),st=stats(),c=CLASSES[S.cls];let html='';
  if(sheetName==='hero'){const avg=(st.physLo+st.physHi)/2+st.fire+st.cold+st.light*1;
    html=`<div class="card"><div class="ent"><canvas id="heroBig" width="18" height="18"></canvas><div style="flex:1;display:grid;gap:6px;min-width:0"><b style="font-family:var(--f-pix);font-size:18px;font-weight:400">旅人 <span style="color:${c.color};font-size:14px">${c.name}</span> Lv${S.lv}</b>${bar('生命',S.hp,st.maxhp,'var(--hp)')}${bar('魔力',S.mp,st.maxmp,'var(--mp)')}${bar('經驗',S.xp,xpNeed(S.lv),'var(--xp)')}</div></div></div>
    <button class="btn pri" data-act="openTree">天賦樹${treePts()>0?`（剩 ${treePts()} 點未分配）`:''}</button>
    <h3>攻擊</h3><div class="kv"><div><span>物理傷害</span><b>${fmt1(st.physLo)}–${fmt1(st.physHi)}</b></div><div><span>元素附加</span><b>${fmt1(st.fire+st.cold+st.light)}</b></div><div><span>法術基礎</span><b>${fmt1(st.spell)}</b></div><div><span>暴擊率</span><b>${st.crit}%</b></div><div><span>暴擊傷害</span><b>${st.critMulti}%</b></div><div><span>吸血</span><b>${st.leech}%</b></div></div>
    <h3>防禦</h3><div class="kv"><div><span>護甲</span><b>${st.armor}</b></div><div><span>閃避</span><b>${fmt1(st.dodge)}%</b></div><div><span>視線範圍</span><b>${st.vision}m</b></div><div><span style="color:#ffb15a">火焰抗性</span><b>${st.res.fire}%</b></div><div><span style="color:#9fe7ff">冰冷抗性</span><b>${st.res.cold}%</b></div><div><span style="color:#fff27a">閃電抗性</span><b>${st.res.light}%</b></div></div>
    <h3>技能</h3><div class="card">${c.skills.map(k=>`<div class="rowx"><div class="t"><b>${SKILLS[k].name}</b><small>${SKILLS[k].kind==='spell'?EL[SKILLS[k].el]+'法術，吃法術傷害':SKILLS[k].kind==='attack'?'攻擊，吃武器與附加傷害':'回復'}</small></div><small style="color:var(--mp)">${SKILLS[k].mp?'MP '+SKILLS[k].mp:'—'}</small></div>`).join('')}</div>
    <div class="btns"><button class="btn" data-act="sheet" data-s="log">冒險日誌</button></div>`}
  else if(sheetName==='bag'){const cell=(sl,area)=>{const it=S.eq[sl];return`<button class="doll-s" style="grid-area:${area};${it?`border-color:${RCOL[it.r]};box-shadow:0 0 10px ${RCOL[it.r]}44 inset`:''}" data-act="eqslot" data-s="${sl}" aria-label="${SLOTN[sl]}"><img src="${slotIcon(it,sl)}" alt=""><small>${it?esc(itemTitle(it)):SLOTN[sl]}</small></button>`};
    html=`<div class="doll"><canvas id="dollHero" width="18" height="18"></canvas>${cell('weapon','w')}${cell('helm','h')}${cell('amulet','a')}${cell('lantern','l')}${cell('ring1','r1')}${cell('chest','c')}${cell('ring2','r2')}${cell('gloves','g')}${cell('boots','b')}</div>
    <h3>通貨</h3>${curRow()}
    <h3>消耗品</h3><div class="card"><div class="rowx"><div class="t"><b>生命藥水 ×${S.potions}</b></div><button class="btn sm" data-act="use" data-k="potions" ${S.potions?'':'disabled'}>使用</button></div><div class="rowx"><div class="t"><b>魔力藥水 ×${S.ethers}</b></div><button class="btn sm" data-act="use" data-k="ethers" ${S.ethers?'':'disabled'}>使用</button></div></div>
    <h3>背包 ${S.inv.length}/30</h3>${S.inv.length?`<div class="list">${S.inv.map((it,i)=>`<button class="irow" data-act="pick" data-i="${i}" style="border-left-color:${RCOL[it.r]}"><img src="${slotIcon(it)}" alt=""><span><b>${itemName(it)}</b><small>${SLOTN[it.slot]}・iLv${it.ilvl}・${esc(itemSum(it))}</small></span></button>`).join('')}</div>`:'<p class="sub">背包是空的。</p>'}`}
  else if(sheetName==='item'){const it=selItem&&(selItem.eq?S.eq[selItem.eq]:S.inv[selItem.i]);if(!it){closeSheet();return}
    const tgt=it.slot==='ring'?(selItem.eq?null:(S.eq.ring1?S.eq.ring1:null)):S.eq[it.slot];
    html=`<div class="ent"><img class="bigico" src="${slotIcon(it)}" alt=""><div class="sub">${selItem.eq?'穿戴中':'背包'}・可以用通貨改造</div></div>${itemCard(it,selItem.eq?'穿戴中':'')}${!selItem.eq&&tgt?itemCard(tgt,'目前穿戴'):''}
    <h3>製作</h3><div class="crafts">${CUR.map(cu=>`<button class="btn sm" data-act="craft" data-c="${cu.id}" ${craftable(it,cu.id)&&S.cur[cu.id]>0?'':'disabled'}>${curDot(cu.id)}${cu.n} <b>${S.cur[cu.id]||0}</b><small>${cu.d}</small></button>`).join('')}</div>
    <div class="btns">${selItem.eq?`<button class="btn" data-act="unequip" data-s="${selItem.eq}">卸下</button>`:it.slot==='ring'?`<button class="btn pri" data-act="equip" data-s="ring1">裝在戒指 1</button><button class="btn pri" data-act="equip" data-s="ring2">裝在戒指 2</button>`:`<button class="btn pri" data-act="equip" data-s="${it.slot}">裝備</button>`}
    ${selItem.eq?'':`<button class="btn" data-act="sell">賣出 ${sellVal(it)} 金</button>`}<button class="btn" data-act="sheet" data-s="bag">返回背包</button></div>`}
  else if(sheetName==='base'){const chk=branchCheck(),main=S.bases.find(b=>b.type==='main');
    html=`<p class="sub">城鎮是大家共用的地標；據點是你自己的家。據點持續產出金幣（最多累積 8 小時），每 30 分鐘恢復 1 次遠征（上限 3 次），不用出門也能攻略附近的洞窟或城鎮試煉，獎勵為實地的 80%，且不會揭開迷霧。</p>
    ${main?'':`<div class="card"><div class="rowx"><div class="t"><b>建立主據點</b><small>${nearTownE()?'城鎮範圍內不能建立據點':'在你現在的位置免費建立'}</small></div><button class="btn pri" data-act="buildMain" ${nearTownE()?'disabled':''}>在此建立</button></div></div>`}
    ${S.bases.map(b=>{const ch=charges(b),d=baseTarget(b),cost=120*b.lv,cc=2*b.lv;return`<div class="card"><div class="rowx"><div class="t"><b>${baseName(b)} Lv${b.lv}</b><small>距離你 ${fmtD(dist(S.lat,S.lng,b.lat,b.lng))}・產出 ${prodRate(b)} 金/小時</small></div><div style="text-align:right"><div style="color:var(--gold);font-family:var(--f-pix)">● ${stored(b)}</div><small class="sub">遠征 ${'■'.repeat(ch)}${'□'.repeat(3-ch)}</small></div></div>
      <p class="sub">${d?`遠征目標：${esc(d.name)} Lv${d.lv}（${fmtD(d.d)}）`:'附近沒有可遠征的目標'}</p>
      <div class="btns"><button class="btn sm" data-act="collect" data-id="${b.id}" ${stored(b)?'':'disabled'}>領取</button><button class="btn sm pri" data-act="expedition" data-id="${b.id}" ${ch&&d?'':'disabled'}>遠征</button><button class="btn sm" data-act="upgrade" data-id="${b.id}" ${b.lv<5&&S.gold>=cost&&S.crystal>=cc?'':'disabled'}>${b.lv<5?`升級 ${cost}● ${cc}◆`:'已滿級'}</button><button class="btn sm" data-act="goto" data-id="${b.id}">查看</button></div></div>`}).join('')}
    ${main?`<div class="card"><div class="rowx"><div class="t"><b>建立分支據點</b><small>${chk||'可以在你現在的位置建立（150 金幣）'}</small></div><button class="btn pri sm" data-act="buildBranch" ${chk?'disabled':''}>建立</button></div></div>`:''}
    <div class="card"><div class="rowx"><div class="t"><b>測試用：時間快轉</b><small>據點產出、遠征恢復、怪物與事件刷新</small></div><button class="btn sm" data-act="ff">快轉 1 小時</button></div></div>`}
  else if(sheetName==='near'){const list=[...ENT.values()].filter(e=>e.kind!=='base'&&visible(e)).map(e=>({...e,d:dist(S.lat,S.lng,e.lat,e.lng)})).sort((a,b)=>(b.ev?1:0)-(a.ev?1:0)||a.d-b.d).slice(0,30);
    html=`<p class="sub">探索度 ${explPct().toFixed(1)}%。迷霧裡的東西要走近才看得到；限時事件排在最前面。</p>${list.map(e=>`<button class="card" style="text-align:left;border:0;width:100%;color:inherit;font:inherit" data-act="openEnt" data-id="${e.id}"><div class="ent"><canvas data-ent="${e.id}" width="18" height="18" style="width:44px;height:44px"></canvas><div style="flex:1;min-width:0"><b style="font-weight:500;color:${e.kind==='monster'?RCOL[e.rar||0]:'inherit'}">${esc(e.kind==='monster'?`${e.name} Lv${e.lv}`:e.kind==='town'&&!S.found[e.id]?'未探索的城鎮':e.name)}</b><small class="sub" style="display:block">${e.bounty?'懸賞目標':KIND[e.kind]}・${dirName(S.lat,S.lng,e.lat,e.lng)}方 ${fmtD(e.d)}${e.d<=(e.kind==='town'?120:RANGE)?'・<span style="color:var(--good)">可互動</span>':''}</small></div></div></button>`).join('')}`}
  else if(sheetName==='settings'){
    html=`<h3>聲音</h3><div class="seg"><button data-act="toggle" data-k="music" aria-pressed="${S.music}">音樂 ${S.music?'開':'關'}</button><button data-act="toggle" data-k="sfx" aria-pressed="${S.sfx}">音效・震動 ${S.sfx?'開':'關'}</button></div>
    <h3>模擬傳送</h3><div class="btns">${['台中車站','科博館','國家歌劇院','逢甲夜市'].map(n=>`<button class="btn sm" data-act="warp" data-n="${n}">${n}</button>`).join('')}</div>
    <h3>雲端存檔</h3><div class="card"><div class="rowx"><div class="t"><b>${esc(CLOUD.status)}</b><small>${CLOUD.uid?'玩家 ID：'+CLOUD.uid.slice(0,8)+'・目前是匿名帳號，換手機前請先綁定（下一版加入）':'存檔只在這台裝置'}</small></div><button class="btn sm" data-act="cloudSync" ${CLOUD.uid?'':'disabled'}>立即同步</button></div></div><h3>版本</h3><p class="sub">漫步勇者 v${VER}</p><h3>關於這個 demo</h3><p class="sub">點地圖模擬走路。道路依台中車站周邊的真實位置手工近似，巷弄為生成；正式版會把 OpenStreetMap 道路畫成這種遊戲風格，並使用手機 GPS。</p>
    <h3>資料</h3><div class="card"><div class="rowx"><div class="t"><b>重新開始</b><small>清除這台裝置上的存檔與迷霧</small></div><button class="btn sm" data-act="reset">${resetArm?'再按一次確認':'重置'}</button></div></div>`}
  else if(sheetName==='log'){html=`<div class="log">${S.log.map(t=>`<div>${esc(t)}</div>`).join('')}</div>`}
  el.innerHTML=html;const hb=$('heroBig');if(hb)hb.getContext('2d').drawImage(sprite('heroF',heroPal()),0,0);
  el.querySelectorAll('canvas[data-ent]').forEach(cv=>{const e=ENT.get(cv.dataset.ent);if(e)cv.getContext('2d').drawImage(entIcon(e),0,0)});
  const dh=$('dollHero');if(dh)dh.getContext('2d').drawImage(sprite('heroF',heroPal()),0,0)}
function nearTownE(){return TOWNS.some(t=>dist(S.lat,S.lng,t.lat,t.lng)<230)}

/* ================= entity interaction ================= */
function openEnt(id){const e=ENT.get(id);if(!e)return;const d=dist(S.lat,S.lng,e.lat,e.lng),lim=e.kind==='town'?120:RANGE,inR=d<=lim||e.kind==='base';sheetName='ent';
  $('stitle').textContent=e.bounty?'懸賞目標':KIND[e.kind];$('scrim').hidden=false;$('sheet').classList.remove('off');let desc='',act='';
  if(e.kind==='monster'){desc=e.rar?`<span style="color:${RCOL[e.rar]}">${RNAME[e.rar]}怪物</span>：${e.mods.map(id=>{const m=EMODS.find(q=>q.id===id);return`<b>${m.n}</b>（${m.d}）`}).join('、')}。掉落更多更好的東西。`:`野生的 ${esc(e.name)} 在路上徘徊。`;
    desc+=`<br><span class="sub">攻擊屬性：${EL[e.base.el]}${e.base.res.some(v=>v)?'・抗性 火'+e.base.res[0]+'% 冰'+e.base.res[1]+'% 雷'+e.base.res[2]+'%':''}</span>`;if(e.bounty)desc+='<br><span style="color:#ff8a6a">懸賞：擊敗可得額外金幣與混沌石。</span>';
    act=`<button class="btn pri" data-act="fight" data-id="${id}" ${inR?'':'disabled'}>戰鬥</button>`}
  else if(e.kind==='dungeon'){desc=isDone(e)?'這座洞窟已被攻略，一小時後重新開啟。':'共 3 層，最深處有首領。每過一層恢復 15% 生命與魔力。';act=`<button class="btn pri" data-act="enter" data-id="${id}" ${inR&&!isDone(e)?'':'disabled'}>進入洞窟</button>`}
  else if(e.kind==='shrine'){desc='誠心參拜可以恢復全部生命與魔力，偶爾會得到通貨。';act=`<button class="btn pri" data-act="pray" data-id="${id}" ${inR?'':'disabled'}>參拜</button>`}
  else if(e.kind==='chest'){desc='路邊的寶箱。裡面通常有通貨，偶爾是裝備……也可能是寶箱怪。';act=`<button class="btn pri" data-act="openChest" data-id="${id}" ${inR?'':'disabled'}>打開</button>`}
  else if(e.kind==='event'){desc={merchant:'流浪商人只在這裡停留 30 分鐘，賣比較好的稀有裝備，還有混沌石。',rift:'裂隙裡會連續湧出 3 波魔法怪物，最後一波是稀有怪物。完成可得大量通貨。',fountain:'喝下泉水，30 分鐘內經驗與掉落提高 20%。'}[e.sub]+`<br><span class="sub">出現在${esc(e.town)}附近，30 分鐘內有效。</span>`;
    act=isDone(e)?'<button class="btn" disabled>已完成</button>':`<button class="btn pri" data-act="event" data-id="${id}" ${inR?'':'disabled'}>${{merchant:'交易',rift:'進入裂隙',fountain:'喝下泉水'}[e.sub]}</button>`}
  else if(e.kind==='base'){desc=`你的${baseName(e.b)}，回到這裡會恢復全部狀態。`;act=`<button class="btn pri" data-act="sheet" data-s="base">管理據點</button>`}
  else if(e.kind==='town'){const t=e.t,done=S.cleared[t.id]===hourEp(),lv=townLv(t),known=S.found[t.id];desc=known?`以真實地標「${esc(t.n)}」為中心的城鎮。`:'還沒探索過的城鎮。走到這裡就能解鎖，並獲得發現獎勵。';
    act=!known?'':(t.svc.includes('inn')?`<button class="btn" data-act="inn" ${inR?'':'disabled'}>旅店休息・15 金</button>`:'')+(t.svc.includes('temple')?`<button class="btn" data-act="pray" data-id="${id}" ${inR?'':'disabled'}>參拜</button>`:'')+(t.svc.includes('shop')?`<button class="btn" data-act="shop" data-id="${id}" ${inR?'':'disabled'}>商店</button>`:'')+
      `<button class="btn pri" data-act="trial" data-id="${id}" ${inR&&!done?'':'disabled'}>${done?'試煉已完成（1 小時後重開）':`地標試煉「${esc(t.dn)}」Lv${lv}`}</button>`}
  const title=e.kind==='town'&&!S.found[e.id]?'未探索的城鎮':e.name;
  $('sbody').innerHTML=`<div class="ent"><canvas id="entBig" width="18" height="18" style="width:84px;height:84px"></canvas><div style="flex:1;min-width:0;display:grid;gap:4px"><b style="font-family:var(--f-pix);font-size:19px;font-weight:400;color:${e.kind==='monster'?RCOL[e.rar||0]:'inherit'}">${esc(title)}${e.lv&&e.kind!=='town'?` <span class="sub">Lv${e.lv}</span>`:''}</b><span class="sub">${d<5?'就在這裡':dirName(S.lat,S.lng,e.lat,e.lng)+'方 '+fmtD(d)}</span></div></div>
    <p class="sub" style="color:var(--ink)">${desc}</p>${inR?'':`<p class="sub" style="color:#ffb27a">距離太遠，需要走到 ${lim} 公尺內（還差 ${fmtD(d-lim)}）。</p>`}
    <div class="btns" style="flex-direction:column">${act}${!inR?`<button class="btn" data-act="walkto" data-id="${id}">走過去</button>`:''}</div>`;
  $('entBig').getContext('2d').drawImage(entIcon(e),0,0)}
const inRange=e=>e&&dist(S.lat,S.lng,e.lat,e.lng)<=(e.kind==='town'?120:RANGE);

/* ================= bases ================= */
const P30=30*60e3;
const prodRate=b=>(b.type==='main'?60:30)*b.lv;
const stored=b=>Math.floor(Math.min(prodRate(b)*8,prodRate(b)*(now()-b.last)/3.6e6));
function charges(b){const t=now();if(b.exp>=3){b.expTs=t;return 3}const k=fl((t-b.expTs)/P30);if(k>0){b.exp=Math.min(3,b.exp+k);b.expTs+=k*P30;if(b.exp>=3)b.expTs=t}return b.exp}
const baseName=b=>b.type==='main'?'主據點':`分支據點 ${S.bases.filter(q=>q.type==='branch').indexOf(b)+1}`;
function baseTarget(b){const [bx,by]=toM(b.lat,b.lng);let best=null;
  for(let i=fl((bx-1500)/DCELL);i<=fl((bx+1500)/DCELL);i++)for(let j=fl((by-1500)/DCELL);j<=fl((by+1500)/DCELL);j++){const r=h(i,j,41);if(r%100>=30)continue;const x=(i+.15+((r>>>8)%70)/100)*DCELL,y=(j+.15+((r>>>16)%70)/100)*DCELL,id=`d${i}_${j}`;
    if(Math.hypot(x,y)>BOUND||nearTown(x,y,160)||S.cleared[id]===hourEp())continue;const d=Math.hypot(x-bx,y-by);if(!best||d<best.d){const [la,ln]=toLL(x,y);best={id,name:'洞窟',lat:la,lng:ln,d,lv:S.lv+1,kind:'dungeon'}}}
  for(const t of TOWNS){const d=Math.hypot(t.x-bx,t.y-by);if(d<1500&&S.found[t.id]&&S.cleared[t.id]!==hourEp()&&(!best||d<best.d))best={id:t.id,name:t.dn,lat:t.lat,lng:t.lng,d,lv:townLv(t),kind:'landmark',dn:t.dn}}return best}
function branchCheck(){if(!S.bases.some(b=>b.type==='main'))return'先建立主據點';if(S.bases.filter(b=>b.type==='branch').length>=3)return'分支據點已達上限 3 座';if(S.gold<150)return'需要 150 金幣';
  if(nearTownE())return'城鎮範圍內不能建立據點';const near=S.bases.find(b=>dist(b.lat,b.lng,S.lat,S.lng)<1000);if(near)return`離${baseName(near)}太近，需要相距 1 公里以上`;return''}

/* ================= actions ================= */
const A={
  sheet:d=>{audioInit();sfx('tap');if(d.s==='tree'){openTree();return}openSheet(d.s)},
  closeSheet:()=>closeSheet(),
  openEnt:d=>{sfx('tap');openEnt(d.id)},
  mbtn:d=>{sfx('select');const f=modalFns[+d.i];f&&f()},
  recenter:()=>{follow=true;cam.z=Math.max(cam.z,.5);sfx('tap')},
  walkto:d=>{const e=ENT.get(d.id);if(!e)return;const lim=(e.kind==='town'?120:RANGE)*.6,dd=dist(S.lat,S.lng,e.lat,e.lng),k=Math.max(0,1-lim/dd);simTarget=[S.lat+(e.lat-S.lat)*k,S.lng+(e.lng-S.lng)*k];follow=true;closeSheet()},
  fight:d=>{const e=ENT.get(d.id);if(!inRange(e))return;startBattle(makeEnemy(e.base,e.lv,e.rar,e.mods),{entId:e.id,bg:e.base.bg,bounty:e.bounty})},
  enter:d=>{const e=ENT.get(d.id);if(!inRange(e)||isDone(e))return;closeSheet();enterDungeon(e,false)},
  trial:d=>{const e=ENT.get(d.id);if(!inRange(e))return;const t=e.t;if(S.cleared[t.id]===hourEp())return;closeSheet();enterDungeon({id:t.id,kind:'landmark',dn:t.dn,lat:t.lat,lng:t.lng,lv:townLv(t)},false)},
  inn:()=>{if(S.gold<15){toast('金幣不足');sfx('nope');return}S.gold-=15;fullHeal();sfx('heal');toast('在旅店好好休息了一晚，狀態全滿');renderHud();closeSheet()},
  pray:d=>{const e=ENT.get(d.id);if(!inRange(e))return;fullHeal();sfx('bless');let gift='';if(Math.random()<.2){const c=rollCur(1);giveCur(c);gift=`，還得到 1 個${CURI[c].n}`}toast(`參拜完成，狀態全滿${gift}`);addLog(`在${e.name}參拜${gift}`);closeSheet();renderHud()},
  shop:d=>{const e=ENT.get(d.id);if(!inRange(e))return;closeSheet();openShop({id:e.id,name:e.name+'・商店',lat:e.lat,lng:e.lng})},
  openChest:d=>{const e=ENT.get(d.id);if(!inRange(e))return;closeSheet();S.defeated[e.id]=1;ENT.delete(e.id);
    if(e.mimic){toast('寶箱張開了嘴——是寶箱怪！');startBattle(makeEnemy(MIMIC,S.lv+1,1,['leech']),{bg:'city'});return}
    const got=[],g=20+S.lv*8;S.gold+=g;got.push(`${g} 金幣`);const n=1+(Math.random()<.4?1:0)+(Math.random()<.15?1:0);for(let i=0;i<n;i++){const c=rollCur(1.5);giveCur(c);got.push(curDot(c)+CURI[c].n)}
    if(Math.random()<.3){const sl=['weapon','helm','chest','gloves','boots','ring','amulet'],it=makeItem(sl[fl(Math.random()*7)],S.lv,Math.random()<.4?1:0);giveItem(it);got.push(itemName(it))}
    sfx('coin');showModal('打開寶箱',`<div class="loot">${got.map(x=>`<span>${x}</span>`).join('')}</div>`,[{label:'好',pri:1,fn:()=>{hideModal();renderHud();save()}}])},
  event:d=>{const e=ENT.get(d.id);if(!inRange(e)||isDone(e))return;closeSheet();
    if(e.sub==='merchant')openShop({id:e.id,name:'流浪商人',lat:e.lat,lng:e.lng},true);
    else if(e.sub==='fountain'){S.buff={until:now()+30*60e3};S.cleared[e.id]=evEp();sfx('bless');toast('祝福生效！30 分鐘內經驗與掉落 +20%');addLog('喝下祝福泉')}
    else enterDungeon({id:e.id,kind:'rift',lat:e.lat,lng:e.lng,lv:e.lv},false)},
  skill:d=>useSkill(d.k), bitem:d=>bItem(d.k), flee:()=>flee(),
  bsub:d=>{if(!B||B.busy)return;sfx('tap');B.sub=d.k||null;renderBHud()},
  use:d=>{const st=stats();if(!S[d.k])return;S[d.k]--;sfx('heal');if(d.k==='potions'){const v=Math.round(st.maxhp*.4);S.hp=Math.min(st.maxhp,S.hp+v);toast(`恢復 ${v} 生命`)}else{const v=Math.round(st.maxmp*.5);S.mp=Math.min(st.maxmp,S.mp+v);toast(`恢復 ${v} 魔力`)}renderHud();renderSheet()},
  pick:d=>{selItem={i:+d.i};sfx('tap');openSheet('item')},
  eqslot:d=>{if(!S.eq[d.s])return;selItem={eq:d.s};sfx('tap');openSheet('item')},
  craft:d=>{const it=selItem.eq?S.eq[selItem.eq]:S.inv[selItem.i];if(craft(it,d.c)){sfx(d.c==='exalt'||d.c==='chaos'||d.c==='alch'?'level':'select');buzz(30);addLog(`使用${CURI[d.c].n}：${itemTitle(it)}`);renderHud();renderSheet();save()}},
  equip:d=>{const it=S.inv.splice(selItem.i,1)[0],cur=S.eq[d.s];S.eq[d.s]=it;if(cur)S.inv.push(cur);sfx('select');toast(`裝備了 ${itemTitle(it)}`);selItem={eq:d.s};renderHud();openSheet('item');save()},
  unequip:d=>{const it=S.eq[d.s];if(!it)return;if(S.inv.length>=30){toast('背包已滿');return}S.inv.push(it);S.eq[d.s]=null;selItem={i:S.inv.length-1};renderHud();openSheet('item')},
  sell:()=>{const it=S.inv.splice(selItem.i,1)[0];S.gold+=sellVal(it);sfx('coin');toast(`賣出 ${itemTitle(it)} +${sellVal(it)} 金`);renderHud();openSheet('bag')},
  alloc:()=>{const p=selNode&&pathTo(selNode);if(!p||!p.length||p.length>treePts())return;S.tree.push(...p);sfx('level');buzz(30);renderHud();renderTreeCard();save()},
  treeReset:()=>{S.tree=[startOf(S.cls)];selNode=null;sfx('select');renderHud();renderTreeCard();save()},
  cloudSync:async()=>{CLOUD.dirty=true;await cloudPush();toast(CLOUD.status);renderSheet()},
  treeBonus:()=>{S.bonusPts=(S.bonusPts||0)+10;sfx('level');renderHud();renderTreeCard();save()},
  openTree:()=>openTree(), closeTree:()=>closeTree(), treeFit:()=>{treeFit();sfx('tap')},
  buildMain:()=>{if(S.bases.some(b=>b.type==='main')||nearTownE())return;S.bases.push({id:uid(),type:'main',lat:S.lat,lng:S.lng,lv:1,last:now(),exp:3,expTs:now()});sfx('level');addLog('建立了主據點');toast('主據點建立完成！');refreshEntities(true);renderSheet();save()},
  buildBranch:()=>{if(branchCheck())return;S.gold-=150;S.bases.push({id:uid(),type:'branch',lat:S.lat,lng:S.lng,lv:1,last:now(),exp:3,expTs:now()});sfx('level');addLog('建立了分支據點');toast('分支據點建立完成！');refreshEntities(true);renderHud();renderSheet();save()},
  collect:d=>{const b=S.bases.find(q=>q.id===d.id),v=stored(b);S.gold+=v;b.last=now();sfx('coin');toast(`領取 ${v} 金幣`);addLog(`從${baseName(b)}領取 ${v} 金幣`);renderHud();renderSheet()},
  upgrade:d=>{const b=S.bases.find(q=>q.id===d.id),c=120*b.lv,cc=2*b.lv;if(b.lv>=5||S.gold<c||S.crystal<cc)return;S.gold+=stored(b);b.last=now();S.gold-=c;S.crystal-=cc;b.lv++;sfx('level');toast(`${baseName(b)} 升級到 Lv${b.lv}`);renderHud();renderSheet()},
  expedition:d=>{const b=S.bases.find(q=>q.id===d.id),tg=baseTarget(b);if(!tg||charges(b)<1)return;
    showModal(`遠征・${esc(tg.name)} Lv${tg.lv}`,`<p>從${baseName(b)}派出遠征，不需要走過去。獎勵為實地攻略的 80%。</p><p class="sub">消耗 1 次遠征（剩 ${charges(b)} 次）・目前生命 ${S.hp}/${stats().maxhp}</p>`,
      [{label:'取消',fn:hideModal},{label:'出發',pri:1,fn:()=>{hideModal();closeSheet();b.exp--;if(b.exp===2)b.expTs=now();enterDungeon(tg,true)}}])},
  goto:d=>{const b=S.bases.find(q=>q.id===d.id);closeSheet();follow=false;[cam.x,cam.y]=toM(b.lat,b.lng)},
  warp:d=>{const t=TOWNS.find(t=>t.n===d.n);simTarget=null;S.lat=t.lat-0.0009;S.lng=t.lng;follow=true;[cam.x,cam.y]=toM(S.lat,S.lng);trailStep(true);refreshEntities(true);checkArrive();closeSheet();toast(`模擬傳送：${t.n}`)},
  toggle:d=>{S[d.k]=!S[d.k];audioInit();if(AU.ctx){AU.music.gain.value=S.music?.5:0;AU.sfx.gain.value=S.sfx?.8:0}save();renderSheet()},
  ff:()=>{S.timeOffset+=3600e3;toast('時間快轉了 1 小時');refreshEntities(true);renderSheet()},
  reset:()=>{if(!resetArm){resetArm=true;renderSheet();return}try{localStorage.removeItem(KEY)}catch(e){}resetArm=false;S=newGame();delete S.intro;fogReset();[cam.x,cam.y]=toM(S.lat,S.lng);trailStep(true);refreshEntities(true);renderHud();closeSheet();toast('新的旅程開始了')}
};
document.addEventListener('click',ev=>{if(ev.target.id==='treeCv')return;const el=ev.target.closest('[data-act]');if(!el||el.disabled)return;const f=A[el.dataset.act];if(f){ev.stopPropagation();f(el.dataset)}});
document.addEventListener('pointerdown',()=>audioInit(),{capture:true,passive:true});
document.addEventListener('visibilitychange',()=>{if(document.hidden)save()});
window.addEventListener('resize',sizeWorld);
setInterval(()=>{if(S&&!B)save();if(sheetName==='base'&&!resetArm)renderSheet();if(!B)refreshEntities()},8000);
