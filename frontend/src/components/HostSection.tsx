// HostSection.tsx — ホスト情報（hostname, OS, uptime）

import type { HostInfo } from "../types";
import { formatUptime } from "../utils";

export default function HostSection(props: { host: HostInfo }) {
  const osLabel = () => {
    if (props.host.os === "darwin") return "macOS";
    return props.host.os;
  };

  return (
    <section class="section">
      <div class="section-header">
        <h2>Host</h2>
      </div>
      <div class="host-info">
        <span class="host-name">{props.host.hostname}</span>
        <span class="host-detail">
          {osLabel()} {props.host.platformVersion} · up{" "}
          {formatUptime(props.host.uptime)}
        </span>
      </div>
    </section>
  );
}
