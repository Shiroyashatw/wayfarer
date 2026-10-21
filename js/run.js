/* 漫步勇者 · 0.1.0 肉鴿：主選單與一局的流程（章節地圖、節點、獎勵、結算） */
'use strict';
/* ================= 主選單 ================= */
function homeRender() {
  const el = $('home');
  if (!el || !S) return;
  el.hidden = !!S.run;
  $('runmap').hidden = !S.run;
  if (S.run) return;
  el.innerHTML = `<div class="hm"><h1 class="hm-t">漫步勇者</h1><p class="sub">v${VER}</p>
    <div class="hm-b"><button class="btn pri" data-act="testFight">測試戰鬥</button><button class="btn" data-act="gacha">契靈祈願</button><button class="btn" data-act="sheet" data-s="settings">設定</button></div></div>`;
}
/* 戰鬥結束、換存檔後重畫目前的畫面（主選單或章節地圖） */
function viewRender() {
  homeRender();
}
/* ================= 一局（第 2 階段實作） ================= */
const runLootQ = () => 0;
function runWin(r) {
  showModal('勝利！', `<p>獲得 ${r.xp} 經驗、${r.gold} 金幣</p>`, [
    {
      label: '繼續',
      pri: 1,
      fn: () => {
        hideModal();
        endBattle();
      }
    }
  ]);
}
function runLose() {
  fullHeal();
  showModal('你倒下了……', '', [
    {
      label: '返回',
      pri: 1,
      fn: () => {
        hideModal();
        endBattle();
      }
    }
  ]);
}
Object.assign(A, {
  testFight: () => {
    fullHeal();
    if (!S.gems.length) {
      giveGem('power');
      giveGem('heal');
    }
    startBattle(
      ['台灣黑熊', '黑潮海龍', '雷神魔像'].map(n =>
        makeEnemy(
          MONS.find(m => m.name === n),
          3
        )
      ),
      { bg: 'forest' }
    );
  }
});
