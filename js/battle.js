/* 漫步勇者 · 戰鬥：背景、邏輯、繪製 */
'use strict';
/* ================= battle: painted backgrounds ================= */
const bbg=$('bbg'),bfx=$('bfx'),bctx=bfx.getContext('2d');let BW=360,BH=480,DPR=1;
function sizeBattle(){const r=$('bview').getBoundingClientRect();DPR=Math.min(2,window.devicePixelRatio||1);BW=r.width;BH=r.height;for(const c of [bbg,bfx]){c.width=Math.round(BW*DPR);c.height=Math.round(BH*DPR)}}
function blob(x,cx,cy,r,col){const g=x.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,col);g.addColorStop(1,col.replace(/[\d.]+\)$/,'0)'));x.fillStyle=g;x.fillRect(cx-r,cy-r,r*2,r*2)}
function paintBG(kind){const x=bbg.getContext('2d'),W=bbg.width,H=bbg.height,r=rng(h(fl(S.lat*1e3),fl(S.lng*1e3),kind.length)),HZ=H*.6;x.save();
  const hr=new Date(now()).getHours(),night=hr<6||hr>=19,dusk=!night&&hr>=16;
  const soft=(px,fn)=>{x.save();if('filter' in x)x.filter=`blur(${px*DPR}px)`;fn();x.restore()};
  const pal={forest:{sky:['#e9f0c8','#9cc27a'],far:'#6f9a5c',mid:'#3f6e36',near:'#264a22',ground:['#9a9a3a','#6d7a28'],fog:'rgba(240,245,200,.55)'},
    meadow:{sky:['#bfe3f2','#e8f2d0'],far:'#8fb7a0',mid:'#6fa155',near:'#4f8a3c',ground:['#a7c766','#7aa548'],fog:'rgba(255,255,240,.45)'},
    city:{sky:['#3a3f7a','#d99a7a'],far:'#5b5f8e',mid:'#3c3f66',near:'#25263f',ground:['#5a5560','#3e3a44'],fog:'rgba(255,200,170,.3)'},
    mountain:{sky:['#a9c3e0','#eef2f6'],far:'#9aa9c0',mid:'#7a8a8f',near:'#5c6a60',ground:['#8e9c70','#6c7a52'],fog:'rgba(255,255,255,.55)'},
    cave:{sky:['#140f1a','#2a2030'],far:'#2a2232',mid:'#1f1926',near:'#120e17',ground:['#3a3242','#241e2a'],fog:'rgba(255,150,80,.18)'}}[kind];
  if(night&&kind!=='cave'){pal.sky=['#0b1030','#2e3570'];pal.fog='rgba(150,180,255,.2)'}else if(dusk&&kind!=='cave'&&kind!=='city'){pal.sky=['#f2b77a','#f6e1b0']}
  let g=x.createLinearGradient(0,0,0,HZ);g.addColorStop(0,pal.sky[0]);g.addColorStop(1,pal.sky[1]);x.fillStyle=g;x.fillRect(0,0,W,H);
  blob(x,W*.6,H*.22,W*.6,night?'rgba(160,180,255,.25)':'rgba(255,250,220,.7)');
  const trees=(col,base,n,size,blur)=>soft(blur,()=>{x.fillStyle=col;for(let i=0;i<n;i++){const cx=r()*W,cy=base-r()*size*.6,rr=size*(.5+r()*.6);x.beginPath();x.ellipse(cx,cy,rr*1.1,rr,0,0,6.28);x.fill();x.fillRect(cx-rr*.08,cy,rr*.16,base-cy+size*.5)}x.fillRect(0,base,W,H-base)});
  const ridge=(col,base,amp,blur,snow)=>soft(blur,()=>{x.fillStyle=col;x.beginPath();x.moveTo(0,H);let y=base;for(let i=0;i<=W;i+=W/14){y=base-amp*(.4+r()*.6);x.lineTo(i,y)}x.lineTo(W,H);x.fill();
    if(snow){x.fillStyle='rgba(255,255,255,.8)';for(let i=0;i<6;i++){const cx=r()*W,cy=base-amp*.9;x.beginPath();x.moveTo(cx-20*DPR,cy+16*DPR);x.lineTo(cx,cy-4*DPR);x.lineTo(cx+20*DPR,cy+16*DPR);x.fill()}}});
  const skyline=(col,base,lit,blur)=>soft(blur,()=>{for(let i=0;i<W;){const w=(16+r()*30)*DPR,hh=(40+r()*140)*DPR;x.fillStyle=col;x.fillRect(i,base-hh,w,hh+H);if(lit){x.fillStyle='rgba(255,215,130,.85)';for(let wy=base-hh+6*DPR;wy<base-4*DPR;wy+=8*DPR)for(let wx=i+4*DPR;wx<i+w-4*DPR;wx+=7*DPR)if(r()<.4)x.fillRect(wx,wy,3*DPR,4*DPR)}i+=w+r()*6*DPR}});
  if(kind==='forest'){trees(pal.far,HZ*.72,26,W*.09,6);blob(x,W*.5,HZ*.6,W*.5,pal.fog);trees(pal.mid,HZ*.88,16,W*.13,2.5);}
  else if(kind==='meadow'){ridge(pal.far,HZ*.8,H*.12,5);blob(x,W*.5,HZ*.75,W*.6,pal.fog);trees(pal.mid,HZ*.95,9,W*.08,2)}
  else if(kind==='city'){skyline(pal.far,HZ*.9,true,4);blob(x,W*.5,HZ*.8,W*.7,pal.fog);skyline(pal.mid,HZ,night||dusk,1.5)}
  else if(kind==='mountain'){ridge(pal.far,HZ*.62,H*.22,4,true);blob(x,W*.5,HZ*.7,W*.7,pal.fog);ridge(pal.mid,HZ*.9,H*.1,2)}
  else{soft(3,()=>{x.fillStyle=pal.far;for(let i=0;i<W;i+=18*DPR){x.beginPath();x.moveTo(i,0);x.lineTo(i+9*DPR,(40+r()*90)*DPR);x.lineTo(i+18*DPR,0);x.fill()}});}
  g=x.createLinearGradient(0,HZ,0,H);g.addColorStop(0,pal.ground[0]);g.addColorStop(1,pal.ground[1]);x.fillStyle=g;x.beginPath();x.moveTo(0,HZ);
  for(let i=0;i<=W;i+=W/10)x.lineTo(i,HZ+(r()-.5)*14*DPR);x.lineTo(W,H);x.lineTo(0,H);x.fill();
  soft(1.5,()=>{for(let i=0;i<140;i++){const yy=HZ+Math.pow(r(),1.4)*(H-HZ),s=(yy-HZ)/(H-HZ);x.fillStyle=`rgba(${kind==='cave'?'90,80,100':kind==='city'?'120,115,125':'60,90,30'},${.25+r()*.3})`;x.beginPath();x.ellipse(r()*W,yy,(8+r()*30)*DPR*s+2,(2+r()*5)*DPR*s+1,0,0,6.28);x.fill()}});
  blob(x,W*.5,HZ+(H-HZ)*.45,W*.55,kind==='cave'?'rgba(255,170,90,.15)':'rgba(255,250,210,.22)');
  if(kind==='forest'||kind==='meadow'){soft(5,()=>{x.fillStyle=pal.near;x.beginPath();x.ellipse(-W*.05,H*.05,W*.3,H*.3,0,0,6.28);x.fill();x.beginPath();x.ellipse(W*1.05,H*.08,W*.28,H*.28,0,0,6.28);x.fill();x.beginPath();x.ellipse(W*.1,H*1.02,W*.35,H*.1,0,0,6.28);x.fill();x.beginPath();x.ellipse(W*.95,H*1.02,W*.35,H*.1,0,0,6.28);x.fill()})}
  if(kind==='cave'){[[.12,.35],[.88,.35]].forEach(([a,b])=>{blob(x,W*a,H*b,W*.3,'rgba(255,150,60,.45)');x.fillStyle='#5a3a20';x.fillRect(W*a-3*DPR,H*b,6*DPR,24*DPR);x.fillStyle='#ffc46a';x.fillRect(W*a-5*DPR,H*b-10*DPR,10*DPR,11*DPR)})}
  const vg=x.createRadialGradient(W/2,H*.55,H*.3,W/2,H*.55,H*.95);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.45)');x.fillStyle=vg;x.fillRect(0,0,W,H);x.restore()}

