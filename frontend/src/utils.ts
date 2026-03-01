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
