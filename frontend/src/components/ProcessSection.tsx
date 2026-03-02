// ProcessSection.tsx — CPU 使用率 top 5 プロセス表示

import { For } from "solid-js";
import type { ProcessInfo } from "../types";

export default function ProcessSection(props: { processes: ProcessInfo[] }) {
  return (
    <section class="section">
      <div class="section-header">
        <h2>Processes</h2>
        <span class="badge proc-badge">Top 5</span>
      </div>
      <div class="proc-list">
        <For each={props.processes}>
          {(p) => (
            <div class="proc-row">
              <span class="proc-name">{p.name}</span>
              <span class="proc-cpu">{p.cpuPct.toFixed(1)}%</span>
              <span class="proc-mem">{p.memPct.toFixed(1)}%</span>
            </div>
          )}
        </For>
      </div>
    </section>
  );
}
