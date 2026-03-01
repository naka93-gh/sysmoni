// main.js — Go 側から ExecJS 経由で呼ばれる UI 更新ロジック
//
// Go の main.go がウィンドウ表示中に 3 秒ごとに ExecJS で
// handleStats({...}) を呼び出してデータを渡す。
// macOS WebKit は hidden ウィンドウの JS 実行を遅延するため、
// Go 側でウィンドウ表示中のみ push する制御を行っている。

let coresInitialized = false;

// handleStats は Go から ExecJS 経由で呼ばれるエントリポイント。
function handleStats(stats) {
  if (!stats || !stats.cpu || !stats.mem) return;
  updateCPU(stats.cpu);
  updateMem(stats.mem);
}

// usageColor は使用率 0-100% を緑→黄→赤の HSL 色相にマッピングする。
function usageColor(pct) {
  const hue = Math.max(0, (1 - pct / 100) * 120);
  return `hsl(${hue}, 80%, 50%)`;
}

function updateCPU(cpu) {
  const total = Math.round(cpu.totalUsage);
  document.getElementById("cpu-total").textContent = total + "%";
  document.getElementById("cpu-total").style.color = usageColor(total);

  const bar = document.getElementById("cpu-total-bar");
  bar.style.width = total + "%";
  bar.style.background = usageColor(total);

  const grid = document.getElementById("cpu-cores");

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

function formatBytes(bytes) {
  const gb = bytes / (1024 * 1024 * 1024);
  return gb >= 10 ? gb.toFixed(0) + " GB" : gb.toFixed(1) + " GB";
}

function updateMem(mem) {
  const pct = Math.round(mem.usedPercent);
  document.getElementById("mem-percent").textContent = pct + "%";

  const bar = document.getElementById("mem-bar");
  bar.style.width = pct + "%";

  document.getElementById("mem-used").textContent = formatBytes(mem.used);
  document.getElementById("mem-total").textContent = formatBytes(mem.total);
}