/* ================= battle: logic ================= */
const BFX={pops:[],fx:[],shake:0,hero:{a:null},en:{a:null,flash:0},t0:0,motes:[]};
const POS=()=>({hx:BW*.27,ex:BW*.72,y:Math.min(BH*.6,BH-118)});
function bmsg(t){const el=$('bmsg');el.textContent=t;el.style.opacity=1;clearTimeout(bmsg.t);bmsg.t=setTimeout(()=>el.style.opacity=0,1300)}
function pop(text,x,y,col){BFX.pops.push({text,x,y,col,t:performance.now()})}
function anim(who,type,dur=360){BFX[who].a={type,t:performance.now(),dur}}
function animOff(who){const a=BFX[who].a;if(!a)return[0,0];const p=(performance.now()-a.t)/a.dur;if(p>=1){BFX[who].a=null;return[0,0]}const s=Math.sin(Math.PI*p);
  if(a.type==='lunge')return[(who==='hero'?1:-1)*BW*.22*s,-6*s];if(a.type==='cast')return[0,-8*s];if(a.type==='hurt')return[(who==='hero'?-8:8)*Math.sin(p*20)*(1-p),0];return[0,0]}
function later(ms,fn){setTimeout(()=>{if(B)fn()},ms)}
function startBattle(e,opts){if(B)return;closeSheet();B={e,...opts,guard:0,poison:0,burn:0,burnDmg:0,shock:0,frozen:0,pFrozen:0,busy:true,sub:null};simTarget=null;
  BFX.pops=[];BFX.fx=[];BFX.en={a:null,flash:0};BFX.hero={a:null};BFX.motes=Array.from({length:30},()=>({x:Math.random(),y:Math.random(),v:rnd(.0005,.0015),p:Math.random()*6.28}));
  sfx('encounter');buzz(60);$('battle').hidden=false;renderBHud();sizeBattle();paintBG(opts.bg||e.bg||'meadow');BFX.t0=performance.now();playSong(B.boss||e.rar===2?'boss':'battle');renderBHud();
  bmsg(e.rar?`${['','魔法','稀有'][e.rar]}怪物：${e.name}`:`${e.name} 出現了！`);setTimeout(()=>{if(B){B.busy=false;renderBHud()}},700)}
