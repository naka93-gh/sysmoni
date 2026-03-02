// index.tsx — SolidJS エントリポイント
//
// Go 側の main.go が ExecJS で `handleStats({...})` を呼び出す。
// ここでグローバル関数として登録し、受け取ったデータを Signal に流す。

import { render } from "solid-js/web";
import App from "./App";
import { setStats } from "./store";
import type { SystemStats } from "./types";
import "./index.css";

// window.handleStats を TypeScript に認識させるための型拡張
declare global {
  interface Window {
    handleStats: (data: SystemStats) => void;
  }
}

// Go → ExecJS → ここ → setStats → 各コンポーネントがリアクティブに更新
window.handleStats = (data: SystemStats) => {
  if (
    data?.host &&
    data?.cpu &&
    data?.mem &&
    data?.disk &&
    data?.net &&
    data?.processes
  ) {
    setStats(data);
  }
};

const root = document.getElementById("root");
if (root) {
  render(() => <App />, root);
}
