/* 漫步勇者 · 天賦樹全螢幕介面 */
'use strict';
/* ================= passive tree (full screen) ================= */
const startOf=cls=>'start_'+(cls||'novice');
const blockedStart=id=>{const n=TREE.byId[id];return n&&n.type==='start'&&n.cls!==S.cls};
function canAlloc(id){if(S.tree.includes(id)||blockedStart(id))return false;return TREE.E.some(([a,b])=>(a===id&&S.tree.includes(b))||(b===id&&S.tree.includes(a)))}
function pathTo(id){if(S.tree.includes(id)||blockedStart(id))return null;const have=new Set(S.tree),prev=new Map(),q=[...S.tree];const seen=new Set(q);
  const adj=TREE.adj||(TREE.adj=(()=>{const m={};for(const [a,b] of TREE.E){(m[a]=m[a]||[]).push(b);(m[b]=m[b]||[]).push(a)}return m})());
  while(q.length){const x=q.shift();if(x===id)break;for(const y of adj[x]||[]){if(seen.has(y)||blockedStart(y))continue;seen.add(y);prev.set(y,x);q.push(y)}}
  if(!seen.has(id))return null;const path=[];let c=id;while(c&&!have.has(c)){path.push(c);c=prev.get(c)}return path.reverse()}
const TV={s:1,x:0,y:0,W:0,H:0,D:1};
function openTree(){closeSheet();$('treeView').hidden=false;sizeTree();treeFit();renderTreeCard();sfx('select')}
function closeTree(){$('treeView').hidden=true;selNode=null;renderHud();save()}
function sizeTree(){const cv=$('treeCv');TV.D=Math.min(2,window.devicePixelRatio||1);TV.W=window.innerWidth;TV.H=window.innerHeight;cv.width=Math.round(TV.W*TV.D);cv.height=Math.round(TV.H*TV.D)}
function treeFit(){const st=TREE.byId[startOf(S.cls)];TV.s=Math.min(TV.W,TV.H)/560;TV.x=st.x*.55;TV.y=st.y*.55+40/TV.s;drawTree()}
const TX=x=>(x-TV.x)*TV.s+TV.W/2, TY=y=>(y-TV.y)*TV.s+TV.H/2;
const CLSN={novice:'冒險者',knight:'劍士',ranger:'遊俠',mage:'術士'};
function drawTree(){const cv=$('treeCv');if(!cv||$('treeView').hidden)return;const x=cv.getContext('2d');x.setTransform(TV.D,0,0,TV.D,0,0);x.imageSmoothingEnabled=false;
  const g=x.createRadialGradient(TX(0),TY(0),20*TV.s,TX(0),TY(0),520*TV.s);g.addColorStop(0,'#2b2436');g.addColorStop(.5,'#18131f');g.addColorStop(1,'#0c0a10');x.fillStyle=g;x.fillRect(0,0,TV.W,TV.H);
  // decorative rings: start disc + outer wheel
  x.strokeStyle='rgba(201,164,92,.18)';x.lineWidth=Math.max(1,10*TV.s);x.beginPath();x.arc(TX(0),TY(0),125*TV.s,0,6.28);x.stroke();
  x.strokeStyle='rgba(201,164,92,.08)';x.lineWidth=Math.max(1,4*TV.s);x.beginPath();x.arc(TX(0),TY(0),410*TV.s,0,6.28);x.stroke();
  x.fillStyle='rgba(201,164,92,.06)';x.beginPath();x.arc(TX(0),TY(0),100*TV.s,0,6.28);x.fill();
  const fs=Math.max(10,Math.min(16,13*TV.s));x.font=`${fs}px DotGothic16, sans-serif`;x.textAlign='center';x.textBaseline='middle';
  [['力量',150],['敏捷',30],['智力',-90]].forEach(([t,a])=>{x.fillStyle='rgba(255,255,255,.22)';x.fillText(t,TX(470*Math.cos(a*Math.PI/180)),TY(470*Math.sin(a*Math.PI/180)))});
  const path=selNode?pathTo(selNode):null,pset=new Set(path||[]);
  for(const [a,b] of TREE.E){const A=TREE.byId[a],Bn=TREE.byId[b],on=S.tree.includes(a)&&S.tree.includes(b),pp=(pset.has(a)||S.tree.includes(a))&&(pset.has(b)||S.tree.includes(b))&&(pset.has(a)||pset.has(b));
    x.strokeStyle=on?'#f2c14e':pp?'rgba(140,220,255,.85)':'rgba(255,255,255,.13)';x.lineWidth=Math.max(1.2,(on?4:pp?3:2.4)*TV.s);x.beginPath();x.moveTo(TX(A.x),TY(A.y));x.lineTo(TX(Bn.x),TY(Bn.y));x.stroke()}
  for(const n of TREE.N){const sx=TX(n.x),sy=TY(n.y);if(sx<-60||sx>TV.W+60||sy<-60||sy>TV.H+60)continue;const on=S.tree.includes(n.id),can=canAlloc(n.id),inp=pset.has(n.id);
    const r=(n.type==='start'?28:n.type==='key'?16:n.type==='notable'?13:9)*TV.s;
    if(n.type==='start'){const mine=n.cls===S.cls;x.fillStyle=mine?'#3a2e16':'#1c1822';x.strokeStyle=mine?'#f2c14e':'rgba(201,164,92,.35)';x.lineWidth=Math.max(2,4*TV.s);x.beginPath();x.arc(sx,sy,r,0,6.28);x.fill();x.stroke();
      x.lineWidth=Math.max(1,1.5*TV.s);x.beginPath();x.arc(sx,sy,r*.78,0,6.28);x.stroke();const im=nodeIcon(n.ic),is=r*1.05;x.globalAlpha=mine?1:.45;if(im.complete)x.drawImage(im,sx-is/2,sy-is/2,is,is);else im.onload=drawTree;x.globalAlpha=1;
      x.fillStyle=mine?'#f2d9a6':'rgba(242,217,166,.45)';x.fillText(CLSN[n.cls],sx,sy+r+fs*.9);if(n.id===selNode){x.strokeStyle='#fff';x.lineWidth=2;x.beginPath();x.arc(sx,sy,r+6,0,6.28);x.stroke()}continue}
    if(n.id===selNode){x.strokeStyle='#fff';x.lineWidth=2;x.beginPath();x.arc(sx,sy,r+6*TV.s+2,0,6.28);x.stroke()}
    if(on){x.fillStyle=n.type==='key'?'rgba(232,135,58,.35)':'rgba(242,193,78,.3)';x.beginPath();x.arc(sx,sy,r+5*TV.s,0,6.28);x.fill()}
    x.fillStyle=on?'#3a2e16':inp?'#203040':can?'#2e2836':'#1a1620';x.strokeStyle=on?(n.type==='key'?'#e8873a':'#f2c14e'):inp?'#8fdcff':can?'#c9a45c':'#4a4054';x.lineWidth=Math.max(1,(n.type==='small'?1.6:2.6)*TV.s);
    x.beginPath();if(n.type==='key'){for(let i=0;i<6;i++){const a=i/6*6.28-Math.PI/2;x[i?'lineTo':'moveTo'](sx+Math.cos(a)*r,sy+Math.sin(a)*r)}x.closePath()}else x.arc(sx,sy,r,0,6.28);x.fill();x.stroke();
    const im=nodeIcon(n.ic),is=r*(n.type==='small'?1.25:1.15);x.globalAlpha=on||inp?1:can?.85:.42;if(im.complete)x.drawImage(im,sx-is/2,sy-is/2,is,is);else im.onload=drawTree;x.globalAlpha=1}
  $('tvPts').innerHTML=`<b>${treePts()}</b> 點可用<small>已點 ${S.tree.length-1} / ${TREE.N.length-4}・每升一級 +1</small>`}
