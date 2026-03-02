// NetSection.tsx — ネットワーク送受信速度テキスト表示
//
// ↑ 送信速度 / ↓ 受信速度を KB/s または MB/s で表示。
// 速度に上限がないためバーは使用しない。

import type { NetInfo } from "../types";
import { formatSpeed } from "../utils";

export default function NetSection(props: { net: NetInfo }) {
  return (
    <section class="section">
      <div class="section-header">
        <h2>Network</h2>
        <span class="badge net-badge">en0</span>
      </div>
      <div class="net-speeds">
        <div class="net-row">
          <span class="net-arrow up">↑</span>
          <span class="net-value">{formatSpeed(props.net.sendSpeed)}</span>
        </div>
        <div class="net-row">
          <span class="net-arrow down">↓</span>
          <span class="net-value">{formatSpeed(props.net.recvSpeed)}</span>
        </div>
      </div>
    </section>
  );
}
