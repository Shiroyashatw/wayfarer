/* 平行跑機器人對局（simLobby）：開 N 個子行程，每個載入一次遊戲邏輯，任務用 IPC 分派。
   給 bot_train.js、bot_cls.js 用。
   用法：const P = require('./lobby_pool')(4); const out = await P.run([{ seed, rating, opt }, …]); P.close();
   每個結果是 [{ place, cls, mode, theme }, …]（照座位順序） */
const { fork } = require('child_process');
const os = require('os');

if (process.argv[2] === '--lobby-worker') {
  const G = require('./game_node');
  process.on('message', ({ id, seed, rating, opt }) => {
    const L = G.simLobby(seed, rating, opt);
    process.send({ id, res: L.map(b => ({ place: b.place, cls: b.stat.cls, mode: b.mode, theme: b.theme })) });
  });
} else
  module.exports = (jobs = os.cpus().length) => {
    const ws = [...Array(Math.max(1, jobs))].map(() => fork(__filename, ['--lobby-worker'])),
      wait = new Map();
    let seq = 0;
    for (const w of ws)
      w.on('message', ({ id, res }) => {
        const f = wait.get(id);
        wait.delete(id);
        f.done(res);
      });
    return {
      run(tasks) {
        let next = 0;
        const out = Array(tasks.length);
        return new Promise(resolve => {
          let left = tasks.length;
          if (!left) return resolve(out);
          const give = w => {
            if (next >= tasks.length) return;
            const k = next++,
              id = ++seq;
            wait.set(id, {
              done: res => {
                out[k] = res;
                if (--left === 0) resolve(out);
                else give(w);
              }
            });
            w.send({ id, ...tasks[k] });
          };
          for (const w of ws) give(w);
        });
      },
      close() {
        for (const w of ws) w.kill();
      }
    };
  };