function renderTreeCard(){const el=$('tvCard'),n=selNode&&TREE.byId[selNode];if(!n){el.innerHTML=`<span class="sub">點節點看效果。從你的職業起點（金框圓盤）往外點；藍色線是要點亮的路徑。雙指縮放、拖曳移動。</span>`;drawTree();return}
  const path=pathTo(n.id),cost=path?path.length:0,stats=Object.entries(n.st).map(([k,v])=>STATN[k](v)).join('<br>');
  let btn;if(S.tree.includes(n.id))btn=`<span class="sub" style="color:var(--good)">${n.type==='start'?'你的職業起點':'已點亮'}</span>`;else if(blockedStart(n.id))btn='<span class="sub">其他職業的起點，無法點亮，但可以從旁邊的節點繞過去</span>';
  else if(!path)btn='<span class="sub">無法到達</span>';else btn=`<button class="btn pri" data-act="alloc" ${cost<=treePts()?'':'disabled'}>${cost<=treePts()?`點亮（${cost} 點）`:`需要 ${cost} 點，目前 ${treePts()} 點`}</button>`;
  el.innerHTML=`<div class="ent"><img class="bigico" src="${pixURL('ic_'+n.ic)}" alt=""><div style="min-width:0;flex:1"><b style="color:${n.type==='key'?'#e8873a':n.type==='notable'||n.type==='start'?'var(--gold)':'var(--ink)'}">${n.n}${n.type==='key'?'・基石':n.type==='notable'?'・重要節點':''}</b><div class="sub">${stats||'—'}</div></div></div>${btn}`;drawTree()}
