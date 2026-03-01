// main.js — Go 側から ExecJS 経由で呼ばれる UI 更新ロジック
//
// Go の main.go が 3 秒ごとに window.ExecJS("handleStats({...})") を実行し、
// このファイルのグローバル関数 handleStats() にデータが渡される。
// Wails のイベント API (@wailsio/runtime) はバンドラが必要なため使わず、
// ExecJS + グローバル関数という直接的な方式を採用している。

// コア別バーの DOM を初回だけ生成するためのフラグ。
// マシンのコア数は動的に変わらないので、2回目以降は DOM 生成をスキップする。
let coresInitialized = false;

// handleStats は Go から呼ばれるエントリポイント。
// stats は monitor.go の SystemStats を JSON シリアライズしたオブジェクト。
function handleStats(stats) {
  if (!stats || !stats.cpu || !stats.mem) return;
  updateCPU(stats.cpu);
  updateMem(stats.mem);
}

// usageColor は使用率 0-100% を緑(120)→黄(60)→赤(0) の HSL 色相にマッピングする。
// HSL を使うことで滑らかなグラデーションが得られる。
function usageColor(pct) {
  const hue = Math.max(0, (1 - pct / 100) * 120);
  return `hsl(${hue}, 80%, 50%)`;
}

// updateCPU は全体バー + コア別バーを更新する。
// コア別バーの DOM は初回呼び出し時に動的生成する。
// コア数はマシンによって異なる（8〜24+）ため、HTML に静的に書けない。
function updateCPU(cpu) {
  const total = Math.round(cpu.totalUsage);
  document.getElementById("cpu-total").textContent = total + "%";
  document.getElementById("cpu-total").style.color = usageColor(total);

  const bar = document.getElementById("cpu-total-bar");
  bar.style.width = total + "%";
  bar.style.background = usageColor(total);

  const grid = document.getElementById("cpu-cores");

  // コア数が変わった場合（通常は初回のみ）に DOM を再構築する
  if (!coresInitialized || grid.children.length !== cpu.coreCount) {
    grid.innerHTML = "";
    for (let i = 0; i < cpu.coreCount; i++) {
      const row = document.createElement("div");
      row.className = "core-row";
      row.innerHTML =
        `<span class="core-label">${i}</span>` +
        `<div class="core-track"><div class="core-fill" id="core-${i}"></div></div>` +
        `<span class="core-pct" id="core-pct-${i}">0%</span>`;
      grid.appendChild(row);
    }
    coresInitialized = true;
  }

  // 各コアのバー幅と色を更新。CSS transition で滑らかにアニメーションする。
  for (let i = 0; i < cpu.perCore.length; i++) {
    const pct = Math.round(cpu.perCore[i]);
    const fill = document.getElementById("core-" + i);
    const label = document.getElementById("core-pct-" + i);
    if (fill) {
      fill.style.width = pct + "%";
      fill.style.background = usageColor(pct);
    }
    if (label) {
      label.textContent = pct + "%";
    }
  }
}

// formatBytes はバイト数を "X.X GB" 形式に変換する。
// 10 GB 以上は小数点以下を省略して見やすくしている。
function formatBytes(bytes) {
  const gb = bytes / (1024 * 1024 * 1024);
  return gb >= 10 ? gb.toFixed(0) + " GB" : gb.toFixed(1) + " GB";
}

// updateMem はメモリセクションの使用率バー・数値を更新する。
// メモリバーは CPU と違い青色固定。使用率で色を変えないのは、
// メモリは高使用率でも正常（キャッシュ活用）な場合が多いため。
function updateMem(mem) {
  const pct = Math.round(mem.usedPercent);
  document.getElementById("mem-percent").textContent = pct + "%";

  const bar = document.getElementById("mem-bar");
  bar.style.width = pct + "%";

  document.getElementById("mem-used").textContent = formatBytes(mem.used);
  document.getElementById("mem-total").textContent = formatBytes(mem.total);
}