function renderBHud(){if(!B)return;const st=stats(),e=B.e,p=POS();
  $('bname').innerHTML=`<span style="color:${RCOL[e.rar||0]}">${esc(e.name)}</span><small>等級 ${e.lv}${B.boss?'・首領':''}${e.mods&&e.mods.length?'・'+modNames(e):''}</small>`;
  $('bstat').textContent=[D?`${D.kind==='rift'?'裂隙第':'第'} ${D.room+1}/3 ${D.kind==='rift'?'波':'層'}`:'',B.poison?`中毒 ${B.poison}`:'',B.burn?`燃燒 ${B.burn}`:'',B.shock?`感電 ${B.shock}`:'',B.frozen?'凍結':'',B.guard?`防禦 ${B.guard}`:'',B.pFrozen?'你被凍結':''].filter(Boolean).join('・');$('bstat').hidden=!$('bstat').textContent;
  const pill=(cls,v,max,txt)=>`<div class="bp ${cls}"><i style="width:${Math.max(0,v/max*100)}%"></i><span>${txt??Math.ceil(v).toLocaleString()}</span></div>`;
  const hp=$('hpills');hp.style.left=p.hx+'px';hp.style.top=(p.y+14)+'px';hp.innerHTML=pill('hp',S.hp,st.maxhp)+pill('mp',S.mp,st.maxmp)+pill('xp',S.xp,xpNeed(S.lv),`Lv${S.lv}`);
  const ep=$('epills');ep.style.left=p.ex+'px';ep.style.top=(p.y+14)+'px';ep.innerHTML=pill('hp',e.hp,e.maxhp);
  const c=CLASSES[S.cls],sk=c.skills.filter(k=>k!=='attack'),dis=B.busy?'disabled':'';
  const cb=(label,icon,sub,act,data,disabled,extra='')=>`<button class="cb ${extra}" data-act="${act}" ${data} ${disabled||dis}><img src="${iconURL(icon)}" alt="">${label}${sub?`<small>${sub}</small>`:''}</button>`;
  const slot=k=>k?cb(SKILLS[k].name,SKILLS[k].icon,SKILLS[k].mp?SKILLS[k].mp+' 魔力':'','skill',`data-k="${k}"`,S.mp<SKILLS[k].mp?'disabled':''):cb('生命藥水','heart','×'+S.potions,'bitem','data-k="potions"',S.potions?'':'disabled');
  let html=slot(sk[0])+cb('攻擊','axe','','skill','data-k="attack"','')+slot(sk[1])+cb('技能','book','','bsub','data-k="skills"','')+cb('逃跑','run',D?'無法逃跑':'','flee','',D?'disabled':'','run')+cb('物品','bag','','bsub','data-k="items"','');
  if(B.sub==='skills')html+=`<div class="bsub">${c.skills.map(k=>cb(SKILLS[k].name,SKILLS[k].icon,SKILLS[k].mp?SKILLS[k].mp+' 魔力':'','skill',`data-k="${k}"`,S.mp<SKILLS[k].mp?'disabled':'')).join('')}${cb('返回','run','','bsub','data-k=""','')}</div>`;
  if(B.sub==='items')html+=`<div class="bsub">${cb('生命藥水','heart','×'+S.potions+'・恢復 40%','bitem','data-k="potions"',S.potions?'':'disabled')}${cb('魔力藥水','ice','×'+S.ethers+'・恢復 50%','bitem','data-k="ethers"',S.ethers?'':'disabled')}${cb('返回','run','','bsub','data-k=""','')}</div>`;
  $('bcmd').innerHTML=html}
/* damage packets: {phys,fire,cold,light} */
function mitigate(pk,arm,res,shock){const tot=pk.phys+pk.fire+pk.cold+pk.light;const pr=pk.phys>0?arm/(arm+10*pk.phys):0;
  let d=pk.phys*(1-pr)+pk.fire*(1-res[0]/100)+pk.cold*(1-res[1]/100)+pk.light*(1-res[2]/100);if(shock)d*=1.2;return Math.max(1,d)}
