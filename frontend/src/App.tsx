// App.tsx — ルートコンポーネント
//
// stats Signal を監視し、データ到着前は Placeholder、到着後は
// CpuSection / MemSection に props で配信する。

import { Show } from "solid-js";
import CpuSection from "./components/CpuSection";
import DiskSection from "./components/DiskSection";
import HostSection from "./components/HostSection";
import MemSection from "./components/MemSection";
import NetSection from "./components/NetSection";
import ProcessSection from "./components/ProcessSection";
import { stats } from "./store";

export default function App() {
  return (
    <div class="container">
      <Show when={stats()} fallback={<Placeholder />}>
        {(s) => (
          <>
            <HostSection host={s().host} />
            <div class="divider" />
            <CpuSection cpu={s().cpu} />
            <div class="divider" />
            <MemSection mem={s().mem} />
            <div class="divider" />
            <DiskSection disk={s().disk} />
            <div class="divider" />
            <NetSection net={s().net} />
            <div class="divider" />
            <ProcessSection processes={s().processes} />
          </>
        )}
      </Show>
    </div>
  );
}

function Placeholder() {
  return (
    <>
      <section class="section">
        <div class="section-header">
          <h2>Host</h2>
        </div>
        <div class="host-info">
          <span class="host-name">--</span>
          <span class="host-detail">--</span>
        </div>
      </section>
      <div class="divider" />
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
      <div class="divider" />
      <section class="section">
        <div class="section-header">
          <h2>Disk</h2>
          <span class="badge">--%</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" />
        </div>
        <div class="mem-detail">
          <span>-- GB</span>
          <span class="mem-sep">/</span>
          <span>-- GB</span>
        </div>
      </section>
      <div class="divider" />
      <section class="section">
        <div class="section-header">
          <h2>Network</h2>
          <span class="badge net-badge">en0</span>
        </div>
        <div class="net-speeds">
          <div class="net-row">
            <span class="net-arrow up">↑</span>
            <span class="net-value">-- KB/s</span>
          </div>
          <div class="net-row">
            <span class="net-arrow down">↓</span>
            <span class="net-value">-- KB/s</span>
          </div>
        </div>
      </section>
      <div class="divider" />
      <section class="section">
        <div class="section-header">
          <h2>Processes</h2>
          <span class="badge proc-badge">Top 5</span>
        </div>
        <div class="proc-list">
          <div class="proc-row">
            <span class="proc-name">--</span>
            <span class="proc-cpu">--%</span>
            <span class="proc-mem">--%</span>
          </div>
        </div>
      </section>
    </>
  );
}
