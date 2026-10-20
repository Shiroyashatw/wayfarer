/* 漫步勇者 · 好友、組隊邀請、玩家名字（需要正式帳號；隊伍代碼遊客也能用） */
'use strict';
/* ================= profile & friends ================= */
const SOC = { friends: [], loaded: false, invCh: null, syncT: 0 };
const isOnline = f => Date.now() - new Date(f.seen_at).getTime() < 3 * 60e3;
/* 把名字、等級、職業、上線時間寫到 profiles，好友列表才看得到 */
async function profileSync(force) {
  if (!CLOUD.sb || CLOUD.anon || !CLOUD.uid) return;
  if (!force && Date.now() - SOC.syncT < 60e3) return;
  SOC.syncT = Date.now();
  try {
    await CLOUD.sb
      .from('profiles')
      .update({ name: (S.name || '旅人').slice(0, 12), lv: S.lv, cls: S.cls, seen_at: new Date().toISOString() })
      .eq('user_id', CLOUD.uid);
  } catch (e) {}
}
async function friendsLoad() {
  if (!CLOUD.sb || CLOUD.anon) return;
  try {
    const { data, error } = await CLOUD.sb.rpc('friend_list');
    if (!error) {
      SOC.friends = data || [];
      SOC.loaded = true;
    }
  } catch (e) {}
  ptPill();
  if (sheetName === 'friends' || sheetName === 'party') renderSheet();
}
const FR_MSG = {
  sent: '已送出好友邀請',
  accepted: '對方也邀請過你，已成為好友！',
  already: '你們已經是好友了',
  self: '這是你自己的編號',
  not_found: '找不到這個玩家編號',
  guest: '要先註冊帳號才能加好友',
  no_profile: '帳號還沒拿到玩家編號，請稍後再試'
};
async function friendAdd(no) {
  const { data, error } = await CLOUD.sb.rpc('friend_request', { target_no: no });
  if (error) throw new Error(error.message);
  await friendsLoad();
  return FR_MSG[data] || data;
}
async function friendRespond(uid, ok) {
  await CLOUD.sb.rpc('friend_respond', { other: uid, accept: ok });
  await friendsLoad();
}
async function friendRemove(uid) {
  await CLOUD.sb.rpc('friend_remove', { other: uid });
  await friendsLoad();
}
/* 登入（或換帳號）後：同步公開資料、讀好友、開始收組隊邀請 */
function socialOnUser() {
  invitesStop();
  SOC.friends = [];
  SOC.loaded = false;
  if (CLOUD.anon) return;
  profileSync(true);
  friendsLoad();
  invitesListen();
}

/* ================= party invites ================= */
/* 邀請寫進 party_invites，收件人用 Realtime 即時收到；開遊戲時補看 10 分鐘內的邀請 */
const INVQ = [];
function invitesListen() {
  if (!CLOUD.sb || CLOUD.anon || SOC.invCh) return;
  SOC.invCh = CLOUD.sb
    .channel('inv-' + CLOUD.uid)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'party_invites', filter: 'to_id=eq.' + CLOUD.uid },
      p => queueInvite(p.new)
    )
    .subscribe();
  CLOUD.sb
    .from('party_invites')
    .select('*')
    .eq('to_id', CLOUD.uid)
    .gte('created_at', new Date(Date.now() - 10 * 60e3).toISOString())
    .then(({ data }) => (data || []).forEach(queueInvite));
}
function invitesStop() {
  if (SOC.invCh && CLOUD.sb) CLOUD.sb.removeChannel(SOC.invCh);
  SOC.invCh = null;
}
const dropInvite = iv =>
  CLOUD.sb
    .from('party_invites')
    .delete()
    .eq('id', iv.id)
    .then(() => {});
