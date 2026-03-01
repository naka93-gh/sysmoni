// MemSection.tsx — メモリ使用率バー + 使用量テキスト
//
// メモリバーは青色固定（CSS の .bar-fill.mem）。
// CPU と違い高使用率でも異常ではないことが多いため、色変化は行わない。

import type { MemInfo } from "../types";
import { formatBytes } from "../utils";

export default function MemSection(props: { mem: MemInfo }) {
  const pct = () => Math.round(props.mem.usedPercent);

  return (
    <section class="section">
      <div class="section-header">
        <h2>Memory</h2>
        <span class="badge">{pct()}%</span>
      </div>
      {/* 青色固定のバー。width のみ動的に変化 */}
      <div class="bar-track">
        <div class="bar-fill mem" style={{ width: `${pct()}%` }} />
      </div>
      {/* 使用量 / 総量を GB 単位で表示 */}
      <div class="mem-detail">
        <span>{formatBytes(props.mem.used)}</span>
        <span class="mem-sep">/</span>
        <span>{formatBytes(props.mem.total)}</span>
      </div>
    </section>
  );
}