function playerHit(sk,mult){const st=stats(),e=B.e,p=POS();let pk;
  if(sk.kind==='spell'){pk={phys:0,fire:0,cold:0,light:0};pk[sk.el]=st.spell*mult*rnd(.85,1.15)}
  else pk={phys:rnd(st.physLo,st.physHi)*mult,fire:st.fire*mult*rnd(.8,1.2),cold:st.cold*mult*rnd(.8,1.2),light:st.light*mult*rnd(.3,1.7)};
  let d=mitigate(pk,e.arm,e.res,B.shock>0);const crit=Math.random()*100<st.crit;if(crit)d*=st.critMulti/100;d=Math.round(d);e.hp=Math.max(0,e.hp-d);
  BFX.en.flash=performance.now();anim('en','hurt',300);const main=pk.fire>pk.cold&&pk.fire>pk.light&&pk.fire>pk.phys*.5?'#ffb15a':pk.cold>pk.phys*.5&&pk.cold>pk.light?'#9fe7ff':pk.light>pk.phys*.5?'#fff27a':'#ffffff';
  pop(crit?d+'!':String(d),p.ex+rnd(-12,12),p.y-80,crit?'#ffd166':main);if(crit){BFX.shake=performance.now();sfx('crit');buzz(40)}else sfx('hit');
  if(st.leech&&d>0){const v=Math.max(1,Math.round(d*st.leech/100));S.hp=Math.min(st.maxhp,S.hp+v)}
  if(e.hp>0){if(pk.fire>0&&Math.random()<(sk.el==='fire'?.4:.2)){B.burn=3;B.burnDmg=Math.max(1,Math.round(pk.fire*.3));pop('燃燒',p.ex,p.y-100,'#ffb15a')}
    if(pk.cold>0&&Math.random()<(sk.freeze||.12)){B.frozen=1;pop('凍結',p.ex,p.y-100,'#9fe7ff')}
    if(pk.light>0&&Math.random()<.25){B.shock=2;pop('感電',p.ex,p.y-100,'#fff27a')}}
  if(e.mods&&e.mods.includes('reflect')){const r=Math.max(1,Math.round(d*.15));S.hp=Math.max(1,S.hp-r);pop('-'+r,p.hx,p.y-90,'#ff8a8a')}
  renderBHud()}
function useSkill(k){const sk=SKILLS[k];if(!B||B.busy||S.mp<sk.mp)return;B.busy=true;B.sub=null;S.mp-=sk.mp;sfx('select');bmsg(sk.name);renderBHud();const p=POS();
  if(sk.kind==='attack'){const ranged=sk.fx==='arrow'||CLASSES[S.cls].wep==='bow',hits=sk.hits||1;
    for(let n=0;n<hits;n++)later(n*380,()=>{if(B.e.hp<=0)return;if(ranged){anim('hero','cast',300);sfx('arrow');BFX.fx.push({type:'arrow',t:performance.now(),dur:260})}else{anim('hero','lunge',380);later(140,()=>sfx('slash'))}
      later(ranged?240:170,()=>{BFX.fx.push({type:sk.fx==='whirl'?'whirl':ranged?'pierce':'slash',t:performance.now(),dur:300});playerHit(sk,sk.mult);
        if(sk.guard){B.guard=sk.guard;pop('護甲↑',p.hx,p.y-90,'#9fd4ef')}if(sk.poison&&B.e.hp>0){B.poison=sk.poison;pop('中毒',p.ex,p.y-100,'#9be36b')}})});
    later(hits*380+380,afterPlayer)}
  else if(sk.kind==='spell'){anim('hero','cast',500);BFX.fx.push({type:'charge',t:performance.now(),dur:450});later(360,()=>{sfx(sk.fx);BFX.fx.push({type:sk.fx,t:performance.now(),dur:600})});
    later(700,()=>playerHit(sk,sk.mult));later(1150,afterPlayer)}
  else{anim('hero','cast',500);later(250,()=>{sfx('heal');BFX.fx.push({type:'heal',t:performance.now(),dur:700});const st=stats(),v=Math.round(st.maxhp*.35);S.hp=Math.min(st.maxhp,S.hp+v);pop('+'+v,p.hx,p.y-90,'#7bd36b');renderBHud()});later(1000,afterPlayer)}}
function bItem(k){if(!B||B.busy||!S[k])return;B.busy=true;B.sub=null;sfx('heal');const st=stats(),p=POS();S[k]--;if(k==='potions'){const v=Math.round(st.maxhp*.4);S.hp=Math.min(st.maxhp,S.hp+v);pop('+'+v,p.hx,p.y-90,'#7bd36b')}else{const v=Math.round(st.maxmp*.5);S.mp=Math.min(st.maxmp,S.mp+v);pop('+'+v+' MP',p.hx,p.y-90,'#6ab8ff')}
  BFX.fx.push({type:'heal',t:performance.now(),dur:700});bmsg(k==='potions'?'生命藥水':'魔力藥水');renderBHud();later(800,afterPlayer)}