function queueInvite(iv) {
  if (!iv) return;
  if (Date.now() - new Date(iv.created_at).getTime() > 10 * 60e3) {
    dropInvite(iv);
    return;
  }
  if (!INVQ.some(q => q.id === iv.id)) INVQ.push(iv);
  sfx('select');
  buzz(40);
  nextInvite();
}
function nextInvite() {
  if (!INVQ.length || busy() || PT) return;
  const iv = INVQ.shift(),
    i = iv.info || {};
  showModal(
    '組隊邀請',
    `<p><b>${esc(i.from || '好友')}</b> ${i.no ? `<span class="sub">#${String(i.no).padStart(6, '0')}</span>` : ''} 邀請你一起打</p><p style="color:${(DTYPES[i.dt] || DTYPES.normal).col}">${esc(i.dn || '地城')} Lv${i.lv || '?'}</p><p class="sub">不用在附近也能加入。戰鬥中每人每回合 15 秒，沒動作會自動普攻。</p>`,
    [
      {
        label: '拒絕',
        fn: () => {
          hideModal();
          dropInvite(iv);
          nextInvite();
        }
      },
      {
        label: '加入',
        pri: 1,
        fn: () => {
          hideModal();
          dropInvite(iv);
          partyJoin(iv.party);
        }
      }
    ]
  );
}
setInterval(nextInvite, 3000);
async function inviteFriend(f) {
  if (!PT || !CLOUD.sb) return;
  const d = PT.dun;
  const { error } = await CLOUD.sb.from('party_invites').insert({
    to_id: f.user_id,
    party: PT.code,
    info: { from: S.name || '旅人', no: CLOUD.no, dn: d ? dunName(d) : '地城', dt: d && d.dt, lv: d && d.lv }
  });
  toast(error ? '邀請失敗：' + error.message : `已邀請 ${f.name}`);
}

/* ================= friends sheet ================= */
function friendsHTML() {
  const inc = SOC.friends.filter(f => f.status === 'pending' && f.incoming),
    out = SOC.friends.filter(f => f.status === 'pending' && !f.incoming),
    ok = SOC.friends.filter(f => f.status === 'accepted');
  const row = (f, btns) =>
    `<div class="card"><div class="rowx"><div class="t"><b>${esc(f.name)} <span class="sub">#${String(f.player_no).padStart(6, '0')}</span></b><small><span style="color:${clsOf(f.cls).color}">${clsOf(f.cls).name}</span> Lv${f.lv}・${isOnline(f) ? '<span style="color:var(--good)">在線</span>' : '離線'}</small></div><div class="btns">${btns}</div></div></div>`;
  let h = '';
  if (CLOUD.anon)
    return `<div class="card"><p class="sub">註冊帳號、拿到玩家編號後就能加好友，並直接邀請好友一起打地城。</p><div class="btns"><button class="btn pri" data-act="sheet" data-s="settings">前往註冊</button></div></div>`;
  h += `<h3>加好友</h3><div class="card"><p class="sub">你的編號是 <b style="color:var(--gold)">${playerTag()}</b>，把它告訴朋友。</p><div class="srow" style="margin-top:6px"><input class="inp" id="frNo" inputmode="numeric" placeholder="對方的玩家編號"><button class="btn pri" data-act="frAdd">送出</button></div><p class="sub" id="frMsg"></p></div>`;
  if (inc.length)
    h +=
      `<h3>收到的好友邀請 ${inc.length}</h3>` +
      inc
        .map(f =>
          row(
            f,
            `<button class="btn sm pri" data-act="frYes" data-u="${f.user_id}">接受</button><button class="btn sm" data-act="frNo" data-u="${f.user_id}">拒絕</button>`
          )
        )
        .join('');
  h +=
    `<h3>好友 ${ok.length}</h3>` +
    (ok.length
      ? ok.map(f => row(f, `<button class="btn sm" data-act="frDel" data-u="${f.user_id}">刪除</button>`)).join('')
      : `<p class="sub">${SOC.loaded ? '還沒有好友。' : '讀取中…'}</p>`);
  if (out.length)
    h +=
      `<h3>等待對方回應</h3>` +
      out.map(f => row(f, `<button class="btn sm" data-act="frDel" data-u="${f.user_id}">取消</button>`)).join('');
  return h + `<div class="btns"><button class="btn" data-act="frReload">重新整理</button></div>`;
}