(()=>{const cv=$('treeCv'),pts=new Map();let drag=null,pinch=null;
  cv.addEventListener('pointerdown',ev=>{cv.setPointerCapture(ev.pointerId);pts.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});if(pts.size===1)drag={x:ev.clientX,y:ev.clientY,cx:TV.x,cy:TV.y,moved:false};
    if(pts.size===2){const [a,b]=[...pts.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),s:TV.s,mx:(a.x+b.x)/2,my:(a.y+b.y)/2,cx:TV.x,cy:TV.y};drag=null}});
  cv.addEventListener('pointermove',ev=>{if(!pts.has(ev.pointerId))return;pts.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});
    if(pinch&&pts.size===2){const [a,b]=[...pts.values()],ns=Math.max(.35,Math.min(3.2,pinch.s*Math.hypot(a.x-b.x,a.y-b.y)/pinch.d));const wx=(pinch.mx-TV.W/2)/pinch.s+pinch.cx,wy=(pinch.my-TV.H/2)/pinch.s+pinch.cy;
      TV.s=ns;TV.x=wx-((a.x+b.x)/2-TV.W/2)/ns;TV.y=wy-((a.y+b.y)/2-TV.H/2)/ns;drawTree();return}
    if(drag){const dx=ev.clientX-drag.x,dy=ev.clientY-drag.y;if(!drag.moved&&Math.hypot(dx,dy)>8)drag.moved=true;if(drag.moved){TV.x=drag.cx-dx/TV.s;TV.y=drag.cy-dy/TV.s;drawTree()}}});
  const end=ev=>{const tap=drag&&!drag.moved&&pts.size===1&&ev.type==='pointerup';pts.delete(ev.pointerId);if(pts.size<2)pinch=null;if(!pts.size)drag=null;
    if(tap){const wx=(ev.clientX-TV.W/2)/TV.s+TV.x,wy=(ev.clientY-TV.H/2)/TV.s+TV.y;let best=null,bd=1e9;for(const n of TREE.N){const r=(n.type==='start'?30:n.type==='key'?18:n.type==='notable'?15:12)+10/TV.s,d=Math.hypot(n.x-wx,n.y-wy);if(d<r&&d<bd){bd=d;best=n}}
      if(best){selNode=best.id;sfx('tap');renderTreeCard()}}};
  cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);
  cv.addEventListener('wheel',ev=>{ev.preventDefault();const ns=Math.max(.35,Math.min(3.2,TV.s*Math.exp(-ev.deltaY*.0015))),wx=(ev.clientX-TV.W/2)/TV.s+TV.x,wy=(ev.clientY-TV.H/2)/TV.s+TV.y;TV.s=ns;TV.x=wx-(ev.clientX-TV.W/2)/ns;TV.y=wy-(ev.clientY-TV.H/2)/ns;drawTree()},{passive:false});
  window.addEventListener('resize',()=>{if(!$('treeView').hidden){sizeTree();drawTree()}})})();
function classPicker(after){const opts=[['knight','劍士','起點在左下，力量路線：生命、護甲、物理傷害。技能：盾擊、旋風斬'],['ranger','遊俠','起點在右下，敏捷路線：暴擊、速度、吸血。技能：連射、毒箭'],['mage','術士','起點在上方，智力路線：法術、魔力、抗性。技能：火球術、冰矛、治癒'],['novice','冒險者','起點在正中央，離三條路線都一樣遠，但起始數值最平均。技能：強力一擊']];
  showModal('選擇職業',`<p class="sub">職業決定技能和天賦樹的起點。天賦點從 0 開始，每升一級得 1 點。</p>${opts.map(([k,n,d],i)=>`<button class="btn" style="text-align:left;display:grid;gap:2px" data-act="mbtn" data-i="${i}"><span style="color:${CLASSES[k].color};font-weight:500">${n}</span><small class="sub">${d}</small></button>`).join('')}`,[]);
  modalFns=opts.map(([k])=>()=>{S.cls=k;S.tree=[startOf(k)];S.classOffered=true;fullHeal();sfx('level');addLog(`選擇了職業：${CLASSES[k].name}`);hideModal();renderHud();after&&after()})}
