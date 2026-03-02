// DiskSection.tsx — ディスク使用率バー + 使用量テキスト
//
// バー色は usageColor() で使用率に応じて緑→黄→赤に変化。
// ディスクは高使用率が問題になるため CPU と同じカラーリング。

import type { DiskInfo } from "../types";
import { formatBytes, usageColor } from "../utils";

export default function DiskSection(props: { disk: DiskInfo }) {
  const pct = () => Math.round(props.disk.usedPercent);

  return (
    <section class="section">
      <div class="section-header">
        <h2>Disk</h2>
        <span class="badge">{pct()}%</span>
      </div>
      <div class="bar-track">
        <div
          class="bar-fill"
          style={{
            width: `${pct()}%`,
            background: usageColor(pct()),
          }}
        />
      </div>
      <div class="mem-detail">
        <span>{formatBytes(props.disk.used)}</span>
        <span class="mem-sep">/</span>
        <span>{formatBytes(props.disk.total)}</span>
      </div>
    </section>
  );
}