function flee(){if(!B||B.busy||D)return;B.busy=true;B.sub=null;sfx('select');renderBHud();if(Math.random()<.7){bmsg('成功逃跑！');addLog(`從 ${B.e.name} 身邊逃走了`);later(700,()=>endBattle())}else{bmsg('逃跑失敗！');later(700,afterPlayer)}}
function enemyDead(){BFX.en.dying=performance.now();sfx('win');later(900,winBattle)}
function afterPlayer(){if(B.e.hp<=0)return enemyDead();later(250,enemyTurn)}
function enemyTurn(){const e=B.e,p=POS(),st=stats();
  const dot=(n,col)=>{e.hp=Math.max(0,e.hp-n);pop(String(n),p.ex+rnd(-10,10),p.y-80,col);BFX.en.flash=performance.now();sfx('hit')};
  if(B.poison>0){dot(Math.max(1,Math.round(e.maxhp*.08)),'#9be36b');B.poison--}if(B.burn>0){dot(B.burnDmg,'#ffb15a');B.burn--}if(B.shock>0)B.shock--;renderBHud();
  if(e.hp<=0){later(400,enemyDead);return}
  later(350,()=>{if(B.frozen){B.frozen=0;bmsg(`${e.name} 被凍住，無法行動`);renderBHud();later(800,endEnemyTurn);return}
    const acts=e.mods&&e.mods.includes('swift')&&Math.random()<.35?2:1;let n=0;
    const strike=()=>{const strong=Math.random()<.15;bmsg(strong?`${e.name} 的猛力一擊！`:`${e.name} 的攻擊${acts>1&&n>0?'（第二次）':''}`);anim('en','lunge',420);
      later(210,()=>{if(Math.random()*100<st.dodge){pop('閃避',p.hx,p.y-90,'#d8d2c4');sfx('tap')}else{
        let atk=e.atk*(strong?1.5:1)*rnd(.9,1.1);if(e.mods&&e.mods.includes('fury')&&e.hp<e.maxhp/2)atk*=1.5;
        const pk={phys:0,fire:0,cold:0,light:0};pk[e.el]+=atk;if(e.mods){if(e.mods.includes('fire'))pk.fire+=atk*.4;if(e.mods.includes('cold'))pk.cold+=atk*.4;if(e.mods.includes('shock'))pk.light+=atk*.4}
        const d=Math.round(mitigate(pk,st.armor*(B.guard>0?2:1),[st.res.fire,st.res.cold,st.res.light],false));S.hp=Math.max(0,S.hp-d);anim('hero','hurt',320);BFX.shake=performance.now();sfx('hurt');buzz(strong?120:50);
        pop(String(d),p.hx,p.y-90,pk.fire>pk.phys?'#ffb15a':pk.cold>pk.phys?'#9fe7ff':pk.light>pk.phys?'#fff27a':'#ff8a8a');
        if(e.mods&&e.mods.includes('leech')){const hl=Math.round(d*.15);if(hl>0){e.hp=Math.min(e.maxhp,e.hp+hl);pop('+'+hl,p.ex,p.y-100,'#7bd36b')}}
        if(pk.cold>0&&Math.random()<.12){B.pFrozen=1;pop('你被凍結',p.hx,p.y-110,'#9fe7ff')}}
        renderBHud();if(S.hp<=0){later(700,loseBattle);return}n++;if(n<acts)later(500,strike);else later(500,endEnemyTurn)})};strike()})}
function endEnemyTurn(){if(!B)return;const st=stats();if(B.guard>0)B.guard--;if(st.regen&&S.hp>0){S.hp=Math.min(st.maxhp,S.hp+st.regen)}
  if(B.pFrozen){B.pFrozen=0;bmsg('你被凍住了，跳過這回合');renderBHud();later(900,enemyTurn);return}B.busy=false;renderBHud()}
function dropLoot(e,boss){const buf=buffOn()?1.2:1,rem=D&&D.remote?.8:1,out=[],r=e.rar||0;
  const itemCh=[.22,.5,1][r]*buf*rem,curN=boss?3+fl(Math.random()*2):r===2?2+fl(Math.random()*2):r===1?(Math.random()<.6?1:0)+(Math.random()<.3?1:0):(Math.random()<.25*buf?1:0);
  const slots=['weapon','helm','chest','gloves','boots','ring','amulet'];
  const mk=minR=>{const q=Math.random();let rar=q<.55?0:q<.9?1:2;rar=Math.max(rar,minR);const it=makeItem(slots[fl(Math.random()*slots.length)],e.lv,rar);giveItem(it);out.push(itemName(it))};
  if(boss)mk(2);else if(Math.random()<itemCh)mk(r>=2?1:0);if(r===2&&Math.random()<.5)mk(0);
  for(let i=0;i<Math.round(curN*rem);i++){const c=rollCur(boss||r===2?3:1);giveCur(c);out.push(curDot(c)+CURI[c].n)}
  if(Math.random()<.12){S.potions++;out.push('生命藥水')}return out}
