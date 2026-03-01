// CpuSection.tsx — CPU 全体使用率バー + コア別バー
//
// 全体使用率を右上バッジとメインバーで表示し、
// <For> でコア数分のミニバーを 2 列グリッドで描画する。
// 色は usageColor() で使用率に応じて緑→黄→赤に変化する。

import { For } from "solid-js";
import type { CPUInfo } from "../types";
import { usageColor } from "../utils";

export default function CpuSection(props: { cpu: CPUInfo }) {
  const totalPct = () => Math.round(props.cpu.totalUsage);

  return (
    <section class="section">
      <div class="section-header">
        <h2>CPU</h2>
        {/* 使用率に応じてバッジの文字色も変化 */}
        <span class="badge" style={{ color: usageColor(totalPct()) }}>
          {totalPct()}%
        </span>
      </div>
      {/* 全体使用率バー */}
      <div class="bar-track">
        <div
          class="bar-fill"
          style={{
            width: `${totalPct()}%`,
            background: usageColor(totalPct()),
          }}
        />
      </div>
      {/* コア別バー: コア数はマシンにより異なるため For で動的生成 */}
      <div class="cores-grid">
        <For each={props.cpu.perCore}>
          {(core, i) => {
            const pct = () => Math.round(core);
            return (
              <div class="core-row">
                <span class="core-label">{i()}</span>
                <div class="core-track">
                  <div
                    class="core-fill"
                    style={{
                      width: `${pct()}%`,
                      background: usageColor(pct()),
                    }}
                  />
                </div>
                <span class="core-pct">{pct()}%</span>
              </div>
            );
          }}
        </For>
      </div>
    </section>
  );
}
