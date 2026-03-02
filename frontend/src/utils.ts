// 使用率 0-100% を緑(120°)→黄(60°)→赤(0°) の HSL 色相にマッピング。
// CPU バーとコア別バーの色付けに使用する。
export function usageColor(pct: number): string {
  const hue = Math.max(0, (1 - pct / 100) * 120);
  return `hsl(${hue}, 80%, 50%)`;
}

// バイト数を GB 表示に変換。10GB 以上は整数、未満は小数第1位まで表示。
export function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  return gb >= 10 ? `${gb.toFixed(0)} GB` : `${gb.toFixed(1)} GB`;
}

// bytes/sec を KB/s または MB/s に自動切替して表示。
export function formatSpeed(bytesPerSec: number): string {
  const kb = bytesPerSec / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB/s`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB/s`;
}

// 秒数を "Xd Xh Xm" 形式に変換。
export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