function winBattle(){const e=B.e,mult=(D&&D.remote?.8:1)*(buffOn()?1.2:1),xp=Math.round(e.xp*mult),gold=Math.round(e.gold*rnd(.8,1.2)*mult);S.gold+=gold;const up=gainXP(xp);{const st0=stats();S.hp=Math.min(st0.maxhp,S.hp+Math.round(st0.maxhp*.2));S.mp=Math.min(st0.maxmp,S.mp+Math.round(st0.maxmp*.2))}
  if(B.entId){S.defeated[B.entId]=1;ENT.delete(B.entId)}const drops=dropLoot(e,B.boss);let bonus='';
  if(B.bounty){const g=100+S.lv*30;S.gold+=g;giveCur('chaos');bonus=`<p style="color:var(--gold)">懸賞完成！額外 ${g} 金幣與 1 個混沌石</p>`;S.cleared[B.bounty]=evEp()}
  addLog(`擊敗 ${e.name} Lv${e.lv}，獲得 ${xp} 經驗、${gold} 金幣`);if(up)setTimeout(()=>sfx('level'),500);renderBHud();save();const inD=!!D;
  const next=()=>{if(inD){D.room++;if(D.room>=3)return dungeonClear();const st=stats();S.hp=Math.min(st.maxhp,S.hp+Math.round(st.maxhp*.15));S.mp=Math.min(st.maxmp,S.mp+Math.round(st.maxmp*.15));
      showModal(D.kind==='rift'?`裂隙第 ${D.room+1}/3 波`:`第 ${D.room+1}/3 層`,`<p>${D.room===2?(D.kind==='rift'?'裂隙深處湧出一隻稀有怪物。':'更深處傳來強大的氣息，首領就在前方。'):'下一波敵人正在逼近。'}</p><p class="sub">生命 ${S.hp}/${st.maxhp}・魔力 ${S.mp}/${st.maxmp}</p>`,
        [{label:'撤退',fn:()=>{hideModal();addLog('撤退了');D=null;endBattle()}},{label:'繼續',pri:1,fn:()=>{hideModal();nextRoom()}}])}else{hideModal();endBattle()}};
  const cont=()=>{if(S.cls==='novice'&&S.lv>=5&&!S.classOffered){S.classOffered=true;classModal(next)}else next()};
  showModal('勝利！',`<p>獲得 <span style="color:var(--good)">${xp} 經驗</span>、<span style="color:var(--gold)">${gold} 金幣</span></p>${drops.length?`<div class="loot">${drops.map(d=>`<span>${d}</span>`).join('')}</div>`:''}${bonus}${up?`<p style="color:var(--gold)">升級到 Lv${S.lv}！狀態全滿，獲得 1 天賦點</p>`:''}`,[{label:'繼續',pri:1,fn:cont}])}
function loseBattle(){sfx('lose');buzz(300);const lost=fl(S.gold*.1);S.gold-=lost;fullHeal();D=null;const main=S.bases.find(b=>b.type==='main');
  addLog(`戰敗，損失 ${lost} 金幣`);showModal('你倒下了……',`<p>損失 ${lost} 金幣，狀態已恢復。${main?'你被送回主據點。':''}</p><p class="sub">提示：看看角色頁的抗性，元素怪物對低抗性很痛。</p>`,[{label:'重新出發',pri:1,fn:()=>{hideModal();if(main){S.lat=main.lat;S.lng=main.lng;refreshEntities(true)}endBattle()}}])}
function endBattle(){$('battle').hidden=true;B=null;playSong('field');renderHud();save()}
function enterDungeon(t,remote){D={id:t.id,kind:t.kind,lat:t.lat,lng:t.lng,lv:t.lv,room:0,remote,lm:t.kind==='landmark'?t:null,seed:h(fl(t.lat*1e4),fl(t.lng*1e4),hourEp())};sfx('door');
  addLog(`${remote?'從據點遠征':'進入'}${t.kind==='rift'?'魔物裂隙':D.lm?D.lm.dn:'洞窟'}（Lv${t.lv}）`);nextRoom()}
