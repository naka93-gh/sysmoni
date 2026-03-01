// App.tsx — ルートコンポーネント
//
// stats Signal を監視し、データ到着前は Placeholder、到着後は
// CpuSection / MemSection に props で配信する。

import { Show } from "solid-js";
import CpuSection from "./components/CpuSection";
import MemSection from "./components/MemSection";
import { stats } from "./store";

export default function App() {
  return (
    <div class="container">
      {/* stats が null の間は Placeholder、データ到着後にセクション表示 */}
      <Show when={stats()} fallback={<Placeholder />}>
        {(s) => (
          <>
            <CpuSection cpu={s().cpu} />
            <div class="divider" />
            <MemSection mem={s().mem} />
          </>
        )}
      </Show>
    </div>
  );
}

// データ未着時の初期表示。Vanilla JS 版の "--%" 表示を再現。
function Placeholder() {
  return (
    <>
      <section class="section">
        <div class="section-header">
          <h2>CPU</h2>
          <span class="badge">--%</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" />
        </div>
      </section>
      <div class="divider" />
      <section class="section">
        <div class="section-header">
          <h2>Memory</h2>
          <span class="badge">--%</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill mem" />
        </div>
        <div class="mem-detail">
          <span>-- GB</span>
          <span class="mem-sep">/</span>
          <span>-- GB</span>
        </div>
      </section>
    </>
  );
}