function nextRoom(){const boss=D.room===2,r=h(D.seed,D.room,9);let e,bg;
  if(D.kind==='rift'){const b=pickMon(r,D.lv);e=boss?makeEnemy(b,D.lv+1,2,rollMods(r,3)):makeEnemy(b,D.lv,1,rollMods(r,1+(r%2)));bg=b.bg}
  else if(boss){const bn=D.lm?`${D.lm.dn}守護者`:'洞窟守護者';e=makeEnemy({name:bn,bg:'cave',hp:70,atk:12,arm:30,el:D.lm?'cold':'fire',res:[25,25,25],xp:30,gold:30,spr:D.lm?'spirit':'golem',pal:D.lm?{v:'#ffd166',e:'#3a1a00',m:'#c0392b'}:{r:'#b0392b',y:'#ffd166'}},D.lv+1);
    e.maxhp=Math.round(e.maxhp*2.2);e.hp=e.maxhp;e.atk=Math.round(e.atk*1.2);e.xp*=2;e.rar=3;bg='cave'}
  else{const q=r%100;e=makeEnemy(pickMon(r,D.lv),D.lv,q<25?1:0,q<25?rollMods(r,1):[]);bg=D.lm?'forest':'cave'}
  if(B){B.e=e;B.boss=boss&&D.kind!=='rift';B.poison=B.burn=B.shock=B.frozen=B.pFrozen=B.guard=0;B.busy=true;BFX.en={a:null,flash:0};BFX.pops=[];paintBG(bg);BFX.t0=performance.now();playSong(boss?'boss':'battle');renderBHud();bmsg(`${e.name} 出現了！`);sfx('encounter');setTimeout(()=>{if(B){B.busy=false;renderBHud()}},800)}
  else startBattle(e,{boss:boss&&D.kind!=='rift',bg})}
function dungeonClear(){const mult=D.remote?.8:1,kind=D.kind,bonus=D.lm?1.6:1,gold=Math.round((40+D.lv*25)*mult*bonus),cry=kind==='rift'?0:Math.max(1,Math.round((2+fl(D.lv/2))*mult*bonus));
  const it=makeItem(['weapon','helm','chest','gloves','boots','ring','amulet'][fl(Math.random()*7)],D.lv+1,D.lm||kind==='rift'?2:1);S.gold+=gold;S.crystal+=cry;giveItem(it);
  const curs=[];for(let i=0;i<(kind==='rift'?4:2);i++){const c=rollCur(3);giveCur(c);curs.push(curDot(c)+CURI[c].n)}
  S.cleared[D.id]=kind==='rift'?evEp():hourEp();const nm=kind==='rift'?'魔物裂隙':D.lm?D.lm.dn:'洞窟',rem=D.remote;addLog(`攻略${nm}（Lv${D.lv}）`);sfx('level');D=null;
  showModal('攻略完成！',`<p><span style="color:var(--gold)">${gold} 金幣</span>${cry?`・<span style="color:#9fe7ff">${cry} 魔晶</span>`:''}</p>${itemCard(it,'首領寶箱')}<div class="loot">${curs.map(c=>`<span>${c}</span>`).join('')}</div>${rem?'<p class="sub">遠征獎勵為實地攻略的 80%。</p>':''}`,
    [{label:'返回地圖',pri:1,fn:()=>{hideModal();endBattle()}}])}
/* ================= battle: drawing ================= */
function renderBattle(t){const c=bctx,now_=performance.now(),p=POS();c.setTransform(DPR,0,0,DPR,0,0);c.clearRect(0,0,BW,BH);c.imageSmoothingEnabled=false;
  let sx=0,sy=0;if(now_-BFX.shake<260){const k=1-(now_-BFX.shake)/260;sx=rnd(-5,5)*k;sy=rnd(-4,4)*k}c.save();c.translate(sx,sy);
  const sc=Math.max(3,Math.min(6,Math.round(BW/90)));
  const e=B.e,[eox,eoy]=animOff('en'),es=B.boss?sc+2:sc+1;
  if(!BFX.en.dying||now_-BFX.en.dying<850){const alpha=BFX.en.dying?1-(now_-BFX.en.dying)/850:1;if(e.rar)glow(c,p.ex+eox,p.y-8*es,(e.rar>=2?16:12)*es,e.rar===3?'232,135,58':e.rar===2?'242,210,94':'110,160,255',.35+.12*Math.sin(t/300));c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.ellipse(p.ex+eox,p.y+2,es*6.5,es*1.5,0,0,6.28);c.fill();
    c.globalAlpha=Math.max(0,alpha);const flash=now_-BFX.en.flash<120||(BFX.en.dying&&fl((now_-BFX.en.dying)/80)%2===0);const faceLeft=e.spr==='boar'||e.spr==='wolf';drawSpr(c,e.spr,e.pal,p.ex+eox,p.y+eoy+Math.sin(t/260)*2,es,faceLeft,flash);c.globalAlpha=1}
  const [hox,hoy]=animOff('hero'),hx=p.hx+hox,hy=p.y+hoy+Math.sin(t/320)*1.5,hs=sc;
  c.fillStyle='rgba(0,0,0,.3)';c.beginPath();c.ellipse(p.hx+hox,p.y+2,hs*6.5,hs*1.5,0,0,6.28);c.fill();
  const wep=CLASSES[S.cls].wep,u=hs;
  if(wep==='sword'){c.fillStyle='#d8dde6';c.fillRect(hx+5*u,hy-15*u,u,9*u);c.fillStyle='#f6f8fb';c.fillRect(hx+5*u,hy-15*u,u*.4,9*u);c.fillStyle='#b8862e';c.fillRect(hx+3.5*u,hy-6*u,4*u,u)}
  else if(wep==='staff'){c.fillStyle='#7a5230';c.fillRect(hx+5*u,hy-17*u,u,16*u);c.fillStyle='#7fe0ff';c.fillRect(hx+4*u,hy-19*u,3*u,3*u)}
  else{c.strokeStyle='#8a5a2f';c.lineWidth=u;c.beginPath();c.arc(hx+3*u,hy-9*u,6*u,-Math.PI*.4,Math.PI*.4);c.stroke();c.strokeStyle='#eee';c.lineWidth=1;c.beginPath();c.moveTo(hx+4.8*u,hy-14.5*u);c.lineTo(hx+4.8*u,hy-3.5*u);c.stroke()}
  drawSpr(c,'heroS',heroPal(),hx,hy,hs,true);
  for(let i=BFX.fx.length-1;i>=0;i--){const f=BFX.fx[i],q=(now_-f.t)/f.dur;if(q>=1){BFX.fx.splice(i,1);continue}drawFx(c,f,q,p,hs)}
  c.globalCompositeOperation='lighter';for(const q of BFX.motes){q.y-=q.v;q.x+=Math.sin(t/900+q.p)*.0006;if(q.y<0)q.y=1;c.fillStyle=`rgba(255,240,180,${.35+.3*Math.sin(t/400+q.p)})`;c.fillRect(q.x*BW,q.y*BH*.9,2,2)}c.globalCompositeOperation='source-over';
  c.font='bold 22px DotGothic16, sans-serif';c.textAlign='center';
  for(let i=BFX.pops.length-1;i>=0;i--){const q=BFX.pops[i],k=(now_-q.t)/1000;if(k>=1){BFX.pops.splice(i,1);continue}const y=q.y-k*30-(k<.15?Math.sin(k/.15*Math.PI)*10:0);c.globalAlpha=k>.7?(1-k)/.3:1;c.lineWidth=4;c.strokeStyle='#000';c.strokeText(q.text,q.x,y);c.fillStyle=q.col;c.fillText(q.text,q.x,y);c.globalAlpha=1}
  c.restore();const intro=(now_-BFX.t0)/450;if(intro<1){c.fillStyle=`rgba(255,255,255,${1-intro})`;c.fillRect(0,0,BW,BH)}}
function drawFx(c,f,q,p,u){const ex=p.ex,ey=p.y-8*u;c.save();c.globalCompositeOperation='lighter';
  if(f.type==='slash'||f.type==='whirl'){const n=f.type==='whirl'?3:1;for(let k=0;k<n;k++){c.strokeStyle=`rgba(255,255,255,${1-q})`;c.lineWidth=5*(1-q)+1;c.beginPath();c.arc(ex,ey,7*u+k*10,-2.2+q*2+k,-0.6+q*2+k);c.stroke()}}
  else if(f.type==='arrow'){const x=p.hx+6*u+(ex-p.hx-6*u)*q;c.fillStyle='#fff';c.fillRect(x-8,ey,16,2)}
  else if(f.type==='pierce'){c.fillStyle=`rgba(255,255,220,${1-q})`;for(let k=0;k<6;k++){const a=k/6*6.28;c.fillRect(ex+Math.cos(a)*q*34,ey+Math.sin(a)*q*34,3,3)}}
  else if(f.type==='charge')blob(c,p.hx+5*u,p.y-18*u,10+40*q,'rgba(170,200,255,.6)');
  else if(f.type==='fire'){for(let k=0;k<26;k++){const a=k*2.39,r=q*56*(.4+(k%5)/5),y=ey-q*22*(k%3);c.fillStyle=k%2?`rgba(255,140,40,${1-q})`:`rgba(255,220,90,${1-q})`;const s=7*(1-q)+2;c.fillRect(ex+Math.cos(a)*r-s/2,y+Math.sin(a)*r*.6-s/2,s,s)}blob(c,ex,ey,80,`rgba(255,120,40,${.55*(1-q)})`)}
  else if(f.type==='ice'){for(let k=0;k<8;k++){const a=k/8*6.28,r=44*(1-q)+8;c.fillStyle=`rgba(170,235,255,${1-q*.7})`;c.save();c.translate(ex+Math.cos(a)*r,ey+Math.sin(a)*r*.7);c.rotate(a);c.fillRect(-11,-2,22,4);c.restore()}blob(c,ex,ey,70,`rgba(140,220,255,${.5*(1-q)})`)}
  else if(f.type==='heal'){for(let k=0;k<14;k++){const x=p.hx-26+((k*37)%52),y=p.y-10-q*80-(k%4)*8;c.fillStyle=`rgba(140,255,150,${1-q})`;c.fillRect(x,y,3,3)}}
  c.restore()}
window.addEventListener('resize',()=>{if(B&&!$('battle').hidden){sizeBattle();paintBG(B.boss||D?'cave':(B.e.bg||'meadow'));renderBHud()}});
